/**
 * A tools-only MCP server over stdio.
 *
 * Deliberately hand-rolled: it speaks newline-delimited JSON-RPC (MCP's stdio
 * transport) on stdin/stdout and nothing else, so it stays inside lezz's stdio
 * bridge, which is tools-only by contract. There are no resources, prompts, or
 * subscriptions to implement, and no HTTP server to secure.
 *
 * Read-only by construction. The tool list contains queries only; there is no
 * mutation tool, no shell tool, and no arbitrary path reader.
 *
 * stdout is the protocol channel. Every log line goes to stderr, including
 * anything the CLI would normally have printed.
 */
import { existsSync } from 'fs';
import { resolve, join } from 'path';
import * as readline from 'readline';

import { getConfig } from '@lemon/extract/core/config';
import { initNewContext } from '@lemon/extract/core/types/lemonContext';
import type { LemonContext } from '@lemon/extract/core/types/lemonContext';
import {
    createGithubContext,
    fetchRepositoryProjects,
    readToken
} from '@lemon/extract/integrations/github';

const PROTOCOL_VERSION = '2024-11-05';
const SERVER_NAME = 'lemon-extract';
const SERVER_VERSION = '0.3.0';
const MAX_LINE_BYTES = 4 * 1024 * 1024;

type JsonRpcId = string | number | null;

type RpcRequest = {
    jsonrpc?: string;
    id?: JsonRpcId;
    method?: string;
    params?: Record<string, unknown>;
};

type RpcResponse = {
    jsonrpc: '2.0';
    id: JsonRpcId;
    result?: unknown;
    error?: { code: number, message: string };
};

type ToolOutcome = {
    content: Array<{ type: 'text', text: string }>;
    isError?: boolean;
};

type Tool = {
    name: string;
    description: string;
    inputSchema: Record<string, unknown>;
    handler: (args: Record<string, unknown>) => Promise<unknown>;
};

/* -------------------------------------------------------------------------
 * Context
 * ---------------------------------------------------------------------- */

/** One context per root directory: the caller names the project it means. */
const contexts = new Map<string, Promise<LemonContext>>();
const githubErrors = new Map<string, string>();

const rootFromArgs = (args: Record<string, unknown>): string => {
    const supplied = typeof args.rootDir === 'string' ? args.rootDir.trim() : '';
    if (supplied) { return resolve(supplied); }
    return resolve(process.env.LEMON_ROOT_DIR || process.cwd());
};

const buildContext = async (rootDir: string): Promise<LemonContext> => {
    const context = await getConfig(initNewContext({ rootDir }));
    try {
        context.github = await createGithubContext();
        githubErrors.delete(rootDir);
    } catch (error) {
        context.github = undefined;
        githubErrors.set(rootDir, (error as Error).message);
    }
    return context;
};

const getContext = (rootDir: string): Promise<LemonContext> => {
    const cached = contexts.get(rootDir);
    if (cached) { return cached; }
    const built = buildContext(rootDir);
    contexts.set(rootDir, built);
    return built;
};

const requireGithub = async (context: LemonContext) => {
    if (!context.github) {
        throw new Error(githubErrors.get(context.rootDir) ?? 'No GitHub context: no credential was supplied.');
    }
    return context.github;
};

const rootDirSchema = {
    type: 'string',
    description: 'Absolute path of the project root holding .lemon-extract.json. Defaults to LEMON_ROOT_DIR, then the working directory.'
};

/* -------------------------------------------------------------------------
 * Tools (read-only)
 * ---------------------------------------------------------------------- */

const tools: Tool[] = [
    {
        name: 'lemon.config',
        description: 'Resolved lemon-extract configuration for a project root: org/context repo and the declared projects. Read-only; does not scan, fetch, or write.',
        inputSchema: {
            type: 'object',
            properties: { rootDir: rootDirSchema },
            additionalProperties: false
        },
        handler: async (args) => {
            const context = await getContext(rootFromArgs(args));
            return {
                rootDir: context.rootDir,
                configPath: resolve(join(context.rootDir, '.lemon-extract.json')),
                configFound: existsSync(resolve(join(context.rootDir, '.lemon-extract.json'))),
                organization: context.config.organization ?? null,
                contextRepo: context.config.contextRepo ?? null,
                projects: (context.config.projects ?? []).map((project) => ({
                    name: project.name ?? null,
                    root: project.root ?? null,
                    enabled: project.enabled === true
                })),
                github: context.github
                    ? { available: true, login: context.github.viewer.login, readOnly: context.github.capabilities.readOnly }
                    : { available: false, reason: githubErrors.get(context.rootDir) ?? null }
            };
        }
    },
    {
        name: 'github.viewer',
        description: 'The authenticated GitHub identity (viewer query) plus what the presented token is allowed to do. Reads the credential from the environment; never returns it.',
        inputSchema: {
            type: 'object',
            properties: { rootDir: rootDirSchema },
            additionalProperties: false
        },
        handler: async (args) => {
            const context = await getContext(rootFromArgs(args));
            const { viewer, capabilities, rateLimit, fetchedAt } = await requireGithub(context);
            return {
                login: viewer.login,
                id: viewer.id,
                name: viewer.name ?? null,
                url: viewer.url ?? null,
                scopes: capabilities.scopes,
                readOnly: capabilities.readOnly,
                canWriteRepo: capabilities.canWriteRepo,
                scopeSource: capabilities.source,
                rateLimit: rateLimit ?? null,
                fetchedAt
            };
        }
    },
    {
        name: 'github.repository.projects',
        description: 'Project boards for a repository (defaults to the organization/contextRepo configured for the given root). Read-only GraphQL query.',
        inputSchema: {
            type: 'object',
            properties: {
                owner: { type: 'string', description: 'Repository owner; defaults to the configured organization.' },
                name: { type: 'string', description: 'Repository name; defaults to the configured contextRepo.' },
                rootDir: rootDirSchema
            },
            additionalProperties: false
        },
        handler: async (args) => {
            const context = await getContext(rootFromArgs(args));
            await requireGithub(context);
            const owner = typeof args.owner === 'string' && args.owner
                ? args.owner
                : context.config.organization;
            const name = typeof args.name === 'string' && args.name
                ? args.name
                : context.config.contextRepo;
            if (!owner || !name) {
                throw new Error('owner/name not supplied and not configured (.lemon-extract.json organization + contextRepo).');
            }
            return fetchRepositoryProjects(readToken(), owner, name);
        }
    }
];

const toolList = tools.map(({ name, description, inputSchema }) => ({ name, description, inputSchema }));

/* -------------------------------------------------------------------------
 * JSON-RPC
 * ---------------------------------------------------------------------- */

const ok = (id: JsonRpcId, result: unknown): RpcResponse => ({ jsonrpc: '2.0', id, result });

const fail = (id: JsonRpcId, code: number, message: string): RpcResponse => ({
    jsonrpc: '2.0',
    id,
    error: { code, message }
});

const asToolResult = async (tool: Tool, args: Record<string, unknown>): Promise<ToolOutcome> => {
    try {
        const value = await tool.handler(args);
        return { content: [{ type: 'text', text: JSON.stringify(value, null, 2) }] };
    } catch (error) {
        // A tool failure is a result, not a protocol error: the caller sees the
        // reason and the server keeps running.
        return {
            content: [{ type: 'text', text: (error as Error).message }],
            isError: true
        };
    }
};

/** Exported for tests: the tool surface, without starting the transport. */
export const toolNames = (): string[] => tools.map((tool) => tool.name);

/** Exported for tests: one JSON-RPC request in, one response (or null) out. */
export const handleRequest = (request: RpcRequest): Promise<RpcResponse | null> => dispatch(request);

const dispatch = async (request: RpcRequest): Promise<RpcResponse | null> => {
    const { id, method, params } = request;
    const hasId = id !== undefined && id !== null;

    // Notifications carry no id and are never answered.
    if (method?.startsWith('notifications/')) { return null; }

    switch (method) {
        case 'initialize': {
            const requested = params?.protocolVersion;
            return ok(id ?? null, {
                protocolVersion: typeof requested === 'string' ? requested : PROTOCOL_VERSION,
                capabilities: { tools: {} },
                serverInfo: { name: SERVER_NAME, version: SERVER_VERSION }
            });
        }
        case 'ping':
            return ok(id ?? null, {});
        case 'tools/list':
            return ok(id ?? null, { tools: toolList });
        case 'tools/call': {
            const name = typeof params?.name === 'string' ? params.name : '';
            const tool = tools.find((candidate) => candidate.name === name);
            if (!tool) {
                // Do not echo the requested name: a probe learns nothing.
                return fail(id ?? null, -32602, 'unknown tool');
            }
            const args = (params?.arguments && typeof params.arguments === 'object')
                ? params.arguments as Record<string, unknown>
                : {};
            return ok(id ?? null, await asToolResult(tool, args));
        }
        default:
            if (!hasId) { return null; }
            return fail(id ?? null, -32601, 'method not found');
    }
};

const write = (response: RpcResponse): void => {
    process.stdout.write(`${JSON.stringify(response)}\n`);
};

/**
 * Start the stdio server. Resolves when stdin closes.
 */
export const startMcpServer = async (): Promise<void> => {
    // Anything that would have gone to stdout now goes to stderr, so a stray
    // console.log in a plugin cannot corrupt the protocol stream.
    console.log = console.error;
    console.info = console.error;

    const rl = readline.createInterface({ input: process.stdin, crlfDelay: Infinity });

    // Requests are handled in order. A tools/call may await the network; the
    // next line waits its turn rather than interleaving output.
    let chain: Promise<void> = Promise.resolve();

    rl.on('line', (line: string) => {
        chain = chain.then(async () => {
            const trimmed = line.trim();
            if (!trimmed) { return; }
            if (Buffer.byteLength(trimmed, 'utf8') > MAX_LINE_BYTES) {
                write(fail(null, -32600, 'request too large'));
                return;
            }
            let request: RpcRequest;
            try {
                request = JSON.parse(trimmed) as RpcRequest;
            } catch {
                write(fail(null, -32700, 'parse error'));
                return;
            }
            if (!request || typeof request !== 'object' || typeof request.method !== 'string') {
                write(fail(null, -32600, 'invalid request'));
                return;
            }
            const response = await dispatch(request);
            if (response) { write(response); }
        }).catch((error: Error) => {
            process.stderr.write(`@lemon/extract:mcp dispatch error: ${error.message}\n`);
        });
    });

    await new Promise<void>((resolveDone) => {
        rl.on('close', () => { resolveDone(); });
    });
    await chain;
};

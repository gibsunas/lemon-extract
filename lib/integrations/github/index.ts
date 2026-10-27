import { LemonContext } from '@lemon/extract/core/types/lemonContext';
import {
    GithubCapabilities,
    GithubContext,
    GithubRateLimit,
    GithubViewer
} from './types';

/*
 * GitHub access for lemon-extract.
 *
 * Auth is deliberately borrowed, not owned. The process receives a bearer
 * token in `LEMON_GITHUB_TOKEN`, put there by whoever starts it — for the lab
 * that is lezz's stdio bridge, which resolves the device-flow token out of the
 * macOS Keychain. lemon-extract never mints, refreshes, stores, or persists a
 * token, and never reads `$GITHUB_TOKEN`: an ambient personal access token from
 * an unrelated tool is exactly the failure lezz.go#36 documents (silent 401,
 * then a quiet fallback that reports the wrong version).
 *
 * Everything below is read-only. Mutating calls are a separate, explicitly
 * enabled path (`assertCanWrite`) and are refused by default.
 */

const GRAPHQL_ENDPOINT = 'https://api.github.com/graphql';
const REST_ENDPOINT = 'https://api.github.com';
const REQUEST_TIMEOUT_MS = 15_000;

/** The only variable consulted for a credential. */
export const TOKEN_ENV = 'LEMON_GITHUB_TOKEN';
/** Second gate for any mutating call, on top of the token's own scopes. */
export const ALLOW_WRITES_ENV = 'LEMON_GITHUB_ALLOW_WRITES';

/** OAuth scopes that grant write access somewhere. */
const WRITE_SCOPES = new Set([
    'repo',
    'public_repo',
    'repo:status',
    'repo_deployment',
    'admin:repo_hook',
    'write:repo_hook',
    'admin:org',
    'write:org',
    'admin:public_key',
    'write:public_key',
    'admin:gpg_key',
    'write:gpg_key',
    'write:packages',
    'delete:packages',
    'write:discussion',
    'workflow'
]);

export class GithubAuthError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'GithubAuthError';
    }
}

/** Raised when a mutating call is attempted against a read-only credential. */
export class GithubCapabilityError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'GithubCapabilityError';
    }
}

type GraphqlResponse<T> = {
    data?: T;
    errors?: Array<{ message: string, type?: string }>;
};

export const readToken = (): string => {
    const token = String(process.env[TOKEN_ENV] ?? '').trim();
    if (!token) {
        throw new GithubAuthError(
            `${TOKEN_ENV} is empty. Sign in with \`lezz auth github\` and let the ` +
            'lezz stdio bridge pass the stored token in, or export it yourself for a one-off run. ' +
            '`$GITHUB_TOKEN` is intentionally not consulted.'
        );
    }
    return token;
};

const githubFetch = async (url: string, token: string, init: RequestInit = {}) => {
    const response = await fetch(url, {
        ...init,
        headers: {
            accept: 'application/vnd.github+json',
            authorization: `bearer ${token}`,
            'x-github-api-version': '2022-11-28',
            'user-agent': '@lemon/extract',
            ...(init.headers ?? {})
        },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
    });
    if (!response.ok) {
        // Never echo the request headers back: they hold the token.
        const body = await response.text().catch(() => '');
        throw new GithubAuthError(
            `GitHub returned ${response.status} ${response.statusText} for ${new URL(url).pathname}` +
            (body ? `: ${body.slice(0, 200)}` : '')
        );
    }
    return response;
};

const graphql = async <T>(token: string, query: string, variables: Record<string, unknown> = {}): Promise<T> => {
    const response = await githubFetch(GRAPHQL_ENDPOINT, token, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ query, variables })
    });
    const payload = await response.json() as GraphqlResponse<T>;
    if (payload.errors?.length) {
        throw new GithubAuthError(`GitHub GraphQL error: ${payload.errors.map((e) => e.message).join('; ')}`);
    }
    if (!payload.data) {
        throw new GithubAuthError('GitHub GraphQL returned no data');
    }
    return payload.data;
};

const VIEWER_QUERY = `
query Viewer {
  viewer {
    login
    id
    name
    url
    avatarUrl
  }
  rateLimit {
    limit
    remaining
    resetAt
  }
}`;

type ViewerPayload = {
    viewer: GithubViewer;
    rateLimit?: GithubRateLimit;
};

/** Issue #6 task 2: execute the viewer query. */
export const fetchViewer = async (token: string): Promise<ViewerPayload> =>
    graphql<ViewerPayload>(token, VIEWER_QUERY);

/**
 * The OAuth scopes the token holds.
 *
 * GitHub only reports these on REST responses, and only for OAuth/PAT
 * credentials. A missing header means "unknown", which is treated as
 * read-only rather than as a permissive credential.
 */
export const fetchCapabilities = async (token: string): Promise<GithubCapabilities> => {
    const response = await githubFetch(`${REST_ENDPOINT}/user`, token);
    const header = response.headers.get('x-oauth-scopes');
    if (header === null) {
        return { scopes: [], readOnly: true, canWriteRepo: false, source: 'unknown' };
    }
    const scopes = header.split(',').map((scope) => scope.trim()).filter(Boolean);
    const writeScopes = scopes.filter((scope) => WRITE_SCOPES.has(scope));
    return {
        scopes,
        readOnly: writeScopes.length === 0,
        canWriteRepo: scopes.includes('repo') || scopes.includes('public_repo'),
        source: 'oauth-scopes'
    };
};

/**
 * Load the viewer and the capability record, and return the context fragment
 * lemon-extract keeps. This is the whole of issue #6's context work.
 */
export const createGithubContext = async (): Promise<GithubContext> => {
    const token = readToken();
    const [{ viewer, rateLimit }, capabilities] = await Promise.all([
        fetchViewer(token),
        fetchCapabilities(token)
    ]);
    return {
        viewer,
        capabilities,
        ...(rateLimit ? { rateLimit } : {}),
        fetchedAt: new Date().toISOString()
    };
};

/**
 * The read-only guard from issue #6 task 4.
 *
 * Called by every mutating operation. Two independent gates must both pass:
 * the token must actually hold a write scope, and the process must have opted
 * in with `LEMON_GITHUB_ALLOW_WRITES=1`. A caller cannot talk its way past it
 * from an MCP request, because the preference lives in the credential and the
 * environment — never in tool arguments.
 */
export const assertCanWrite = (context: GithubContext | undefined): void => {
    if (!context) {
        throw new GithubCapabilityError('No GitHub context: run the viewer query before any write.');
    }
    if (context.capabilities.readOnly) {
        throw new GithubCapabilityError(
            'Refusing to write: this token is read-only ' +
            `(scopes: ${context.capabilities.scopes.join(', ') || 'unknown'}). ` +
            'Never downgrade a read-only preference.'
        );
    }
    if (process.env[ALLOW_WRITES_ENV] !== '1') {
        throw new GithubCapabilityError(
            `Refusing to write: set ${ALLOW_WRITES_ENV}=1 to enable mutating calls for this process.`
        );
    }
};

const REPOSITORY_PROJECTS_QUERY = `
query RepositoryProjects($owner: String!, $name: String!) {
  repository(owner: $owner, name: $name) {
    nameWithOwner
    url
    visibility
    projectsV2(first: 20) {
      nodes {
        id
        title
        url
        closed
        public
      }
    }
  }
}`;

export type RepositoryProjects = {
    nameWithOwner: string;
    url: string;
    visibility: string;
    projects: Array<{ id: string, title: string, url: string, closed: boolean, public: boolean }>;
};

/** Read-only replacement for `github-api`'s retired `repo.listProjects()`. */
export const fetchRepositoryProjects = async (
    token: string,
    owner: string,
    name: string
): Promise<RepositoryProjects> => {
    const data = await graphql<{ repository: RepositoryProjects & { projectsV2: { nodes: RepositoryProjects['projects'] } } }>(
        token,
        REPOSITORY_PROJECTS_QUERY,
        { owner, name }
    );
    if (!data.repository) {
        throw new GithubAuthError(`Repository ${owner}/${name} is not visible to this token.`);
    }
    const { projectsV2, ...repository } = data.repository;
    return { ...repository, projects: projectsV2?.nodes ?? [] };
};

/**
 * Bootstrap hook: attach the GitHub context when a credential is present.
 *
 * A missing token is not fatal. lemon-extract's non-GitHub commands (scan,
 * init, npm inventory) must keep working offline, so this only records the
 * reason the identity is absent.
 */
export const bootstrap = async (lemonContext: LemonContext): Promise<LemonContext> => {
    const debug = lemonContext.utils.debug.extend('github');
    try {
        lemonContext.github = await createGithubContext();
        const { viewer, capabilities } = lemonContext.github;
        debug(`viewer ${viewer.login} (read-only: ${capabilities.readOnly})`);
    } catch (error) {
        lemonContext.github = undefined;
        debug(`no GitHub identity: ${(error as Error).message}`);
    }
    return lemonContext;
};

/** Issue #6 task 1/2 in the CLI: `lemon-extract github` prints the identity. */
export const main = async (lemonContext: LemonContext): Promise<LemonContext> => {
    const context = lemonContext.github ?? await createGithubContext();
    const { viewer, capabilities, rateLimit } = context;
    const output = {
        login: viewer.login,
        id: viewer.id,
        name: viewer.name ?? null,
        scopes: capabilities.scopes,
        readOnly: capabilities.readOnly,
        canWriteRepo: capabilities.canWriteRepo,
        scopeSource: capabilities.source,
        rateLimit: rateLimit ?? null
    };
    // stdout is the command's result; the token is not part of the context.
    process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
    return lemonContext;
};

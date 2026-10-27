import { afterEach, beforeEach, describe, expect, it } from '@jest/globals';

import { TOKEN_ENV } from '@lemon/extract/integrations/github';
import { handleRequest, toolNames } from './server';

describe('mcp server', () => {
    const saved = { ...process.env };

    beforeEach(() => {
        delete process.env[TOKEN_ENV];
    });

    afterEach(() => {
        process.env = { ...saved };
    });

    it('initializes as a tools-only server', async () => {
        const response = await handleRequest({
            jsonrpc: '2.0',
            id: 1,
            method: 'initialize',
            params: { protocolVersion: '2024-11-05' }
        });
        expect(response?.result).toEqual({
            protocolVersion: '2024-11-05',
            capabilities: { tools: {} },
            serverInfo: { name: 'lemon-extract', version: '0.3.0' }
        });
    });

    it('never answers a notification', async () => {
        await expect(handleRequest({ jsonrpc: '2.0', method: 'notifications/initialized' }))
            .resolves.toBeNull();
    });

    it('exposes a read-only tool surface', async () => {
        const response = await handleRequest({ jsonrpc: '2.0', id: 2, method: 'tools/list' });
        const result = response?.result as { tools: Array<{ name: string }> };
        const names = result.tools.map((tool) => tool.name);
        expect(names).toEqual(toolNames());
        for (const name of names) {
            expect(name).not.toMatch(/write|delete|create|update|exec|run/);
        }
    });

    it('rejects unknown methods and unknown tools without echoing them', async () => {
        const method = await handleRequest({ jsonrpc: '2.0', id: 3, method: 'lemon.explode' });
        expect(method?.error).toEqual({ code: -32601, message: 'method not found' });

        const tool = await handleRequest({
            jsonrpc: '2.0',
            id: 4,
            method: 'tools/call',
            params: { name: 'github.deleteRepository', arguments: {} }
        });
        expect(JSON.stringify(tool)).not.toContain('deleteRepository');
        expect(tool?.error).toEqual({ code: -32602, message: 'unknown tool' });
    });

    it('reports a missing credential as a tool error, not a crash', async () => {
        const response = await handleRequest({
            jsonrpc: '2.0',
            id: 5,
            method: 'tools/call',
            params: { name: 'github.viewer', arguments: {} }
        });
        const result = response?.result as { isError: boolean, content: Array<{ text: string }> };
        expect(result.isError).toBe(true);
        expect(result.content[0].text).toContain(TOKEN_ENV);
    });

    it('surfaces config without requiring a database or a network', async () => {
        const response = await handleRequest({
            jsonrpc: '2.0',
            id: 6,
            method: 'tools/call',
            params: { name: 'lemon.config', arguments: {} }
        });
        const result = response?.result as { content: Array<{ text: string }> };
        const payload = JSON.parse(result.content[0].text);
        expect(payload).toHaveProperty('rootDir');
        expect(payload.github.available).toBe(false);
        expect(payload).not.toHaveProperty('token');
    });
});

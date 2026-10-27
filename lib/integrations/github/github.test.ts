import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

import {
    ALLOW_WRITES_ENV,
    TOKEN_ENV,
    assertCanWrite,
    fetchCapabilities,
    fetchViewer,
    readToken
} from './index';
import type { GithubContext } from './types';

const viewerFixture = {
    viewer: {
        login: 'octocat',
        id: 'MDQ6VXNlcjE=',
        name: 'The Octocat',
        url: 'https://github.com/octocat',
        avatarUrl: 'https://avatars.example/octocat'
    },
    rateLimit: { limit: 5000, remaining: 4999, resetAt: '2026-01-01T00:00:00Z' }
};

const mockFetch = (body: unknown, headers: Record<string, string> = {}) => {
    const response = {
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: { get: (name: string) => headers[name.toLowerCase()] ?? null },
        json: async () => body,
        text: async () => JSON.stringify(body)
    };
    return jest.spyOn(globalThis, 'fetch').mockResolvedValue(response as unknown as Response);
};

const contextWith = (readOnly: boolean, scopes: string[] = []): GithubContext => ({
    viewer: viewerFixture.viewer,
    capabilities: { scopes, readOnly, canWriteRepo: !readOnly, source: 'oauth-scopes' },
    fetchedAt: '2026-01-01T00:00:00Z'
});

describe('github credential', () => {
    const saved = { ...process.env };

    beforeEach(() => {
        delete process.env[TOKEN_ENV];
        delete process.env[ALLOW_WRITES_ENV];
    });

    afterEach(() => {
        process.env = { ...saved };
        jest.restoreAllMocks();
    });

    it('reads only LEMON_GITHUB_TOKEN, never GITHUB_TOKEN', () => {
        process.env.GITHUB_TOKEN = 'ambient-pat-must-not-be-used';
        expect(() => readToken()).toThrow(new RegExp(TOKEN_ENV));
        process.env[TOKEN_ENV] = 'explicit-token';
        expect(readToken()).toBe('explicit-token');
    });

    it('executes the viewer query from issue #6', async () => {
        const spy = mockFetch({ data: viewerFixture });
        const result = await fetchViewer('token');
        expect(result.viewer.login).toBe('octocat');
        expect(spy).toHaveBeenCalledWith(
            'https://api.github.com/graphql',
            expect.objectContaining({ method: 'POST' })
        );
    });

    it('treats a missing x-oauth-scopes header as read-only', async () => {
        mockFetch({ login: 'octocat' });
        await expect(fetchCapabilities('token')).resolves.toEqual({
            scopes: [],
            readOnly: true,
            canWriteRepo: false,
            source: 'unknown'
        });
    });

    it('derives write capability from the scopes it was granted', async () => {
        mockFetch({ login: 'octocat' }, { 'x-oauth-scopes': 'gist, read:org' });
        const readOnly = await fetchCapabilities('token');
        expect(readOnly.readOnly).toBe(true);
        expect(readOnly.canWriteRepo).toBe(false);

        mockFetch({ login: 'octocat' }, { 'x-oauth-scopes': 'repo, read:user' });
        const writer = await fetchCapabilities('token');
        expect(writer.readOnly).toBe(false);
        expect(writer.canWriteRepo).toBe(true);
    });

    it('never writes with a read-only credential, even when writes are enabled', () => {
        process.env[ALLOW_WRITES_ENV] = '1';
        expect(() => assertCanWrite(contextWith(true, ['read:user']))).toThrow(/read-only/);
    });

    it('refuses writes unless the process explicitly opts in', () => {
        expect(() => assertCanWrite(contextWith(false, ['repo']))).toThrow(new RegExp(ALLOW_WRITES_ENV));
        process.env[ALLOW_WRITES_ENV] = '1';
        expect(() => assertCanWrite(contextWith(false, ['repo']))).not.toThrow();
    });

    it('refuses writes with no context at all', () => {
        expect(() => assertCanWrite(undefined)).toThrow(/No GitHub context/);
    });
});

/**
 * GitHub identity stored in the lemon context (issue #6, task 3).
 *
 * Shape only — no token, no headers. The access token itself never enters the
 * context, the audit log, or any MCP response.
 */
export type GithubViewer = {
    login: string;
    id: string;
    name?: string | null;
    url?: string;
    avatarUrl?: string;
};

/**
 * What the presented credential is allowed to do (issue #6, task 4).
 *
 * `readOnly` is the preference the context must never violate. It is derived
 * from the token's OAuth scopes and defaults to `true` whenever the scopes
 * cannot be established — a fine-grained PAT does not return
 * `x-oauth-scopes`, and an unknown credential must not be treated as a
 * write-capable one.
 */
export type GithubCapabilities = {
    scopes: string[];
    readOnly: boolean;
    canWriteRepo: boolean;
    source: 'oauth-scopes' | 'unknown';
};

export type GithubRateLimit = {
    limit: number;
    remaining: number;
    resetAt: string;
};

export type GithubContext = {
    viewer: GithubViewer;
    capabilities: GithubCapabilities;
    rateLimit?: GithubRateLimit;
    fetchedAt: string;
};

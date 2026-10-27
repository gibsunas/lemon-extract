# GitHub access

lemon-extract authenticates to GitHub with **a bearer token it is given**, not
one it owns. It never signs in, never refreshes, never writes a credential to
disk, and never reads `$GITHUB_TOKEN`.

This answers [issue #6](https://github.com/gibsunas/lemon-extract/issues/6):
read the token, run the viewer query, keep the viewer and the credential's
capabilities in the lemon context, and never violate a read-only preference.

## Where the token comes from

| Source | Sets | Used by |
|---|---|---|
| lezz stdio bridge (lab default) | `LEMON_GITHUB_TOKEN` in the child environment | `lemon-extract`, `lemon-extract-mcp` |
| a one-off shell | `LEMON_GITHUB_TOKEN=… lemon-extract github` | local debugging |

`lezz auth github` stores a device-flow token in the macOS Keychain; the lezz
stdio bridge resolves `keychain:LEZZ_GITHUB_TOKEN` at spawn time and passes it
to this process. The token is never written into `.lemon-extract.json`, a
`.env` file, a bridge YAML file, or an argument list.

### Why not `$GITHUB_TOKEN`

A stale or unrelated personal access token inherited from the environment turns
a valid request into a 401, and tooling that treats 401 as "not found" reports
the wrong answer instead of an auth error. That failure mode is documented in
[lezz.go#36](https://github.com/james-gibson/lezz.go/issues/36). The only
variable consulted here is `LEMON_GITHUB_TOKEN`, so an ambient credential cannot
be picked up by accident.

## What it does

```sh
LEMON_GITHUB_TOKEN=… lemon-extract github
```

```json
{
  "login": "james-gibson",
  "id": "MDQ6VXNlcjI0MzM3NzE=",
  "name": "James Gibson",
  "scopes": ["gist", "project", "read:org", "repo", "workflow"],
  "readOnly": false,
  "canWriteRepo": true,
  "scopeSource": "oauth-scopes",
  "rateLimit": { "limit": 5000, "remaining": 4985, "resetAt": "2026-10-27T17:53:59Z" }
}
```

The viewer query is GraphQL (`query Viewer { viewer { … } }`). The capability
record comes from the `x-oauth-scopes` header on `GET /user`, because GraphQL
does not report scopes.

## Read-only is the default

`capabilities.readOnly` is `true` when the token holds no write scope **and**
when the scopes cannot be established at all. A fine-grained PAT does not return
`x-oauth-scopes`; an unknown credential is treated as read-only rather than as a
permissive one.

`assertCanWrite` guards every mutating call with two independent gates:

1. the token must actually hold a write scope, and
2. the process must opt in with `LEMON_GITHUB_ALLOW_WRITES=1`.

Neither gate can be set from an MCP tool argument. There is no tool that mutates
anything, so an MCP caller has no path to either.

## MCP surface

`lemon-extract-mcp` serves MCP over stdio (newline-delimited JSON-RPC, tools
only). It is designed to sit behind the lezz stdio bridge, which exposes it as a
loopback HTTP endpoint and registers it as `adhd.project.lemon-extract.call`.

| Tool | Upstream | Mutates |
|---|---|---|
| `lemon.config` | `.lemon-extract.json` | no |
| `github.viewer` | GraphQL viewer + `GET /user` scopes | no |
| `github.repository.projects` | GraphQL `projectsV2` | no |

Each takes an optional `rootDir` argument (defaults to `LEMON_ROOT_DIR`, then
the working directory), so one bridge serves every project root the caller
names. Contexts are cached per root for the life of the process; a credential
change needs a restart, not a retry.

Deliberately **not** exposed: `scan` (writes to Postgres), `npm` (arborist tree
building), `git` (spawns `git`). They mutate state or execute commands, and the
bridge contract is read-only tools only. Exposing them would need its own
entitlement, not a wider tool list.

### Bridge definition (lezz)

```yaml
name: lemon-extract
repo: gibsunas/lemon-extract
command: lemon-extract-mcp
secrets:
  LEMON_GITHUB_TOKEN: keychain:LEZZ_GITHUB_TOKEN
allowed_tools:
  - lemon.config
  - github.viewer
  - github.repository.projects
request_timeout: 30s
```

The command is static config, never a request field. The child gets a minimal
environment allow-list plus the one secret the config names, resolved by lezz at
spawn time from the same Keychain item `lezz auth github` wrote.

## Limits

- The token is a bearer credential: anyone who can read the child's environment
  can replay it until it is revoked.
- `README` of the parent lab project: the bridge has no inbound auth yet, so
  loopback binding is the boundary, not authorization.
- Signing out means `lezz auth logout`, then restart the bridge.

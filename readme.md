# @lemon/extract

A utility tool used to manage and understand complex systems

## Why?

### Problem Thesis

Managing multiple development projects across any size organization is difficult, let alone keeping them in sync. Automating that management is even harder.

Repo code is just the start though, what does that actually represent in the real world? Where is it deployed? Did it compile the correct packages, schema, etc.

How do those deployments correlate to changes? How are changes tracked over time?

### Current Plan
Build a self configuring tool that prioritizes safe changes across one or more repos to facilitate the rapid deployment of uniform code

Examples:
  - a project maintainer should be able to say all projects must use a version of lodash greater than the last known SEV
    - The tool should be able to scan and identify projects using an older lodash
    - The tool should also be able to create a pr consisting of package.json / package-lock.json for all projects in violation of the version floor
  - a project maintainer should be able to request a scan of a given deployment
    - This means it knows where they are deployed (might need server boot announcements)
    - Where they deployed from
    -

## Dev

Requires Node.js **>= 22.22.2** (the floor comes from `@npmcli/arborist`).

The Prisma CLI's transitive `deepmerge-ts` is pinned through `overrides` to a
release without the stack-exhaustion advisory; `npm audit` is clean.

```
# Terminal A
$ npm run watch

# Terminal B
$ DEBUG=@lemon/extract:* npm run cli -- --help
```

## Running

The fastest way to utilize `@lemon/extract` is by running
```
$ npx @lemon/extract
```

## GitHub access

GitHub is authenticated with a token supplied by the caller — for this lab, the
lezz stdio bridge resolves `lezz auth github`'s Keychain item and passes it in
`LEMON_GITHUB_TOKEN`. lemon-extract never stores a credential and never reads
`$GITHUB_TOKEN`.

```sh
$ LEMON_GITHUB_TOKEN=… lemon-extract github
```

Read [docs/github.md](docs/github.md) for the capability model (read-only is the
default and cannot be overridden by a request) and the MCP surface.

## MCP

`lemon-extract-mcp` serves a read-only, tools-only MCP server over stdio:

| Tool | Upstream |
|---|---|
| `lemon.config` | resolved `.lemon-extract.json` |
| `github.viewer` | GraphQL viewer + token capabilities |
| `github.repository.projects` | GraphQL `projectsV2` |

It is meant to be wrapped by a supervisor (the lezz stdio bridge) that owns the
process, the credential, and the loopback HTTP endpoint. Running it directly is
fine for a probe:

```sh
printf '%s\n' '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | lemon-extract-mcp
```

## What the tool will do for you?

- Identifies all unique tsconfig naming conventions, displaying a count of each
- Counts and sumarizes the files included by a particular tsconfig

## Why this tool is useful?

- Misconfigured tsconfig files can slow down the cold start time of your tooling
- Finding misconfigured tsconfig's can be difficult if you have hundreds of them
- Misconfigured tsconfig files can cause Out Of Memory exceptions, usually in CI

## Assumptions

Typescript (tsc) must be globally available

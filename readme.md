# @lemon/extract

A utility tool designed to enable faster debugging of Typescript mono repos.

## Running

The fastest way to utilize `@lemon/extract` is by running
```
$ npx @lemon/extract
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
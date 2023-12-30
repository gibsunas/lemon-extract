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
```
# Terminal A
$ npm run webpack -- --watch

# Terminal B
$ DEBUG=@lemon/extract:* npm run cli -- --help
```

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

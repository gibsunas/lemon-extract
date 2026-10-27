#! /usr/bin/env node

const fs = require('fs');
const path = require('path');

// Works from the checkout (bin/ → ../dist/bundle.cjs) and from the published
// tarball (dist/bin/ → ../bundle.cjs).
const candidates = [
    path.join(__dirname, '..', 'dist', 'bundle.cjs'),
    path.join(__dirname, '..', 'bundle.cjs')
];
const bundle = candidates.find((candidate) => fs.existsSync(candidate)) ?? candidates[0];

// The bundle exports the CLI; importing it must stay side-effect free so the
// same artifact can back the MCP entrypoint too.
const run = async () => {
    const { main } = require(bundle);
    await main();
};

run().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
});

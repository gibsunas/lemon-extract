#! /usr/bin/env node

const fs = require('fs');
const path = require('path');

// MCP stdio entrypoint. stdout belongs to the protocol, so failures are
// reported on stderr only. Works from the checkout and from the published
// tarball.
const candidates = [
    path.join(__dirname, '..', 'dist', 'bundle.cjs'),
    path.join(__dirname, '..', 'bundle.cjs')
];
const bundle = candidates.find((candidate) => fs.existsSync(candidate)) ?? candidates[0];

const run = async () => {
    const { startMcpServer } = require(bundle);
    await startMcpServer();
};

run().catch((error) => {
    console.error(error instanceof Error ? error.stack ?? error.message : error);
    process.exit(1);
});

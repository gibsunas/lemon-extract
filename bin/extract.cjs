#! /usr/bin/env node

const path = require('path');

const main = () => {
    const bundleDist = path.join(__dirname, '../dist/bundle.cjs');
    import(bundleDist);
};

main();

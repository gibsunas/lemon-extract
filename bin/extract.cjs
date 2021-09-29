#! /usr/bin/env node

const path = require('path');

const main = () => {
    const bundleDist = path.join(__dirname, '../dist/bundle.cjs');
    // eslint-disable-next-line import/no-dynamic-require
    require(bundleDist);
};

main();

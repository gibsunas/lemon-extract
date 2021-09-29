// Adapted from https://stackoverflow.com/a/52177090
const path = require('path');
const fs = require('fs');

// DO NOT DELETE THIS FILE
// This file is used by build system to build a clean npm package with the compiled js files in the root of the package.
// It will not be included in the npm package.

function main() {
    const rootDir = path.resolve(__dirname, '../..');
    const source = fs.readFileSync(`${rootDir}/package.json`).toString('utf-8');
    const sourceObj = JSON.parse(source);
    sourceObj.scripts = {};
    sourceObj.devDependencies = {};
    if (sourceObj.main.startsWith('dist/')) {
        sourceObj.main = sourceObj.main.slice(5);
    }
    fs.writeFileSync(`${rootDir}/dist/package.json`, Buffer.from(JSON.stringify(sourceObj, null, 2), 'utf-8'));
    fs.writeFileSync(`${rootDir}/dist/version.txt`, Buffer.from(sourceObj.version, 'utf-8'));

    fs.copyFileSync(`${rootDir}/.npmignore`, `${rootDir}/dist/.npmignore`);
    fs.copyFileSync(`${rootDir}/readme.md`, `${rootDir}/dist/readme.md`);
}

main();

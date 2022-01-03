import { readPackageJson } from '@lemon/extract/utils';
import { resolve } from 'path';

const nrwlPackagesToScan = [
    '@nrwl/angular',
    '@nrwl/cli',
    '@nrwl/cypress',
    '@nrwl/devkit',
    '@nrwl/eslint-plugin-nx',
    '@nrwl/express',
    '@nrwl/gatsby',
    '@nrwl/jest',
    '@nrwl/linter',
    '@nrwl/nest',
    '@nrwl/next',
    '@nrwl/node',
    '@nrwl/nx-plugin',
    '@nrwl/react',
    '@nrwl/storybook',
    '@nrwl/tao',
    '@nrwl/web',
    '@nrwl/workspace',
    'create-nx-plugin',
    'create-nx-workspace'
    // 'nx',
];

const monitoredPackages = nrwlPackagesToScan;
const filterUnmonitoredPackages = (dependencies: Object = {}) => {
    const packages: string[] = Object.getOwnPropertyNames(dependencies).filter((x) => monitoredPackages.includes(x));
    return packages.map((x) => ({ [x]: dependencies[x] }));
};
interface NxMetaData {

}

interface PackageMetadata {
    version: string;
}

const processPackageJson: (contents: any) => PackageMetadata = (contents: any = {}) => {
    const result = {
        name: contents.name,
        dependencies: contents.dependencies,
        filteredDependencies: filterUnmonitoredPackages(contents.dependencies),
        peerDependencies: filterUnmonitoredPackages(contents.peerDependencies),
        version: contents.version
    };

    return result;
};

const gatherMetadata = (path: string = process.cwd()) => {
    const nodeModulesPath = resolve(path, 'node_modules');

    const metadata = nrwlPackagesToScan.map((x) => {
        return processPackageJson(readPackageJson(`${nodeModulesPath}/${x}`));
    });
    console.log(metadata);
    return metadata;
};

export {
    gatherMetadata
};

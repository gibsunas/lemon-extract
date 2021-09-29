import { readJsonFile } from '@nrwl/workspace';
import { existsSync } from 'fs';

export type PackageJson = {
    name: string,
    license?: string,
    version: string,
    private?: boolean,
    dependencies?: Record<string, string>,
    devDependencies?: Record<string, string>,
    peerDependencies?: Record<string, string>,
    optionalDependencies?: Record<string, string>,
    scripts?: Record<string, string>,
}

const readPackageJson = (path: string) => {
    const packagePath = `${path}/package.json`;
    if (!existsSync(packagePath)) { return {} as PackageJson; }
    return readJsonFile(packagePath) as PackageJson;
};

export {
    readPackageJson,
};

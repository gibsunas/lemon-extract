import { existsSync, readFileSync } from 'fs';

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
};

const readPackageJson = (path: string) => {
    const packagePath = `${path}/package.json`;
    if (!existsSync(packagePath)) { return {} as PackageJson; }
    try {
        return JSON.parse(readFileSync(packagePath, 'utf-8')) as PackageJson;
    } catch {
        // A malformed package.json in a scanned project is data, not a crash:
        // report it as empty so one bad project cannot abort the whole scan.
        return {} as PackageJson;
    }
};

export {
    readPackageJson
};

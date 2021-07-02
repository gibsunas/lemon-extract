import { readJsonFile } from '@nrwl/workspace';
import { existsSync } from 'fs';

const readPackageJson = (path: string) => {
    const packagePath = `${path}/package.json`;
    if (!existsSync(packagePath)) { return {}; }
    return readJsonFile(packagePath);
};

export {
    readPackageJson,
}

/* eslint-disable no-unreachable */
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { gatherMetadata } from './gather';

interface RunContext {
  rootDir: string,
}

interface Introspection {
  files?: string[],
  message: string,
  reason?: string,
  type: 'warning' | 'error',
}
interface IntrospectionError extends Introspection {
  type: 'error'
}

interface IntrospectionWarning extends Introspection {
  type: 'warning'
}
interface IntrospectionResult {
  errors: Object[],
  name: string,
  warnings: Object[],
}
interface NxIntrospectionResult extends IntrospectionResult {
  versions? : { cli?: { global?: string, local?: string }, workspace?: string },
  paths?: { nxJson?: string, workspaceJson?: string, }
}

const introspectNx : (runContext: RunContext) => NxIntrospectionResult = (inspectionContext:RunContext) => {
    const nxJsonPath = resolve(inspectionContext.rootDir, 'nx.json');
    const workspaceJsonPath = resolve(inspectionContext.rootDir, 'workspace.json');
    const packageJsonPath = resolve(inspectionContext.rootDir, 'package.json');
    const tsConfigJsonPath = resolve(inspectionContext.rootDir, 'tsconfig.json');
    const packageJson = JSON.parse(String(readFileSync(packageJsonPath)));
    const nxJson = JSON.parse(String(readFileSync(nxJsonPath)));
    // const tsConfigJson = JSON.parse(String(readFileSync(tsConfigJsonPath)));
    const workspaceJson = JSON.parse(String(readFileSync(workspaceJsonPath)));
    const { dependencies, devDependencies } = packageJson;
    const versions = {
        cli: {
            local: devDependencies['@nrwl/cli'] ?? null,
            global: null, // need to read global version
        },
        workspace: devDependencies['@nrwl/workspace'] ?? null,
    };

    const checkCacheableOperations = (config: any) => {
        const ops = config?.tasksRunnerOptions?.default?.options?.cacheableOperations ?? null;
        const expected = ['build', 'lint', 'test'];
        const missing = [];
        expected.forEach((x) => {
            const isIncluded = ops.includes(x);
            if (!isIncluded) {
                missing.push(x);
            }
        });

        const results: IntrospectionWarning[] = missing.map((x) => {
            const type = 'warning';
            const message = `Expected Nx task target '${x}' to be present in config.tasksRunnerOptions.default.options.cacheableOperations`;
            const files: string[] = [nxJsonPath];

            const result: IntrospectionWarning = {
                files,
                message,
                type,
            };
            return result;
        });

        return results;
    };

    const checkImplicitDependencies = (config: any) => {
        const hasNxJson = !!config.implicitDependencies['nx.json'];
        const hasPackageJson = !!config.implicitDependencies['package.json'];
        const hasWorkspaceJson = !!config.implicitDependencies['workspace.json'];

        const missing = [];

        if (!hasNxJson) {
            missing.push({ name: 'nx.json', path: nxJsonPath });
        }

        if (!hasPackageJson) {
            missing.push({ name: 'package.json', path: packageJsonPath });
        }

        if (!hasWorkspaceJson) {
            missing.push({ name: 'workspace.json', path: workspaceJsonPath });
        }

        const results: IntrospectionWarning[] = missing.map((x: { name: string, path: string }) => {
            const type = 'warning';
            const message = `Expected Nx implicit dependency '${x.name}' to be present in config.implicitDependencies`;
            const reason = `Generally changes in ${x.path} impact the entire project`;
            const files: string[] = [
                nxJsonPath,
                x.path,
            ];

            const result: IntrospectionWarning = {
                files,
                message,
                reason,
                type,
            };
            return result;
        });

        return results;
    };

    const checkEthics = (config: any) => {
        const { defaultBase } = config.affected ?? {};
        const usesMaster = defaultBase === 'master';
        const type = 'warning';
        const message = 'Expected Nx config.defaultBase !== master';
        const reason = 'https://github.com/github/renaming';
        const files: string[] = [nxJsonPath];

        const result: IntrospectionWarning = {
            files,
            message,
            reason,
            type,
        };
        return usesMaster ? [result] : [];
    };

    const checkPrivacy = (config: any) => {
        const tracksUsage = config?.tasksRunnerOptions?.default?.options?.canTrackAnalytics ?? null;

        if (!tracksUsage) { return []; }

        const type = 'warning';
        const message = 'Nx is allowed to track usage analytics: config.tasksRunnerOptions.default.options.canTrackAnalytics is true';
        const reason = 'This ';
        const files: string[] = [nxJsonPath];

        const result: IntrospectionWarning = {
            files,
            message,
            reason,
            type,
        };
        return [result];
    };
    const checkTypeScript = (config: any) => {
        const tracksUsage = config?.tasksRunnerOptions?.default?.options?.canTrackAnalytics ?? null;

        if (!tracksUsage) { return []; }

        const type = 'warning';
        const message = 'Nx is allowed to track usage analytics: config.tasksRunnerOptions.default.options.canTrackAnalytics is true';
        const reason = 'This ';
        const files: string[] = [nxJsonPath];

        const result: IntrospectionWarning = {
            files,
            message,
            reason,
            type,
        };
        return [result];
    };
    const checkScripts = (config: any) => {
        const hasNx = config?.scripts?.nx ?? null;

        if (hasNx) { return []; }

        const type = 'warning';
        const message = 'Expected config.scripts.nx to exist';
        const reason = 'Good question';
        const files: string[] = [packageJson];

        const result: IntrospectionWarning = {
            files,
            message,
            reason,
            type,
        };
        return [result];
    };

    gatherMetadata(inspectionContext.rootDir);
    return {
        name: 'nx',
        errors: [
            // ...checkTypeScript()
        ],
        paths: {
            nxJson: nxJsonPath,
            workspaceJson: workspaceJsonPath,
        },
        warnings: [
            // ...checkCacheableOperations(nxJson),
            // ...checkImplicitDependencies(nxJson),
            // ...checkEthics(nxJson),
            // ...checkPrivacy(nxJson),
            // ...checkScripts(packageJson),
        ],
        versions,
    };
};

const Nx = (runContext: RunContext) => introspectNx(runContext);

export { Nx };

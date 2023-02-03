import { LemonContext } from '@lemon/extract/core/types/lemonContext';
import { PrismaClient } from '@prisma/client';
import { existsSync } from 'fs';
import * as path from 'path';
import { ProjectConfig } from '../../repos';

const pluginBase = '@lemon/extract/core/plugins/';
const name = 'scan';
const extractCmd = `${name}`;
const description = '';
const fullName = `${pluginBase}${name}`;

const spaces = (length: number) => Array(length).fill(' ').join('');
type DefaultScanActions = {
    init: () => Promise<void>,
};

type SafeScanActions = {
    refresh: () => Promise<void>,
    // fetchFile: (filePathRelativeToRoot: string) => Promise<string>
};

type NodeScanActions = {
    // getPackageJson: () => Promise<string | undefined>,
};
type RepoScanActions = Partial<DefaultScanActions & SafeScanActions>;
export interface ScanPluginActions {
    repo: RepoScanActions,
    node: Partial<NodeScanActions>,
};

export type ScanActions = Partial<ScanPluginActions>;

const prisma = new PrismaClient();
const main = async (lemonContext: LemonContext) => {
    const debug = lemonContext.utils.debug.extend(name);
    debug('main');
    // const localContext = await bootstrap(lemonContext);
    lemonContext.config.projects.forEach(async (projectConfig) => {
        if (!projectConfig.enabled) { return; };
        debug(projectConfig);
        const record = {
            name: projectConfig.name
        };
        if (projectConfig.metadata?.arborist) {
            debug(projectConfig.metadata.arborist);
        }
        await prisma.lemonExtractProject.upsert({
            create: record,
            update: record,
            where: {
                id: projectConfig.id || Math.random() * 100000 + ''
            }
        }).catch(console.error);
    });
    debug('main completed');
    return lemonContext;
};
const updateMetadata = (lemonContext, project, expectations) => async (key) => {
    if (!project.metadata[key] !== expectations[key]) {
        const debug = lemonContext.utils.debug.extend(name);
        lemonContext.flags.verbosity > 2 && debug(`${spaces(26)}| ${project.name} | Updating local scan metadata: [${key}] (${project.metadata[key]} => ${expectations[key]})`);
        project.metadata[key] = expectations[key];
    }
};

const updateState = (lemonContext: LemonContext) => async (project: ProjectConfig) => {
    const debug = lemonContext.utils.debug.extend(name);
    if (!project.enabled) {
        lemonContext.flags.verbosity > 1 && debug(`Skipping disabled project | ${project.name}`);
        return;
    }
    const epectedPackagePath = path.join(String(project.metadata.rootDir), 'package.json');
    const hasPackagePath = existsSync(epectedPackagePath);
    if (!hasPackagePath) {
        lemonContext.flags.verbosity > 1 && debug(`Project is missing the package.json. Skipping | ${project.name}`);
        return;
    }

    updateMetadata(lemonContext, project, {
        scanActions: {
            repo: {
                refresh: (lemonContext) => lemonContext
            }
        }
    });
};

const bootstrap = async (lemonContext: LemonContext) => {
    const debug = lemonContext.utils.debug.extend(name);
    lemonContext.flags.verbosity > 2 && debug('Starting');

    await Promise.all(lemonContext.config.projects.map(await updateState(lemonContext)));
    lemonContext.flags.verbosity > 2 && debug('Finished');
    return lemonContext;
};

export { main };
export default {
    name: fullName,
    extractCmd,
    description,
    bootstrap,
    main
};

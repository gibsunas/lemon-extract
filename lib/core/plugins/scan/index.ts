import { LemonContext } from '@lemon/extract/core/types/lemonContext';
import { PrismaClient } from '@prisma/client';
import { existsSync } from 'fs';
import * as path from 'path';
import { ProjectConfig } from '../../repos';
import { spaces } from '../../ui/shittyFirstDraft';

const pluginBase = '@lemon/extract/core/plugins/';
const name = 'scan';
const extractCmd = `${name}`;
const description = '';
const fullName = `${pluginBase}${name}`;

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

    Promise.all(
        [lemonContext
            .config
            .projects
            .filter(({ enabled }) => !!enabled)
            .forEach(async (projectConfig) => {
                debug(projectConfig);
                const record = {
                    id: projectConfig.id,
                    name: projectConfig.name
                };
                const now = new Date(Date.now()).toUTCString();
                // const state: LemonExtractProjectState = {
                //     id: now,
                //     projectConfigHash: now,
                //     gitCommitId: ''
                // };
                // const project: LemonExtractProjectScan = {
                //     projectId: projectConfig.id,
                //     id: projectConfig.id + '-' + now + '-' + Math.random() * 100000,
                //     createdAt: new Date(now),
                //     updatedAt: new Date(now),
                //     projectStateId: now
                // };

                // debug('extracting');
                const lemonExtractProject = await prisma.lemonExtractProject.upsert({
                    create: record,
                    update: record,
                    where: {
                        id: projectConfig.id
                    }
                }).catch(debug);

                const commit = await prisma.gitCommit.upsert({
                    create: {
                        sha: now,
                        message: '',
                        timestamp: new Date(now)
                    },
                    update: {
                        sha: now,
                        message: '',
                        timestamp: new Date(now)
                    },
                    where: {
                        sha: now
                    }
                }).catch(debug);

                const lemonExtractProjectState = await prisma.lemonExtractProjectState.create({
                    data: {
                        gitCommitId: commit.sha,
                        projectConfigHash: ''
                    }
                }).catch(debug);
                const lemonExtractScanExtract = await prisma.extract.create({
                    data: {
                        inputData: ''
                    }
                }).catch(debug);
                const lemonExtractProjectScan = await prisma.lemonExtractProjectScan.create({
                    data: {
                        extractId: lemonExtractScanExtract.id,
                        projectId: lemonExtractProject.id,
                        projectStateId: lemonExtractProjectState.id
                    }
                }).catch(debug);

                if (projectConfig.metadata?.arborist && lemonExtractProjectState) {
                    // debug(projectConfig.metadata.arborist.valueOf());

                    const arborist = projectConfig.metadata.arborist.valueOf() as any;
                    // eslint-disable-next-line dot-notation
                    const arboristChildren = Array.from(arborist['children']);
                    const updatedState = await prisma.lemonExtractProjectState.update({
                        data: {
                            ...lemonExtractProjectState,
                            id: undefined
                        },
                        where: {
                            id: lemonExtractProjectState.id
                        }
                    }).catch(console.error);

                    projectConfig.metadata.projectStateId = (updatedState && lemonExtractProjectState.id) ?? (projectConfig.metadata.projectStateId || undefined);

                    await arboristChildren.map((v: any) => JSON.parse(JSON.stringify(v[1]))).forEach(async (arboristRecord: any) => {
                        const packageRecord = {
                            // ...arboristRecord,
                            id: arboristRecord.resolved,
                            name: `${arboristRecord.name}@${arboristRecord.version}`,
                            version: arboristRecord.version,
                            resolvedUri: arboristRecord.resolved
                            // edgesIn: undefined
                        };
                        const scanRecord = {
                            // ...arboristRecord,
                            // id: arboristRecord.resolved,
                            projectScanId: lemonExtractProjectScan.id,
                            packageName: packageRecord.name,
                            // version: arboristRecord.version,
                            packageURI: arboristRecord.resolved
                            // edgesIn: undefined
                        };
                        // console.table(packageRecord);
                        await prisma.package.upsert({
                            create: packageRecord,
                            update: packageRecord,
                            where: {
                                id: arboristRecord.resolved
                            }
                        }).catch(debug);
                        await prisma.lemonExtractScanRecord.create({ data: scanRecord }).catch(debug);
                    });

                    // debug(updatedState);

                    // const prismaInput: Partial<LemonExtractProjectScan> | any = {
                    //     id: now,
                    //     projectId: projectConfig.id,
                    //     projectStateId: now,
                    //     // projectId: projectConfig.id,
                    //     LemonExtractScanRecords: {
                    //         connectOrCreate: []
                    //     }
                    // };
                    // await prisma.lemonExtractProjectScan.upsert({
                    //     create: prismaInput,
                    //     update: prismaInput,
                    //     where: {
                    //         id: projectConfig.id || Math.random() * 100000 + ''
                    //     }
                    // }).catch(console.error);
                }
            })
        ]).finally(
            () => {
                debug('main completed');
            }
        );

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
        lemonContext.flags.verbosity > 4 && debug(`Skipping disabled project | ${project.name}`);

        return;
    }
    const epectedPackagePath = path.join(String(project.metadata.rootDir), 'package.json');
    const hasPackagePath = existsSync(epectedPackagePath);
    if (!hasPackagePath) {
        lemonContext.flags.verbosity > 4 && debug(`Project is missing the package.json. Skipping | ${project.name}`);

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

    lemonContext.flags.verbosity > 4 && debug('Starting');

    await Promise.all(lemonContext.config.projects.map(await updateState(lemonContext)));
    lemonContext.flags.verbosity > 4 && debug('Finished');

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

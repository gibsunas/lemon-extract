import { LemonContext } from '@lemon/extract/core/types/lemonContext';
import Arborist from '@npmcli/arborist';
import { existsSync } from 'fs';
import * as path from 'path';
import { ProjectConfig } from '../../repos';

const pluginBase = '@lemon/extract/core/plugins/';
const name = 'npm';
const extractCmd = `${name}`;
const description = '';
const fullName = `${pluginBase}${name}`;

const spaces = (length: number) => Array(length).fill(' ').join('');

const main = async (lemonContext: LemonContext) => {
    const debug = lemonContext.utils.debug.extend(name);
    debug('main');
    // const localContext = await bootstrap(lemonContext);
    lemonContext.config.projects.forEach((projectConfig) => {
        if (!projectConfig.enabled && !projectConfig.metadata?.arborist) { return; };
        // debug(projectConfig);
    });

    return lemonContext;
};
const updateMetadata = (lemonContext, project, expectations) => async (key) => {
    if (!project.metadata[key] !== expectations[key]) {
        const debug = lemonContext.utils.debug.extend(name);
        lemonContext.flags.verbosity > 2 && debug(`${spaces(26)}| ${project.name} | Updating local npm metadata: [${key}] (${project.metadata[key]} => ${expectations[key]})`);
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

    const arborist = new Arborist({
        path: project.metadata.rootDir
    })
        .buildIdealTree({})
        .then(async (tree) => {
            // debug(Object.keys(tree));
            // console.dir({ name: 'pinned', tree });
            const arboristChildren = new Map(tree.children);
            const expectations = {
                arborist: tree,
                arboristChildren,
                arboristInventory: tree.inventory,
                apple: tree.resolve('@angular-devkit/core').pkgid,
                banana: arboristChildren.get('@angular-devkit/core')
            };
            // debug(expectations.banana);
            const errorMessage = `Plugin ${fullName} expected project ${project.name} to have metadata. This may mean plugins are initialized incorrectly.`;
            if (!project.metadata) { throw new Error(errorMessage); }

            const update = updateMetadata(lemonContext, project, expectations);

            update('apple');
            update('banana');
            update('arborist');
            update('arboristChildren');
            update('arboristInventory');
            debug(project);
            project.scanActions && await project.scanActions.repo.refresh();
            return tree;
            // console.dir(
            //     Array.from(
            //         tree.children.values()
            //     )
            //         .map(
            //             (child) => ({
            //                 name: child.name,
            //                 childrenCount: Array.from(child.children.values()).length,
            //                 children: Array.from(child.children.values()).map(p => `${p.name}@${p.version}`)
            //             })
            //         )
            // );
        }).catch(lemonContext.utils.debug);
    updateMetadata(lemonContext, project, { arborist });
    // if (!hasGitDir) {
    //     lemonContext.flags.verbosity > 1 && debug(`Project is missing the .git folder. Skipping | ${project.name}`);
    //     return;
    // }

    // const gitOrigin = String(execSync('git remote get-url origin', { cwd: String(project.metadata.rootDir) })).replace('\n', '');

    //     arborist.children.values()
    // )
    //     .map(
    //         (child) => ({
    //             name: child.name,
    //             childrenCount: Array.from(child.children.values()).length,
    //             children: Array.from(child.children.values()).map(p => `${p.name}@${p.version}`)
    //         })
    //     );
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

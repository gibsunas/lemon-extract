import { LemonContext } from '@lemon/extract/core/types';
import { LemonConfig } from '@lemon/extract/core/types/lemonConfig';
// import { readJsonFile, writeJsonFile } from '@nrwl/workspace/src/utilities/fileutils';
import { lstatSync, readdirSync, readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import { ProjectConfig } from '../../repos';

const name = 'init';
const pluginBase = '@lemon/extract/core/plugins/';
const fullName = `${pluginBase}${name}`;
const extractCmd = `${name}`;
const description = 'Run this first';

const spaces = (length: number) => Array(length).fill(' ').join('');

const main = async (lemonContext: LemonContext) => {
    const debug = lemonContext.utils.debug.extend(name);
    debug('main');
    // console.log(lemonContext.config);
    if (lemonContext.config.lemonRcPath) {
        // we should also create an initial version to hydrate from
        const lemonConfig: LemonConfig = JSON.parse(String(readFileSync(lemonContext.config.lemonRcPath)));
        lemonConfig.projects = lemonContext.config.projects;
        writeFileSync(lemonContext.config.lemonRcPath, JSON.stringify(lemonConfig));
        return lemonContext;
    }
};

const bootstrap = async (lemonContext: LemonContext) => {
    const debug = lemonContext.utils.debug.extend(name);

    const updateMetadata = (lemonContext, project, expectations) => (key) => {
        if (!project.metadata[key] !== expectations[key]) {
            lemonContext.flags.verbosity > 2 && debug(`${spaces(25)}| ${project.name} | Updating local metadata: [${key}] (${project.metadata[key]} => ${expectations[key]})`);
            project.metadata[key] = expectations[key];
        }
    };

    const updateState = (lemonContext: LemonContext) => (project: ProjectConfig) => {
        const expectations = {
            rootDir: resolve(lemonContext.rootDir, project.root),
            isContextManagementRepo: project.name === lemonContext.config.contextRepo,
            enabled: project.enabled || false
        };
        if (!expectations.enabled) { return; }

        const update = updateMetadata(lemonContext, project, expectations);

        lemonContext.flags.verbosity > 2 && debug(`Updating in-memory state | ${project.name}`);

        if (!project.metadata) {
            lemonContext.flags.verbosity > 2 && debug(`${spaces(25)}| ${project.name} | Creating local metadata`);
            project.metadata = {};
        }

        update('enabled');
        update('rootDir');
        update('isContextManagementRepo');
    };
    lemonContext.flags.verbosity > 2 && debug('Starting', lemonContext.flags.verbosity);
    lemonContext.flags.verbosity > 3 && debug(lemonContext.config.projects);

    // Sourced from https://stackoverflow.com/a/24594123/1765430
    const getDirectories = (source) => readdirSync(source, { withFileTypes: true })
        .filter((dirent) => dirent.isDirectory())
        .map((dirent) => dirent.name);

    const isRootDirActuallyADir = lstatSync(lemonContext.rootDir).isDirectory(); // future handling of rootdirless might be interesting
    const directoriesInRootDir = !isRootDirActuallyADir ? [] : getDirectories(lemonContext.rootDir);
    if (lemonContext.config.projects.length !== directoriesInRootDir.length) {
        directoriesInRootDir.forEach((dir) => {
            // TODO: This should follow .gitignore rules () or we get:
            /*
                @lemon/extract:core:plugins:git Starting +0ms
                @lemon/extract:core:plugins:git Skipping disabled project | .git +1ms
                @lemon/extract:core:plugins:git Skipping disabled project | .github +0ms
                @lemon/extract:core:plugins:git Skipping disabled project | bin +0ms
                @lemon/extract:core:plugins:git Skipping disabled project | dist +0ms
                @lemon/extract:core:plugins:git Skipping disabled project | lib +0ms
                @lemon/extract:core:plugins:git Skipping disabled project | node_modules +0ms
                @lemon/extract:core:plugins:git Skipping disabled project | scripts +0ms
                @lemon/extract:core:plugins:git Finished +0ms
            */

            const isContextManagementRepo = dir === lemonContext.config.contextRepo ?? undefined;
            const rootDir = `./${dir}`;
            const matchingProjects = lemonContext.config.projects
                .filter((p) => p.root === rootDir);
            const errorMessage = `A duplicate project was detected (likely a bug or .lemon-extract.json misconfiguration): ${rootDir}`;
            switch (matchingProjects.length) {
                case 0: break;
                case 1: return;
                default: throw new Error(errorMessage);
            }

            const project: ProjectConfig = {
                name: dir,
                root: rootDir,
                enabled: isContextManagementRepo,
                metadata: {}
            };
            isContextManagementRepo && (project.metadata.isContextManagementRepo = isContextManagementRepo);

            lemonContext.config.projects.push(project);
        });
    }

    lemonContext.config.projects.forEach(updateState(lemonContext));
    lemonContext.flags.verbosity > 3 && debug(lemonContext.config.projects);
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

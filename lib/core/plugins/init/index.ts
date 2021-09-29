import { LemonContext } from '@lemon/extract/core/types/lemonContext';
import { readdirSync } from 'fs';
import { resolve } from 'path';
import { ProjectConfig } from '../../repos';

const pluginBase = '@lemon/extract/core/plugins/';
const name = 'init';
const fullName = `${pluginBase}${name}`;

const spaces = (length: number) => Array(length).fill(' ').join('');

const main = async (lemonContext: LemonContext) => {
    // const debug = Debug.extend("plugins:init")
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
            enabled: project.enabled || false,
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
    debug('Starting', lemonContext.flags.verbosity);
    lemonContext.flags.verbosity > 1 && debug(lemonContext.config.projects);

    // Sourced from https://stackoverflow.com/a/24594123/1765430
    const getDirectories = (source) => readdirSync(source, { withFileTypes: true })
        .filter((dirent) => dirent.isDirectory())
        .map((dirent) => dirent.name);

    const directoriesInRootDir = getDirectories(lemonContext.rootDir);
    if (lemonContext.config.projects.length !== directoriesInRootDir.length) {
        directoriesInRootDir.forEach((dir) => {
            const isContextManagementRepo = dir === lemonContext.config.contextRepo ?? undefined;
            const rootDir = `./${dir}`;
            const matchingProjects = lemonContext.config.projects.filter((p) => p.root === rootDir);
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
                metadata: {},
            };
            isContextManagementRepo && (project.metadata.isContextManagementRepo = isContextManagementRepo);

            lemonContext.config.projects.push(project);
        });
    }

    lemonContext.config.projects.forEach(updateState(lemonContext));
    debug('Finished');
    return lemonContext;
};

export { main };
export default { name: fullName, main };

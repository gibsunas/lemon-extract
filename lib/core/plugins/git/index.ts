import { LemonContext } from '@lemon/extract/core/types/lemonContext';
import { execSync } from 'child_process';
import { existsSync } from 'fs';
import path from 'path';
import { ProjectConfig } from '../../repos';

const pluginBase = '@lemon/extract/core/plugins/';
const name = 'git';
const extractCmd = `${name}`;
const description = '';
const fullName = `${pluginBase}${name}`;

const spaces = (length: number) => Array(length).fill(' ').join('');

const main = async (lemonContext: LemonContext) => {
    const debug = lemonContext.utils.debug.extend(name);
    debug('main');
    return lemonContext;
};

const bootstrap = async (lemonContext: LemonContext) => {
    const debug = lemonContext.utils.debug.extend(name);

    const updateMetadata = (lemonContext, project, expectations) => (key) => {
        if (!project.metadata[key] !== expectations[key]) {
            lemonContext.flags.verbosity > 2 && debug(`${spaces(25)}| ${project.name} | Updating local git metadata: [${key}] (${project.metadata[key]} => ${expectations[key]})`);
            project.metadata[key] = expectations[key];
        }
    };

    const updateState = (lemonContext: LemonContext) => (project: ProjectConfig) => {
        // debug(project)
        if (!project.enabled) {
            lemonContext.flags.verbosity > 1 && debug(`Skipping disabled project | ${project.name}`);
            return;
        }
        const gitDirPath = path.join(String(project.metadata.rootDir), '.git');
        const hasGitDir = existsSync(gitDirPath);

        if (!hasGitDir) {
            lemonContext.flags.verbosity > 1 && debug(`Project is missing the .git folder. Skipping | ${project.name}`);
            return;
        }

        const gitOrigin = String(execSync('git remote get-url origin', { cwd: String(project.metadata.rootDir) })).replace('\n', '');

        const expectations = {
            gitOrigin
        };
        const errorMessage = `Plugin ${fullName} expected project ${project.name} to have metadata. This may mean plugins are initialized incorrectly.`;
        if (!project.metadata) { throw new Error(errorMessage); }

        const update = updateMetadata(lemonContext, project, expectations);

        lemonContext.flags.verbosity > 2 && debug(`Updating in-memory state | ${project.name}`);

        update('gitOrigin');
        // update("rootDir");
        // update("isContextManagementRepo");
    };
    lemonContext.flags.verbosity > 2 && debug('Starting');

    lemonContext.config.projects.forEach(updateState(lemonContext));
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

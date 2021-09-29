import { ProjectConfig } from '@lemon/extract/core/repos';
import { LemonContext } from '@lemon/extract/core/types/lemonContext';

const pluginBase = '@lemon/extract/core/plugins/';
const name = 'github';
const fullName = `${pluginBase}${name}`;

const spaces = (length: number) => Array(length).fill(' ').join('');

const main = async (lemonContext: LemonContext) => {
    const debug = lemonContext.utils.debug.extend(name);
    debug('Launching');

    const githubActions: GithubActions = (project): Partial<RepoActions> => {
        if (!project.metadata.githubId) {
            lemonContext.flags.verbosity > 1 && debug(`${spaces(25)}| ${project.name} | No available actions, skipping (missing githubId)`);
            return {};
        }

        return {
            repo: {
                fetchFile: async (filePathRelativeToRoot) => {
                    console.log(
                        project,
                        project.metadata?.githubId,
                        filePathRelativeToRoot,
                    );
                    return '1';
                },
            },
        };
    };

    const updateMetadata = (lemonContext, project, expectations) => (key) => {
        if (project.metadata[key] !== expectations[key]) {
            lemonContext.flags.verbosity > 2 && debug(`${spaces(25)}| ${project.name} | Updating local github metadata: [${key}] (${project.metadata[key]} => ${expectations[key]})`);
            project.metadata[key] = expectations[key];
        }
    };

    const updateState = (lemonContext: LemonContext) => (project: ProjectConfig) => {
        // debug(project)

        if (!project.enabled || !project.metadata?.gitOrigin) {
            lemonContext.flags.verbosity > 1 && debug(`Skipping disabled project | ${project.name}`);
            return;
        }

        const errorMessage = `Plugin ${fullName} expected project ${project.name} to have metadata. This may mean plugins are initialized incorrectly.`;
        if (!project.metadata) { throw new Error(errorMessage); }

        const githubURI = String(project.metadata.gitOrigin)
            .replace('git@github.com:', 'https://github.com/')
            .replace('.git', '');

        const expectations = {
            githubURI,
            // githubId: "<fill this in from gql query>",
            githubDefaultBranchRef: '<fill this in too>',
        };
        const update = updateMetadata(lemonContext, project, expectations);

        lemonContext.flags.verbosity > 2 && debug(`Updating in-memory state | ${project.name}`);

        update('githubURI');
        update('githubId');
        update('githubDefaultBranchRef');
        const repoActions = githubActions(project).repo;
        if (repoActions?.fetchFile) {
            repoActions.fetchFile('package.json');
            repoActions.fetchFile('yarn.lock');
        }
    };
    lemonContext.config.projects
        // .filter(p => p.enabled && p.metadata?.gitOrigin)
        .forEach(updateState(lemonContext));
    // debug(lemonContext.config.projects.filter(p => p.enabled))
    debug('Launched');
    return lemonContext;
};

export type RepoActions = {
    repo: {
        fetchFile: (filePathRelativeToRoot: string) => Promise<string>
    }
}
export type GithubActions = (project: ProjectConfig) => Partial<RepoActions>

export { main };
export default { name: fullName, main };

import { ProjectDao } from '@lemon/extract/core/plugins/github/dao';
import { ProjectConfig } from '@lemon/extract/core/repos';
import { LemonContext } from '@lemon/extract/core/types/lemonContext';
import { join as PathJoin } from 'path';
type DefaultRepoActions = {
    init: () => Promise<void>,
};

type SafeRepoActions = {
    refresh: () => Promise<void>,
    fetchFile: (filePathRelativeToRoot: string) => Promise<string>
};

type NodeRepoActions = {
    getPackageJson: () => Promise<string | undefined>,
};

type RepoActions = Partial<DefaultRepoActions & SafeRepoActions>;
export interface GithubPluginActions {
    repo: RepoActions,
    node: Partial<NodeRepoActions>,
};

export type GithubActions = Partial<GithubPluginActions>;

const pluginBase = '@lemon/extract/core/plugins/';
const name = 'github';
const extractCmd = `${name}`;
const description = '';
const fullName = `${pluginBase}${name}`;

const spaces = (length: number) => Array(length).fill(' ').join('');

const fetchFile = (project) => async (filePathRelativeToRoot) => {
    console.log(
        project,
        project.metadata,
        PathJoin(project.metadata.githubURI || '', filePathRelativeToRoot || '')
    );
    return '1';
};
const main = async (lemonContext: LemonContext) => {
    const debug = lemonContext.utils.debug.extend(name);
    debug('main');
    lemonContext.plugins.get('@lemon/extract/core/plugins/debug').main(lemonContext);
    return lemonContext;
};

const bootstrap = async (lemonContext: LemonContext) => {
    const debug = lemonContext.utils.debug.extend(name);
    lemonContext.flags.verbosity > 2 && debug('Launching');

    const githubActions: (project) => GithubActions = (project): Partial<GithubPluginActions> => {
        if (!project.metadata.githubId) {
            lemonContext.flags.verbosity > 1 &&
                debug(`${spaces(25)}| ${project.name} | No available actions to enable (missing githubId)`);
            return {
                node: {
                    getPackageJson: () => fetchFile(project)('package.json')
                },
                repo: {
                    init: async () => { }
                }
            };
        }
        return {
            node: {
                getPackageJson: () => fetchFile(project)('package.json')
            },
            repo: {
                fetchFile: fetchFile(project)
            }
        };
    };

    const updateMetadata = (lemonContext, project, expectations) => (key) => {
        if (project.metadata[key] !== expectations[key]) {
            lemonContext.flags.verbosity > 2 &&
                debug(`${spaces(25)}| ${project.name} | Updating local github metadata: [${key}] (${project.metadata[key]} => ${expectations[key]})`);
            project.metadata[key] = expectations[key];
        }
    };

    const updateState = (lemonContext: LemonContext) => async (project: ProjectConfig) => {
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

        // i don't care for this...i don't think i got this static signature right
        // It feels odd to not pass in the project
        const githubId = await ProjectDao.getRepoId(lemonContext)({ byURI: githubURI });
        const expectations = {
            githubURI,
            githubId,
            githubDefaultBranchRef: '<fill this in too>'
        };
        const update = updateMetadata(lemonContext, project, expectations);

        lemonContext.flags.verbosity > 2 && debug(`Updating in-memory state | ${project.name}`);

        update('githubURI');
        update('githubId');
        update('githubDefaultBranchRef');
        const projectActions = githubActions(project);
        project.githubActions = projectActions;

        if (projectActions.repo?.fetchFile) {
            projectActions.repo.fetchFile('package.json');
            projectActions.repo.fetchFile('yarn.lock');
        }
    };
    lemonContext.config.projects
        // .filter(p => p.enabled && p.metadata?.gitOrigin)
        .forEach(await updateState(lemonContext));
    // debug(lemonContext.config.projects.filter(p => p.enabled))
    lemonContext.flags.verbosity > 2 && debug('Launched');
    return lemonContext;
};

export { bootstrap, main };
export default {
    name: fullName,
    extractCmd,
    description,
    bootstrap,
    main
};

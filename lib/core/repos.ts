import { GithubActions } from '@lemon/extract/core/plugins/github';
import { LemonContext } from '@lemon/extract/core/types/lemonContext';
import { execSync } from 'child_process';
import { existsSync } from 'fs';
import * as path from 'path';
import { readPackageJson } from '../utils';

const gitStat2JsonPath = path.resolve(__dirname, '../lib/utils/external/git-log2json', 'git-stat2json');
// console.log(gitStat2JsonPath)
export type ProjectConfigMetadata = {

};
export type ProjectConfig = {
    name?: string,
    enabled?: boolean,
    root?: string,
    githubActions?: GithubActions,
    metadata?: Record<string, string | boolean | number>,
};

export type CoreProjectsConfig = {
    cwd?: string;
    projects?: ProjectConfig[]
};

const getScriptMetadata = (scripts: Record<string, string>) => {
    const result = {
        start: scripts.start,
        test: scripts.test,
        build: scripts.build,
        lint: scripts.lint,
        help: scripts.help
    };
    return result;
};

const getGitMetadata = (rootDir: string) => {
    try {
        if (!existsSync(path.join(rootDir, '.git'))) { return null; }
        // const gitStat = String(execSync(gitStat2JsonPath, { cwd: rootDir}));
        const gitStatus = String(execSync('git status', { cwd: rootDir }));
        const gitFetch = String(execSync('git fetch --all -q', { cwd: rootDir }));
        // Sourced from: https://stackoverflow.com/a/50056710
        const gitDefaultBranch = String(execSync("git remote show origin | sed -n '/HEAD branch/s/.*: //p'", { cwd: rootDir })).replace('\n', '');
        // const gitPull = String(execSync("git fetch --all", { cwd: rootDir}));
        // console.log({gitFetch, gitDefaultBranch })

        return { defaultBranch: gitDefaultBranch };
    } catch (err) {
        // console.error(err);
    }
};

export const CoreProjects = (context: LemonContext) => async () => {
    // const repo = await client.getRepo(lemonRc.organization, lemonRc.contextRepo);
    // const { data: projects } = await repo.listProjects();

    // // const { data: notifications } = await user.listNotifications();
    context.config.projects.map((x) => {
        const projectRoot = path.join(context.rootDir, x.root);

        const packageJson = readPackageJson(projectRoot);
        const scripts: Record<string, string> = packageJson.scripts || {};
        const scriptMetadata = getScriptMetadata(scripts);
        const gitMetadata = getGitMetadata(projectRoot);
        const metadata = {
            git: gitMetadata,
            scripts: scriptMetadata,
            projectRoot
        };
        const result = {
            // packageJson,
            metadata
        };
        console.log(result);
        // console.log(x.repository, x.subject)
    });

    return context;
};

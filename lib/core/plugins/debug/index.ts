import { LemonContext } from '@lemon/extract/core/types/lemonContext';

const pluginBase = '@lemon/extract/core/plugins/';
const name = 'debug';
const extractCmd = undefined;
const description = 'Init stuff';
const fullName = `${pluginBase}${name}`;

const spaces = (length: number) => Array(length).fill(' ').join('');

const bootstrap = async (lemonContext: LemonContext) => {
    const debug = lemonContext.utils.debug.extend(name);
    lemonContext.flags.verbosity > 2 && debug('bootstrap');
    return lemonContext;
};

const main = async (lemonContext: LemonContext) => {
    const debug = lemonContext.utils.debug.extend(name);
    lemonContext.flags.verbosity > 2 && debug('Launching');

    const project = lemonContext.config.projects.find((x) => x.enabled && x.name === 'handled');

    if (project && project.githubActions) {
        const actions = project.githubActions;
        actions.node?.getPackageJson();
    }
    debug(lemonContext.config.projects.filter((p) => p.enabled));
    lemonContext.flags.verbosity > 2 && debug('Launched');
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

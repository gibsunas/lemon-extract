import { LemonContext } from '@lemon/extract/core/types/lemonContext';

const pluginBase = '@lemon/extract/core/plugins/';
const name = 'debug';
const fullName = `${pluginBase}${name}`;

const spaces = (length: number) => Array(length).fill(' ').join('');

const main = async (lemonContext: LemonContext) => {
    const debug = lemonContext.utils.debug.extend(name);
    debug('Launching');

    debug(lemonContext.config.projects.filter((p) => p.enabled));
    debug('Launched');
    return lemonContext;
};

export { main };
export default { name: fullName, main };

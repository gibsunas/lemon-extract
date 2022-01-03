import { LemonConfig } from '@lemon/extract/core/types/lemonConfig';
import { LemonContext } from '@lemon/extract/core/types/lemonContext';
import { existsSync, readFileSync } from 'fs';
import { join, resolve } from 'path';

const applyLemonRcToContext = (context: LemonContext, lemonRc: Partial<LemonConfig>) => {
    context.config = { ...context.config, ...lemonRc };
    return context;
};

const applyContextToLemonRc = (context: LemonContext, lemonRc: Partial<LemonConfig>) => {
    lemonRc.projects = context.config.projects || [];
    return lemonRc;
};

const getConfig = async (context: LemonContext): Promise<LemonContext> => {
    const debug = context.utils.debug.extend('config');
    const lemonRcPath = context.config?.lemonRcPath ?? resolve(join(context.rootDir, '.lemon-extract.json'));

    debug(`Checking for config ${lemonRcPath}`);

    const hasLemonRc = existsSync(lemonRcPath);

    if (!hasLemonRc) { debug('Defaulting to supplied context'); return context; }

    debug('Config found!');
    const config = readFileSync(lemonRcPath, 'utf-8');

    const lemonRc: Partial<LemonConfig> = { ...JSON.parse(config) as Partial<LemonConfig> };

    if (context.flags.verbosity > 1) {
        debug(`.lemonrc => ${JSON.stringify(lemonRc, undefined, 2)}`);
    }
    return applyLemonRcToContext(context, lemonRc);
};

export { applyContextToLemonRc, applyLemonRcToContext, getConfig };

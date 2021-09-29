import { LemonConfig } from '@lemon/extract/core/types/lemonConfig';
import { LemonContext } from '@lemon/extract/core/types/lemonContext';
import fs from 'fs';
import { join, resolve } from 'path';

const applyLemonRcToContext = (context: LemonContext, lemonRc: Partial<LemonConfig>) => {
    context.config = { ...context.config, ...lemonRc };
    return context;
};

const getConfig = async (context: LemonContext): Promise<LemonContext> => {
    const debug = context.utils.debug.extend('config');
    const lemonRcPath = context.config?.lemonRcPath ?? resolve(join(context.rootDir, '.lemon-extract.json'));

    debug(`Checking for config ${lemonRcPath}`);

    const hasLemonRc = fs.existsSync(lemonRcPath);

    if (!hasLemonRc) { return context; }

    debug('Config found!');
    const config = fs.readFileSync(lemonRcPath, 'utf-8');
    // console.trace(config)
    const lemonRc: Partial<LemonConfig> = { ...JSON.parse(config) as Partial<LemonConfig> };
    // lemonRc.cwd = cwd;
    if (context.flags.verbosity > 1) {
        debug(`.lemonrc => ${JSON.stringify(lemonRc, undefined, 2)}`);
    }
    return applyLemonRcToContext(context, lemonRc);
};

export { getConfig };

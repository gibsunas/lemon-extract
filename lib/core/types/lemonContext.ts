import { LemonConfig } from '@lemon/extract/core/types/lemonConfig';
import { Debugger } from 'debug';
import { debug as Debug } from '../../utils/debug';

export interface LemonContext {
    config: LemonConfig,
    processArgs?: Record<string, string>,
    rootDir: string,
    plugins: Map<string, any>,
    utils: {
        debug: Debugger
    }
    flags: {
        isDryRun: boolean,
        verbosity: 0 | 1 | 2 | 3,
    },
    auditLog: [],
    fixes: {
        pending: [],
        applied: [],
        failed: [],
    },
}

export const initNewContext = (initialContext: Partial<LemonContext>) => {
    const lemonContext: LemonContext = {
        config: initialContext.config || {},
        processArgs: undefined,
        plugins: new Map<string, any>(),
        rootDir: initialContext.rootDir || process.cwd(),
        utils: {
            debug: Debug.extend('core'),
        },
        flags: {
            isDryRun: initialContext.flags?.isDryRun ?? true,
            verbosity: initialContext.flags?.verbosity ?? 3,
        },
        auditLog: [],
        fixes: {
            pending: [],
            applied: [],
            failed: [],
        },
    };
    if (lemonContext.flags.verbosity > 1) {
        lemonContext.utils.debug(`initNewContext => ${JSON.stringify(lemonContext, undefined, 2)}`);
    }
    return lemonContext;
};

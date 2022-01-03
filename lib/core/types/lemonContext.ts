import { LemonConfig } from '@lemon/extract/core/types/lemonConfig';
import { Debugger } from 'debug';
import type fetch from 'node-fetch';
import { debug as Debug } from '../../utils/debug';
// const fetch = require('node-fetch');
interface LemonContext {
    config: LemonConfig,
    commandOptions?: Record<string, string>,
    processArgs?: Record<string, string>,
    cwd: string,
    rootDir: string,
    plugins: Map<string, any>,
    utils: {
        debug: typeof Debugger
        fetch: typeof fetch
    }
    flags: {
        isDryRun: boolean,
        verbosity: 0 | 1 | 2 | 3 | 4,
    },
    auditLog: [],
    fixes: {
        pending: [],
        applied: [],
        failed: [],
    },
}

const initNewContext = (initialContext: Partial<LemonContext>) => {
    const lemonContext: LemonContext = {
        config: initialContext.config || { projects: [] },
        commandOptions: undefined,
        processArgs: undefined,
        plugins: new Map<string, any>(),
        rootDir: initialContext.rootDir || process.cwd(),
        cwd: initialContext.cwd || process.cwd(),
        utils: {
            debug: Debug.extend('core')
        },
        flags: {
            isDryRun: initialContext.flags?.isDryRun ?? true, // Unless instructed otherwise, ALWAYS assume dry-run
            verbosity: initialContext.flags?.verbosity ?? 4
        },
        auditLog: [],
        fixes: {
            pending: [],
            applied: [],
            failed: []
        }
    };
    lemonContext.flags.verbosity > 1 &&
        lemonContext.utils.debug(`initNewContext => ${JSON.stringify(lemonContext, undefined, 2)}`);
    return lemonContext;
};

export { initNewContext, LemonContext };

import { LemonConfig } from '@lemon/extract/core/types/lemonConfig';
import { Debugger } from 'debug';
import { debug as Debug } from '../../utils/debug';
import type { GithubContext } from '../../integrations/github/types';
interface LemonContext {
    config: LemonConfig,
    commandOptions?: Record<string, string>,
    processArgs?: Record<string, string>,
    cwd: string,
    rootDir: string,
    plugins: Map<string, any>,
    /**
     * GitHub identity + capability record (issue #6). Absent when no
     * credential was supplied; never contains the token itself.
     */
    github?: GithubContext,
    utils: {
        debug: typeof Debugger
        fetch?: typeof globalThis.fetch
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

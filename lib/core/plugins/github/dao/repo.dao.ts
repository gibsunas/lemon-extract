import { LemonContext } from '@lemon/extract/core/types/lemonContext';
import { ProjectConfig } from '../../../repos';

type GetRepoIdOptions = {
    project: ProjectConfig,
    byURI?: string,
    byName?: string,
};

type GetRepoId = (lemonContext: LemonContext) => (options: Partial<GetRepoIdOptions>) => Promise<LemonContext | string>;
const getRepoId: GetRepoId = (lemonContext: LemonContext) => async (options: GetRepoIdOptions) => {
    const debug = lemonContext.utils.debug.extend('dao:repo');
    const fetch = lemonContext.utils.fetch;

    if (options.byName) {
        debug(options.byName);
    } else if (options.byURI) {
        debug(options.byURI);
    } else {
        debug(options);
    }

    return '<these are not the id you were looking for>';
};

export { getRepoId };

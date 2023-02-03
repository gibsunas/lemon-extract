import { corePlugins } from '@lemon/extract/core/plugins';
import { LemonContext } from '@lemon/extract/core/types/lemonContext';

const initializeLocalContext = (upstream: LemonContext) => {
    const debug = upstream.utils.debug.extend('plugins');
    return { ...upstream, utils: { ...upstream.utils, debug } };
};

const init = (localContext: LemonContext, currentPlugin) => async (context: LemonContext) => {
    localContext.utils.debug(localContext.flags);
    localContext.flags.verbosity > 0 && localContext.utils.debug(`    Bootstrapping => ${currentPlugin.name}`);
    currentPlugin.bootstrap && await currentPlugin.bootstrap(localContext);
    // currentPlugin.main && currentPlugin.main(localContext);
    context.plugins.set(currentPlugin.name, currentPlugin);
    return context;
};

const main = async (lemonContext: LemonContext) => {
    const localContext = initializeLocalContext(lemonContext);

    const pluginsToInit = [...corePlugins];
    localContext.utils.debug('Assembling plugins');

    pluginsToInit.forEach(async (currentPlugin) => {
        await init(localContext, currentPlugin)(lemonContext);
    });
    localContext.utils.debug('Plugins loaded');
    localContext.utils.debug('Assembled plugins');
    return lemonContext;
};

const bootstrap = (lemonContext) => { lemonContext.utils.debug({ hello: 2 }); };

export {
    bootstrap,
    main
};

import { corePlugins } from '@lemon/extract/core/plugins';
import { LemonContext } from '@lemon/extract/core/types/lemonContext';
import { LemonPlugin } from '@lemon/extract/core/types/lemonPlugin';

const applyLocalContext = (upstream: LemonContext, local: LemonContext) => {
    console.log(upstream.plugins.size, local.plugins.size);
    upstream.plugins = local.plugins;
    console.log(upstream.plugins.size, local.plugins.size);

    return upstream;
};

const initializeLocalContext = (upstream: LemonContext) => {
    const debug = upstream.utils.debug.extend('plugins');
    return { ...upstream, utils: { ...upstream.utils, debug } };
};

const init = (localContext: LemonContext, currentPlugin: LemonPlugin) => (context: LemonContext) => {
    localContext.flags.verbosity > 0 && localContext.utils.debug(`    Bootstrapping => ${currentPlugin.name}`);
    currentPlugin.bootstrap && currentPlugin.bootstrap(localContext);
    // currentPlugin.main && currentPlugin.main(localContext);
    context.plugins.set(currentPlugin.name, currentPlugin);
    return context;
};

const main = async (lemonContext: LemonContext) => {
    const localContext = initializeLocalContext(lemonContext);

    localContext.utils.debug('Assembling plugins');
    const pluginsToInit = [...corePlugins];

    // yes, it's lazy
    const cb = (promiseChain, currentPlugin) =>
        promiseChain.then(init(localContext, currentPlugin));
    return pluginsToInit.reduce(cb, Promise.resolve(lemonContext))
        .then((context) => {
            localContext.utils.debug('Plugins loaded');
            return context; // applyLocalContext(context, localContext);
        });
};

const bootstrap = () => { };

export {
    bootstrap,
    main
};

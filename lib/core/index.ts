import { Github } from '../integrations/github/index';
import { getConfig } from './config';
import { main as LoadPlugins } from './pluginController';
import { CoreProjects } from './repos';
import { initNewContext } from './types/lemonContext';

const fs = require('fs');

const main = async ({ processArgs }) => {
    const initialContext = initNewContext({ processArgs });
    const { debug } = initialContext.utils;

    debug('Initializing');
    const context = await getConfig(initialContext).then(LoadPlugins)
        .catch((error) => {
            debug('Something went wrong while loading plugins');
            console.error(error);
            return initialContext;
        })
        .finally(() => {
            debug('Initialized');
        });

    if (context.flags.verbosity > 0 && !process.env.DEBUG) {
        debug('🍋 Oh hi there!');
        debug('🍋 Tip: Run with DEBUG=@lemon/extract:* ');
    }

    const github = Github(initialContext);
    const projects = CoreProjects(context);
    const something = () => { };
    return {
        projects,
        github,
        something,
    };
};
export {
    main,
};

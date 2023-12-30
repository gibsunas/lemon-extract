import { LemonContext } from '@lemon/extract/core/types/lemonContext';
import { readPackageJson } from '@lemon/extract/utils';
import { Command } from 'commander';
import { debug } from 'debug';
import * as path from 'path';
import { getConfig } from './config';
import { main as LoadPlugins } from './pluginController';
import { initNewContext } from './types/lemonContext';

const corePlugins = [
    '@lemon/extract/core/plugins/init',
    '@lemon/extract/core/plugins/git',
    '@lemon/extract/core/plugins/github',
    '@lemon/extract/core/plugins/npm',
    '@lemon/extract/core/plugins/scan',
    '@lemon/extract/core/plugins/debug'
];

const initializeLocalContext = (upstream: LemonContext, commandOptions?: Record<string, string>) => {
    const debug = upstream.utils.debug.extend('cli');
    return {
        ...upstream,
        commandOptions,
        utils: {
            ...upstream.utils,
            debug
        }
    };
};

export const createExtractCore = (lemonContext: LemonContext) => {
    debug('@lemon/extract')('Creating LemonExtractCore');
    return main(lemonContext);
};

const commandHandler = (lemonContext: LemonContext, key: string) => async (command: Command) => {
    // const handlerContext = initializeLocalContext(lemonContext);
    const handler = lemonContext.plugins.get(key);

    if (!handler || !handler.extractCmd || !handler.main) { return; }
    lemonContext.flags.verbosity > 2 && lemonContext.utils.debug(`Plugin has a CLI command. Connecting [${handler.extractCmd}] => ${key} `);
    await command
        .command(handler.extractCmd)
        .description(handler.description)
        .action((options) => handler.main(initializeLocalContext(lemonContext, options)));
};

const bootstrap = async (options: { cliCommand: Command, processArgs }) => {
    const packageJson = readPackageJson(path.resolve(__dirname, '..'));
    options.cliCommand.version(packageJson.version);

    const initialContext = initNewContext({ processArgs: options.processArgs });
    const { debug } = initialContext.utils;

    const lemonContext = await getConfig(initialContext)
        .then(LoadPlugins)
        .catch((error) => {
            debug('Something went wrong while loading plugins');
            console.error(error);
            return initialContext;
        })
        .finally(() => {
            debug('Initialized');
        });

    const lemonExtract = await createExtractCore(lemonContext);
    debug(lemonContext);
    corePlugins.map(async (key) =>
        await commandHandler(lemonExtract, key)(options.cliCommand)
    );
    // options.cliCommand
    //     .command('github')
    //     .description('Github')
    //     .action(() => { });

    // options.cliCommand
    //     .command('something')
    //     .description('Something')
    //     .action(createExtractCore(lemonContext)
    //         .then(() => something()));

    // options.cliCommand
    //     .command('gh')
    //     .description('Github')
    //     .action(createExtractCore(lemonContext)
    //         .then(() => github()));

    // options.cliCommand
    //     .command('projects')
    //     .description('Projects')
    //     .action(createExtractCore(lemonContext)
    //         .then(() => projects()));
    debug('Initialized');
    return lemonContext;
};

const main = async (lemonContext: LemonContext) => {
    debug('Initializing');

    if (lemonContext.flags.verbosity > 0 && !process.env.DEBUG) {
        debug('🍋 Oh hi there!');
        debug('🍋 Tip: Run with DEBUG=@lemon/extract:* ');
    }

    return lemonContext;
};

export {
    bootstrap,
    main
};

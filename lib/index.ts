import { bootstrap as BootstrapLemonExtract } from '@lemon/extract/core';
import { Command } from 'commander';

// const fs = require('fs');
// const glob = require('glob');

// const transformToTable = (metadata) =>
// // console.log(metadata.stats)
// ({
//     title: metadata.configPath,
//     fileCount: metadata.files ? metadata.files.length : 0,
//     size: metadata.stats.total,
//     errors: metadata.errors.join(', '),
// });
// const extractStats = (metadata) => {
//     let total = 0;
//     const files = metadata.files || [];
//     files.map((file) => {
//         const stats = fs.statSync(resolve(metadata.rootDir, file));
//         total += stats.size;
//     });

//     return { ...metadata, stats: { total } };
// };
// const collectSchematicCollections = async (): Promise<string[]> => new Promise((resolve, reject) => {
//     glob('**/collection.json', async (error, files) => {
//         resolve(files);
//     });
// });

// const extract = async () => {
//     glob('**/tsconfig*.json', async (er, files) => {
//         const rootPath = process.cwd();
//         // files is an array of filenames.
//         // If the `nonull` option is set, and nothing
//         // was found, then files is ["**/*.js"]
//         // er is an error object or null.
//         // console.log(files);
//         const schematicCollections = await collectSchematicCollections();
//         // console.log(schematicCollections)
//         const ignoreList = schematicCollections.map((collectionPath) => {
//             const collectionRoot = resolve(collectionPath.replace('collection.json', ''));
//             const { schematics }: { schematics: any } = JSON.parse(String(fs.readFileSync(collectionPath)));
//             const collectionSchematics: Array<any> = Object.values(schematics);
//             collectionSchematics.map((key) => {
//                 console.log(schematics, schematics[key]);
//             });
//             debug({ schematics, collectionSchematics });

//             const dirsToIgnore = !collectionSchematics.length ? [] : collectionSchematics
//                 .filter((s) => s.schema)
//                 .map((schematic) => {
//                     const { schema } = schematic;
//                     console.log({ collectionRoot, schema });
//                     const schemaPath = resolve(collectionRoot, schema);
//                     const partialPath = `${schemaPath.replace('schema.json', '')}files`;

//                     const filesDir = schema.replace('schema.json', '');
//                     return filesDir;
//                 })
//                 .map((schematicFilesRoot) => `${schematicFilesRoot}.*`.replace('/', '\/'))
//                 .flat();

//             return dirsToIgnore;
//         }).flat();

//         console.log(ignoreList);
//         const uniqueConfigTypes = files
//             .filter((file) => !file.includes('node_modules'))
//             .map((file) => {
//                 debug('typescript:config')(`Found ${file}`);
//                 return file.split('/').pop();
//             }).reduce((acc, x) => {
//                 const result = { ...acc };
//                 result[x] = result[x] ? result[x] + 1 : 1;
//                 return result;
//             }, {});

//         const inspectConfig = (config) => {
//             let metadata = {
//                 configPath: config,
//                 errors: [],
//                 rootDir: dirname(config),
//             };
//             try {
//                 metadata = {
//                     ...metadata,
//                     ...JSON.parse(String(execSync(`tsc -p ${config} --noEmit --showConfig`))),
//                 };
//             } catch (error) {
//                 const message = String(error.output);
//                 if (message.includes('TS18003')) {
//                     metadata.errors.push('TS18003');
//                 } else {
//                     console.error(`Unhandled error:\n\n${message}\n\n${metadata.configPath}`);
//                 }
//             }
//             return metadata;
//         };

//         const table = new Table({ head: ['', 'Files', 'Size (b)', 'Errors'] });
//         files
//             .filter((file) => !file.includes('node_modules'))
//             .filter((file) => ignoreList
//                 .map((ignoreKey) => {
//                     // console.log(resolve(`${rootPath}${x}`))
//                     console.log({ file, ignoreKey: ignoreKey.replace('./', '.*/') });
//                     return String(`${file}`).includes(ignoreKey.replace('./', '.*/'));
//                 })
//                 .reduce((acc, value) => (acc ? !!acc : !!value), false))
//             .map(inspectConfig)
//             .filter((x) => x)
//             .map(extractStats)
//             .sort((a, b) => a.stats.total - b.stats.total)
//             .map(transformToTable)
//             .map((entry) => {
//                 table.push({ [entry.title]: [entry.fileCount, prettyBytes(entry.size), entry.errors] });
//             });

//         console.log(table.toString());
//         console.log(uniqueConfigTypes);
//     });
// };

// extract();

interface RunContext {
  rootDir: string,
}

// const context: RunContext = {
//     rootDir: '/Users/james/src/prototypes/my-workspace'
// };

// const context: runContext = {
//   rootDir: '/Users/james/src/gibsunas/@lemon/extract'
// }

// console.log(Nx(context))
// console.log(introspectNx(context).warnings);

const main = async () => {
    const program = new Command();

    // .option('-c, --config <path>', 'set config path', './.lemon-extract.json');

    // Let's give the plugins a chance to alter the CLI dynamically
    await BootstrapLemonExtract({ cliCommand: program, processArgs: process.argv });

    // program
    //   .command('ts')
    //   .description('Typescript review')
    //   .action((options) => {
    //         debug('Launching typescript review executor');
    //         extract();
    //       });
    // program
    //   .command('lint')
    //   .description('Workspace linting')
    //   .action((options) => {
    //         debug('Launching workspace linting');
    //         console.log(Nx(context));
    //       });

    program.parse(process.argv);
};
export const cli = main;
export default { cli, main };
main();

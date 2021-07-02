import { existsSync, readFileSync } from 'fs';
import glob from 'glob';
import * as Table from 'cli-table';
import { execSync } from 'child_process';
import fs from 'fs';
import {dirname, resolve} from 'path';
import prettyBytes from 'pretty-bytes';

import { Nx } from './introspection/nx/index';

import { Command } from 'commander';
const program = new Command();

const transformToTable = (metadata) => {
  // console.log(metadata.stats)
  return {
    title: metadata.configPath,
    fileCount: metadata.files ? metadata.files.length : 0,
    size: metadata.stats.total,
    errors: metadata.errors.join(', ')
  };
};

const extractStats = (metadata) => {
  let total = 0;
  const files = metadata.files || [];
  files.map(file => {
    const stats = fs.statSync(resolve(metadata.rootDir, file));
    total += stats.size;
  })

  return { ...metadata, stats: {total}};
}

const collectSchematicCollections = async ():Promise<string[]> => {
  return new Promise((resolve, reject) => {
    glob("**/collection.json", async (error, files) => {
      resolve(files);
    })
  })

};

const extract = async () => {
  glob("**/tsconfig*.json", async function (er, files) {
    const rootPath = process.cwd();
    // files is an array of filenames.
    // If the `nonull` option is set, and nothing
    // was found, then files is ["**/*.js"]
    // er is an error object or null.
    //console.log(files);
    const schematicCollections = await collectSchematicCollections();
    // console.log(schematicCollections)
    const ignoreList = schematicCollections.map(collectionPath => {
      const collectionRoot = resolve(collectionPath.replace('collection.json', ''));
      const { schematics }: { schematics: any } = JSON.parse(String(fs.readFileSync(collectionPath)));
      const collectionSchematics:Array<any> = Object.values(schematics);
      collectionSchematics.map(key => {
        console.log(schematics,schematics[key])
      })
      // console.log({ schematics, collectionSchematics});

      const dirsToIgnore = !collectionSchematics.length ? [] : collectionSchematics
        .map((schematic) => {
          const { schema } = schematic;
          const schemaPath = resolve(collectionRoot, schema);
            const partialPath = `${schemaPath.replace('schema.json', '')}files`;

            const filesDir = schema.replace('schema.json', '');
            return filesDir;
        })
        .map(schematicFilesRoot => {
          return `${schematicFilesRoot}.*`.replace('/', '\/')
        })
        .flat()

      return dirsToIgnore;
    }).flat()

    console.log(ignoreList)
    const uniqueConfigTypes = files
      .filter((file) => !file.includes('node_modules'))
      .map(file => {
        // console.log(file);
        return file.split('/').pop();
      }).reduce((acc,x) => {
        const result = { ...acc };
        result[x] = result[x] ? result[x] + 1 : 1;
        return result;
      }, {})



    const inspectConfig = (config) => {
      let metadata = {
        configPath: config,
        errors: [],
        rootDir: dirname(config)
      };
      try {
        metadata = {
          ...metadata,
          ...JSON.parse(String(execSync(`tsc -p ${config} --noEmit --showConfig`)))};
      } catch (error) {
        const message = String(error.output);
        if (message.includes('TS18003')) {
          metadata.errors.push('TS18003');
        } else {
          console.error(`Unhandled error:\n\n${message}\n\n${metadata.configPath}`)
        }
      }
      return metadata;
    }


    var table = new Table({ head: ["", "Files", "Size (b)", "Errors"] });
    files
      .filter((file) => !file.includes('node_modules'))
      .filter(file => {
        return ignoreList
          .map(ignoreKey => {
            // console.log(resolve(`${rootPath}${x}`))
            console.log({file,ignoreKey: ignoreKey.replace('./','.*/')})
            return String(`${file}`).includes(ignoreKey.replace('./','.*/'))
          })
          .reduce((acc, value) => {
            return !!acc ? !!acc : !!value
          }, false)
        })
      .map(inspectConfig)
      .filter(x => x)
      .map(extractStats)
      .sort((a, b) => {

        return a.stats.total - b.stats.total
      })
      .map(transformToTable)
      .map((entry) => {

      table.push({ [entry.title]: [entry.fileCount,prettyBytes(entry.size), entry.errors] } )
    })

    console.log(table.toString());
    console.log(uniqueConfigTypes)
  })
};

// extract();

interface RunContext {
  rootDir: string,
};


const context: RunContext = {
  rootDir: '/Users/james/src/prototypes/my-workspace'
}

// const context: runContext = {
//   rootDir: '/Users/james/src/gibsunas/@lemon/extract'
// }

// console.log(Nx(context))
//console.log(introspectNx(context).warnings);

program
  .version('0.0.1')
  .option('-c, --config <path>', 'set config path', './deploy.conf');

// program
//   .command('extract')
//   .description('Typescript review')
//   .action((options) => {
//     extract();
//   });
program
  .command('lint')
  .description('Workspace linting')
  .action((options) => {
    console.log(Nx(context))
  });
program.parse(process.argv)

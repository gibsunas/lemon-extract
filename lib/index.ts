const glob = require('glob');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const prettyBytes = require('pretty-bytes');

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
    const stats = fs.statSync(path.resolve(metadata.rootDir, file));
    total += stats.size;
  })

  return { ...metadata, stats: {total}};
}
glob("**/tsconfig*.json", function (er, files) {
    // files is an array of filenames.
    // If the `nonull` option is set, and nothing
    // was found, then files is ["**/*.js"]
    // er is an error object or null.
    //console.log(files);

    const uniqueConfigTypes = files
      .filter((file) => !file.includes('node_modules'))
      .map(file => {
        console.log(file);
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
        rootDir: path.dirname(config)
      };
      try {
        metadata = { 
          ...metadata,
          ...JSON.parse(execSync(`tsc -p ${config} --noEmit --showConfig`))};
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

    var Table = require('cli-table');
    var table = new Table({ head: ["", "Files", "Size (b)", "Errors"] });
    files
      .filter((file) => !file.includes('node_modules'))
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


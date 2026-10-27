const path = require('path');
const nodeExternals = require('webpack-node-externals');

const isDev = process.env.NODE_ENV === 'development';

module.exports = {
    entry: './lib/index.ts',
    // A CLI runs under node, so node builtins stay external (webpack 5 treats
    // `target: node` builtins as external automatically). Do not add a
    // resolve.fallback block for `fs`/`path`/etc. here: mapping them to `false`
    // silently replaces them with empty modules at runtime.
    target: 'node',
    mode: isDev ? 'development' : 'production',
    devtool: isDev ? 'inline-source-map' : 'source-map',
    // Runtime dependencies are shipped in package.json, not inlined in the bundle.
    externals: [nodeExternals()],
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                // Tests are type-checked by jest/ts-jest, not by the bundle.
                // Compiling them here would ship .test.d.ts in the tarball.
                exclude: [/node_modules/, /\.test\.ts$/]
            }
        ]
    },
    resolve: {
        alias: {
            '@lemon/extract/introspection': path.resolve(__dirname, 'lib/introspection/'),
            '@lemon/extract/integrations': path.resolve(__dirname, 'lib/integrations/'),
            '@lemon/extract/utils': path.resolve(__dirname, 'lib/utils/'),
            '@lemon/extract/core': path.resolve(__dirname, 'lib/core/')
        },
        extensions: ['.tsx', '.ts', '.js', '.mjs', '.cjs']
    },
    output: {
        filename: 'bundle.cjs',
        path: path.resolve('.', 'dist'),
        // The bundle is a CommonJS file inside a `"type": "module"` package,
        // and the bin scripts require() its exports.
        library: { type: 'commonjs2' },
        chunkFormat: 'commonjs'
    },
    stats: 'errors-warnings'
};

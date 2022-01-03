const path = require('path');
const nodeExternals = require('webpack-node-externals');

module.exports = {
  node: false,
  entry: './lib/index.ts',
  devtool: 'inline-source-map',
  target: 'node',
  mode: 'development',
  externals: [nodeExternals()],
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/
      }
    ]
  },
  resolve: {
    alias: {
      '@lemon/extract/introspection': path.resolve(__dirname, 'lib/introspection/'),
      '@lemon/extract/utils': path.resolve(__dirname, 'lib/utils/'),
        '@lemon/extract/core': path.resolve(__dirname, 'lib/core/')
      },
      modules: [
        'node_modules'
      ],
      extensions: ['.tsx', '.ts', '.js', '.mjs', '.cjs'],
      fallback: {
          '@nrwl/*': false,
          debug: false,
          assert: false,
          child_process: false,
          fs: false,
          path: false,
      util: false
    }
  },
  output: {
    filename: 'bundle.cjs',
      path: path.resolve('.', 'dist')
    }
};

// Copyright Epic Games, Inc. All Rights Reserved.

const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');

const devCommon = {
  mode: 'development',
  devtool: 'inline-source-map',
  devServer: {
    static: './dist',
  }
};

module.exports = [
  merge(common, devCommon, {
    output: {
      filename: 'libpixelstreamingfrontend-ui.dev.js',
      library: {
        name: 'libpixelstreamingfrontendUI', // exposed variable that will provide access to the library classes
        type: 'umd'
      },
    }
  }),
  merge(common, devCommon, {
    output: {
      filename: 'libpixelstreamingfrontend-ui.dev.esm.js',
      library: {
        type: 'module'
      },
    },
    experiments: {
      outputModule: true
    }
  })
];

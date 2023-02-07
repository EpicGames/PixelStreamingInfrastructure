// Copyright Epic Games, Inc. All Rights Reserved.

const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');
const fs = require('fs');

const pages = fs.readdirSync('./src', { withFileTypes: true })
	.filter(item => !item.isDirectory())
	.filter(item => path.parse(item.name).ext === '.html')
	.map(htmlFile => path.parse(htmlFile.name).name);

module.exports = (env) => {
  return {
    mode: 'development',
    entry: pages.reduce((config, page) => {
		config[page] = `./src/${page}.ts`;
		return config;
	}, {}),
    plugins: [
      new webpack.DefinePlugin({
        WEBSOCKET_URL: JSON.stringify((env.WEBSOCKET_URL !== undefined) ? env.WEBSOCKET_URL : '')
      }),
    ].concat(pages.map((page) => new HtmlWebpackPlugin({
    	title: 'Development',
    	template: `./src/${page}.html`,
    	filename: `${page}.html`,
		chunks: [page],
    }), )),
    // turn off so we can see the source map for dom delegate so we can debug the library
    devtool: 'inline-source-map',
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          loader: 'ts-loader',
          exclude: [
            /node_modules/,
          ],
        },
        {
          test: /\.html$/i,
          use: 'html-loader'
        },
        {
          test: /\.css$/,
          type: 'asset/resource',
          generator: {
            filename: 'css/[name][ext]'
          }
        },
        {
          test: /\.(png|svg)$/i,
          type: 'asset/resource',
          generator: {
            filename: 'images/[name][ext]'
          }
        },
      ],
    },
    resolve: {
      extensions: ['.tsx', '.ts', '.js', '.svg'],
    },
    output: {
      filename: '[name].js',
      library: 'frontend', // change this to something more meaningful
      libraryTarget: 'umd',
      path: path.resolve(__dirname, '../../../SignallingWebServer/Public'),
      clean: true,
      globalObject: 'this',
      hashFunction: 'xxhash64',
    },
    experiments: {
      futureDefaults: true
    },
    optimization: {
      minimize: false
    },
    devServer: {
    	static: {
    		directory: path.join(__dirname, '../../../SignallingWebServer/Public'),
    	},
    }
  };
}

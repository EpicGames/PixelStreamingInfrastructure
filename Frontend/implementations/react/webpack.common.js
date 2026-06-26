// Copyright Epic Games, Inc. All Rights Reserved.

const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');
const fs = require('fs');

const pages = fs.readdirSync('./src', { withFileTypes: true })
	.filter(item => !item.isDirectory())
	.filter(item => path.parse(item.name).ext === '.html')
	.map(htmlFile => path.parse(htmlFile.name).name);

module.exports = {
	entry: pages.reduce((config, page) => {
		config[page] = `./src/${page}.tsx`;
		return config;
	}, {}),

    plugins: [].concat(pages.map((page) => new HtmlWebpackPlugin({
          title: `${page}`,
          template: `./src/${page}.html`,
          filename: `${page}.html`,
          chunks: [page],
    }), )),

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
      extensions: ['.tsx', '.ts', '.js', '.svg', '.json'],
    },
    output: {
      filename: '[name].js',
      library: 'epicgames-react-frontend',
      libraryTarget: 'umd',
      // Output to a local dist/ rather than SignallingWebServer/www so this build
      // doesn't clobber the TypeScript reference frontend that Wilbur serves by default.
      // To have Wilbur serve this bundle, point it at dist/ via --http_root.
      path: process.env.WEBPACK_OUTPUT_PATH
          ? path.resolve(process.env.WEBPACK_OUTPUT_PATH)
          : path.resolve(__dirname, './dist'),
      clean: true,
      globalObject: 'this',
      hashFunction: 'xxhash64',
    },
	devServer: {
    	static: {
    		directory: path.join(__dirname, './dist'),
    	},
    },
}

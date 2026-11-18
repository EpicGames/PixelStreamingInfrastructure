// Copyright Epic Games, Inc. All Rights Reserved.

const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');

module.exports = {
    mode: 'development',
    devtool: 'inline-source-map',
	entry: './src/player.ts',
	plugins: [
		new HtmlWebpackPlugin({
				title: `Pixel Streaming ES Module`,
				scriptLoading: 'module',
				template: `./src/player.html`,
				filename: `player_esm.html`
		}),
	],
	output: {
		filename: 'player.esm.js',
		libraryTarget: 'module',
		module: true,
		path: process.env.WEBPACK_OUTPUT_PATH ? path.resolve(process.env.WEBPACK_OUTPUT_PATH) : path.resolve(__dirname, '../../../SignallingWebServer/www'),
		globalObject: 'this',
		hashFunction: 'xxhash64'
	},
	experiments: {
		outputModule: true,
	},
	module: {
		rules: [
		  {
			test: /\.tsx?$/,
			loader: 'ts-loader',
			exclude: [
			  /node_modules/,
			],
			options: {
				configFile: "tsconfig.esm.json"
			}
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
			test: /\.(png|svg|jpg|jpeg|gif)$/i,
			type: 'asset/resource',
			generator: {
			  filename: 'images/[name][ext]'
			}
		  },
		  {
			test: /\.(woff2?|eot|ttf|otf)$/i,
			type: 'asset/resource',
			generator: {
			  filename: 'fonts/[name][ext]'
			}
		  }
		],
	},
	resolve: {
		extensions: ['.tsx', '.ts', '.js', '.svg', '.json'],
	},
};

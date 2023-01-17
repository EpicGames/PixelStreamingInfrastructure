const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
//const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const webpack = require('webpack');

module.exports = (env) => {
  return {
    mode: 'development',
    entry: {
      index: './src/index.ts',
    },
    plugins: [

      new webpack.DefinePlugin({
        WEBSOCKET_URL: JSON.stringify((env.WEBSOCKET_URL !== undefined) ? env.WEBSOCKET_URL : '')
      }),

      new HtmlWebpackPlugin({
        title: 'Development',
        template: './src/index.html',
        filename: 'index.html'
      }),

    ],
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
            filename: 'assets/images/[name][ext]'
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
      path: path.resolve(__dirname, 'dist'),
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
    		directory: path.join(__dirname, 'dist'),
    	},
    }
  };
}

// Copyright Epic Games, Inc. All Rights Reserved.

const package = require('./package.json');
const path = require('path');
const webpack = require('webpack');

module.exports = {
    mode: 'production',
    entry: {
        index: './src/pixelstreamingfrontend.ts'
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                loader: 'ts-loader',
                exclude: [/node_modules/]
            }
        ]
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js']
    },
    plugins: [
        new webpack.DefinePlugin({
            LIBRARY_VERSION: JSON.stringify(package.version)
        })
    ],
    output: {
        filename: 'lib-pixelstreamingfrontend.min.js',
        library: 'lib-pixelstreamingfrontend', // exposed variable that will provide access to the library classes
        libraryTarget: 'umd',
        path: path.resolve(__dirname, 'dist'),
        clean: false,
        globalObject: 'this'
    },
    optimization: {
        minimize: true,
        usedExports: true,
    },
    stats: 'errors-only',
    performance: {
        hints: false
    }
};

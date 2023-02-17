// Copyright Epic Games, Inc. All Rights Reserved.

const package = require('./package.json');
const path = require('path');
const webpack = require('webpack');

module.exports = {
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
        library: 'lib-pixelstreamingfrontend', // exposed variable that will provide access to the library classes
        libraryTarget: 'umd',
        path: path.resolve(__dirname, 'dist'),
        clean: true,
        globalObject: 'this'
    }
};

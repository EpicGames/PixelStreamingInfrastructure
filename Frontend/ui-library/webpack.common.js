// Copyright Epic Games, Inc. All Rights Reserved.

const package = require('./package.json');
const path = require('path');
const webpack = require('webpack');

module.exports = {
    entry: {
        index: './src/pixelstreamingfrontend-ui.ts'
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
    externals: {
        '@epicgames-ps/lib-pixelstreamingfrontend-ue5.3': '@epicgames-ps/lib-pixelstreamingfrontend-ue5.3',
        jss: 'jss',
        'jss-plugin-camel-case': 'jss-plugin-camel-case',
        'jss-plugin-global': 'jss-plugin-global'
    },
    plugins: [
        new webpack.DefinePlugin({
            LIBRARY_VERSION: JSON.stringify(package.version)
        })
    ],
    output: {
        path: path.resolve(__dirname, 'dist'),
        globalObject: 'this'
    }
};
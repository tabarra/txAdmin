const fs = require('fs');
const path = require('path');
const webpack = require('webpack');
const CopyPlugin = require('copy-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const helpers = require('./src/extras/helpers');

//Prepare banner
let banner;
try {
    let separator = '%'.repeat(80);
    let logoPad = ' '.repeat(18);
    const lines = [
        logoPad + helpers.txAdminASCII().split('\n').join('\n'+logoPad),
        separator,
        `Author: André Tabarra (https://github.com/tabarra)`,
        `Repository: https://github.com/tabarra/txAdmin`,
        `txAdmin is a free open source software provided under the license below.`,
        separator,
        fs.readFileSync(path.resolve(__dirname, 'LICENSE'), 'utf8').trim(),
        separator,
    ]
    banner = lines.join('\n');
} catch (error) {
    console.error(`Failed to create license banner with error: ${error.message}`);
    process.exit();
}

//Export Webpack Config
module.exports = {
    mode: 'development',
    target: 'node',
    entry: './main.js',
    output: {
        filename: 'main.js'
    },
    node: {
        __dirname: true
    },
    externals: {
        // NOTE: adding those actually cause errors during run time
        // 'encoding': 'this_resolved_to_nothing', //probably not an issue, will print error at runtime if it is
        // 'erlpack': 'this_resolved_to_nothing', //not an issue, optional compression
        // 'zlib-sync': 'this_resolved_to_nothing', //not an issue, for sharding only
        // 'utf-8-validate': 'this_resolved_to_nothing', //optional
        // 'cardinal': 'this_resolved_to_nothing', //optional for better printed debug code 
        // 'osx-temperature-sensor': 'this_resolved_to_nothing', //optional, osx only

        // ./node_modules/keyv/src/index.js => optional external storage conectors
        // ./src/extras/helpers.js => dyn require.resolve in dependencyChecker() only
    },
    resolve: {
        mainFields: ["main"],
    },
    stats: 'errors-warnings',
    plugins: [
        new webpack.DefinePlugin({
            'process.env': {
                APP_ENV: JSON.stringify('webpack')
            }
        }),
        new CopyPlugin({
            patterns: [
                'LICENSE',
                '*.md',
                'fxmanifest.lua',
                'scripts/*.lua',
                'scripts/menu/**',
                'web/**',
                'docs/**',
            ]
        }),
        new TerserPlugin({
            extractComments: false,
        }),
        new webpack.BannerPlugin({banner}),
    ],
};

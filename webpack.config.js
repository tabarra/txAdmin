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
        `Written with ❤️ for the CitizenFX Collective.`,
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
        path: path.resolve(__dirname, 'dist'),
        filename: 'main.js'
    },
    externals: {
        // engine.io
        uws: 'uws',
        
        // discord.js
        '@discordjs/opus': 'empty',
        'node-opus': 'empty',
        'opusscript': 'empty',
    },
    stats: 'errors-warnings',
    plugins: [
        new webpack.DefinePlugin({
            'process.env': {
                APP_ENV: JSON.stringify('webpack')
            }
        }),
        new CopyPlugin([
            'LICENSE',
            '*.md',
            'fxmanifest.lua',
            'scripts/*.lua',
            'scripts/cl_*.js',
            'web/**',
            'docs/**',
        ]),
        new TerserPlugin({
            extractComments: false,
        }),
        new webpack.BannerPlugin({banner}),
    ],
};

const path = require('path');
const webpack = require('webpack');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
    mode: 'development',
    target: 'node',
    entry: './starter.js',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'starter.js'
    },
    externals: {
        // engine.io
        uws: 'uws'
    },
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
            'extensions/**/*.lua',
            'extensions/**/cl_*.js',
            'web/**',
        ]),
    ],
};

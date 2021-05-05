const HtmlWebpackPlugin = require('html-webpack-plugin');
const CommonWebpack = require('./webpack.common');
const CopyPlugin = require('copy-webpack-plugin');
const { EnvironmentPlugin  } = require('webpack');

const path = require('path');

module.exports = CommonWebpack({
    mode: 'development',
    devtool: 'source-map',
    devServer: {
        contentBase: path.join(process.cwd(), 'menu/public'),
        watchContentBase: true,
        host: 'localhost',
        writeToDisk: true,
    },
    plugins: [
        new EnvironmentPlugin ({
            DEV_IN_GAME: true,
        }),
        new CopyPlugin({
            patterns: [
                { from: path.join(process.cwd(), 'menu/public/assets'), to: path.join(process.cwd(), 'scripts/menu/nui/assets') },
            ],
        }),
        new HtmlWebpackPlugin({
            template: './menu/public/index.html',
            inject: true,
        }),
    ],
});
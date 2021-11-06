const HtmlWebpackPlugin = require('html-webpack-plugin');
const CommonWebpack = require('./webpack.common');
const CopyPlugin = require('copy-webpack-plugin');
const { DefinePlugin  } = require('webpack');

const path = require('path');

module.exports = CommonWebpack({
    mode: 'development',
    devtool: 'source-map',
    devServer: {
        contentBase: path.join(process.cwd(), 'menu/public'),
        watchContentBase: true,
        writeToDisk: true,
        hot: false,
        inline: false,
        liveReload: false,
    },
    plugins: [
        new DefinePlugin({
            'process.env': {
                DEV_MODE: JSON.stringify('game'),
            },
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

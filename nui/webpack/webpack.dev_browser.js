const HtmlWebpackPlugin = require('html-webpack-plugin');
const CommonWebpack = require('./webpack.common');
const { DefinePlugin } = require('webpack');
const path = require('path');

module.exports = CommonWebpack({
    mode: 'development',
    devtool: 'source-map',
    devServer: {
        static: path.join(process.cwd(), 'menu/public'),
        host: 'localhost',
    },
    plugins: [
        new DefinePlugin({
            'PROCESS_DEV_MODE': JSON.stringify('browser'),
        }),
        new HtmlWebpackPlugin({
            template: './menu/public/index.html',
            inject: true,
        }),
    ],
});

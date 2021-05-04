const HtmlWebpackPlugin = require('html-webpack-plugin');
const CommonWebpack = require('./webpack.common');
const path = require('path');

module.exports = CommonWebpack({
    mode: 'development',
    devtool: 'source-map',
    devServer: {
        contentBase: path.join(process.cwd(), 'menu/public'),
        watchContentBase: true,
        host: 'localhost',
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: './menu/public/index.html',
            inject: true,
        }),
    ],
});
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CommonWebpack = require('./webpack.common');
const CopyPlugin = require('copy-webpack-plugin');
const { DefinePlugin } = require('webpack');

const path = require('path');
const CWD = process.cwd();

module.exports = CommonWebpack({
    mode: 'development',
    devtool: 'source-map',
    plugins: [
        new DefinePlugin({
            'PROCESS_DEV_MODE': JSON.stringify('game'),
        }),
        new CopyPlugin({
            patterns: [
                {
                    from: path.join(CWD, 'menu/public'),
                    to: path.join(CWD, 'scripts/menu/nui'),
                    globOptions: {
                        ignore: ['**/*.html'],
                    },
                },
            ],
        }),
        new HtmlWebpackPlugin({
            template: './menu/public/index.html',
            inject: true,
        }),
    ],
});

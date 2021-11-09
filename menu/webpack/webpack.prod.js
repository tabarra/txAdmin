const HtmlWebpackPlugin = require('html-webpack-plugin');
const CommonWebpack = require('./webpack.common');
const CopyPlugin = require('copy-webpack-plugin');
const path = require('path');

const CWD = process.cwd();

module.exports = CommonWebpack({
    mode: 'production',
    plugins: [
        new HtmlWebpackPlugin({
            template: './menu/public/index.html',
            inject: true,
            minify: {
                removeComments: true,
                collapseWhitespace: true,
                removeRedundantAttributes: true,
                useShortDoctype: true,
                removeEmptyAttributes: true,
                removeStyleLinkTypeAttributes: true,
                keepClosingSlash: true,
                minifyJS: true,
                minifyCSS: true,
                minifyURLs: true,
            },
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
    ],
});

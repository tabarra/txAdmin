/* eslint-disable no-trailing-spaces */
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
    entry: './menu/src/index.tsx',
    output: {
        path: path.join(__dirname, '.menu/dist'),
        filename: 'index.js',
    },
    devServer: {
        contentBase: path.join(__dirname, './menu/dist'),
        watchContentBase: true,
        host: 'localhost',
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                exclude: /node_modules/,
                use: {
                    loader: 'ts-loader',
                    options: {
                        transpileOnly: true,
                    },
                },
            },
            {
                test: /\.jsx?$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                },
            },
            {
                test: /\.css$/,
                use: [
                    'style-loader', 
                    'css-loader',
                ],
            },
        ],
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: './menu/public/index.html',
            inject: true,
        }),
    ],
    resolve: { extensions: ['.tsx', '.ts', '.js', '.jsx' ] },
};
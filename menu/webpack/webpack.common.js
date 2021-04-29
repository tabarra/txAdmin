const path = require('path');
const processCWD = process.cwd();


module.exports = (options) => ({
    mode: options.mode,
    entry: './menu/src/index.tsx',
    output: {
        path: path.join(processCWD, 'scripts/menu/nui'),
        filename: options.mode === 'production' ? '[hash].js' : 'index.js',
    },
    devServer: options.devServer,
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: [
                    {
                        loader: 'ts-loader',
                        options: {
                            transpileOnly: true,
                        },
                    },
                ],
                exclude: /node_modules/,
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
    plugins: options.plugins,
    resolve: {
        modules: ['node_modules', path.join(processCWD, 'menu/src')],
        extensions: ['.ts', '.tsx', '.js', '.jsx'],
    },
});
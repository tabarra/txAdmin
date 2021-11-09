const path = require('path');
const CWD = process.cwd();


module.exports = (options) => ({
    mode: options.mode,
    entry: './menu/src/index.tsx',
    output: {
        path: path.join(CWD, 'scripts/menu/nui'),
        filename: 'index.js',
    },
    optimization: options.optimization,
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
                test: /\.css$/,
                use: ['style-loader', 'css-loader'],
            },
        ],
    },
    plugins: options.plugins,
    resolve: {
        modules: ['node_modules', path.join(CWD, 'menu/src')],
        extensions: ['.ts', '.tsx', '.js', '.jsx'],
    },
});

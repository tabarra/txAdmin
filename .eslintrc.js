module.exports = {
    env: {
        node: true,
        commonjs: true,
        es2017: true,
    },
    globals: {
        globals: 'writable',
        GlobalData: 'writable',
        ExecuteCommand: 'readonly',
        GetConvar: 'readonly',
        GetCurrentResourceName: 'readonly',
        GetPasswordHash: 'readonly',
        GetResourceMetadata: 'readonly',
        GetResourcePath: 'readonly',
        IsDuplicityVersion: 'readonly',
        VerifyPasswordHash: 'readonly',
    },
    extends: ['airbnb'],
    parserOptions: {
        ecmaVersion: 10,
    },
    ignorePatterns: ['webpack.config.js'],
    rules: {
        'no-control-regex': 'off',
        'no-empty': ['error', { allowEmptyCatch: true }],
        'no-prototype-builtins': 'off',
        'no-unused-vars': ['warn', {
            varsIgnorePattern: '(dir|log)\\w*',
        }],

        // Custom
        indent: ['error', 4],

        // FIXME: re-enable it somewhen
        'linebreak-style': 'off',
        'spaced-comment': 'off',
        'object-curly-spacing': 'off', //maybe keep this disabled?

        // Check it:
        // 'object-curly-newline': ['error', 'never'],
    },
};

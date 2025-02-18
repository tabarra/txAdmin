module.exports = {
    env: {
        node: true,
        commonjs: true,
        es2017: true,
    },
    globals: {
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
    extends: [],
    ignorePatterns: [
        '*.ignore.*',
    ],
    rules: {
        //Review these
        'no-control-regex': 'off',
        'no-empty': ['error', { allowEmptyCatch: true }],
        'no-prototype-builtins': 'off',
        'no-unused-vars': ['warn', {
            varsIgnorePattern: '^_\\w*',
            vars: 'all',
            args: 'none', //diff
            ignoreRestSiblings: true,
        }],

        //From Airbnb, fixed them already
        'keyword-spacing': ['error', {
            before: true,
            after: true,
            overrides: {
                return: { after: true },
                throw: { after: true },
                case: { after: true },
            },
        }],
        'space-before-blocks': 'error',
        quotes: ['error', 'single', { allowTemplateLiterals: true }],
        semi: ['error', 'always'],
        'no-trailing-spaces': ['error', {
            skipBlankLines: false,
            ignoreComments: false,
        }],
        'space-infix-ops': 'error',
        'comma-dangle': ['error', {
            arrays: 'always-multiline',
            objects: 'always-multiline',
            imports: 'always-multiline',
            exports: 'always-multiline',
            functions: 'always-multiline',
        }],
        'padded-blocks': ['error', {
            blocks: 'never',
            classes: 'never',
            switches: 'never',
        }, {
            allowSingleLineBlocks: true,
        }],
        'comma-spacing': ['error', { before: false, after: true }],
        'arrow-spacing': ['error', { before: true, after: true }],
        'arrow-parens': ['error', 'always'],
        'operator-linebreak': ['error', 'before', { overrides: { '=': 'none' } }],

        // Custom
        indent: ['error', 4],

        // FIXME: re-enable it somewhen
        'linebreak-style': 'off',
        'spaced-comment': 'off',
        'object-curly-spacing': 'off', //maybe keep this disabled?
        'arrow-body-style': 'off', //maybe keep this disabled?

        // Check it:
        // 'object-curly-newline': ['error', 'never'],
    },
};

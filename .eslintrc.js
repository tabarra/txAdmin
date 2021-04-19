module.exports = {
    "env": {
        "node": true,
        "commonjs": true,
        "es2017": true
    },
    "globals": {
        "globals": "writable",
        "GlobalData": "writable",
        "ExecuteCommand": "readonly",
        "GetConvar": "readonly",
        "GetCurrentResourceName": "readonly",
        "GetPasswordHash": "readonly",
        "GetResourceMetadata": "readonly",
        "GetResourcePath": "readonly",
        "IsDuplicityVersion": "readonly",
        "VerifyPasswordHash": "readonly"
    },
    "extends": "eslint:recommended",
    "parserOptions": {
        "ecmaVersion": 10
    },
    "ignorePatterns": ["webpack.config.js"],
    "rules": {
        "no-control-regex": "off",
        "no-empty": ["error", { "allowEmptyCatch": true }],
        "no-prototype-builtins": "off",
        "no-unused-vars": ["off", { "varsIgnorePattern": "(dir|log)\\w*" }]
    }
};

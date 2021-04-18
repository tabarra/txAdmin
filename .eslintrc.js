module.exports = {
    "env": {
        "node": true,
        "commonjs": true,
        "es2021": true,
    },
    "globals": {
        "globals": true,
        "GlobalData": true,
        "ExecuteCommand": true,
        "GetConvar": true,
        "GetCurrentResourceName": true,
        "GetResourcePath": true,
        "IsDuplicityVersion": true,
        "GetResourceMetadata": true
    },
    "extends": "eslint:recommended",
    "parserOptions": {
        "ecmaVersion": 12
    },
    "ignorePatterns": ["webpack.config.js"],
    "rules": {
        "no-unused-vars": "off",
        "no-empty": "off"
    }
};

// Copyright Epic Games, Inc. All Rights Reserved.

module.exports = {
    root: true,
    parser: '@typescript-eslint/parser',
    plugins: [
        '@typescript-eslint',
        'eslint-plugin-tsdoc'
        ],
    extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
    rules: {
        "tsdoc/syntax": "warn",
        "@typescript-eslint/no-explicit-any": "off",
        "@typescript-eslint/no-unused-vars": [
            "error",
            {
                "argsIgnorePattern": "^_",
                "varsIgnorePattern": "^_",
                "caughtErrorsIgnorePattern": "^_"
            }
        ]
    }
};

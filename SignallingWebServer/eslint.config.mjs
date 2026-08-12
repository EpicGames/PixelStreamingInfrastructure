// Copyright Epic Games, Inc. All Rights Reserved.

import tseslint from 'typescript-eslint';
import tsdocPlugin from 'eslint-plugin-tsdoc';
import baseConfig from '../eslint.config.mjs'


export default tseslint.config(
    baseConfig,
    {
        ignores: ["**/*.test.ts"],
    },
    {
        languageOptions: {
            parser: tseslint.parser,
            parserOptions: {
                project: 'tsconfig.json',
                tsconfigRootDir: import.meta.dirname,
            },
        },
        files: ["src/**/*.ts"],
        plugins: {
            'tsdoc': tsdocPlugin
        },
        rules: {
            "tsdoc/syntax": "warn",
            "@typescript-eslint/require-array-sort-compare": "error",
            "no-unused-vars": "off",
            "@typescript-eslint/no-unused-vars": [
                "error",
                {
                    "argsIgnorePattern": "^_",
                    "varsIgnorePattern": "^_",
                    "caughtErrorsIgnorePattern": "^_"
                }
            ]
        }
    }
);

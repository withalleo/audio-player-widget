const tsPlugin = require('@typescript-eslint/eslint-plugin')
const tsParser = require('@typescript-eslint/parser')
const unusedVars = require('eslint-plugin-unused-imports')

module.exports = [
    {
        files: ['**/*.ts'],
        plugins: {
            prettier: require('eslint-plugin-prettier'),
            '@typescript-eslint': tsPlugin,
            '@typescript-eslint/parser': tsParser,
            'unused-imports': unusedVars,
        },
        languageOptions: {
            parser: tsParser,
            ecmaVersion: 2024,
            sourceType: 'module',
        },
        settings: {
            project: 'tsconfig.json',
            createDefaultProgram: true,
        },
        rules: {
            'no-var': 'error',
            'prefer-const': 'warn',
            'no-underscore-dangle': 'off',
            'no-fallthrough': 'off',
            '@typescript-eslint/no-misused-new': 'error',
            '@typescript-eslint/no-non-null-assertion': 'error',
            '@typescript-eslint/no-unused-expressions': 'error',
            '@typescript-eslint/prefer-function-type': 'error',
            '@typescript-eslint/no-namespace': 'warn',
            '@typescript-eslint/no-empty-function': 'warn',
            '@typescript-eslint/ban-ts-comment': 'warn',
            '@typescript-eslint/no-var-requires': 'warn',
            '@typescript-eslint/explicit-module-boundary-types': 'off',
            '@typescript-eslint/member-ordering': 'off',
            'prettier/prettier': 'warn',
            'unused-imports/no-unused-imports': 'warn',
            'unused-imports/no-unused-vars': ['warn'],
            '@typescript-eslint/naming-convention': [
                'warn',
                {
                    'selector': 'enumMember',
                    'format': ['PascalCase'],
                },
                {
                    'selector': 'variable',
                    'format': ['camelCase', 'UPPER_CASE'],
                },
                {
                    'selector': 'typeLike',
                    'format': ['PascalCase'],
                },
            ],
            'semi': ['warn', 'never'],
        },
    },
    {
        files: ['**/*.html'],
        plugins: {
            prettier: require('eslint-plugin-prettier'),
        },
        rules: {
            'prettier/prettier': 'warn',
        },
    },
    {
        files: ['**/*.scss'],
        plugins: {
            prettier: require('eslint-plugin-prettier'),
        },
        rules: {
            'prettier/prettier': 'warn',
        },
    },
]

import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
    {
        // Build output, vendored fixtures, and the experiment scratch space are
        // not ours to lint.
        ignores: [
            'dist/**',
            'coverage/**',
            'node_modules/**',
            'scripts/experiments/**',
            'testbed/**',
            '__fixtures__/**',
            '**/__fixtures__/**',
            'prisma/**'
        ]
    },
    js.configs.recommended,
    ...tseslint.configs.recommended,
    {
        files: ['**/*.ts'],
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'module',
            globals: { ...globals.node }
        },
        rules: {
            // Formatting is Prettier's job (see .prettierrc); ESLint keeps the
            // correctness rules it can actually evaluate for TypeScript.
            semi: ['error', 'always'],
            quotes: ['warn', 'single', { avoidEscape: true }],
            'no-unused-expressions': [2, { allowShortCircuit: true, allowTernary: true }],
            '@typescript-eslint/no-unused-expressions': [2, { allowShortCircuit: true, allowTernary: true }],
            // The plugin/context layer is intentionally loosely typed while the
            // model settles; keep the rule opt-in for new code.
            '@typescript-eslint/no-explicit-any': 'off',
            '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }]
        }
    },
    {
        files: ['**/*.cjs', '**/*.js', '**/*.mjs'],
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'commonjs',
            globals: { ...globals.node }
        },
        rules: {
            semi: ['error', 'always'],
            quotes: ['warn', 'single', { avoidEscape: true }],
            // These files are CommonJS by contract (bin scripts, webpack and
            // jest configs loaded by tools that use require()).
            '@typescript-eslint/no-require-imports': 'off'
        }
    }
);

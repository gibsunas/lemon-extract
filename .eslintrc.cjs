module.exports = {
    env: {
        browser: false,
        node: true,
        es2021: true
    },
    extends: [
        'standard'
    ],
    parser: '@typescript-eslint/parser',
    parserOptions: {
        ecmaVersion: 12,
        sourceType: 'module'
    },
    plugins: [
        '@typescript-eslint'
    ],
    rules: {
        indent: ['error', 4],
        semi: [2, 'always'],
        '@typescript-eslint/semi': ['error', 'always'],
        'no-unused-expressions': [2, { allowShortCircuit: true, allowTernary: true }]
    }
};

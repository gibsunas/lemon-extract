/*
 * Jest runs the TypeScript sources directly through ts-jest.
 *
 * Deliberately CommonJS: the sources are authored as ESM and compiled for the
 * test run, which avoids the `--experimental-vm-modules` dance and keeps the
 * tests runnable on every supported Node release.
 */
export default {
    clearMocks: true,
    collectCoverage: true,
    coverageDirectory: 'coverage',
    coverageProvider: 'v8',
    coverageReporters: ['json', 'text', 'lcov', 'clover'],
    roots: ['lib'],
    moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx', 'json', 'node'],
    moduleNameMapper: {
        '^@lemon/extract/core/(.*)$': '<rootDir>/lib/core/$1',
        '^@lemon/extract/integrations/(.*)$': '<rootDir>/lib/integrations/$1',
        '^@lemon/extract/utils$': '<rootDir>/lib/utils/index.ts',
        '^@lemon/extract/utils/(.*)$': '<rootDir>/lib/utils/$1',
        '^@lemon/extract/introspection/(.*)$': '<rootDir>/lib/introspection/$1',
        '^@lemon/extract/(.*)$': '<rootDir>/lib/$1'
    },
    testEnvironment: 'node',
    transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
            tsconfig: {
                module: 'CommonJS',
                moduleResolution: 'node'
            }
        }]
    },
    verbose: true
};

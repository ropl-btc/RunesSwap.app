/** @type {import('jest').Config} */
export default {
  coverageProvider: 'v8',
  testEnvironment: '<rootDir>/scripts/jest-environment.cjs',
  moduleNameMapper: {
    '^base58-js$': '<rootDir>/node_modules/base58-js/index.js',
    '^.+\\.(css|scss)$': '<rootDir>/__mocks__/styleMock.js',
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@omnisat/lasereyes$': '<rootDir>/__mocks__/lasereyes.ts',
  },
  transform: {
    '^.+\\.[jt]sx?$': [
      '@swc/jest',
      {
        jsc: {
          parser: { syntax: 'typescript', tsx: true },
          transform: { react: { runtime: 'automatic' } },
          target: 'es2022',
        },
      },
    ],
  },
  transformIgnorePatterns: [
    'node_modules/(?!(@omnisat/lasereyes|@omnisat/lasereyes-react|@omnisat/lasereyes-core|bitcoin-address-validation|base58-js)/)',
  ],
  maxWorkers: 1,
  testTimeout: 30000,
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
};

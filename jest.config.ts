import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom', // Changed from 'node' to support React components
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: 'tsconfig.jest.json',
      },
    ],
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^.+\\.module\\.(css|scss)$': '<rootDir>/__mocks__/styleMock.js',
    '^.+\\.(css|scss)$': '<rootDir>/__mocks__/styleMock.js',
  },
  maxWorkers: 2, // Limit parallel workers
  workerIdleMemoryLimit: '1GB', // Restart workers if they use too much memory
  testTimeout: 10000, // 10 second timeout for hanging tests
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'], // Setup file for React testing
};

export default config;

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
  maxWorkers: 1, // Run tests serially to prevent memory issues
  workerIdleMemoryLimit: '512MB', // Restart workers if they use too much memory
  testTimeout: 30000, // 30 second timeout for slow tests
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'], // Setup file for React testing
  // Memory management
  logHeapUsage: true,
  detectOpenHandles: true,
  forceExit: true,
};

export default config;

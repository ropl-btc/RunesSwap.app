// Jest setup for React testing
// eslint-disable-next-line @typescript-eslint/no-require-imports
require('@testing-library/jest-dom');

// Configure React environment for concurrent features
global.IS_REACT_ACT_ENVIRONMENT = true;

// Add missing JSDOM globals for browser APIs
// eslint-disable-next-line @typescript-eslint/no-require-imports
global.TextEncoder = require('util').TextEncoder;
// eslint-disable-next-line @typescript-eslint/no-require-imports
global.TextDecoder = require('util').TextDecoder;

// Mock fetch for Node.js environment
global.fetch = jest.fn();

// Mock console.warn to reduce noise in tests
global.console.warn = jest.fn();

// Setup cleanup after each test
afterEach(() => {
  jest.clearAllMocks();
});

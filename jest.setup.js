// Jest setup for React testing

// Configure React environment for concurrent features
global.IS_REACT_ACT_ENVIRONMENT = true;

// Mock fetch for Node.js environment
global.fetch = jest.fn();

// Mock console.warn to reduce noise in tests
global.console.warn = jest.fn();

// Setup cleanup after each test
afterEach(() => {
  jest.clearAllMocks();
});

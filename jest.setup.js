require('@testing-library/jest-dom');
const { cleanup } = require('@testing-library/react');

global.IS_REACT_ACT_ENVIRONMENT = true;
global.fetch = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  if (typeof window !== 'undefined') {
    window.localStorage.clear();
    window.sessionStorage.clear();
  }
});

afterEach(() => {
  cleanup();
  jest.restoreAllMocks();
});

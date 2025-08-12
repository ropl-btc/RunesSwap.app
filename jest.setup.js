// Jest setup for React testing
// eslint-disable-next-line @typescript-eslint/no-require-imports
require('@testing-library/jest-dom');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { cleanup } = require('@testing-library/react');

// Configure React environment for concurrent features
global.IS_REACT_ACT_ENVIRONMENT = true;

// Add necessary polyfills for libraries that require them
// eslint-disable-next-line @typescript-eslint/no-require-imports
global.TextEncoder = require('util').TextEncoder;
// eslint-disable-next-line @typescript-eslint/no-require-imports
global.TextDecoder = require('util').TextDecoder;

// Mock fetch for Node.js environment
global.fetch = jest.fn();

// Add Web API globals for API route testing
// Only add these if they don't exist (to avoid conflicts with Next.js)
if (typeof global.Request === 'undefined') {
  global.Request = class Request {
    constructor(input, init = {}) {
      Object.defineProperty(this, 'url', {
        value: typeof input === 'string' ? input : input.url,
        writable: false,
      });
      this.method = init.method || 'GET';
      this.headers = new Map(Object.entries(init.headers || {}));
      this.body = init.body || null;
    }

    json() {
      return Promise.resolve(JSON.parse(this.body || '{}'));
    }

    text() {
      return Promise.resolve(this.body || '');
    }

    clone() {
      return new Request(this.url, {
        method: this.method,
        headers: Object.fromEntries(this.headers),
        body: this.body,
      });
    }
  };
}

if (typeof global.Response === 'undefined') {
  global.Response = class Response {
    constructor(body, init = {}) {
      this.body = body;
      this.status = init.status || 200;
      this.statusText = init.statusText || 'OK';
      this.headers = new Map(Object.entries(init.headers || {}));
      this.ok = this.status >= 200 && this.status < 300;
    }

    static json(object, init = {}) {
      return new Response(JSON.stringify(object), {
        ...init,
        headers: {
          'Content-Type': 'application/json',
          ...init.headers,
        },
      });
    }

    json() {
      return Promise.resolve(JSON.parse(this.body || '{}'));
    }

    text() {
      return Promise.resolve(this.body || '');
    }
  };
}

if (typeof global.Headers === 'undefined') {
  global.Headers = Map;
}

// Mock console.warn to reduce noise in tests
global.console.warn = jest.fn();

// Setup cleanup after each test
afterEach(() => {
  cleanup();
  jest.clearAllMocks();
});

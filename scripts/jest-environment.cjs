const { TestEnvironment } = require('jest-environment-jsdom');

// Use Node's real HTTP primitives inside jsdom, matching the Workers API contract.
module.exports = class extends TestEnvironment {
  async setup() {
    await super.setup();
    Object.assign(this.global, { Request, Response, Headers, TextEncoder, TextDecoder });
  }
};

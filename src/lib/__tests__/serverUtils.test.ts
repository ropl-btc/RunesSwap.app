/**
 * Tests for server-side utility functions.
 */

// Mock the external SDK modules before importing
jest.mock('ordiscan');
jest.mock('satsterminal-sdk');

import { Ordiscan } from 'ordiscan';

// Loaded dynamically in each test to avoid memoization bleed
const loadServerUtils = () =>
  require('@/lib/serverUtils') as typeof import('@/lib/serverUtils');
const loadLogger = () => require('@/lib/logger').logger;

const MockedOrdiscan = Ordiscan as jest.MockedClass<typeof Ordiscan>;

describe('serverUtils', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Reset environment variables
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;

    // Restore all mocks including logger.error
    jest.restoreAllMocks();
  });

  describe('getOrdiscanClient', () => {
    it('should create Ordiscan client when API key is provided', () => {
      // Set up environment variable
      process.env.ORDISCAN_API_KEY = 'test-ordiscan-key';

      // Mock Ordiscan constructor
      const mockOrdiscanInstance = {} as Ordiscan;
      MockedOrdiscan.mockImplementation(() => mockOrdiscanInstance);

      const { getOrdiscanClient } = loadServerUtils();
      const client = getOrdiscanClient();

      expect(MockedOrdiscan).toHaveBeenCalledWith('test-ordiscan-key');
      expect(client).toBe(mockOrdiscanInstance);
    });

    it('should throw error when ORDISCAN_API_KEY is missing', () => {
      // Ensure API key is not set
      delete process.env.ORDISCAN_API_KEY;

      // Reset modules to ensure fresh serverUtils load with current env
      jest.resetModules();

      // Load logger and spy on it after resetting modules
      const logger = loadLogger();
      jest.spyOn(logger, 'error').mockImplementation(() => {});

      const { getOrdiscanClient } = loadServerUtils();
      expect(() => getOrdiscanClient()).toThrow(
        'Server configuration error: Missing Ordiscan API Key',
      );

      expect(logger.error).toHaveBeenCalledWith(
        'Server configuration error: Missing Ordiscan API Key',
        { service: 'ordiscan' },
        'CONFIG',
      );
    });

    it('should throw error when ORDISCAN_API_KEY is empty string', () => {
      // Set empty API key
      process.env.ORDISCAN_API_KEY = '';

      // Reset modules to ensure fresh serverUtils load with current env
      jest.resetModules();

      // Load logger and spy on it after resetting modules
      const logger = loadLogger();
      jest.spyOn(logger, 'error').mockImplementation(() => {});

      const { getOrdiscanClient } = loadServerUtils();
      expect(() => getOrdiscanClient()).toThrow(
        'Server configuration error: Missing Ordiscan API Key',
      );

      expect(logger.error).toHaveBeenCalledWith(
        'Server configuration error: Missing Ordiscan API Key',
        { service: 'ordiscan' },
        'CONFIG',
      );
    });
  });

  describe('getSatsTerminalClient', () => {
    it('should create enhanced SatsTerminal client with API key', () => {
      // Set up environment variable
      process.env.SATS_TERMINAL_API_KEY = 'test-sats-terminal-key';

      const { getSatsTerminalClient } = loadServerUtils();
      const client = getSatsTerminalClient();

      // Client should be the enhanced proxy wrapper
      expect(typeof client).toBe('object');
      expect(client).toBeDefined();
    });

    it('should throw error when SATS_TERMINAL_API_KEY is missing', () => {
      // Ensure API key is not set
      delete process.env.SATS_TERMINAL_API_KEY;

      // Reset modules to clear cached SatsTerminal client and ensure fresh load
      jest.resetModules();

      // Load logger and spy on it after resetting modules
      const logger = loadLogger();
      jest.spyOn(logger, 'error').mockImplementation(() => {});

      const { getSatsTerminalClient } = loadServerUtils();
      expect(() => getSatsTerminalClient()).toThrow(
        'Server configuration error: Missing SatsTerminal API Key',
      );

      expect(logger.error).toHaveBeenCalledWith(
        'Server configuration error: Missing SatsTerminal API Key',
        { service: 'satsterminal' },
        'CONFIG',
      );
    });

    it('should throw error when SATS_TERMINAL_API_KEY is empty string', () => {
      // Set empty API key
      process.env.SATS_TERMINAL_API_KEY = '';

      // Reset modules to clear cached SatsTerminal client and ensure fresh load
      jest.resetModules();

      // Load logger and spy on it after resetting modules
      const logger = loadLogger();
      jest.spyOn(logger, 'error').mockImplementation(() => {});

      const { getSatsTerminalClient } = loadServerUtils();
      expect(() => getSatsTerminalClient()).toThrow(
        'Server configuration error: Missing SatsTerminal API Key',
      );

      expect(logger.error).toHaveBeenCalledWith(
        'Server configuration error: Missing SatsTerminal API Key',
        { service: 'satsterminal' },
        'CONFIG',
      );
    });

    it('should not return cached client when API key changes between tests', () => {
      // This test verifies that the memoization cache is properly cleared
      // between tests when environment variables change

      // First call with initial API key
      process.env.SATS_TERMINAL_API_KEY = 'test-key-1';

      // Reset modules to clear any cached client
      jest.resetModules();

      const { getSatsTerminalClient: getSatsTerminalClient1 } =
        loadServerUtils();
      const client1 = getSatsTerminalClient1();

      // Second call with different API key
      process.env.SATS_TERMINAL_API_KEY = 'test-key-2';

      // Reset modules to clear cached client - this is the critical fix
      jest.resetModules();

      const { getSatsTerminalClient: getSatsTerminalClient2 } =
        loadServerUtils();
      const client2 = getSatsTerminalClient2();

      // Should create different clients (not cached) - the critical assertion
      expect(client1).not.toBe(client2);
      expect(typeof client1).toBe('object');
      expect(typeof client2).toBe('object');
    });
  });
});

import * as popularRunesCache from '@/lib/popularRunesCache';
import { GET } from './route';

// Mock the cache functions
jest.mock('@/lib/popularRunesCache');
const mockGetCachedPopularRunes = jest.fn();
const mockUpdateLastRefreshAttempt = jest.fn();
const mockCachePopularRunes = jest.fn();

const mockedPopularRunesCache = jest.mocked(popularRunesCache);
mockedPopularRunesCache.getCachedPopularRunes = mockGetCachedPopularRunes;
mockedPopularRunesCache.updateLastRefreshAttempt = mockUpdateLastRefreshAttempt;
mockedPopularRunesCache.cachePopularRunes = mockCachePopularRunes;
// Helper used by route for detecting fallback data
mockedPopularRunesCache.isFallbackPopularRunesData = jest
  .fn()
  .mockImplementation(
    (data: unknown, lastRefreshAttempt: number | null) =>
      Array.isArray(data) &&
      lastRefreshAttempt === null &&
      (data as Record<string, unknown>[]).some(
        (item) =>
          item?.id === 'liquidiumtoken' || item?.id === 'ordinals_ethtoken',
      ),
  );
// Provide default mock for new helper used in route

// Mock the SatsTerminal client
const mockPopularTokens = jest.fn();
jest.mock('@/lib/serverUtils', () => ({
  getSatsTerminalClient: jest.fn(() => ({
    popularTokens: mockPopularTokens,
  })),
}));

// Mock console methods to avoid noise in tests
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

describe('/api/cached-popular-runes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    console.error = jest.fn();
    console.warn = jest.fn();
  });

  afterAll(() => {
    console.error = originalConsoleError;
    console.warn = originalConsoleWarn;
  });

  const mockCachedData = [
    {
      id: 'test-rune-1',
      name: 'TEST•RUNE•ONE',
      rune: 'TEST•RUNE•ONE',
      imageURI: 'https://example.com/test1.png',
    },
    {
      id: 'test-rune-2',
      name: 'TEST•RUNE•TWO',
      rune: 'TEST•RUNE•TWO',
      imageURI: 'https://example.com/test2.png',
    },
  ];

  const mockFreshData = [
    {
      id: 'fresh-rune-1',
      name: 'FRESH•RUNE•ONE',
      rune: 'FRESH•RUNE•ONE',
      imageURI: 'https://example.com/fresh1.png',
    },
  ];

  describe('when cached data exists and is fresh', () => {
    it('should return cached data immediately without refresh', async () => {
      mockGetCachedPopularRunes.mockResolvedValue({
        data: mockCachedData,
        isExpired: false,
        isStale: false,
        lastRefreshAttempt: Date.now() - 1000,
      });

      const response = await GET();

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data).toEqual({
        success: true,
        data: {
          data: mockCachedData,
          isStale: false,
          cacheAge: expect.any(String),
        },
      });

      // Should not attempt to refresh or update timestamp
      expect(mockUpdateLastRefreshAttempt).not.toHaveBeenCalled();
      expect(mockPopularTokens).not.toHaveBeenCalled();
    });
  });

  describe('when cached data exists but should refresh', () => {
    it('should return cached data and trigger background refresh', async () => {
      const lastRefreshTime = Date.now() - 1000;
      mockGetCachedPopularRunes.mockResolvedValue({
        data: mockCachedData,
        isExpired: true,
        isStale: false,
        lastRefreshAttempt: lastRefreshTime,
      });

      mockUpdateLastRefreshAttempt.mockResolvedValue(undefined);
      mockPopularTokens.mockResolvedValue(mockFreshData);
      mockCachePopularRunes.mockResolvedValue(undefined);

      const response = await GET();

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data).toEqual({
        success: true,
        data: {
          data: mockCachedData,
          isStale: true, // isExpired maps to isStale in response
          cacheAge: new Date(lastRefreshTime).toISOString(),
        },
      });

      // Should update refresh timestamp immediately
      expect(mockUpdateLastRefreshAttempt).toHaveBeenCalledTimes(1);

      // Background refresh should be triggered (but we can't easily test the async nature)
      // We'll test the background refresh function behavior separately
    });

    it('should handle background refresh failure gracefully', async () => {
      mockGetCachedPopularRunes.mockResolvedValue({
        data: mockCachedData,
        isExpired: true,
        isStale: false,
        lastRefreshAttempt: Date.now() - 1000,
      });

      mockUpdateLastRefreshAttempt.mockResolvedValue(undefined);
      mockPopularTokens.mockRejectedValue(new Error('API Error'));

      const response = await GET();

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.data.data).toEqual(mockCachedData);

      // Should still update refresh timestamp
      expect(mockUpdateLastRefreshAttempt).toHaveBeenCalledTimes(1);
    });
  });

  describe('when no cached data exists (first run)', () => {
    it('should fetch data synchronously and cache it', async () => {
      // First run: only fallback data available (indicated by lastRefreshAttempt: null)
      const fallbackData = [
        {
          id: 'liquidiumtoken',
          rune: 'LIQUIDIUM•TOKEN',
          name: 'LIQUIDIUM•TOKEN',
          imageURI: 'https://icon.unisat.io/icon/runes/LIQUIDIUM%E2%80%A2TOKEN',
          etching: { runeName: 'LIQUIDIUM•TOKEN' },
        },
      ];

      // First run identified by lastRefreshAttempt: null
      mockGetCachedPopularRunes.mockResolvedValue({
        data: fallbackData,
        isExpired: true,
        isStale: false,
        lastRefreshAttempt: null, // This indicates first run
      });

      mockPopularTokens.mockResolvedValue(mockFreshData);
      mockCachePopularRunes.mockResolvedValue(undefined);

      const response = await GET();

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data).toEqual({
        success: true,
        data: mockFreshData,
      });

      expect(mockPopularTokens).toHaveBeenCalledWith({});
      expect(mockCachePopularRunes).toHaveBeenCalledWith(mockFreshData);
    });

    it('should handle invalid API response format', async () => {
      // First run scenario: only fallback data available
      const fallbackData = [
        {
          id: 'liquidiumtoken',
          rune: 'LIQUIDIUM•TOKEN',
          name: 'LIQUIDIUM•TOKEN',
          imageURI: 'https://icon.unisat.io/icon/runes/LIQUIDIUM%E2%80%A2TOKEN',
          etching: { runeName: 'LIQUIDIUM•TOKEN' },
        },
      ];

      // First run identified by lastRefreshAttempt: null
      mockGetCachedPopularRunes.mockResolvedValue({
        data: fallbackData,
        isExpired: true,
        isStale: false,
        lastRefreshAttempt: null,
      });

      mockPopularTokens.mockResolvedValue({ invalid: 'format' });

      const response = await GET();

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.data.data).toEqual(fallbackData);
      expect(data.data.isStale).toBe(true);
      expect(data.data.error).toBe('Failed to fetch fresh data');

      expect(mockCachePopularRunes).not.toHaveBeenCalled();
    });

    it('should handle null API response', async () => {
      // First run scenario: only fallback data available
      const fallbackData = [
        {
          id: 'liquidiumtoken',
          rune: 'LIQUIDIUM•TOKEN',
          name: 'LIQUIDIUM•TOKEN',
          imageURI: 'https://icon.unisat.io/icon/runes/LIQUIDIUM%E2%80%A2TOKEN',
          etching: { runeName: 'LIQUIDIUM•TOKEN' },
        },
      ];

      // First run identified by lastRefreshAttempt: null
      mockGetCachedPopularRunes.mockResolvedValue({
        data: fallbackData,
        isExpired: true,
        isStale: false,
        lastRefreshAttempt: null,
      });

      mockPopularTokens.mockResolvedValue(null);

      const response = await GET();

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.data.data).toEqual(fallbackData);
      expect(data.data.isStale).toBe(true);
      expect(data.data.error).toBe('Failed to fetch fresh data');

      expect(mockCachePopularRunes).not.toHaveBeenCalled();
    });

    it('should return fallback data when API fails and cache returns fallback', async () => {
      const fallbackData = [
        {
          id: 'liquidiumtoken',
          rune: 'LIQUIDIUM•TOKEN',
          name: 'LIQUIDIUM•TOKEN',
          imageURI: 'https://icon.unisat.io/icon/runes/LIQUIDIUM%E2%80%A2TOKEN',
          etching: { runeName: 'LIQUIDIUM•TOKEN' },
        },
      ];

      // First call returns only fallback data (first run scenario)
      mockGetCachedPopularRunes.mockResolvedValueOnce({
        data: fallbackData,
        isExpired: true,
        isStale: false,
        lastRefreshAttempt: null,
      });

      // Second call (after API failure) returns fallback data
      mockGetCachedPopularRunes.mockResolvedValueOnce({
        data: fallbackData,
        isExpired: true,
        isStale: false,
        lastRefreshAttempt: null,
      });

      mockPopularTokens.mockRejectedValue(new Error('API Error'));

      const response = await GET();

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.data.data).toEqual(fallbackData);
      expect(data.data.isStale).toBe(true);
      expect(data.data.error).toBe('Failed to fetch fresh data');
    });
  });

  describe('error handling', () => {
    it('should handle cache metadata fetch errors', async () => {
      mockGetCachedPopularRunes.mockRejectedValue(
        new Error('Database connection failed'),
      );

      const response = await GET();

      expect(response.status).toBe(500);
      const data = await response.json();

      expect(data.success).toBe(false);
      expect(data.error.message).toBe('Database connection failed');
    });

    it('should handle updateLastRefreshAttempt errors gracefully', async () => {
      mockGetCachedPopularRunes.mockResolvedValue({
        data: mockCachedData,
        isExpired: true,
        isStale: false,
        lastRefreshAttempt: Date.now() - 1000,
      });

      mockUpdateLastRefreshAttempt.mockRejectedValue(
        new Error('Update failed'),
      );
      mockPopularTokens.mockResolvedValue(mockFreshData);

      const response = await GET();

      // Should still return cached data successfully
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.data).toEqual(mockCachedData);
    });
  });

  describe('background refresh behavior', () => {
    it('should not trigger background refresh when cache is stale', async () => {
      mockGetCachedPopularRunes.mockResolvedValue({
        data: mockCachedData,
        isExpired: true,
        isStale: true, // Stale data should not trigger background refresh
        lastRefreshAttempt: Date.now() - 1000,
      });

      const response = await GET();

      expect(response.status).toBe(200);

      // Should not update refresh timestamp for stale data
      expect(mockUpdateLastRefreshAttempt).not.toHaveBeenCalled();
      expect(mockPopularTokens).not.toHaveBeenCalled();
    });

    it('should handle caching errors during background refresh', async () => {
      mockGetCachedPopularRunes.mockResolvedValue({
        data: mockCachedData,
        isExpired: true,
        isStale: false,
        lastRefreshAttempt: Date.now() - 1000,
      });

      mockUpdateLastRefreshAttempt.mockResolvedValue(undefined);
      mockPopularTokens.mockResolvedValue(mockFreshData);
      mockCachePopularRunes.mockRejectedValue(new Error('Cache write failed'));

      const response = await GET();

      // Should still return cached data successfully
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.data).toEqual(mockCachedData);

      expect(mockUpdateLastRefreshAttempt).toHaveBeenCalledTimes(1);
    });
  });

  describe('response format validation', () => {
    it('should return correct response format for fresh cache', async () => {
      const lastRefreshTime = Date.now() - 5000;
      mockGetCachedPopularRunes.mockResolvedValue({
        data: mockCachedData,
        isExpired: false,
        isStale: false,
        lastRefreshAttempt: lastRefreshTime,
      });

      const response = await GET();

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.data.data).toEqual(mockCachedData);
      expect(data.data.isStale).toBe(false);
      expect(data.data.cacheAge).toBe(new Date(lastRefreshTime).toISOString());
    });

    it('should return correct response format for expired cache', async () => {
      mockGetCachedPopularRunes.mockResolvedValue({
        data: mockCachedData,
        isExpired: true,
        isStale: false,
        lastRefreshAttempt: Date.now() - 1000,
      });

      mockUpdateLastRefreshAttempt.mockResolvedValue(undefined);

      const response = await GET();

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data.data.isStale).toBe(true); // isExpired should map to isStale: true
    });

    it('should handle null lastRefreshAttempt', async () => {
      mockGetCachedPopularRunes.mockResolvedValue({
        data: mockCachedData,
        isExpired: false,
        isStale: false,
        lastRefreshAttempt: null,
      });

      const response = await GET();

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data.data.cacheAge).toBe(null);
    });
  });
});

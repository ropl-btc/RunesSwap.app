import {
  QUERY_KEYS,
  fetchBtcBalanceFromApi,
  fetchPopularFromApi,
  fetchRuneActivityFromApi,
  fetchRuneInfoFromApi,
  fetchRunePriceHistoryFromApi,
  fetchRunesFromApi,
} from './api';

// Mock the fetchWrapper module that the underlying functions use
jest.mock('./fetchWrapper', () => ({
  get: jest.fn(),
  post: jest.fn(),
  FetchError: class FetchError extends Error {
    constructor(
      message: string,
      public status: number,
      public statusText: string,
      public url: string,
    ) {
      super(message);
      this.name = 'FetchError';
    }
  },
}));

import { get } from './fetchWrapper';

// Helper to mock fetchWrapper responses
const mockFetchWrapperResponse = <T>(
  data: T,
  status = 200,
  statusText = 'OK',
) => ({
  data,
  status,
  statusText,
  headers: new Headers(),
});

describe('apiClient', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('QUERY_KEYS', () => {
    it('exports the expected query keys', () => {
      expect(QUERY_KEYS).toHaveProperty('POPULAR_RUNES');
      expect(QUERY_KEYS).toHaveProperty('RUNE_INFO');
      expect(QUERY_KEYS).toHaveProperty('RUNE_MARKET');
      expect(QUERY_KEYS).toHaveProperty('BTC_BALANCE');
      expect(QUERY_KEYS).toHaveProperty('RUNE_BALANCES');
      expect(QUERY_KEYS).toHaveProperty('RUNE_ACTIVITY');
      expect(QUERY_KEYS).toHaveProperty('PORTFOLIO_DATA');
    });
  });

  describe('fetchRunesFromApi', () => {
    it('returns empty array for empty query', async () => {
      const result = await fetchRunesFromApi('');
      expect(result).toEqual([]);
      expect(get).not.toHaveBeenCalled();
    });

    it('fetches and processes runes data successfully', async () => {
      const mockRunes = [
        { id: '1', name: 'RUNE1' },
        { id: '2', name: 'RUNE2' },
      ];

      (get as jest.Mock).mockResolvedValue(
        mockFetchWrapperResponse({ success: true, data: mockRunes }),
      );

      const result = await fetchRunesFromApi('test');

      expect(get).toHaveBeenCalledWith('/api/sats-terminal/search?query=test');
      expect(result).toEqual(mockRunes);
    });

    it('returns empty array when success response has non-array data', async () => {
      (get as jest.Mock).mockResolvedValue(
        mockFetchWrapperResponse({ success: true, data: { notAnArray: true } }),
      );

      const result = await fetchRunesFromApi('test');

      expect(get).toHaveBeenCalledWith('/api/sats-terminal/search?query=test');
      expect(result).toEqual([]);
    });

    it('throws error for fetchWrapper errors', async () => {
      const { FetchError } = jest.requireMock('./fetchWrapper');
      (get as jest.Mock).mockRejectedValue(
        new FetchError(
          'HTTP 404: Not Found',
          404,
          'Not Found',
          '/api/sats-terminal/search',
        ),
      );

      await expect(fetchRunesFromApi('test')).rejects.toThrow(
        'Failed to search runes',
      );
      expect(get).toHaveBeenCalledWith('/api/sats-terminal/search?query=test');
    });

    it('throws error for success: false response', async () => {
      (get as jest.Mock).mockResolvedValue(
        mockFetchWrapperResponse({ success: false, error: 'Not found' }),
      );

      await expect(fetchRunesFromApi('test')).rejects.toThrow(
        'Failed to search runes',
      );
      expect(get).toHaveBeenCalledWith('/api/sats-terminal/search?query=test');
    });
  });

  describe('fetchPopularFromApi', () => {
    it('fetches and processes popular collections successfully', async () => {
      const mockPopular = [
        { id: '1', name: 'POPULAR1' },
        { id: '2', name: 'POPULAR2' },
      ];

      (get as jest.Mock).mockResolvedValue(
        mockFetchWrapperResponse({ success: true, data: mockPopular }),
      );

      const result = await fetchPopularFromApi();

      expect(get).toHaveBeenCalledWith('/api/popular-runes');
      expect(result).toEqual(mockPopular);
    });

    it('throws error for fetchWrapper errors', async () => {
      const { FetchError } = jest.requireMock('./fetchWrapper');
      (get as jest.Mock).mockRejectedValue(
        new FetchError(
          'HTTP 500: Server Error',
          500,
          'Server Error',
          '/api/popular-runes',
        ),
      );

      await expect(fetchPopularFromApi()).rejects.toThrow(
        'Failed to fetch popular runes',
      );
      expect(get).toHaveBeenCalledWith('/api/popular-runes');
    });

    it('throws error for success: false response', async () => {
      (get as jest.Mock).mockResolvedValue(
        mockFetchWrapperResponse({ success: false, error: 'Server error' }),
      );

      await expect(fetchPopularFromApi()).rejects.toThrow(
        'Failed to fetch popular runes',
      );
      expect(get).toHaveBeenCalledWith('/api/popular-runes');
    });
  });

  describe('fetchRuneInfoFromApi', () => {
    it('normalizes rune name by removing bullet characters', async () => {
      const mockRuneInfo = { id: '1', name: 'RUNE', decimals: 8 };

      (get as jest.Mock).mockResolvedValue(
        mockFetchWrapperResponse({ success: true, data: mockRuneInfo }),
      );

      await fetchRuneInfoFromApi('RUNE•TEST');

      expect(get).toHaveBeenCalledWith('/api/ordiscan/rune-info?name=RUNETEST');
    });

    it('fetches and processes rune info successfully', async () => {
      const mockRuneInfo = { id: '1', name: 'RUNE', decimals: 8 };

      (get as jest.Mock).mockResolvedValue(
        mockFetchWrapperResponse({ success: true, data: mockRuneInfo }),
      );

      const result = await fetchRuneInfoFromApi('RUNE');

      expect(get).toHaveBeenCalledWith('/api/ordiscan/rune-info?name=RUNE');
      expect(result).toEqual(mockRuneInfo);
    });

    it('returns null for 404 responses', async () => {
      const { FetchError } = jest.requireMock('./fetchWrapper');
      (get as jest.Mock).mockRejectedValue(
        new FetchError(
          'HTTP 404: Not Found',
          404,
          'Not Found',
          '/api/ordiscan/rune-info',
        ),
      );

      const result = await fetchRuneInfoFromApi('NONEXISTENT');
      expect(result).toBeNull();
      expect(get).toHaveBeenCalledWith(
        '/api/ordiscan/rune-info?name=NONEXISTENT',
      );
    });

    it('throws error for server errors', async () => {
      const { FetchError } = jest.requireMock('./fetchWrapper');
      (get as jest.Mock).mockRejectedValue(
        new FetchError(
          'HTTP 500: Server error',
          500,
          'Server error',
          '/api/ordiscan/rune-info',
        ),
      );

      await expect(fetchRuneInfoFromApi('RUNE')).rejects.toThrow(
        'HTTP 500: Server error',
      );
      expect(get).toHaveBeenCalledWith('/api/ordiscan/rune-info?name=RUNE');
    });
  });

  describe('fetchBtcBalanceFromApi', () => {
    it('fetches and processes BTC balance successfully', async () => {
      const mockBalance = { balance: 123456 };

      (get as jest.Mock).mockResolvedValue(
        mockFetchWrapperResponse({ success: true, data: mockBalance }),
      );

      const result = await fetchBtcBalanceFromApi('bc1qtest');

      expect(get).toHaveBeenCalledWith(
        '/api/ordiscan/btc-balance?address=bc1qtest',
      );
      expect(result).toBe(123456);
    });

    it('returns 0 for missing balance data', async () => {
      (get as jest.Mock).mockResolvedValue(
        mockFetchWrapperResponse({ success: true, data: {} }),
      );

      const result = await fetchBtcBalanceFromApi('bc1qtest');

      expect(get).toHaveBeenCalledWith(
        '/api/ordiscan/btc-balance?address=bc1qtest',
      );
      expect(result).toBe(0);
    });

    it('returns 0 when API returns null data', async () => {
      (get as jest.Mock).mockResolvedValue(
        mockFetchWrapperResponse({ success: true, data: null }),
      );

      const result = await fetchBtcBalanceFromApi('bc1qtest');

      expect(get).toHaveBeenCalledWith(
        '/api/ordiscan/btc-balance?address=bc1qtest',
      );
      expect(result).toBe(0);
    });

    it('throws error for fetchWrapper errors', async () => {
      const { FetchError } = jest.requireMock('./fetchWrapper');
      (get as jest.Mock).mockRejectedValue(
        new FetchError(
          'HTTP 500: Server Error',
          500,
          'Server Error',
          '/api/ordiscan/btc-balance',
        ),
      );

      await expect(fetchBtcBalanceFromApi('bc1qtest')).rejects.toThrow(
        'Failed to fetch BTC balance for bc1qtest',
      );
      expect(get).toHaveBeenCalledWith(
        '/api/ordiscan/btc-balance?address=bc1qtest',
      );
    });
  });

  describe('fetchRuneActivityFromApi', () => {
    it('throws error when fetchWrapper fails', async () => {
      const { FetchError } = jest.requireMock('./fetchWrapper');
      (get as jest.Mock).mockRejectedValue(
        new FetchError(
          'HTTP 500: Internal Error',
          500,
          'Internal Error',
          '/api/ordiscan/rune-activity',
        ),
      );

      await expect(fetchRuneActivityFromApi('addr')).rejects.toThrow(
        'Failed to fetch rune activity for addr',
      );
      expect(get).toHaveBeenCalledWith(
        '/api/ordiscan/rune-activity?address=addr',
      );
    });

    it('throws error for general network failures', async () => {
      (get as jest.Mock).mockRejectedValue(new Error('Network error'));

      await expect(fetchRuneActivityFromApi('addr')).rejects.toThrow(
        'Failed to fetch rune activity for addr',
      );
      expect(get).toHaveBeenCalledWith(
        '/api/ordiscan/rune-activity?address=addr',
      );
    });
  });

  describe('fetchRunePriceHistoryFromApi', () => {
    it('returns default response for empty rune name', async () => {
      const result = await fetchRunePriceHistoryFromApi('');
      expect(result).toEqual({ slug: '', prices: [], available: false });
      expect(get).not.toHaveBeenCalled();
    });

    it('formats slug for LIQUIDIUM runes', async () => {
      const mockHistory = {
        slug: 'LIQUIDIUMTOKEN',
        prices: [],
        available: true,
      };

      (get as jest.Mock).mockResolvedValue(
        mockFetchWrapperResponse({ success: true, data: mockHistory }),
      );

      const result = await fetchRunePriceHistoryFromApi('LIQUIDIUM•TOKEN');

      expect(get).toHaveBeenCalledWith(
        '/api/rune-price-history?slug=LIQUIDIUMTOKEN',
      );
      expect(result).toEqual(mockHistory);
    });
  });
});

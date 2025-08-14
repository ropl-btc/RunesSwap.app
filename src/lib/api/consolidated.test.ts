import { runApiTests, setupApiMocks, testData } from '../../test-utils';
import {
  QUERY_KEYS,
  fetchBtcBalanceFromApi,
  fetchListRunesFromApi,
  fetchPopularFromApi,
  fetchPortfolioDataFromApi,
  fetchRuneActivityFromApi,
  fetchRuneBalancesFromApi,
  fetchRuneInfoFromApi,
  fetchRuneMarketFromApi,
  fetchRunePriceHistoryFromApi,
  fetchRunesFromApi,
  updateRuneDataViaApi,
} from '../api';
import { apiGet, apiPost } from './createApiClient';

jest.mock('./createApiClient', () => ({
  apiGet: jest.fn(),
  apiPost: jest.fn(),
}));
jest.mock('../logger', () => ({ logFetchError: jest.fn() }));

describe('API Client Functions', () => {
  beforeEach(setupApiMocks);

  it('exports expected query keys', () => {
    const expectedKeys = [
      'POPULAR_RUNES',
      'RUNE_INFO',
      'RUNE_MARKET',
      'BTC_BALANCE',
      'RUNE_BALANCES',
      'RUNE_ACTIVITY',
      'PORTFOLIO_DATA',
    ];
    expectedKeys.forEach((key) => expect(QUERY_KEYS).toHaveProperty(key));
  });

  describe('fetchRunesFromApi', () => {
    it('returns empty array for empty query and fetches data successfully', async () => {
      expect(await fetchRunesFromApi('')).toEqual([]);
      expect(apiGet).not.toHaveBeenCalled();

      const mockRunes = [testData.runeSearchResult()];
      (apiGet as jest.Mock).mockResolvedValue(mockRunes);

      const result = await fetchRunesFromApi('test');
      expect(apiGet).toHaveBeenCalledWith('/api/sats-terminal/search', {
        query: 'test',
      });
      expect(result).toEqual(mockRunes);
    });

    it('handles non-array responses and errors', async () => {
      const mockResponse = { notAnArray: true };
      (apiGet as jest.Mock).mockResolvedValue(mockResponse);
      expect(await fetchRunesFromApi('test')).toEqual(mockResponse);

      (apiGet as jest.Mock).mockRejectedValue(new Error('API failed'));
      await expect(fetchRunesFromApi('test')).rejects.toThrow('API failed');
    });
  });

  runApiTests(
    'fetchPopularFromApi',
    fetchPopularFromApi,
    '/api/popular-runes',
    [],
    undefined,
    [testData.popularRune()],
    true,
  );

  describe('fetchRuneInfoFromApi', () => {
    it('normalizes rune names and handles success/error cases', async () => {
      (apiGet as jest.Mock).mockResolvedValue(testData.runeData);

      await fetchRuneInfoFromApi('RUNE•TEST');
      expect(apiGet).toHaveBeenCalledWith('/api/ordiscan/rune-info', {
        name: 'RUNETEST',
      });

      const result = await fetchRuneInfoFromApi('RUNE');
      expect(result).toEqual(testData.runeData);

      (apiGet as jest.Mock).mockRejectedValue(new Error('Not Found'));
      expect(await fetchRuneInfoFromApi('FAIL')).toBeNull();
    });
  });

  describe('fetchBtcBalanceFromApi', () => {
    it('fetches balance and handles edge cases', async () => {
      (apiGet as jest.Mock).mockResolvedValue(testData.balanceData);
      expect(await fetchBtcBalanceFromApi('bc1qtest')).toBe(123456);

      const testCases = [
        { mockData: {}, expected: 0 },
        { mockData: null, expected: 0 },
      ];

      for (const { mockData, expected } of testCases) {
        (apiGet as jest.Mock).mockResolvedValue(mockData);
        expect(await fetchBtcBalanceFromApi('bc1qtest')).toBe(expected);
      }
    });
  });

  // Use helper functions for simple endpoints
  runApiTests(
    'fetchRuneBalancesFromApi',
    fetchRuneBalancesFromApi,
    '/api/ordiscan/rune-balances',
    ['bc1test'],
    { address: 'bc1test' },
    testData.runeBalances,
    true,
  );

  runApiTests(
    'fetchRuneMarketFromApi',
    fetchRuneMarketFromApi,
    '/api/ordiscan/rune-market',
    ['RUNE1'],
    { name: 'RUNE1' },
    testData.marketData,
    false,
  );

  runApiTests(
    'fetchListRunesFromApi',
    fetchListRunesFromApi,
    '/api/ordiscan/list-runes',
    [],
    undefined,
    [testData.runeData],
    true,
  );

  runApiTests(
    'fetchRuneActivityFromApi',
    fetchRuneActivityFromApi,
    '/api/ordiscan/rune-activity',
    ['addr'],
    { address: 'addr' },
    [testData.runeActivityEvent('TRANSFER', 'addr')],
    true,
  );

  describe('fetchPortfolioDataFromApi', () => {
    it('fetches portfolio data and handles empty address', async () => {
      (apiGet as jest.Mock).mockResolvedValue(testData.portfolioData);
      const result = await fetchPortfolioDataFromApi('bc1test');
      expect(apiGet).toHaveBeenCalledWith('/api/portfolio-data', {
        address: 'bc1test',
      });
      expect(result).toEqual(testData.portfolioData);

      expect(await fetchPortfolioDataFromApi('')).toEqual({
        balances: [],
        runeInfos: {},
        marketData: {},
      });
    });
  });

  describe('updateRuneDataViaApi', () => {
    it('updates rune data via POST and handles errors', async () => {
      (apiPost as jest.Mock).mockResolvedValue(testData.runeData);
      const result = await updateRuneDataViaApi('RUNE1');
      expect(apiPost).toHaveBeenCalledWith('/api/ordiscan/rune-update', {
        name: 'RUNE1',
      });
      expect(result).toEqual(testData.runeData);

      (apiPost as jest.Mock).mockRejectedValue(new Error('Error'));
      expect(await updateRuneDataViaApi('FAIL')).toBeNull();
    });
  });

  describe('fetchRunePriceHistoryFromApi', () => {
    it('handles empty names and regular runes', async () => {
      expect(await fetchRunePriceHistoryFromApi('')).toEqual({
        slug: '',
        prices: [],
        available: false,
      });

      (apiGet as jest.Mock).mockResolvedValue(testData.priceHistory);
      const result = await fetchRunePriceHistoryFromApi('RUNE1');
      expect(result).toEqual(testData.priceHistory);

      (apiGet as jest.Mock).mockRejectedValue(new Error('Error'));
      await expect(fetchRunePriceHistoryFromApi('FAIL')).rejects.toThrow(
        'Error',
      );
    });
  });
});

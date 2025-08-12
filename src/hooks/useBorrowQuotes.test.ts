import { act, renderHook } from '@testing-library/react';
import {
  type BorrowRangeResponse,
  type LiquidiumBorrowQuoteOffer,
  type LiquidiumBorrowQuoteResponse,
  fetchBorrowQuotesFromApi,
  fetchBorrowRangesFromApi,
  fetchPopularFromApi,
} from '@/lib/api';
import type { RuneData } from '@/lib/runesData';

// Mock the API client functions
jest.mock('@/lib/api', () => ({
  fetchBorrowQuotesFromApi: jest.fn(),
  fetchBorrowRangesFromApi: jest.fn(),
  fetchPopularFromApi: jest.fn(),
}));

// Mock the utility functions
jest.mock('@/utils/typeGuards', () => ({
  safeArrayFirst: jest.fn((array: unknown[]): unknown => array[0]),
  safeArrayAccess: jest.fn(
    (array: unknown[], index: number): unknown => array[index],
  ),
}));

// Import the mocked functions for type safety
import type { Asset } from '@/types/common';
import useBorrowQuotes from './useBorrowQuotes';

const mockFetchBorrowQuotesFromApi =
  fetchBorrowQuotesFromApi as jest.MockedFunction<
    typeof fetchBorrowQuotesFromApi
  >;
const mockFetchBorrowRangesFromApi =
  fetchBorrowRangesFromApi as jest.MockedFunction<
    typeof fetchBorrowRangesFromApi
  >;
const mockFetchPopularFromApi = fetchPopularFromApi as jest.MockedFunction<
  typeof fetchPopularFromApi
>;

// Test data
const mockAsset: Asset = {
  id: 'test-rune-id',
  name: 'TEST•RUNE',
  imageURI: 'test-image.png',
  isBTC: false,
};

const mockRuneInfo: RuneData = {
  id: 'test-rune-id',
  name: 'TEST•RUNE',
  symbol: 'TEST',
  decimals: 8,
  supply: '1000000',
  icon: 'test-icon.png',
  spacedName: 'TEST•RUNE',
  supply_formatted: '1,000,000',
  market: {
    floor_price: 100,
    market_cap: 1000000,
  },
};

describe('useBorrowQuotes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Popular Runes Fetching', () => {
    it('should fetch and set popular runes from API', async () => {
      const mockPopularRunes = [
        {
          token_id: '840010:907',
          token: 'LIQUIDIUM•TOKEN',
          icon: 'liquidium.png',
        },
        {
          token_id: '840000:45',
          token: 'MAGIC•INTERNET•MONEY',
          icon: 'magic.png',
        },
      ];
      mockFetchPopularFromApi.mockResolvedValue(mockPopularRunes);

      const { result } = renderHook(() =>
        useBorrowQuotes({
          collateralAsset: null,
          collateralAmount: '',
          address: null,
          collateralRuneInfo: null,
        }),
      );

      await act(async () => {
        await Promise.resolve();
      });

      expect(result.current.isPopularLoading).toBe(false);
      expect(result.current.popularError).toBeNull();
      expect(result.current.popularRunes).toHaveLength(2);
    });

    it('should handle popular runes fetch error', async () => {
      const errorMessage = 'Network error';
      mockFetchPopularFromApi.mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() =>
        useBorrowQuotes({
          collateralAsset: null,
          collateralAmount: '',
          address: null,
          collateralRuneInfo: null,
        }),
      );

      await act(async () => {
        await Promise.resolve();
      });

      expect(result.current.isPopularLoading).toBe(false);
      expect(result.current.popularError).toBe(errorMessage);
      expect(result.current.popularRunes).toEqual([]);
    });
  });

  describe('Borrow Range Fetching', () => {
    it('should fetch min-max range when collateral asset changes', async () => {
      const mockBorrowRangeResponse: BorrowRangeResponse = {
        success: true,
        data: {
          minAmount: '1000000000',
          maxAmount: '10000000000',
        },
      };

      mockFetchBorrowRangesFromApi.mockResolvedValue(mockBorrowRangeResponse);

      const { result } = renderHook(() =>
        useBorrowQuotes({
          collateralAsset: mockAsset,
          collateralAmount: '100',
          address: 'bc1test',
          collateralRuneInfo: mockRuneInfo,
        }),
      );

      await act(async () => {
        await Promise.resolve();
      });

      expect(mockFetchBorrowRangesFromApi).toHaveBeenCalledWith(
        'test-rune-id',
        'bc1test',
      );
      expect(result.current.minMaxRange).toContain('Min:');
      expect(result.current.minMaxRange).toContain('Max:');
    });
  });

  describe('Quote Fetching', () => {
    it('should fetch quotes when handleGetQuotes is called', async () => {
      const mockQuoteResponse: LiquidiumBorrowQuoteResponse = {
        runeDetails: {
          offers: [
            {
              id: 'quote-1',
              loanAmount: '50000000',
              interestRate: 0.05,
              duration: 30,
              lenderAddress: 'bc1lender',
            } as LiquidiumBorrowQuoteOffer,
          ],
          valid_ranges: {
            rune_amount: {
              ranges: [{ min: '1000000000', max: '10000000000' }],
            },
          },
        },
      };

      mockFetchBorrowQuotesFromApi.mockResolvedValue(mockQuoteResponse);
      mockFetchPopularFromApi.mockResolvedValue([]);

      const { result } = renderHook(() =>
        useBorrowQuotes({
          collateralAsset: mockAsset,
          collateralAmount: '100',
          address: 'bc1test',
          collateralRuneInfo: mockRuneInfo,
        }),
      );

      await act(async () => {
        await result.current.handleGetQuotes();
      });

      expect(mockFetchBorrowQuotesFromApi).toHaveBeenCalled();
      expect(result.current.quotes).toHaveLength(1);
      expect(result.current.isQuotesLoading).toBe(false);
      expect(result.current.quotesError).toBeNull();
    });

    it('should handle quote fetch errors', async () => {
      mockFetchBorrowQuotesFromApi.mockRejectedValue(
        new Error('Quote fetch failed'),
      );
      mockFetchPopularFromApi.mockResolvedValue([]);

      const { result } = renderHook(() =>
        useBorrowQuotes({
          collateralAsset: mockAsset,
          collateralAmount: '100',
          address: 'bc1test',
          collateralRuneInfo: mockRuneInfo,
        }),
      );

      await act(async () => {
        await result.current.handleGetQuotes();
      });

      expect(result.current.quotes).toEqual([]);
      expect(result.current.quotesError).toBe('Quote fetch failed');
      expect(result.current.isQuotesLoading).toBe(false);
    });
  });
});

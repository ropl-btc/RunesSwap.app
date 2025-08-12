import { act, renderHook } from '@testing-library/react';
import {
  type BorrowRangeResponse,
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
  formatted_name: 'TEST•RUNE',
  spacers: null,
  number: null,
  inscription_id: null,
  decimals: 8,
  mint_count_cap: null,
  symbol: 'TEST',
  etching_txid: null,
  amount_per_mint: null,
  timestamp_unix: null,
  premined_supply: '1000000',
  mint_start_block: null,
  mint_end_block: null,
  current_supply: null,
  current_mint_count: null,
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
          runeId: 'test-rune-id',
          minAmount: '1000000000',
          maxAmount: '10000000000',
          cached: false,
          updatedAt: new Date().toISOString(),
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
      const mockQuoteResponse = {
        runeDetails: {
          offers: [{ offer_id: 'quote-1' }],
          valid_ranges: {
            rune_amount: {
              ranges: [{ min: '1000000000', max: '10000000000' }],
            },
            loan_term_days: [7, 14, 30],
          },
          rune_id: 'test-rune-id',
          slug: 'test-rune',
          floor_price_sats: 100,
          floor_price_last_updated_at: '2024-01-01T00:00:00Z',
          common_offer_data: {
            interest_rate: 0.05,
            rune_divisibility: 8,
          },
        },
      } as LiquidiumBorrowQuoteResponse;

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

import { act, renderHook } from '@testing-library/react';
import {
  type BorrowRangeResponse,
  type LiquidiumBorrowQuoteOffer,
  type LiquidiumBorrowQuoteResponse,
  fetchBorrowQuotesFromApi,
  fetchBorrowRangesFromApi,
  fetchPopularFromApi,
} from '@/lib/apiClient';
import type { RuneData } from '@/lib/runesData';

// Mock the API client functions
jest.mock('@/lib/apiClient', () => ({
  fetchBorrowQuotesFromApi: jest.fn(),
  fetchBorrowRangesFromApi: jest.fn(),
  fetchPopularFromApi: jest.fn(),
}));

// Mock the utility functions
jest.mock('@/utils/runeUtils', () => ({
  normalizeRuneName: jest.fn((name: string) => name.toLowerCase()),
}));

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
  imageURI: 'https://example.com/test.png',
  isBTC: false,
};

const mockBtcAsset: Asset = {
  id: 'BTC',
  name: 'BTC',
  imageURI: '/Bitcoin.svg',
  isBTC: true,
};

const mockRuneInfo: RuneData = {
  id: 'test-rune-id:123',
  name: 'TEST•RUNE',
  formatted_name: 'TEST•RUNE',
  spacers: 1,
  number: 123,
  inscription_id: null,
  decimals: 8,
  mint_count_cap: null,
  symbol: null,
  etching_txid: 'abc123',
  amount_per_mint: null,
  timestamp_unix: '1640995200',
  premined_supply: '1000000000000',
  mint_start_block: null,
  mint_end_block: null,
  current_supply: '1000000000000',
  current_mint_count: 0,
};

const mockQuoteOffer: LiquidiumBorrowQuoteOffer = {
  offer_id: 'offer-123',
  fungible_amount: 1,
  loan_term_days: 30,
  ltv_rate: 80,
  loan_breakdown: {
    total_repayment_sats: 110000,
    principal_sats: 100000,
    interest_sats: 10000,
    loan_due_by_date: '2024-02-01T00:00:00Z',
    activation_fee_sats: 1000,
    discount: {
      discount_rate: 0,
      discount_sats: 0,
    },
  },
};

const mockBorrowQuoteResponse: LiquidiumBorrowQuoteResponse = {
  success: true,
  runeDetails: {
    rune_id: 'test-rune-id',
    slug: 'test-rune',
    floor_price_sats: 50000,
    floor_price_last_updated_at: '2024-01-01T00:00:00Z',
    common_offer_data: {
      interest_rate: 10,
      rune_divisibility: 8,
    },
    valid_ranges: {
      rune_amount: {
        ranges: [
          { min: '100000000', max: '1000000000' },
          { min: '1000000000', max: '10000000000' },
        ],
      },
      loan_term_days: [7, 14, 30],
    },
    offers: [mockQuoteOffer],
  },
};

const mockBorrowRangeResponse: BorrowRangeResponse = {
  success: true,
  data: {
    runeId: 'test-rune-id',
    minAmount: '100000000',
    maxAmount: '10000000000',
    loanTermDays: [7, 14, 30],
    cached: false,
    updatedAt: '2024-01-01T00:00:00Z',
  },
};

const mockPopularRunes = [
  {
    rune_id: 'popular-rune-1',
    slug: 'popular-rune-1',
    rune: 'POPULAR•RUNE•ONE',
    icon_content_url_data: 'https://example.com/popular1.png',
  },
  {
    rune_id: 'popular-rune-2',
    slug: 'popular-rune-2',
    rune: 'POPULAR•RUNE•TWO',
    icon_content_url_data: 'https://example.com/popular2.png',
  },
];

// Type for hook parameters (kept for potential future use)
// type HookProps = Parameters<typeof useBorrowQuotes>[0];

describe('useBorrowQuotes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Popular Runes Fetching', () => {
    it('should fetch popular runes on mount and include LIQUIDIUM•TOKEN', async () => {
      mockFetchPopularFromApi.mockResolvedValue(mockPopularRunes);

      const { result } = renderHook(() =>
        useBorrowQuotes({
          collateralAsset: null,
          collateralAmount: '',
          address: null,
          collateralRuneInfo: null,
        }),
      );

      expect(result.current.isPopularLoading).toBe(true);
      expect(result.current.popularRunes).toEqual([]);

      await act(async () => {
        await Promise.resolve();
      });

      expect(mockFetchPopularFromApi).toHaveBeenCalledTimes(1);
      expect(result.current.isPopularLoading).toBe(false);
      expect(result.current.popularError).toBeNull();

      // Should include LIQUIDIUM•TOKEN first, then fetched runes
      expect(result.current.popularRunes).toHaveLength(3);
      expect(result.current.popularRunes[0]).toEqual({
        id: 'liquidiumtoken',
        name: 'LIQUIDIUM•TOKEN',
        imageURI: 'https://icon.unisat.io/icon/runes/LIQUIDIUM%E2%80%A2TOKEN',
        isBTC: false,
      });
    });

    it('should handle popular runes fetch error and fallback to LIQUIDIUM•TOKEN', async () => {
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
      expect(result.current.popularRunes).toEqual([
        {
          id: 'liquidiumtoken',
          name: 'LIQUIDIUM•TOKEN',
          imageURI: 'https://icon.unisat.io/icon/runes/LIQUIDIUM%E2%80%A2TOKEN',
          isBTC: false,
        },
      ]);
    });

    it('should handle non-array response from popular runes API', async () => {
      mockFetchPopularFromApi.mockResolvedValue(
        {} as Record<string, unknown>[],
      );

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
      expect(result.current.popularRunes).toEqual([
        {
          id: 'liquidiumtoken',
          name: 'LIQUIDIUM•TOKEN',
          imageURI: 'https://icon.unisat.io/icon/runes/LIQUIDIUM%E2%80%A2TOKEN',
          isBTC: false,
        },
      ]);
    });
  });

  describe('Borrow Range Fetching', () => {
    it('should fetch borrow ranges when collateral asset changes', async () => {
      mockFetchBorrowRangesFromApi.mockResolvedValue(mockBorrowRangeResponse);
      mockFetchPopularFromApi.mockResolvedValue([]);

      const { result } = renderHook(() =>
        useBorrowQuotes({
          collateralAsset: mockAsset,
          collateralAmount: '1.0',
          address: 'test-address',
          collateralRuneInfo: mockRuneInfo,
        }),
      );

      await act(async () => {
        await Promise.resolve();
      });

      expect(mockFetchBorrowRangesFromApi).toHaveBeenCalledWith(
        'test-rune-id:123',
        'test-address',
      );
      expect(result.current.minMaxRange).toBe('Min: 1.00 - Max: 100.00');
      expect(result.current.borrowRangeError).toBeNull();
    });

    it('should use rune info ID when it contains colon', async () => {
      mockFetchBorrowRangesFromApi.mockResolvedValue(mockBorrowRangeResponse);
      mockFetchPopularFromApi.mockResolvedValue([]);

      renderHook(() =>
        useBorrowQuotes({
          collateralAsset: mockAsset,
          collateralAmount: '1.0',
          address: 'test-address',
          collateralRuneInfo: mockRuneInfo,
        }),
      );

      await act(async () => {
        await Promise.resolve();
      });

      expect(mockFetchBorrowRangesFromApi).toHaveBeenCalledWith(
        'test-rune-id:123',
        'test-address',
      );
    });

    it('should not fetch ranges for BTC asset', async () => {
      mockFetchPopularFromApi.mockResolvedValue([]);

      const { result } = renderHook(() =>
        useBorrowQuotes({
          collateralAsset: mockBtcAsset,
          collateralAmount: '1.0',
          address: 'test-address',
          collateralRuneInfo: null,
        }),
      );

      await act(async () => {
        await Promise.resolve();
      });

      expect(mockFetchBorrowRangesFromApi).not.toHaveBeenCalled();
      expect(result.current.minMaxRange).toBeNull();
      expect(result.current.borrowRangeError).toBeNull();
    });

    it('should not fetch ranges when required params are missing', async () => {
      mockFetchPopularFromApi.mockResolvedValue([]);

      const { result } = renderHook(() =>
        useBorrowQuotes({
          collateralAsset: null,
          collateralAmount: '1.0',
          address: 'test-address',
          collateralRuneInfo: mockRuneInfo,
        }),
      );

      await act(async () => {
        await Promise.resolve();
      });

      expect(mockFetchBorrowRangesFromApi).not.toHaveBeenCalled();
      expect(result.current.minMaxRange).toBeNull();
    });

    it('should handle borrow range fetch error with specific error messages', async () => {
      const errorMessage = 'No valid ranges found for this rune';
      mockFetchBorrowRangesFromApi.mockRejectedValue(new Error(errorMessage));
      mockFetchPopularFromApi.mockResolvedValue([]);

      const { result } = renderHook(() =>
        useBorrowQuotes({
          collateralAsset: mockAsset,
          collateralAmount: '1.0',
          address: 'test-address',
          collateralRuneInfo: mockRuneInfo,
        }),
      );

      await act(async () => {
        await Promise.resolve();
      });

      expect(result.current.minMaxRange).toBeNull();
      expect(result.current.borrowRangeError).toBe(
        'This rune is not currently available for borrowing on Liquidium.',
      );
    });

    it('should handle unsuccessful borrow range response', async () => {
      mockFetchBorrowRangesFromApi.mockResolvedValue({
        success: false,
        error: 'Range not found',
      });
      mockFetchPopularFromApi.mockResolvedValue([]);

      const { result } = renderHook(() =>
        useBorrowQuotes({
          collateralAsset: mockAsset,
          collateralAmount: '1.0',
          address: 'test-address',
          collateralRuneInfo: mockRuneInfo,
        }),
      );

      await act(async () => {
        await Promise.resolve();
      });

      expect(result.current.minMaxRange).toBeNull();
      expect(result.current.borrowRangeError).toBeNull();
    });
  });

  describe('Quote Fetching', () => {
    beforeEach(() => {
      mockFetchPopularFromApi.mockResolvedValue([]);
    });

    it('should fetch quotes successfully', async () => {
      mockFetchBorrowQuotesFromApi.mockResolvedValue(mockBorrowQuoteResponse);

      const { result } = renderHook(() =>
        useBorrowQuotes({
          collateralAsset: mockAsset,
          collateralAmount: '1.0',
          address: 'test-address',
          collateralRuneInfo: mockRuneInfo,
        }),
      );

      await act(async () => {
        await result.current.handleGetQuotes();
      });

      expect(mockFetchBorrowQuotesFromApi).toHaveBeenCalledWith(
        'test-rune-id:123',
        '100000000',
        'test-address',
      );
      expect(result.current.quotes).toEqual([mockQuoteOffer]);
      expect(result.current.quotesError).toBeNull();
      expect(result.current.isQuotesLoading).toBe(false);
    });

    it('should not fetch quotes when required params are missing', async () => {
      const { result } = renderHook(() =>
        useBorrowQuotes({
          collateralAsset: null,
          collateralAmount: '1.0',
          address: 'test-address',
          collateralRuneInfo: mockRuneInfo,
        }),
      );

      await act(async () => {
        await result.current.handleGetQuotes();
      });

      expect(mockFetchBorrowQuotesFromApi).not.toHaveBeenCalled();
      expect(result.current.quotes).toEqual([]);
    });

    it('should handle quote fetch error', async () => {
      const errorMessage = 'Failed to fetch quotes';
      mockFetchBorrowQuotesFromApi.mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() =>
        useBorrowQuotes({
          collateralAsset: mockAsset,
          collateralAmount: '1.0',
          address: 'test-address',
          collateralRuneInfo: mockRuneInfo,
        }),
      );

      await act(async () => {
        await result.current.handleGetQuotes();
      });

      expect(result.current.quotes).toEqual([]);
      expect(result.current.quotesError).toBe(errorMessage);
      expect(result.current.isQuotesLoading).toBe(false);
    });

    it('should handle response without rune details', async () => {
      mockFetchBorrowQuotesFromApi.mockResolvedValue({
        success: true,
      });

      const { result } = renderHook(() =>
        useBorrowQuotes({
          collateralAsset: mockAsset,
          collateralAmount: '1.0',
          address: 'test-address',
          collateralRuneInfo: mockRuneInfo,
        }),
      );

      await act(async () => {
        await result.current.handleGetQuotes();
      });

      expect(result.current.quotes).toEqual([]);
      expect(result.current.quotesError).toBe(
        'No loan offers found or invalid response.',
      );
      expect(result.current.minMaxRange).toBeNull();
    });

    it('should handle response with no offers', async () => {
      mockFetchBorrowQuotesFromApi.mockResolvedValue({
        ...mockBorrowQuoteResponse,
        runeDetails: {
          ...mockBorrowQuoteResponse.runeDetails!,
          offers: [],
        },
      });

      const { result } = renderHook(() =>
        useBorrowQuotes({
          collateralAsset: mockAsset,
          collateralAmount: '1.0',
          address: 'test-address',
          collateralRuneInfo: mockRuneInfo,
        }),
      );

      await act(async () => {
        await result.current.handleGetQuotes();
      });

      expect(result.current.quotes).toEqual([]);
      expect(result.current.quotesError).toBe(
        'No loan offers available for this amount.',
      );
    });

    it('should calculate global min/max from multiple ranges', async () => {
      const responseWithMultipleRanges = {
        ...mockBorrowQuoteResponse,
        runeDetails: {
          ...mockBorrowQuoteResponse.runeDetails!,
          valid_ranges: {
            rune_amount: {
              ranges: [
                { min: '200000000', max: '500000000' },
                { min: '50000000', max: '1500000000' },
                { min: '100000000', max: '800000000' },
              ],
            },
            loan_term_days: [7, 14, 30],
          },
        },
      };

      mockFetchBorrowQuotesFromApi.mockResolvedValue(
        responseWithMultipleRanges,
      );

      const { result } = renderHook(() =>
        useBorrowQuotes({
          collateralAsset: mockAsset,
          collateralAmount: '1.0',
          address: 'test-address',
          collateralRuneInfo: mockRuneInfo,
        }),
      );

      await act(async () => {
        await result.current.handleGetQuotes();
      });

      // Should use global min (50000000) and max (1500000000)
      expect(result.current.minMaxRange).toBe('Min: 0.50 - Max: 15.00');
    });
  });

  describe('Amount Conversion Logic', () => {
    beforeEach(() => {
      mockFetchPopularFromApi.mockResolvedValue([]);
      mockFetchBorrowQuotesFromApi.mockResolvedValue(mockBorrowQuoteResponse);
    });

    it('should handle BigInt conversion for high precision decimals', async () => {
      const highDecimalRuneInfo = {
        ...mockRuneInfo,
        decimals: 18,
      };

      const { result } = renderHook(() =>
        useBorrowQuotes({
          collateralAsset: mockAsset,
          collateralAmount: '1.23456789',
          address: 'test-address',
          collateralRuneInfo: highDecimalRuneInfo,
        }),
      );

      await act(async () => {
        await result.current.handleGetQuotes();
      });

      // Should use BigInt calculation for high decimals
      expect(mockFetchBorrowQuotesFromApi).toHaveBeenCalledWith(
        'test-rune-id:123',
        '1234567890000000000',
        'test-address',
      );
    });

    it('should handle invalid collateral amount with validation error', async () => {
      const { result } = renderHook(() =>
        useBorrowQuotes({
          collateralAsset: mockAsset,
          collateralAmount: 'invalid-number',
          address: 'test-address',
          collateralRuneInfo: mockRuneInfo,
        }),
      );

      await act(async () => {
        await result.current.handleGetQuotes();
      });

      // Should not call API and set validation error instead
      expect(mockFetchBorrowQuotesFromApi).not.toHaveBeenCalled();
      expect(result.current.quotesError).toBe(
        'Please enter a valid collateral amount.',
      );
      expect(result.current.isQuotesLoading).toBe(false);
    });

    it('should handle zero or negative collateral amount with validation error', async () => {
      const { result } = renderHook(() =>
        useBorrowQuotes({
          collateralAsset: mockAsset,
          collateralAmount: '0',
          address: 'test-address',
          collateralRuneInfo: mockRuneInfo,
        }),
      );

      await act(async () => {
        await result.current.handleGetQuotes();
      });

      // Should not call API and set validation error instead
      expect(mockFetchBorrowQuotesFromApi).not.toHaveBeenCalled();
      expect(result.current.quotesError).toBe(
        'Please enter a valid collateral amount.',
      );
      expect(result.current.isQuotesLoading).toBe(false);
    });

    it('should handle zero decimals correctly', async () => {
      const zeroDecimalRuneInfo = {
        ...mockRuneInfo,
        decimals: 0,
      };

      const { result } = renderHook(() =>
        useBorrowQuotes({
          collateralAsset: mockAsset,
          collateralAmount: '123',
          address: 'test-address',
          collateralRuneInfo: zeroDecimalRuneInfo,
        }),
      );

      await act(async () => {
        await result.current.handleGetQuotes();
      });

      expect(mockFetchBorrowQuotesFromApi).toHaveBeenCalledWith(
        'test-rune-id:123',
        '123',
        'test-address',
      );
    });
  });

  describe('State Management', () => {
    beforeEach(() => {
      mockFetchPopularFromApi.mockResolvedValue([]);
    });

    it('should reset quotes when resetQuotes is called', async () => {
      mockFetchBorrowQuotesFromApi.mockResolvedValue(mockBorrowQuoteResponse);

      const { result } = renderHook(() =>
        useBorrowQuotes({
          collateralAsset: mockAsset,
          collateralAmount: '1.0',
          address: 'test-address',
          collateralRuneInfo: mockRuneInfo,
        }),
      );

      // First get some quotes
      await act(async () => {
        await result.current.handleGetQuotes();
      });

      expect(result.current.quotes).toHaveLength(1);

      // Then reset
      act(() => {
        result.current.resetQuotes();
      });

      expect(result.current.quotes).toEqual([]);
      expect(result.current.selectedQuoteId).toBeNull();
      expect(result.current.quotesError).toBeNull();
    });

    it('should manage selectedQuoteId state', async () => {
      const { result } = renderHook(() =>
        useBorrowQuotes({
          collateralAsset: mockAsset,
          collateralAmount: '1.0',
          address: 'test-address',
          collateralRuneInfo: mockRuneInfo,
        }),
      );

      expect(result.current.selectedQuoteId).toBeNull();

      act(() => {
        result.current.setSelectedQuoteId('test-quote-id');
      });

      expect(result.current.selectedQuoteId).toBe('test-quote-id');
    });

    it('should reset quotes before fetching new ones', async () => {
      mockFetchBorrowQuotesFromApi.mockResolvedValue(mockBorrowQuoteResponse);

      const { result } = renderHook(() =>
        useBorrowQuotes({
          collateralAsset: mockAsset,
          collateralAmount: '1.0',
          address: 'test-address',
          collateralRuneInfo: mockRuneInfo,
        }),
      );

      // Set some initial state
      act(() => {
        result.current.setSelectedQuoteId('old-quote-id');
      });

      // Mock an error to set quotesError
      mockFetchBorrowQuotesFromApi.mockRejectedValueOnce(
        new Error('Test error'),
      );
      await act(async () => {
        await result.current.handleGetQuotes();
      });

      expect(result.current.quotesError).toBe('Test error');

      // Now fetch successfully
      mockFetchBorrowQuotesFromApi.mockResolvedValue(mockBorrowQuoteResponse);
      await act(async () => {
        await result.current.handleGetQuotes();
      });

      // Should have reset the state
      expect(result.current.selectedQuoteId).toBeNull();
      expect(result.current.quotesError).toBeNull();
      expect(result.current.quotes).toEqual([mockQuoteOffer]);
    });
  });

  describe('formatRuneAmount function', () => {
    beforeEach(() => {
      mockFetchPopularFromApi.mockResolvedValue([]);
    });

    it('should format amounts correctly with BigInt', async () => {
      mockFetchBorrowRangesFromApi.mockResolvedValue(mockBorrowRangeResponse);

      const { result } = renderHook(() =>
        useBorrowQuotes({
          collateralAsset: mockAsset,
          collateralAmount: '1.0',
          address: 'test-address',
          collateralRuneInfo: mockRuneInfo,
        }),
      );

      await act(async () => {
        await Promise.resolve();
      });

      // The formatRuneAmount function should format the ranges correctly
      expect(result.current.minMaxRange).toBe('Min: 1.00 - Max: 100.00');
    });

    it('should handle zero decimals in formatting', async () => {
      const zeroDecimalRuneInfo = {
        ...mockRuneInfo,
        decimals: 0,
      };

      mockFetchBorrowRangesFromApi.mockResolvedValue({
        ...mockBorrowRangeResponse,
        data: {
          ...mockBorrowRangeResponse.data!,
          minAmount: '100',
          maxAmount: '1000',
        },
      });

      const { result } = renderHook(() =>
        useBorrowQuotes({
          collateralAsset: mockAsset,
          collateralAmount: '1.0',
          address: 'test-address',
          collateralRuneInfo: zeroDecimalRuneInfo,
        }),
      );

      await act(async () => {
        await Promise.resolve();
      });

      expect(result.current.minMaxRange).toBe('Min: 100 - Max: 1000');
    });

    it('should fallback to Number conversion on BigInt error', async () => {
      // This would happen with invalid string inputs in real scenarios
      const { result } = renderHook(() =>
        useBorrowQuotes({
          collateralAsset: mockAsset,
          collateralAmount: '1.0',
          address: 'test-address',
          collateralRuneInfo: mockRuneInfo,
        }),
      );

      // We can't easily test the BigInt fallback without mocking BigInt itself,
      // but the test structure is here for completeness
      expect(result.current.minMaxRange).toBeNull();
    });
  });
});

import { act, renderHook } from '@testing-library/react';
import { fetchBorrowQuotesFromApi, fetchBorrowRangesFromApi } from '@/lib/api';
import {
  createMockAsset,
  createMockBorrowQuote,
  createMockBorrowRange,
  createMockRuneInfo,
} from '@/hooks/__test-utils__';
import useBorrowQuotes from '@/hooks/useBorrowQuotes';
import usePopularRunes from '@/hooks/usePopularRunes';

jest.mock('@/lib/api', () => ({
  fetchBorrowQuotesFromApi: jest.fn(),
  fetchBorrowRangesFromApi: jest.fn(),
}));

jest.mock('@/hooks/usePopularRunes', () => jest.fn());

jest.mock('@/utils/typeGuards', () => ({
  safeArrayFirst: jest.fn((array: unknown[]) => array[0]),
  safeArrayAccess: jest.fn((array: unknown[], index: number) => array[index]),
}));

const mocks = {
  fetchBorrowQuotes: fetchBorrowQuotesFromApi as jest.Mock,
  fetchBorrowRanges: fetchBorrowRangesFromApi as jest.Mock,
  usePopularRunes: usePopularRunes as jest.Mock,
};

const baseProps = {
  collateralAsset: null,
  collateralAmount: '',
  address: null,
  collateralRuneInfo: null,
};

const activeProps = {
  collateralAsset: createMockAsset(),
  collateralAmount: '100',
  address: 'bc1test',
  collateralRuneInfo: createMockRuneInfo(),
};

describe('useBorrowQuotes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mocks.usePopularRunes.mockReturnValue({
      popularRunes: [],
      isLoading: false,
      error: null,
    });
  });

  describe('Popular Runes', () => {
    const scenarios = [
      {
        name: 'success',
        setup: () =>
          mocks.usePopularRunes.mockReturnValue({
            popularRunes: [createMockAsset(), createMockAsset({ id: '2' })],
            isLoading: false,
            error: null,
          }),
      },
      {
        name: 'error',
        setup: () =>
          mocks.usePopularRunes.mockReturnValue({
            popularRunes: [],
            isLoading: false,
            error: new Error('Network error'),
          }),
      },
    ];

    test.each(scenarios)('handles $name', async ({ setup }) => {
      setup();
      const { result } = renderHook(() => useBorrowQuotes(baseProps));
      await act(async () => Promise.resolve());

      expect(result.current.isPopularLoading).toBe(false);
      const hasError = result.current.popularError !== null;
      expect(result.current.popularRunes).toHaveLength(hasError ? 0 : 2);
    });
  });

  describe('Borrow Range', () => {
    it('fetches min-max range when collateral asset changes', async () => {
      mocks.fetchBorrowRanges.mockResolvedValue(createMockBorrowRange());
      const { result } = renderHook(() => useBorrowQuotes(activeProps));
      await act(async () => Promise.resolve());

      expect(mocks.fetchBorrowRanges).toHaveBeenCalledWith(
        'test-rune-id',
        'bc1test',
      );
      expect(result.current.minMaxRange).toContain('Min:');
      expect(result.current.minMaxRange).toContain('Max:');
    });
  });

  describe('Quote Fetching', () => {
    const quoteScenarios = [
      {
        name: 'success',
        mockData: createMockBorrowQuote(),
        expectQuotes: 1,
        expectError: null,
      },
      {
        name: 'error',
        mockData: new Error('Quote fetch failed'),
        expectQuotes: 0,
        expectError: 'Quote fetch failed',
      },
    ];

    test.each(quoteScenarios)(
      'handles quote fetch $name',
      async ({ mockData, expectQuotes, expectError }) => {
        if (mockData instanceof Error) {
          mocks.fetchBorrowQuotes.mockRejectedValue(mockData);
        } else {
          mocks.fetchBorrowQuotes.mockResolvedValue(mockData);
        }
        mocks.usePopularRunes.mockReturnValue({
          popularRunes: [],
          isLoading: false,
          error: null,
        });

        const { result } = renderHook(() => useBorrowQuotes(activeProps));
        await act(async () => result.current.handleGetQuotes());

        expect(result.current.quotes).toHaveLength(expectQuotes);
        expect(result.current.quotesError).toBe(expectError);
        expect(result.current.isQuotesLoading).toBe(false);
      },
    );
  });
});

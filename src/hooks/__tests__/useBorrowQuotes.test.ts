import { act, renderHook } from '@testing-library/react';
import {
  fetchBorrowQuotesFromApi,
  fetchBorrowRangesFromApi,
  fetchPopularFromApi,
} from '@/lib/api';
import {
  createAsyncTestScenario,
  createMockAsset,
  createMockBorrowQuote,
  createMockBorrowRange,
  createMockPopularRunes,
  createMockRuneInfo,
} from '../__test-utils__';
import useBorrowQuotes from '../useBorrowQuotes';

jest.mock('@/lib/api', () => ({
  fetchBorrowQuotesFromApi: jest.fn(),
  fetchBorrowRangesFromApi: jest.fn(),
  fetchPopularFromApi: jest.fn(),
}));

jest.mock('@/utils/typeGuards', () => ({
  safeArrayFirst: jest.fn((array: unknown[]) => array[0]),
  safeArrayAccess: jest.fn((array: unknown[], index: number) => array[index]),
}));

const mocks = {
  fetchBorrowQuotes: fetchBorrowQuotesFromApi as jest.Mock,
  fetchBorrowRanges: fetchBorrowRangesFromApi as jest.Mock,
  fetchPopular: fetchPopularFromApi as jest.Mock,
};

const baseProps = {
  collateralAsset: null,
  collateralAmount: '',
  address: null,
  collateralRuneInfo: null,
  cachedPopularRunes: [],
};

const activeProps = {
  collateralAsset: createMockAsset(),
  collateralAmount: '100',
  address: 'bc1test',
  collateralRuneInfo: createMockRuneInfo(),
  cachedPopularRunes: [],
};

describe('useBorrowQuotes', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('Popular Runes', () => {
    const scenarios = [
      createAsyncTestScenario(
        'success',
        mocks.fetchPopular,
        createMockPopularRunes(),
      ),
      createAsyncTestScenario(
        'error',
        mocks.fetchPopular,
        new Error('Network error'),
      ),
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
        mocks.fetchPopular.mockResolvedValue([]);

        const { result } = renderHook(() => useBorrowQuotes(activeProps));
        await act(async () => result.current.handleGetQuotes());

        expect(result.current.quotes).toHaveLength(expectQuotes);
        expect(result.current.quotesError).toBe(expectError);
        expect(result.current.isQuotesLoading).toBe(false);
      },
    );
  });
});

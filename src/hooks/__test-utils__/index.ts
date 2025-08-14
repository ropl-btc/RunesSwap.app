// Shared test utilities for hook testing
import type {
  BorrowRangeResponse,
  LiquidiumBorrowQuoteResponse,
} from '@/lib/api';
import type { Asset, RuneData } from '@/types/common';

// Mock factory functions
export function createMockAsset(overrides: Partial<Asset> = {}): Asset {
  return {
    id: 'test-rune-id',
    name: 'TEST•RUNE',
    imageURI: 'test-image.png',
    isBTC: false,
    ...overrides,
  };
}

export function createMockRuneInfo(
  overrides: Partial<RuneData> = {},
): RuneData {
  return {
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
    ...overrides,
  };
}

export function createMockBorrowRange(
  overrides: Partial<BorrowRangeResponse['data']> = {},
): BorrowRangeResponse {
  return {
    success: true,
    data: {
      runeId: 'test-rune-id',
      minAmount: '1000000000',
      maxAmount: '10000000000',
      cached: false,
      updatedAt: new Date().toISOString(),
      ...overrides,
    },
  };
}

export function createMockBorrowQuote(
  overrides: Partial<LiquidiumBorrowQuoteResponse> = {},
): LiquidiumBorrowQuoteResponse {
  return {
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
    ...overrides,
  } as LiquidiumBorrowQuoteResponse;
}

export function createMockPopularRunes() {
  return [
    { token_id: '840010:907', token: 'LIQUIDIUM•TOKEN', icon: 'liquidium.png' },
    { token_id: '840000:45', token: 'MAGIC•INTERNET•MONEY', icon: 'magic.png' },
  ];
}

// Common mock setups
export function setupApiMocks() {
  const mocks = {
    fetchBorrowQuotesFromApi: jest.fn(),
    fetchBorrowRangesFromApi: jest.fn(),
    fetchPopularFromApi: jest.fn(),
    getPsbtFromApi: jest.fn(),
    confirmPsbtViaApi: jest.fn(),
    fetchRecommendedFeeRates: jest.fn(),
    fetchRunesFromApi: jest.fn(),
  };

  jest.doMock('@/lib/api', () => ({
    ...mocks,
    QUERY_KEYS: { BTC_FEE_RATES: 'btcFeeRates' },
  }));

  return mocks;
}

export function setupQueryMock(data = { fastestFee: 5, halfHourFee: 5 }) {
  const mockUseQuery = jest.fn().mockReturnValue({ data });
  jest.doMock('@tanstack/react-query', () => ({ useQuery: mockUseQuery }));
  return mockUseQuery;
}

export function setupStoreMock(storeData: Record<string, unknown> = {}) {
  const defaultStore = {
    runeSearchQuery: '',
    setRuneSearchQuery: jest.fn(),
  };

  const mockStore = jest.fn(() => ({ ...defaultStore, ...storeData }));
  jest.doMock('@/store/runesInfoStore', () => ({
    useRunesInfoStore: mockStore,
  }));
  return mockStore;
}

// Test scenario helpers
export function createAsyncTestScenario<T>(
  name: string,
  mockFn: jest.Mock,
  mockData: T | Error,
  expectedResult?: unknown,
) {
  return {
    name,
    setup: () => {
      if (mockData instanceof Error) {
        mockFn.mockRejectedValue(mockData);
      } else {
        mockFn.mockResolvedValue(mockData);
      }
    },
    expected: expectedResult,
  };
}

import { NextRequest } from 'next/server';

import { apiGet } from '@/lib/api/createApiClient';

// Request helpers
export function createTestRequest(
  url: string,
  method: 'GET' | 'POST' = 'GET',
): NextRequest {
  return new NextRequest(url, { method });
}

// Response validation helpers
export async function expectSuccessResponse(
  response: Response,
  expectedData?: unknown,
) {
  expect(response.status).toBe(200);
  const data = await response.json();
  expect(data.success).toBe(true);
  if (expectedData !== undefined) {
    expect(data.data).toEqual(expectedData);
  }
  return data;
}

export async function expectErrorResponse(
  response: Response,
  status: number,
  message?: string,
) {
  expect(response.status).toBe(status);
  const data = await response.json();
  expect(data.success).toBe(false);
  if (message) {
    expect(data.error.message).toBe(message);
  }
  return data;
}

// API test pattern helper
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function runApiTests<T extends (...args: any[]) => Promise<any>>(
  name: string,
  fn: T,
  endpoint: string,
  params: Parameters<T>,
  callArgs: Record<string, unknown> | undefined,
  mockResponse: unknown,
  throwsOnError = false,
) {
  describe(name, () => {
    it('fetches and returns data successfully', async () => {
      (apiGet as jest.Mock).mockResolvedValue(mockResponse);
      expect(await fn(...params)).toEqual(mockResponse);
      const expectedCall = callArgs ? [endpoint, callArgs] : [endpoint];
      expect(apiGet).toHaveBeenCalledWith(...expectedCall);
    });

    it(`${throwsOnError ? 'throws error' : 'returns null'} on API failures`, async () => {
      (apiGet as jest.Mock).mockRejectedValue(new Error('API Error'));
      if (throwsOnError) {
        await expect(fn(...params)).rejects.toThrow('API Error');
      } else {
        expect(await fn(...params)).toBeNull();
      }
    });
  });
}

// Mock factories
export const mockWalletProvider = (
  overrides: Record<string, unknown> = {},
) => ({
  requestAccounts: jest.fn().mockResolvedValue(['test-address']),
  signPsbt: jest.fn().mockResolvedValue('signed-psbt'),
  getPublicKey: jest.fn().mockResolvedValue('test-pubkey'),
  ...overrides,
});

export const mockQuoteData = (overrides: Record<string, unknown> = {}) => ({
  selectedOrders: [{ amount: '1000', price: 100 }],
  totalFormattedAmount: '1000',
  totalPrice: '0.001',
  ...overrides,
});

export const mockBorrowListing = (overrides: Record<string, unknown> = {}) => ({
  id: 'test-listing-id',
  principalAmountSat: 100000,
  interestRate: 0.1,
  duration: 30,
  ...overrides,
});

// Test data fixtures
export const testData = {
  runeData: {
    id: '840000:3',
    name: 'DOGGOTOTHEMOON',
    formatted_name: 'DOG•GO•TO•THE•MOON',
    decimals: 5,
    symbol: '🐕',
    current_supply: '10000000',
  },

  balanceData: { balance: 123456 },

  runeBalances: [
    { name: 'UNCOMMON•GOODS', balance: '1000000' },
    { name: 'RSIC•METAPROTOCOL', balance: '500000' },
  ],

  marketData: {
    price_in_sats: 1000,
    price_in_usd: 0.5,
    market_cap_in_btc: 21,
    market_cap_in_usd: 10500,
  },

  portfolioData: {
    balances: [{ name: 'TEST•RUNE', balance: '1000' }],
    runeInfos: {
      'TEST•RUNE': { id: 'test-id', name: 'TEST•RUNE', decimals: 0 },
    },
    marketData: { 'TEST•RUNE': { price_in_sats: 100, price_in_usd: 0.1 } },
  },

  priceHistory: {
    slug: 'TEST•RUNE',
    prices: [{ timestamp: 123456, price: 100 }],
    available: true,
  },

  popularRune: (overrides: Record<string, unknown> = {}) => ({
    token_id: '840010:907',
    token: 'TEST•RUNE',
    symbol: '🧪',
    icon: 'test-icon-uri',
    is_verified: true,
    ...overrides,
  }),

  runeSearchResult: (overrides: Record<string, unknown> = {}) => ({
    id: 'test-id',
    name: 'TEST•RUNE',
    imageURI: 'test-image-uri',
    ...overrides,
  }),

  runeActivityEvent: (
    type: 'MINT' | 'ETCH' | 'TRANSFER',
    userAddress: string,
    overrides: Record<string, unknown> = {},
  ) => ({
    txid: 'test-txid',
    timestamp: '2023-01-01T00:00:00Z',
    runestone_messages: [{ type, rune: 'BITCOIN' }],
    inputs: [
      { address: userAddress, output: 'txid:0', rune: '', rune_amount: '' },
    ],
    outputs: [
      { address: userAddress, vout: 0, rune: 'BITCOIN', rune_amount: '1000' },
    ],
    ...overrides,
  }),
};

// Mock management helpers
export const setupApiMocks = () => jest.clearAllMocks();

export const mockFetch = (response: unknown, status = 200) => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: status < 400,
    status,
    json: () => Promise.resolve(response),
    text: () => Promise.resolve(JSON.stringify(response)),
  } as Response);
};

export const mockLocalStorage = () => {
  const store: Record<string, string> = {};
  Object.defineProperty(window, 'localStorage', {
    value: {
      getItem: jest.fn((key: string) => store[key] || null),
      setItem: jest.fn((key: string, value: string) => {
        store[key] = value;
      }),
      removeItem: jest.fn((key: string) => {
        delete store[key];
      }),
      clear: jest.fn(() => {
        Object.keys(store).forEach((key) => delete store[key]);
      }),
    },
    writable: true,
  });
};

jest.mock('@/lib/serverUtils');
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        in: jest.fn(() => ({
          gt: jest.fn(),
        })),
      })),
    })),
  },
}));
jest.mock('@/lib/runesData');
jest.mock('@/lib/runeMarketData');

import { getRuneMarketData } from '@/lib/runeMarketData';
import { type RuneData, getRuneData } from '@/lib/runesData';
import { getOrdiscanClient } from '@/lib/serverUtils';
import { supabase } from '@/lib/supabase';
import { createTestRequest, testData } from '@/test-utils';
import type { RuneMarketInfo } from '@/types/ordiscan';
import { GET } from './route';

const mockGetOrdiscanClient = jest.mocked(getOrdiscanClient);
const mockSupabase = jest.mocked(supabase);
const mockGetRuneData = jest.mocked(getRuneData);
const mockGetRuneMarketData = jest.mocked(getRuneMarketData);

const createRequest = (address = 'bc1p123...test') =>
  createTestRequest(
    `http://localhost:3000/api/portfolio-data${address ? `?address=${address}` : ''}`,
  );

const setupMocks = (overrides: Record<string, unknown> = {}) => {
  const {
    balances = testData.runeBalances,
    runeInfos = [testData.runeData],
    runeInfosError = null,
    marketData = [{ rune_name: 'UNCOMMON•GOODS', ...testData.marketData }],
    marketError = null,
    missingRuneData = null,
    missingMarketData = null,
  } = overrides;

  const mockGetRunes = jest.fn().mockResolvedValue(balances);
  mockGetOrdiscanClient.mockReturnValue({
    address: { getRunes: mockGetRunes },
  } as unknown as ReturnType<typeof getOrdiscanClient>);

  const mockGt = jest.fn(() =>
    Promise.resolve({ data: marketData, error: marketError }),
  );
  const mockInRunes = jest.fn(() =>
    Promise.resolve({ data: runeInfos, error: runeInfosError }),
  );
  const mockInMarket = jest.fn(() => ({ gt: mockGt }));

  (mockSupabase.from as jest.Mock).mockImplementation((table: string) => ({
    select: jest.fn(() => ({
      in: table === 'runes' ? mockInRunes : mockInMarket,
    })),
  }));

  mockGetRuneData.mockResolvedValue(missingRuneData as RuneData | null);
  mockGetRuneMarketData.mockResolvedValue(
    missingMarketData as RuneMarketInfo | null,
  );

  return { mockGetRunes, mockInRunes, mockInMarket, mockGt };
};

describe('/api/portfolio-data', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return complete portfolio data successfully', async () => {
    setupMocks();
    const response = await GET(createRequest());
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.balances).toEqual(testData.runeBalances);
    expect(data.data.runeInfos).toBeDefined();
    expect(data.data.marketData).toBeDefined();
  });

  it.each([
    ['missing', undefined],
    ['empty', ''],
  ])('should return 400 when address is %s', async (_, address) => {
    const url =
      address === undefined
        ? 'http://localhost:3000/api/portfolio-data'
        : `http://localhost:3000/api/portfolio-data?address=${address}`;
    const request = createTestRequest(url);
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error.message).toBe('Invalid request parameters');
  });

  it.each([
    ['empty balances', []],
    ['null response', null],
  ])('should return empty portfolio when %s', async (_, balances) => {
    setupMocks({ balances });
    const response = await GET(createRequest());
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toEqual({
      balances: [],
      runeInfos: {},
      marketData: {},
    });
  });

  it.each([
    {
      type: 'rune info',
      setup: {
        balances: [{ name: 'MISSING•RUNE', balance: '1000' }],
        runeInfos: [],
        marketData: [],
        missingRuneData: testData.runeData,
      },
      expectedCall: [mockGetRuneData, 'MISSING•RUNE'],
    },
    {
      type: 'market data',
      setup: {
        balances: [{ name: 'MISSING•MARKET', balance: '1000' }],
        runeInfos: [testData.runeData],
        marketData: [],
        missingMarketData: testData.marketData,
      },
      expectedCall: [mockGetRuneMarketData, 'MISSING•MARKET'],
    },
  ])(
    'should fetch missing $type from external API',
    async ({ setup, expectedCall }) => {
      setupMocks(setup);
      const response = await GET(createRequest());
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(expectedCall[0]).toHaveBeenCalledWith(expectedCall[1]);
    },
  );

  it.each([
    [
      'rune info',
      { runeInfos: null, runeInfosError: { message: 'Database error' } },
    ],
    [
      'market data',
      { marketData: null, marketError: { message: 'Market data error' } },
    ],
  ])('should handle Supabase %s errors gracefully', async (_, overrides) => {
    setupMocks(overrides);
    const response = await GET(createRequest());
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.balances).toEqual(testData.runeBalances);
  });

  it('should handle Ordiscan API errors', async () => {
    const mockGetRunes = jest
      .fn()
      .mockRejectedValue(new Error('Ordiscan API error'));
    mockGetOrdiscanClient.mockReturnValue({
      address: { getRunes: mockGetRunes },
    } as unknown as ReturnType<typeof getOrdiscanClient>);

    const response = await GET(createRequest());
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error.message).toBe('Ordiscan API error');
  });

  it('should handle missing external API data gracefully', async () => {
    setupMocks({
      balances: [{ name: 'UNKNOWN•RUNE', balance: '1000' }],
      runeInfos: [],
      marketData: [],
      missingRuneData: null,
      missingMarketData: null,
    });

    const response = await GET(createRequest());
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.balances).toEqual([
      { name: 'UNKNOWN•RUNE', balance: '1000' },
    ]);
    expect(data.data.runeInfos).toEqual({});
    expect(data.data.marketData).toEqual({});
  });

  it('should handle batch operations correctly', async () => {
    const { mockInRunes, mockInMarket, mockGt } = setupMocks();
    const response = await GET(createRequest());

    expect(response.status).toBe(200);
    expect(mockInRunes).toHaveBeenCalledWith('name', [
      'UNCOMMON•GOODS',
      'RSIC•METAPROTOCOL',
    ]);
    expect(mockInMarket).toHaveBeenCalledWith('rune_name', [
      'UNCOMMON•GOODS',
      'RSIC•METAPROTOCOL',
    ]);
    expect(mockGt).toHaveBeenCalled();
  });
});

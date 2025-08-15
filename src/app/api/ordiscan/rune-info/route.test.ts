import { type RuneData, getRuneData } from '@/lib/runesData';
import { createTestRequest } from '@/test-utils';
import { GET } from '@/app/api/ordiscan/rune-info/route';

jest.mock('@/lib/runesData');
const mockGetRuneData = jest.mocked(getRuneData);

describe('rune info route', () => {
  beforeEach(() => jest.clearAllMocks());

  const mockRuneData: RuneData = {
    id: '840000:3',
    name: 'BTC',
    formatted_name: 'BTC',
    spacers: 0,
    number: 3,
    inscription_id: 'test-inscription-id',
    decimals: 8,
    mint_count_cap: null,
    symbol: '₿',
    etching_txid: 'test-etching-txid',
    amount_per_mint: null,
    timestamp_unix: '1713571767',
    premined_supply: '2100000000000000',
    mint_start_block: null,
    mint_end_block: null,
    current_supply: '2100000000000000',
    current_mint_count: 1,
  };

  const testCases = [
    {
      name: 'rune found',
      mockData: mockRuneData,
      url: 'https://example.com/api?name=BTC',
      expectedStatus: 200,
      expectedData: mockRuneData,
    },
    {
      name: 'rune not found',
      mockData: null,
      url: 'https://example.com/api?name=UNKNOWN',
      expectedStatus: 404,
      expectedData: null,
    },
  ];

  testCases.forEach(({ name, mockData, url, expectedStatus, expectedData }) => {
    it(`returns ${expectedStatus} when ${name}`, async () => {
      mockGetRuneData.mockResolvedValue(mockData);
      const response = await GET(createTestRequest(url));

      expect(mockGetRuneData).toHaveBeenCalledWith(
        name === 'rune found' ? 'BTC' : 'UNKNOWN',
      );
      expect(response.status).toBe(expectedStatus);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data).toEqual(expectedData);
    });
  });
});

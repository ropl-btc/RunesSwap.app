import { GET } from '@/server/api/sats-terminal/search/route';
import {
  createTestRequest,
  expectErrorResponse,
  expectSuccessResponse,
  testData,
} from '@/test-utils';

var mockSearch = jest.fn();
var mockRuneGetInfo = jest.fn();
var mockLimit = jest.fn();
var mockOr = jest.fn();
var mockSelect = jest.fn();
var mockFrom = jest.fn();

jest.mock('@/lib/serverUtils', () => ({
  getSatsTerminalClient: jest.fn(() => ({ search: mockSearch })),
  getOrdiscanClient: jest.fn(() => ({
    rune: {
      getInfo: mockRuneGetInfo,
    },
  })),
}));

jest.mock('@/lib/supabase', () => ({
  hasSupabase: false,
  supabase: {
    from: mockFrom,
  },
}));

describe('/api/sats-terminal/search', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockFrom.mockReturnValue({
      select: mockSelect,
    });
    mockSelect.mockReturnValue({
      or: mockOr,
    });
    mockOr.mockReturnValue({
      limit: mockLimit,
    });
    mockLimit.mockResolvedValue({ data: [], error: null });
  });

  const testCases = [
    {
      name: 'successful search',
      mockData: [testData.runeSearchResult()],
      url: 'http://localhost:3000/api/sats-terminal/search?query=test&sell=false',
      expectSuccess: true,
    },
    {
      name: 'missing query parameter',
      url: 'http://localhost:3000/api/sats-terminal/search',
      expectError: { status: 400, message: 'Invalid request parameters' },
    },
  ];

  testCases.forEach(({ name, mockData, url, expectSuccess, expectError }) => {
    it(`should handle ${name}`, async () => {
      if (mockData) mockSearch.mockResolvedValue(mockData);

      const response = await GET(createTestRequest(url));

      if (expectSuccess) {
        await expectSuccessResponse(response, mockData);
      } else if (expectError) {
        await expectErrorResponse(response, expectError.status, expectError.message);
      }
    });
  });

  it('should generate stable IDs for items without token_id or id', async () => {
    const mockData = [
      { token: 'STABLE•RUNE', name: 'Stable Rune', icon: 'stable-icon.png' },
      { name: 'Another Rune', imageURI: 'another-icon.png' },
    ];
    mockSearch.mockResolvedValue(mockData);

    const url = 'http://localhost:3000/api/sats-terminal/search?query=stable&sell=false';
    const request = createTestRequest(url);

    const response = await GET(request);
    const data = await expectSuccessResponse(response);

    expect(data.data).toHaveLength(2);
    expect(data.data[0].id).toMatch(/^search_[a-f0-9]{8}$/);
    expect(data.data[1].id).toMatch(/^search_[a-f0-9]{8}$/);
    expect(data.data[0].id).not.toBe(data.data[1].id);

    // Verify ID stability
    const secondResponse = await GET(request);
    const secondData = await expectSuccessResponse(secondResponse);
    expect(secondData.data[0].id).toBe(data.data[0].id);
    expect(secondData.data[1].id).toBe(data.data[1].id);
  });

  it('should support SDK responses wrapped in a tokens array', async () => {
    mockSearch.mockResolvedValue({
      tokens: [
        {
          token_id: '840000:3',
          token: 'TEST•RUNE',
          icon: 'test-image-uri',
        },
      ],
    });

    const response = await GET(
      createTestRequest('http://localhost:3000/api/sats-terminal/search?query=test&sell=false'),
    );

    const data = await expectSuccessResponse(response);
    expect(data.data).toHaveLength(1);
    expect(data.data[0].name).toBe('TEST•RUNE');
  });

  it('should fall back to Ordiscan exact search when SatsTerminal is unavailable', async () => {
    mockSearch.mockRejectedValue(new Error('Service Unavailable'));
    mockRuneGetInfo.mockResolvedValue({
      id: '840000:3',
      name: 'DOGGOTOTHEMOON',
      formatted_name: 'DOG•GO•TO•THE•MOON',
    });

    const response = await GET(
      createTestRequest('http://localhost:3000/api/sats-terminal/search?query=DOG•GO•TO•THE•MOON'),
    );

    const data = await expectSuccessResponse(response);
    expect(data.data).toEqual([
      {
        id: '840000:3',
        name: 'DOG•GO•TO•THE•MOON',
        imageURI:
          'https://icon.unisat.io/icon/runes/DOG%E2%80%A2GO%E2%80%A2TO%E2%80%A2THE%E2%80%A2MOON',
      },
    ]);
  });
});

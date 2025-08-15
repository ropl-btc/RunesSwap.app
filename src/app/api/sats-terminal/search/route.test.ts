import {
  createTestRequest,
  expectErrorResponse,
  expectSuccessResponse,
  testData,
} from '@/test-utils';
import { GET } from '@/app/api/sats-terminal/search/route';

const mockSearch = jest.fn();
jest.mock('@/lib/serverUtils', () => ({
  getSatsTerminalClient: jest.fn(() => ({ search: mockSearch })),
}));

describe('/api/sats-terminal/search', () => {
  beforeEach(() => jest.clearAllMocks());

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
        await expectErrorResponse(
          response,
          expectError.status,
          expectError.message,
        );
      }
    });
  });

  it('should generate stable IDs for items without token_id or id', async () => {
    const mockData = [
      { token: 'STABLE•RUNE', name: 'Stable Rune', icon: 'stable-icon.png' },
      { name: 'Another Rune', imageURI: 'another-icon.png' },
    ];
    mockSearch.mockResolvedValue(mockData);

    const url =
      'http://localhost:3000/api/sats-terminal/search?query=stable&sell=false';
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
});

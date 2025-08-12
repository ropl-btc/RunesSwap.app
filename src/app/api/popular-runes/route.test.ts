import * as popularRunes from '@/lib/popularRunes';
import { GET } from './route';

// Mock the popular runes module
jest.mock('@/lib/popularRunes');
const mockGetPopularRunes = jest.fn();

const mockedPopularRunes = jest.mocked(popularRunes);
mockedPopularRunes.getPopularRunes = mockGetPopularRunes;

describe('/api/popular-runes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockPopularRunesData = [
    {
      token_id: '840010:907',
      token: 'LIQUIDIUM•TOKEN',
      symbol: '🫠',
      icon: 'https://icon.unisat.io/icon/runes/LIQUIDIUM•TOKEN',
      is_verified: true,
    },
    {
      token_id: '840000:45',
      token: 'MAGIC•INTERNET•MONEY',
      symbol: '🧙',
      icon: 'https://icon.unisat.io/icon/runes/MAGIC•INTERNET•MONEY',
      is_verified: true,
    },
  ];

  describe('GET /api/popular-runes', () => {
    it('should return hardcoded popular runes list successfully', async () => {
      mockGetPopularRunes.mockReturnValue(mockPopularRunesData);

      const response = await GET();

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data).toEqual({
        success: true,
        data: mockPopularRunesData,
      });

      expect(mockGetPopularRunes).toHaveBeenCalledTimes(1);
    });

    it('should handle errors gracefully', async () => {
      mockGetPopularRunes.mockImplementation(() => {
        throw new Error('Failed to get popular runes');
      });

      const response = await GET();

      expect(response.status).toBe(500);
      const data = await response.json();

      expect(data.success).toBe(false);
      expect(data.error.message).toBe('Failed to get popular runes');
    });
  });
});

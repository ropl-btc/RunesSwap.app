import { get } from '../fetchWrapper';
import { fetchRuneInfoFromApi } from './ordiscan';

// Mock the fetchWrapper module
jest.mock('../fetchWrapper', () => ({
  get: jest.fn(),
  FetchError: class FetchError extends Error {
    constructor(
      message: string,
      public status: number,
      public statusText: string,
      public url: string,
    ) {
      super(message);
      this.name = 'FetchError';
    }
  },
}));

beforeEach(() => {
  jest.clearAllMocks();
});

describe('fetchRuneInfoFromApi', () => {
  it('fetches and returns rune info', async () => {
    (get as jest.Mock).mockResolvedValue({
      data: { success: true, data: { name: 'BTC' } },
      status: 200,
      statusText: 'OK',
      headers: new Headers(),
    });

    const result = await fetchRuneInfoFromApi('BTC');
    expect(get).toHaveBeenCalledWith('/api/ordiscan/rune-info?name=BTC');
    expect(result).toEqual({ name: 'BTC' });
  });

  it('throws on error response', async () => {
    const { FetchError } = jest.requireMock('../fetchWrapper');
    (get as jest.Mock).mockRejectedValue(
      new FetchError(
        'HTTP 500: oops',
        500,
        'oops',
        '/api/ordiscan/rune-info?name=FAIL',
      ),
    );

    await expect(fetchRuneInfoFromApi('FAIL')).rejects.toThrow(
      'HTTP 500: oops',
    );
  });
});

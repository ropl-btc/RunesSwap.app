import { expectErrorResponse, expectSuccessResponse } from '@/test-utils';

const mockFetchExternal = jest.fn();
jest.mock('@/lib/fetchWrapper', () => ({
  fetchExternal: (...args: unknown[]) => mockFetchExternal(...args),
}));

beforeEach(() => {
  jest.resetModules();
});

it('shares concurrent requests and caches the BTC/USD price for one minute', async () => {
  mockFetchExternal.mockResolvedValue({ data: { USD: 77446 } });
  const { GET } = await import('./route');
  const responses = await Promise.all([GET(), GET()]);
  for (const response of responses) await expectSuccessResponse(response, { usd: 77446 });
  await expectSuccessResponse(await GET(), { usd: 77446 });
  expect(mockFetchExternal).toHaveBeenCalledTimes(1);
  expect(mockFetchExternal).toHaveBeenCalledWith(
    'https://mempool.space/api/v1/prices',
    expect.objectContaining({ timeout: 10000, retries: 3 }),
  );
});

it.each([undefined, 0, -1, Infinity, '77446'])('rejects an invalid price: %s', async (USD) => {
  mockFetchExternal.mockResolvedValue({ data: { USD } });
  const { GET } = await import('./route');
  await expectErrorResponse(await GET(), 500, 'Invalid response format from mempool.space');
});

it('keeps the last known price during an upstream outage and retries later', async () => {
  const clock = jest.spyOn(Date, 'now').mockReturnValue(1000);
  mockFetchExternal.mockResolvedValueOnce({ data: { USD: 77446 } });
  const { GET } = await import('./route');
  await GET();
  clock.mockReturnValue(62000);
  mockFetchExternal.mockRejectedValueOnce(new Error('Service unavailable'));
  await expectSuccessResponse(await GET(), { usd: 77446 });
  mockFetchExternal.mockResolvedValueOnce({ data: { USD: 78000 } });
  await expectSuccessResponse(await GET(), { usd: 78000 });
});

const appFetch = jest.fn();
jest.mock(
  '@tanstack/react-start/server-entry',
  () => ({
    __esModule: true,
    default: { fetch: (request: Request) => appFetch(request) },
    createServerEntry: (entry: unknown) => entry,
  }),
  { virtual: true },
);

import server from './server';

it('preserves the canonical host redirect, path, and rune query', async () => {
  const response = await server.fetch(new Request('https://runesswap.app/swap?rune=DOG'));
  expect(response.status).toBe(308);
  expect(response.headers.get('location')).toBe('https://www.runesswap.app/swap?rune=DOG');
  expect(appFetch).not.toHaveBeenCalled();
});

it('passes requests on www and preview hosts through without changing their body', async () => {
  appFetch.mockResolvedValue(Response.json({ success: true }));
  const request = new Request('https://www.runesswap.app/api/sats-terminal/quote', {
    method: 'POST',
    body: '{"btcAmount":"0.001"}',
  });
  expect((await server.fetch(request)).status).toBe(200);
  expect(appFetch).toHaveBeenCalledWith(request);
  expect(await request.text()).toBe('{"btcAmount":"0.001"}');
});

import { SatsTerminal } from '@satsterminal-sdk/swaps';

it('uses native fetch once with the SDK authentication and quote payload intact', async () => {
  const quote = { totalPrice: '0.001', selectedOrders: [] };
  jest.mocked(fetch).mockResolvedValueOnce(Response.json(quote));
  const terminal = new SatsTerminal({ apiKey: 'test-key' });
  const result = await terminal.fetchQuote({
    btcAmount: '0.001',
    runeName: 'DOG•GO•TO•THE•MOON',
    address: 'test-address',
    sell: false,
  });
  expect(result).toEqual(quote);
  expect(fetch).toHaveBeenCalledTimes(1);
  const [url, options] = jest.mocked(fetch).mock.calls[0]!;
  expect(String(url)).toMatch(/^https:\/\/api\.satsterminal\.com\//);
  expect(options?.method).toBe('POST');
  expect(options?.headers).toEqual(expect.objectContaining({ 'x-api-key': 'test-key' }));
  expect(JSON.parse(String(options?.body))).toEqual(
    expect.objectContaining({
      btcAmount: '0.001',
      runeName: 'DOG•GO•TO•THE•MOON',
      address: 'test-address',
      sell: false,
    }),
  );
});

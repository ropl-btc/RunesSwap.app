import { act, renderHook } from '@testing-library/react';
import { QuoteResponse } from 'satsterminal-sdk';
import { initialSwapProcessState } from '@/components/swap/SwapProcessManager';
import { BTC_ASSET } from '@/types/common';
import useSwapExecution from '@/hooks/useSwapExecution';

jest.mock('@/lib/api', () => ({
  getPsbtFromApi: jest.fn(),
  confirmPsbtViaApi: jest.fn(),
}));

jest.mock('@/hooks/useFeeRates', () => ({
  __esModule: true,
  default: jest.fn(),
}));

const { getPsbtFromApi, confirmPsbtViaApi } = jest.requireMock('@/lib/api');
const useFeeRates = jest.requireMock('@/hooks/useFeeRates')
  .default as jest.Mock;

type HookProps = Parameters<typeof useSwapExecution>[0];

const createBaseProps = (overrides: Partial<HookProps> = {}): HookProps => ({
  connected: true,
  address: 'addr',
  paymentAddress: 'paddr',
  publicKey: 'pub',
  paymentPublicKey: 'ppub',
  signPsbt: jest.fn().mockResolvedValue({ signedPsbtBase64: 'signed' }),
  assetIn: BTC_ASSET,
  assetOut: { id: 'RUNE', name: 'RUNE', imageURI: 'test-image-uri' },
  quote: {
    selectedOrders: [
      { id: '1', market: 'RUNE/BTC', price: 1, formattedAmount: 1 },
    ],
  } as unknown as QuoteResponse,
  quoteTimestamp: Date.now(),
  swapState: initialSwapProcessState,
  dispatchSwap: jest.fn(),
  isThrottledRef: { current: false },
  quoteKeyRef: { current: '' },
  ...overrides,
});

beforeEach(() => {
  jest.clearAllMocks();
  useFeeRates.mockReturnValue({
    data: { fastestFee: 5, halfHourFee: 5 },
  });
});

describe('useSwapExecution', () => {
  const swapScenarios = [
    {
      name: 'successful swap',
      setup: () => {
        (getPsbtFromApi as jest.Mock).mockResolvedValue({
          psbtBase64: 'psbt',
          swapId: 'swap123',
        });
        (confirmPsbtViaApi as jest.Mock).mockResolvedValue({ txid: 'tx123' });
      },
      props: {},
      expectedActions: [{ type: 'SWAP_SUCCESS', txId: 'tx123' }],
    },
    {
      name: 'quote expiry',
      setup: () => {},
      props: { quoteTimestamp: Date.now() - 61000 },
      expectedActions: [
        { type: 'QUOTE_EXPIRED' },
        {
          type: 'SET_GENERIC_ERROR',
          error: 'Quote expired. Please fetch a new one.',
        },
      ],
    },
  ];

  test.each(swapScenarios)(
    'handles $name',
    async ({ setup, props, expectedActions }) => {
      setup();
      const hookProps = createBaseProps(props);
      const { result } = renderHook(() => useSwapExecution(hookProps));

      await act(async () => result.current.handleSwap());

      expectedActions.forEach((action) => {
        expect(hookProps.dispatchSwap).toHaveBeenCalledWith(action);
      });
    },
  );

  it('retries with higher fee rate on fee error', async () => {
    let call = 0;
    (getPsbtFromApi as jest.Mock).mockImplementation(() => {
      call += 1;
      return call === 1
        ? Promise.reject(new Error('Network fee rate not high enough'))
        : Promise.resolve({ psbtBase64: 'psbt2', swapId: 'swap2' });
    });
    (confirmPsbtViaApi as jest.Mock).mockResolvedValue({ txid: 'tx456' });

    const props = createBaseProps();
    const { result } = renderHook(() => useSwapExecution(props));

    await act(async () => result.current.handleSwap());

    expect(getPsbtFromApi).toHaveBeenCalledTimes(2);
    expect(props.dispatchSwap).toHaveBeenCalledWith({
      type: 'SET_GENERIC_ERROR',
      error:
        'Fee rate too low, automatically retrying with a higher fee rate...',
    });
    expect(props.dispatchSwap).toHaveBeenCalledWith({
      type: 'SWAP_SUCCESS',
      txId: 'tx456',
    });
  });
});

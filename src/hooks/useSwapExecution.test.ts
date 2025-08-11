import { act, renderHook } from '@testing-library/react';
import { QuoteResponse } from 'satsterminal-sdk';
import { initialSwapProcessState } from '@/components/swap/SwapProcessManager';
import { BTC_ASSET } from '@/types/common';
import useSwapExecution from './useSwapExecution';

jest.mock('@/lib/api', () => ({
  getPsbtFromApi: jest.fn(),
  confirmPsbtViaApi: jest.fn(),
  fetchRecommendedFeeRates: jest.fn(),
  QUERY_KEYS: { BTC_FEE_RATES: 'btcFeeRates' },
}));

jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(),
}));

const { getPsbtFromApi, confirmPsbtViaApi } = jest.requireMock('@/lib/api');
const { useQuery } = jest.requireMock('@tanstack/react-query');

// DOM environment is handled by jest-environment-jsdom

type HookProps = Parameters<typeof useSwapExecution>[0];

function baseProps(overrides: Partial<HookProps> = {}): HookProps {
  return {
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
        {
          id: '1',
          market: 'RUNE/BTC',
          price: 1,
          formattedAmount: 1,
        },
      ],
    } as unknown as QuoteResponse,
    quoteTimestamp: Date.now(),
    swapState: initialSwapProcessState,
    dispatchSwap: jest.fn(),
    isThrottledRef: { current: false },
    quoteKeyRef: { current: '' },
    ...overrides,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  (useQuery as jest.Mock).mockReturnValue({
    data: { fastestFee: 5, halfHourFee: 5 },
  });
});

describe('useSwapExecution', () => {
  it('dispatches SWAP_SUCCESS on successful swap', async () => {
    (getPsbtFromApi as jest.Mock).mockResolvedValue({
      psbtBase64: 'psbt',
      swapId: 'swap123',
    });
    (confirmPsbtViaApi as jest.Mock).mockResolvedValue({ txid: 'tx123' });

    const props = baseProps();
    const { result } = renderHook(() => useSwapExecution(props));

    await act(async () => {
      await result.current.handleSwap();
    });

    expect(props.dispatchSwap).toHaveBeenCalledWith({
      type: 'SWAP_SUCCESS',
      txId: 'tx123',
    });
  });

  it('handles quote expiry', async () => {
    const props = baseProps({ quoteTimestamp: Date.now() - 61000 });
    const { result } = renderHook(() => useSwapExecution(props));

    await act(async () => {
      await result.current.handleSwap();
    });

    expect(props.dispatchSwap).toHaveBeenCalledWith({ type: 'QUOTE_EXPIRED' });
    expect(props.dispatchSwap).toHaveBeenCalledWith({
      type: 'SET_GENERIC_ERROR',
      error: 'Quote expired. Please fetch a new one.',
    });
    expect(getPsbtFromApi).not.toHaveBeenCalled();
  });

  it('retries with higher fee rate on fee error', async () => {
    let call = 0;
    (getPsbtFromApi as jest.Mock).mockImplementation(() => {
      call += 1;
      if (call === 1) {
        return Promise.reject(new Error('Network fee rate not high enough'));
      }
      return Promise.resolve({ psbtBase64: 'psbt2', swapId: 'swap2' });
    });
    (confirmPsbtViaApi as jest.Mock).mockResolvedValue({ txid: 'tx456' });

    const props = baseProps();
    const { result } = renderHook(() => useSwapExecution(props));

    await act(async () => {
      await result.current.handleSwap();
    });

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

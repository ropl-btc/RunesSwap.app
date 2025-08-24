import { renderHook } from '@testing-library/react';
import { useRuneInfo } from '@/hooks/useRuneInfo';
import { useRuneMarketData } from '@/hooks/useRuneMarketData';

jest.mock('@/hooks/useRuneDataQuery', () => ({ useRuneDataQuery: jest.fn() }));
jest.mock('@/lib/api', () => ({
  fetchRuneInfoFromApi: jest.fn(),
  fetchRuneMarketFromApi: jest.fn(),
}));

const { useRuneDataQuery } = jest.requireMock('@/hooks/useRuneDataQuery');
const { fetchRuneInfoFromApi, fetchRuneMarketFromApi } =
  jest.requireMock('@/lib/api');

describe('rune data hooks', () => {
  beforeEach(() => {
    (useRuneDataQuery as jest.Mock).mockReturnValue({ data: 'mock' });
  });

  it('useRuneInfo delegates to useRuneDataQuery', () => {
    const { result } = renderHook(() => useRuneInfo('TEST'));
    expect(useRuneDataQuery).toHaveBeenCalledWith(
      'runeInfo',
      'TEST',
      fetchRuneInfoFromApi,
      { staleTime: Infinity, retry: 2 },
    );
    expect(result.current.data).toBe('mock');
  });

  it('useRuneMarketData delegates to useRuneDataQuery', () => {
    const { result } = renderHook(() => useRuneMarketData('TEST'));
    expect(useRuneDataQuery).toHaveBeenCalledWith(
      'runeMarket',
      'TEST',
      fetchRuneMarketFromApi,
      { staleTime: 60000, retry: 2 },
    );
    expect(result.current.data).toBe('mock');
  });
});

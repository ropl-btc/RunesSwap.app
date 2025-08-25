import { renderHook } from '@testing-library/react';
import { useRuneDataQuery } from '@/hooks/useRuneDataQuery';

jest.mock('@/hooks/useApiQuery', () => ({ useApiQuery: jest.fn() }));

const { useApiQuery } = jest.requireMock('@/hooks/useApiQuery');

describe('useRuneDataQuery', () => {
  it('delegates to useApiQuery with provided options', () => {
    const fetcher = jest.fn();
    (useApiQuery as jest.Mock).mockReturnValue({ data: 'mock' });

    const { result } = renderHook(() =>
      useRuneDataQuery('testKey', 'TEST', fetcher, {
        staleTime: 5,
        retry: 1,
      }),
    );

    expect(useApiQuery).toHaveBeenCalledWith('testKey', 'TEST', fetcher, 5, {
      enabled: true,
      retry: 1,
    });
    expect(result.current.data).toBe('mock');
  });
});

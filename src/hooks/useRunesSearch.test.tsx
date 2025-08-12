import { act, renderHook } from '@testing-library/react';
import useRunesSearch from './useRunesSearch';

jest.mock('@/lib/api', () => ({
  fetchRunesFromApi: jest.fn(),
  fetchPopularFromApi: jest.fn(),
}));

jest.mock('@/store/runesInfoStore', () => ({
  useRunesInfoStore: jest.fn(() => ({
    runeSearchQuery: '',
    setRuneSearchQuery: jest.fn(),
  })),
}));

// DOM environment is handled by jest-environment-jsdom

type HookProps = Parameters<typeof useRunesSearch>[0];

describe('useRunesSearch', () => {
  it('updates when props change', async () => {
    const cachedA = [
      {
        token_id: '123:1',
        token: 'AAA',
        icon: 'a.png',
      },
    ];
    const cachedB = [
      {
        token_id: '123:2',
        token: 'BBB',
        icon: 'b.png',
      },
    ];

    const initialProps: HookProps = { cachedPopularRunes: cachedA };
    const { result, rerender } = renderHook(
      (props: HookProps = {}) => useRunesSearch(props),
      { initialProps },
    );

    await act(async () => {
      await Promise.resolve();
    });
    expect(result.current.availableRunes.map((r) => r.id)).toEqual(['123:1']);

    rerender({ cachedPopularRunes: cachedB });
    await act(async () => {
      await Promise.resolve();
    });
    expect(result.current.availableRunes.map((r) => r.id)).toEqual(['123:2']);
  });
});

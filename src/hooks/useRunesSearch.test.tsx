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
        rune: 'AAA',
        etching: { runeName: 'AAA' },
        icon_content_url_data: 'a.png',
      },
    ];
    const cachedB = [
      {
        rune: 'BBB',
        etching: { runeName: 'BBB' },
        icon_content_url_data: 'b.png',
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
    expect(result.current.availableRunes.map((r) => r.id)).toEqual([
      'liquidiumtoken',
      'AAA',
    ]);

    rerender({ cachedPopularRunes: cachedB });
    await act(async () => {
      await Promise.resolve();
    });
    expect(result.current.availableRunes.map((r) => r.id)).toEqual([
      'liquidiumtoken',
      'BBB',
    ]);
  });
});

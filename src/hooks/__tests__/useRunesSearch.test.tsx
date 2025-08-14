import { act, renderHook } from '@testing-library/react';
import useRunesSearch from '../useRunesSearch';

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

type HookProps = Parameters<typeof useRunesSearch>[0];

const createMockRunes = (suffix: string) => [
  {
    token_id: `123:${suffix}`,
    token: `TOKEN_${suffix}`,
    icon: `${suffix}.png`,
  },
];

describe('useRunesSearch', () => {
  it('updates when props change', async () => {
    const scenarios = [
      {
        props: { cachedPopularRunes: createMockRunes('1') },
        expectedId: '123:1',
      },
      {
        props: { cachedPopularRunes: createMockRunes('2') },
        expectedId: '123:2',
      },
    ];

    const { result, rerender } = renderHook(
      (props: HookProps = {}) => useRunesSearch(props),
      { initialProps: scenarios[0]?.props },
    );

    for (const { props, expectedId } of scenarios) {
      rerender(props);
      await act(async () => Promise.resolve());
      expect(result.current.availableRunes.map((r) => r.id)).toEqual([
        expectedId,
      ]);
    }
  });
});

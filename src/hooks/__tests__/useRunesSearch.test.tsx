import { act, renderHook } from '@testing-library/react';
import useRunesSearch from '@/hooks/useRunesSearch';

jest.mock('@/lib/api', () => ({
  fetchRunesFromApi: jest.fn(),
}));

jest.mock('@/store/runesInfoStore', () => ({
  useRunesInfoStore: jest.fn(() => ({
    runeSearchQuery: '',
    setRuneSearchQuery: jest.fn(),
  })),
}));

const createMockRunes = (suffix: string) => [
  {
    token_id: `123:${suffix}`,
    token: `TOKEN_${suffix}`,
    icon: `${suffix}.png`,
  },
];

describe('useRunesSearch', () => {
  it('updates when cached popular runes change', async () => {
    const runes1 = createMockRunes('1').map((r) => ({
      id: r.token_id,
      name: r.token,
      imageURI: r.icon,
    }));
    const runes2 = createMockRunes('2').map((r) => ({
      id: r.token_id,
      name: r.token,
      imageURI: r.icon,
    }));

    type Props = { cachedPopularRunes: Record<string, unknown>[] };
    const { result, rerender } = renderHook(
      (props: Props) => useRunesSearch(props),
      { initialProps: { cachedPopularRunes: runes1 } },
    );
    expect(result.current.availableRunes.map((r) => r.id)).toEqual(['123:1']);

    rerender({ cachedPopularRunes: runes2 });
    await act(async () => Promise.resolve());
    expect(result.current.availableRunes.map((r) => r.id)).toEqual(['123:2']);
  });
});

import { act, renderHook } from '@testing-library/react';
import useRunesSearch from '@/hooks/useRunesSearch';
import usePopularRunes from '@/hooks/usePopularRunes';

jest.mock('@/lib/api', () => ({
  fetchRunesFromApi: jest.fn(),
}));

jest.mock('@/hooks/usePopularRunes', () => jest.fn());

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
  const mockUsePopularRunes = usePopularRunes as jest.Mock;

  beforeEach(() => {
    mockUsePopularRunes.mockReturnValue({
      popularRunes: [],
      isLoading: false,
      error: null,
    });
  });

  it('updates when hook data changes', async () => {
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

    mockUsePopularRunes.mockReturnValueOnce({
      popularRunes: runes1,
      isLoading: false,
      error: null,
    });

    const { result, rerender } = renderHook(() => useRunesSearch());
    expect(result.current.availableRunes.map((r) => r.id)).toEqual(['123:1']);

    mockUsePopularRunes.mockReturnValueOnce({
      popularRunes: runes2,
      isLoading: false,
      error: null,
    });
    rerender();
    await act(async () => Promise.resolve());
    expect(result.current.availableRunes.map((r) => r.id)).toEqual(['123:2']);
  });
});

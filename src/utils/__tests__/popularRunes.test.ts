import {
  mapPopularItems,
  mapPopularToAsset,
  mapPopularToRune,
} from '@/utils/popularRunes';

describe('popular runes mappers', () => {
  const items = [
    {
      token_id: '1',
      token: 'AAA',
      symbol: '',
      icon: 'url1',
      is_verified: true,
    },
    { id: '2', name: 'BBB', imageURI: 'url2' },
  ];

  it('maps items using a transformer', () => {
    const result = mapPopularItems(items, ({ id, name }) => ({
      value: id,
      label: name,
    }));
    expect(result).toEqual([
      { value: '1', label: 'AAA' },
      { value: '2', label: 'BBB' },
    ]);
  });

  it('maps items to Asset', () => {
    expect(mapPopularToAsset(items)).toEqual([
      { id: '1', name: 'AAA', imageURI: 'url1', isBTC: false },
      { id: '2', name: 'BBB', imageURI: 'url2', isBTC: false },
    ]);
  });

  it('maps items to Rune', () => {
    expect(mapPopularToRune(items)).toEqual([
      { id: '1', name: 'AAA', imageURI: 'url1' },
      { id: '2', name: 'BBB', imageURI: 'url2' },
    ]);
  });
});

import { getCachedPopularRunes } from './popularRunesCache';

type SupabaseMock = {
  from: jest.Mock;
  select: jest.Mock;
  order: jest.Mock;
  limit: jest.Mock;
  maybeSingle: jest.Mock;
};

jest.mock('./supabase', () => {
  const mock = {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    maybeSingle: jest.fn().mockResolvedValue({ data: null }),
  } as unknown as SupabaseMock;
  return { supabase: mock };
});

describe('getCachedPopularRunes', () => {
  it('returns fallback data when cache is empty', async () => {
    const result = await getCachedPopularRunes();
    expect(result.data).toBeDefined();
    expect(Array.isArray(result.data)).toBe(true);
    expect(result.isExpired).toBe(true);
  });
});

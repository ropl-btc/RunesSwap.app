import { getLiquidiumJwt } from '@/lib/liquidiumAuth';
import { supabase } from '@/lib/supabase';

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
  },
}));

describe('getLiquidiumJwt', () => {
  // Cast the imported supabase client to the mocked shape for tests
  type SupabaseMock = {
    from: jest.Mock;
    select: jest.Mock;
    eq: jest.Mock;
    limit: jest.Mock;
  };
  const mocked = supabase as unknown as SupabaseMock;
  const { from, select, eq, limit } = mocked;

  beforeEach(() => {
    jest.resetAllMocks();
    from.mockReturnValue(supabase);
    select.mockReturnValue(supabase);
    eq.mockReturnValue(supabase);
    limit.mockReturnValue(Promise.resolve({ data: [], error: null }));
  });

  it('returns 500 on DB error', async () => {
    limit.mockResolvedValueOnce({ data: null, error: { message: 'db fail' } });
    const res = await getLiquidiumJwt('addr');
    // @ts-expect-error - NextResponse has .status at runtime in tests
    expect(res.status).toBe(500);
  });

  it('returns 401 when missing token', async () => {
    limit.mockResolvedValueOnce({ data: [], error: null });
    const res = await getLiquidiumJwt('addr');
    // @ts-expect-error - NextResponse has .status at runtime in tests
    expect(res.status).toBe(401);
  });

  it('returns 401 when token expired', async () => {
    const past = new Date(Date.now() - 1000).toISOString();
    limit.mockResolvedValueOnce({
      data: [{ jwt: 'x', expires_at: past }],
      error: null,
    });
    const res = await getLiquidiumJwt('addr');
    // @ts-expect-error - NextResponse has .status at runtime in tests
    expect(res.status).toBe(401);
  });

  it('returns jwt string on success', async () => {
    const future = new Date(Date.now() + 60_000).toISOString();
    limit.mockResolvedValueOnce({
      data: [{ jwt: 'jwt123', expires_at: future }],
      error: null,
    });
    const res = await getLiquidiumJwt('addr');
    expect(res).toBe('jwt123');
  });
});

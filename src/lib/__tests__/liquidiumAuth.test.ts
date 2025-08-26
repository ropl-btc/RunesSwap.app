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
  const from = supabase.from as jest.Mock;
  const select = supabase.select as jest.Mock;
  const eq = supabase.eq as jest.Mock;
  const limit = supabase.limit as jest.Mock;

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

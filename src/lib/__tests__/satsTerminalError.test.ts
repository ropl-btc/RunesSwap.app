import { handleSatsTerminalError } from '@/lib/satsTerminalError';

describe('handleSatsTerminalError', () => {
  it('maps quote expired to 410', () => {
    const res = handleSatsTerminalError(new Error('Quote expired for id')); // message contains
    expect(res).toBeTruthy();
    // @ts-expect-error - NextResponse has .status at runtime in tests
    expect(res.status).toBe(410);
  });

  it('maps rate limit to 429', () => {
    const res = handleSatsTerminalError(new Error('Rate limit exceeded'));
    expect(res).toBeTruthy();
    // @ts-expect-error - NextResponse has .status at runtime in tests
    expect(res.status).toBe(429);
  });

  it('maps unexpected token to 503', () => {
    const res = handleSatsTerminalError(
      new Error('Unexpected token < in JSON'),
    );
    expect(res).toBeTruthy();
    // @ts-expect-error - NextResponse has .status at runtime in tests
    expect(res.status).toBe(503);
  });

  it('returns null for unknown errors', () => {
    const res = handleSatsTerminalError(new Error('Other'));
    expect(res).toBeNull();
  });
});

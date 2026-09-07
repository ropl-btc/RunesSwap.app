import { enforceRateLimit } from '@/lib/rateLimit';

it('uses the trusted Cloudflare IP even when forwarded headers change', () => {
  const options = { key: 'cloudflare-ip-test', limit: 1, windowMs: 60_000 };
  const request = (forwarded: string, ip = '192.0.2.1') =>
    new Request('https://example.com', {
      headers: { 'cf-connecting-ip': ip, 'x-forwarded-for': forwarded },
    });
  expect(enforceRateLimit(request('198.51.100.1'), options)).toBeNull();
  expect(enforceRateLimit(request('198.51.100.2'), options)?.status).toBe(429);
  expect(enforceRateLimit(request('198.51.100.1', '192.0.2.2'), options)).toBeNull();
});

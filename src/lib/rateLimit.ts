import type { NextRequest } from 'next/server';

import { createErrorResponse } from '@/lib/apiUtils';

// Simple in-memory sliding-window rate limiter (best-effort in serverless)
// Keyed by IP + route key. For distributed environments, prefer Redis-backed limiter.

type Entry = { count: number; resetAt: number };
const store = new Map<string, Entry>();

function getClientIp(req: NextRequest): string {
  const xf = req.headers.get('x-forwarded-for');
  if (typeof xf === 'string' && xf.length > 0) {
    const first = xf.split(',')[0] ?? '';
    return first.trim();
  }
  const xr = req.headers.get('x-real-ip');
  if (typeof xr === 'string' && xr.length > 0) return xr.trim();
  // Fallback: not ideal, but avoids undefined keys
  return 'unknown';
}

export function enforceRateLimit(
  req: NextRequest,
  opts: { key: string; limit: number; windowMs: number },
) {
  const ip = getClientIp(req);
  const now = Date.now();
  const key = `${opts.key}:${ip}`;
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + opts.windowMs });
    return null;
  }

  if (entry.count >= opts.limit) {
    const retryAfterSec = Math.max(1, Math.ceil((entry.resetAt - now) / 1000));
    return createErrorResponse(
      'Rate limit exceeded',
      `Try again in ${retryAfterSec}s`,
      429,
    );
  }

  entry.count += 1;
  store.set(key, entry);
  return null;
}

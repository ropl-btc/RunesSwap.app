import { ok } from '@/lib/apiResponse';
import { POPULAR_RUNES } from '@/lib/popularRunes';

export function GET() {
  const response = ok(POPULAR_RUNES);
  response.headers.set('Cache-Control', 'public, max-age=3600');
  return response;
}

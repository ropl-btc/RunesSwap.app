import { createFileRoute } from '@tanstack/react-router';
import { GET } from '@/server/api/rune-price-history/route';

export const Route = createFileRoute('/api/rune-price-history')({
  server: { handlers: { GET: ({ request }) => GET(request) } },
});

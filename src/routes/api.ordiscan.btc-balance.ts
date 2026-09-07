import { createFileRoute } from '@tanstack/react-router';
import { GET } from '@/server/api/ordiscan/btc-balance/route';

export const Route = createFileRoute('/api/ordiscan/btc-balance')({
  server: { handlers: { GET: ({ request }) => GET(request) } },
});

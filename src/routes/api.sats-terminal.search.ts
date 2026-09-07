import { createFileRoute } from '@tanstack/react-router';
import { GET } from '@/server/api/sats-terminal/search/route';

export const Route = createFileRoute('/api/sats-terminal/search')({
  server: { handlers: { GET: ({ request }) => GET(request) } },
});

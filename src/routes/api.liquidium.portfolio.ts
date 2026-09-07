import { createFileRoute } from '@tanstack/react-router';
import { GET } from '@/server/api/liquidium/portfolio/route';

export const Route = createFileRoute('/api/liquidium/portfolio')({
  server: { handlers: { GET: ({ request }) => GET(request) } },
});

import { createFileRoute } from '@tanstack/react-router';
import { GET } from '@/server/api/portfolio-data/route';

export const Route = createFileRoute('/api/portfolio-data')({
  server: { handlers: { GET: ({ request }) => GET(request) } },
});

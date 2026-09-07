import { createFileRoute } from '@tanstack/react-router';
import { GET } from '@/server/api/liquidium/challenge/route';

export const Route = createFileRoute('/api/liquidium/challenge')({
  server: { handlers: { GET: ({ request }) => GET(request) } },
});

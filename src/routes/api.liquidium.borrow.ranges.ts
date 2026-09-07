import { createFileRoute } from '@tanstack/react-router';
import { GET } from '@/server/api/liquidium/borrow/ranges/route';

export const Route = createFileRoute('/api/liquidium/borrow/ranges')({
  server: { handlers: { GET: ({ request }) => GET(request) } },
});

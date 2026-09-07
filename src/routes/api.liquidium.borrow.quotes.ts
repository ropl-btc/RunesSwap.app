import { createFileRoute } from '@tanstack/react-router';
import { GET } from '@/server/api/liquidium/borrow/quotes/route';

export const Route = createFileRoute('/api/liquidium/borrow/quotes')({
  server: { handlers: { GET: ({ request }) => GET(request) } },
});

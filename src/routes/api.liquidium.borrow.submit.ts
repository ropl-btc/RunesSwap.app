import { createFileRoute } from '@tanstack/react-router';
import { POST } from '@/server/api/liquidium/borrow/submit/route';

export const Route = createFileRoute('/api/liquidium/borrow/submit')({
  server: { handlers: { POST: ({ request }) => POST(request) } },
});

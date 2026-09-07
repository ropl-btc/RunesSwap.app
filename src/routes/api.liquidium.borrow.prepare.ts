import { createFileRoute } from '@tanstack/react-router';
import { POST } from '@/server/api/liquidium/borrow/prepare/route';

export const Route = createFileRoute('/api/liquidium/borrow/prepare')({
  server: { handlers: { POST: ({ request }) => POST(request) } },
});

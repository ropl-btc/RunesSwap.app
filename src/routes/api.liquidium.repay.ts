import { createFileRoute } from '@tanstack/react-router';
import { POST } from '@/server/api/liquidium/repay/route';

export const Route = createFileRoute('/api/liquidium/repay')({
  server: { handlers: { POST: ({ request }) => POST(request) } },
});

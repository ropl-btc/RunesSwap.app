import { createFileRoute } from '@tanstack/react-router';
import { POST } from '@/server/api/liquidium/auth/route';

export const Route = createFileRoute('/api/liquidium/auth')({
  server: { handlers: { POST: ({ request }) => POST(request) } },
});

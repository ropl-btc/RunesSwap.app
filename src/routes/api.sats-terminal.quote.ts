import { createFileRoute } from '@tanstack/react-router';
import { POST } from '@/server/api/sats-terminal/quote/route';

export const Route = createFileRoute('/api/sats-terminal/quote')({
  server: { handlers: { POST: ({ request }) => POST(request) } },
});

import { createFileRoute } from '@tanstack/react-router';
import { POST } from '@/server/api/sats-terminal/psbt/confirm/route';

export const Route = createFileRoute('/api/sats-terminal/psbt/confirm')({
  server: { handlers: { POST: ({ request }) => POST(request) } },
});

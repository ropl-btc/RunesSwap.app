import { createFileRoute } from '@tanstack/react-router';
import { POST } from '@/server/api/sats-terminal/psbt/create/route';

export const Route = createFileRoute('/api/sats-terminal/psbt/create')({
  server: { handlers: { POST: ({ request }) => POST(request) } },
});

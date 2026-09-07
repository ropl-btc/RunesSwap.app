import { createFileRoute } from '@tanstack/react-router';
import { POST } from '@/server/api/ordiscan/rune-update/route';

export const Route = createFileRoute('/api/ordiscan/rune-update')({
  server: { handlers: { POST: ({ request }) => POST(request) } },
});

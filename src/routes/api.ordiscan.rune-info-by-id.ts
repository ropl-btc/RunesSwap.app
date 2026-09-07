import { createFileRoute } from '@tanstack/react-router';
import { GET } from '@/server/api/ordiscan/rune-info-by-id/route';

export const Route = createFileRoute('/api/ordiscan/rune-info-by-id')({
  server: { handlers: { GET: ({ request }) => GET(request) } },
});

import { createFileRoute } from '@tanstack/react-router';
import { GET } from '@/server/api/ordiscan/rune-info/route';

export const Route = createFileRoute('/api/ordiscan/rune-info')({
  server: { handlers: { GET: ({ request }) => GET(request) } },
});

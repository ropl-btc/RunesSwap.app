import { createFileRoute } from '@tanstack/react-router';
import { GET } from '@/server/api/ordiscan/rune-market/route';

export const Route = createFileRoute('/api/ordiscan/rune-market')({
  server: { handlers: { GET: ({ request }) => GET(request) } },
});

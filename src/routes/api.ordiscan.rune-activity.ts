import { createFileRoute } from '@tanstack/react-router';
import { GET } from '@/server/api/ordiscan/rune-activity/route';

export const Route = createFileRoute('/api/ordiscan/rune-activity')({
  server: { handlers: { GET: ({ request }) => GET(request) } },
});

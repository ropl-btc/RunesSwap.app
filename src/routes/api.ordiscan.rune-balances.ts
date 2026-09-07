import { createFileRoute } from '@tanstack/react-router';
import { GET } from '@/server/api/ordiscan/rune-balances/route';

export const Route = createFileRoute('/api/ordiscan/rune-balances')({
  server: { handlers: { GET: ({ request }) => GET(request) } },
});

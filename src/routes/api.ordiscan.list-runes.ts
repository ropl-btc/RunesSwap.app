import { createFileRoute } from '@tanstack/react-router';
import { GET } from '@/server/api/ordiscan/list-runes/route';

export const Route = createFileRoute('/api/ordiscan/list-runes')({
  server: { handlers: { GET: () => GET() } },
});

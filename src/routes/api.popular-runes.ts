import { createFileRoute } from '@tanstack/react-router';
import { GET } from '@/server/api/popular-runes/route';

export const Route = createFileRoute('/api/popular-runes')({
  server: { handlers: { GET: () => GET() } },
});

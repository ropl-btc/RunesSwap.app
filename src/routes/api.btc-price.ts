import { createFileRoute } from '@tanstack/react-router';
import { GET } from '@/server/api/btc-price/route';

export const Route = createFileRoute('/api/btc-price')({
  server: { handlers: { GET: () => GET() } },
});

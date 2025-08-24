import { getRuneMarketData } from '@/lib/runeMarketData';
import { createRuneRoute } from '@/app/api/ordiscan/helpers';

export const GET = createRuneRoute(
  getRuneMarketData,
  'Failed to fetch market info',
);

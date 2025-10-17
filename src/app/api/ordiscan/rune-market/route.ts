import { createRuneRoute } from '@/app/api/ordiscan/helpers';
import { getRuneMarketData } from '@/lib/runeMarketData';

export const GET = createRuneRoute(
  getRuneMarketData,
  'Failed to fetch market info',
);

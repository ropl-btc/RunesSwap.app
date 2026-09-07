import { ok } from '@/lib/apiResponse';
import { fetchExternal } from '@/lib/fetchWrapper';
import { withApiHandler } from '@/lib/withApiHandler';

const CACHE_TTL_MS = 60_000;
let cachedPrice: { usd: number; fetchedAt: number } | undefined;
let inFlight: Promise<number> | undefined;

export const GET = withApiHandler(
  async () => {
    if (cachedPrice && Date.now() - cachedPrice.fetchedAt < CACHE_TTL_MS) {
      return ok({ usd: cachedPrice.usd });
    }

    if (!inFlight) {
      inFlight = fetchExternal<{ USD?: number }>('https://mempool.space/api/v1/prices', {
        timeout: 10000,
        retries: 3,
      })
        .then(({ data }) => {
          if (typeof data.USD !== 'number' || !Number.isFinite(data.USD) || data.USD <= 0) {
            throw new Error('Invalid response format from mempool.space');
          }
          cachedPrice = { usd: data.USD, fetchedAt: Date.now() };
          return data.USD;
        })
        .finally(() => {
          inFlight = undefined;
        });
    }

    try {
      return ok({ usd: await inFlight });
    } catch (error) {
      if (cachedPrice) return ok({ usd: cachedPrice.usd });
      throw error;
    }
  },
  { defaultErrorMessage: 'Failed to fetch BTC price' },
);

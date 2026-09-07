import { createHash } from 'node:crypto';
import type { SearchParams } from '@satsterminal-sdk/swaps';
import { z } from 'zod';
import { ok } from '@/lib/apiResponse';
import { validateRequest } from '@/lib/apiUtils';
import { logger } from '@/lib/logger';
import { handleSatsTerminalError } from '@/lib/satsTerminalError';
import { getOrdiscanClient, getSatsTerminalClient } from '@/lib/serverUtils';
import { hasSupabase, supabase } from '@/lib/supabase';
import { withApiHandler } from '@/lib/withApiHandler';
import type { Rune } from '@/types/satsTerminal';
import { getRuneIconUrl, normalizeRuneName } from '@/utils/runeUtils';

const searchParamsSchema = z.object({
  query: z.string().trim().min(1, 'Query parameter is required'),
  sell: z.string().optional(),
});

interface SearchResponseItem {
  token_id?: string;
  id?: string;
  token?: string;
  name?: string;
  icon?: string;
  imageURI?: string;
}

interface SearchResponseBody {
  tokens?: SearchResponseItem[];
}

interface SupabaseRuneRecord {
  id?: string | null;
  name?: string | null;
  formatted_name?: string | null;
}

/**
 * Generate a stable ID based on item properties and index.
 * This ensures consistent IDs across API calls for the same search results.
 * @param item - The search response item
 * @param index - The item's position in the results array
 * @returns A stable, deterministic ID
 */
function generateStableId(item: SearchResponseItem, index: number): string {
  // Use existing ID if available
  if (item.token_id) return item.token_id;
  if (item.id) return item.id;

  // Create stable ID from item properties
  const identifier = [
    item.token || item.name || '',
    item.icon || item.imageURI || '',
    index.toString(),
  ]
    .filter(Boolean)
    .join('|');

  // Generate a short hash for readability
  const hash = createHash('md5').update(identifier).digest('hex').slice(0, 8);
  return `search_${hash}`;
}

function normalizeSearchResponse(
  response: SearchResponseItem[] | SearchResponseBody | null | undefined,
): SearchResponseItem[] {
  if (Array.isArray(response)) {
    return response;
  }

  if (response && Array.isArray(response.tokens)) {
    return response.tokens;
  }

  return [];
}

function mapSearchItemsToRunes(items: SearchResponseItem[]): Rune[] {
  return items.map((item, index) => ({
    id: generateStableId(item, index),
    name: item.token || item.name || 'Unknown',
    imageURI: item.icon || item.imageURI || '',
  }));
}

function buildRuneSearchScore(query: string, candidateName: string): number {
  const normalizedQuery = normalizeRuneName(query).toUpperCase();
  const normalizedCandidate = normalizeRuneName(candidateName).toUpperCase();

  if (normalizedCandidate === normalizedQuery) return 400;
  if (candidateName.toUpperCase() === query.toUpperCase()) return 350;
  if (normalizedCandidate.startsWith(normalizedQuery)) return 250;
  if (candidateName.toUpperCase().startsWith(query.toUpperCase())) return 200;
  if (normalizedCandidate.includes(normalizedQuery)) return 100;
  if (candidateName.toUpperCase().includes(query.toUpperCase())) return 75;
  return 0;
}

function mapFallbackRecordToRune(record: SupabaseRuneRecord, index: number): Rune {
  const displayName = record.formatted_name || record.name || 'Unknown';
  return {
    id: record.id || generateStableId({ name: displayName }, index),
    name: displayName,
    imageURI: displayName === 'Unknown' ? '' : getRuneIconUrl(displayName),
  };
}

async function searchRunesViaSupabase(query: string): Promise<Rune[]> {
  if (!hasSupabase) {
    return [];
  }

  try {
    const escapedQuery = query.replace(/[%_]/g, '').trim();
    if (!escapedQuery) return [];

    const { data, error } = await supabase
      .from('runes')
      .select('id, name, formatted_name')
      .or(`name.ilike.%${escapedQuery}%,formatted_name.ilike.%${escapedQuery}%`)
      .limit(20);

    if (error) {
      logger.warn('Supabase rune search fallback failed', { error, query }, 'API');
      return [];
    }

    const records = ((data || []) as SupabaseRuneRecord[])
      .filter((record) => {
        const displayName = record.formatted_name || record.name || '';
        return buildRuneSearchScore(query, displayName) > 0;
      })
      .sort((left, right) => {
        const leftName = left.formatted_name || left.name || '';
        const rightName = right.formatted_name || right.name || '';
        return buildRuneSearchScore(query, rightName) - buildRuneSearchScore(query, leftName);
      });

    return records.map(mapFallbackRecordToRune);
  } catch (error) {
    logger.warn('Supabase rune search fallback threw unexpectedly', { error, query }, 'API');
    return [];
  }
}

async function searchRunesViaOrdiscan(query: string): Promise<Rune[]> {
  try {
    const ordiscan = getOrdiscanClient();
    const normalizedQuery = normalizeRuneName(query).toUpperCase();

    const exactInfo = await ordiscan.rune
      .getInfo({ name: normalizedQuery })
      .then((result) => [result])
      .catch(() => []);

    return exactInfo.map((record, index) => ({
      id: record.id || generateStableId({ name: record.formatted_name || record.name }, index),
      name: record.formatted_name || record.name,
      imageURI: getRuneIconUrl(record.formatted_name || record.name),
    }));
  } catch (error) {
    logger.warn('Ordiscan exact rune fallback failed', { error, query }, 'API');
    return [];
  }
}

async function searchRunesWithFallback(query: string, sell: boolean): Promise<Rune[]> {
  const terminal = getSatsTerminalClient();
  const searchParams: SearchParams = {
    query,
    sell,
  };

  try {
    const primaryResults = normalizeSearchResponse(await terminal.search(searchParams));
    if (primaryResults.length > 0) {
      return mapSearchItemsToRunes(primaryResults);
    }
  } catch (error) {
    logger.warn(
      'SatsTerminal search failed, using fallback search providers',
      { error, query },
      'API',
    );
  }

  const supabaseResults = await searchRunesViaSupabase(query);
  if (supabaseResults.length > 0) {
    return supabaseResults;
  }

  return searchRunesViaOrdiscan(query);
}

export const GET = withApiHandler(
  async (request: Request) => {
    const validation = await validateRequest(request, searchParamsSchema, 'query');
    if (!validation.success) return validation.errorResponse;

    const { query, sell } = validation.data;
    const transformedResults = await searchRunesWithFallback(query, sell === 'true');
    return ok(transformedResults);
  },
  {
    defaultErrorMessage: 'Failed to search',
    customErrorHandler: handleSatsTerminalError,
  },
);

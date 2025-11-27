import { logApiError, logDbError } from '@/lib/logger';
import { getOrdiscanClient } from '@/lib/serverUtils';
import {
  fetchRuneByName,
  type RuneRecord,
  upsertRuneData,
} from '@/lib/supabaseQueries';

/**
 * Data structure for a Rune, matching Supabase schema and API response.
 */
export interface RuneData {
  /** Unique identifier. */
  id: string;
  /** Name of the Rune. */
  name: string;
  /** Formatted name (e.g., with spacers). */
  formatted_name: string | null;
  /** Spacer mask. */
  spacers: number | null;
  /** Rune number. */
  number: number | null;
  /** Inscription ID of the etching. */
  inscription_id: string | null;
  /** Number of decimals. */
  decimals: number | null;
  /** Max mint count. */
  mint_count_cap: string | null;
  /** Symbol character. */
  symbol: string | null;
  /** Etching transaction ID. */
  etching_txid: string | null;
  /** Amount per mint. */
  amount_per_mint: string | null;
  /** Etching timestamp. */
  timestamp_unix: string | null;
  /** Premined supply. */
  premined_supply: string; // Changed to match API response
  /** Mint start block height. */
  mint_start_block: number | null;
  /** Mint end block height. */
  mint_end_block: number | null;
  /** Current circulating supply. */
  current_supply: string | null;
  /** Current mint count. */
  current_mint_count: number | null;
}

function normalizeRuneData(
  data: Partial<RuneData | RuneRecord> | null | undefined,
): RuneData | null {
  if (!data?.name || !data?.id) return null;

  return {
    id: data.id,
    name: data.name,
    formatted_name: data.formatted_name ?? null,
    spacers: data.spacers ?? null,
    number: data.number ?? null,
    inscription_id: data.inscription_id ?? null,
    decimals: data.decimals ?? null,
    mint_count_cap: data.mint_count_cap ?? null,
    symbol: data.symbol ?? null,
    etching_txid: data.etching_txid ?? null,
    amount_per_mint: data.amount_per_mint ?? null,
    timestamp_unix: data.timestamp_unix ?? null,
    premined_supply: data.premined_supply ?? '0',
    mint_start_block: data.mint_start_block ?? null,
    mint_end_block: data.mint_end_block ?? null,
    current_supply: data.current_supply ?? null,
    current_mint_count: data.current_mint_count ?? null,
  };
}

/**
 * Fetches detailed data for a Rune by name.
 * Tries to fetch from Supabase cache first, then falls back to Ordiscan API.
 * Updates Supabase cache on successful API fetch.
 *
 * @param runeName - The name of the Rune.
 * @returns RuneData object or null if not found/error.
 */
export async function getRuneData(runeName: string): Promise<RuneData | null> {
  try {
    // First, try to get from Supabase using centralized utility
    const existingRune = await fetchRuneByName(runeName);

    const normalizedExisting = normalizeRuneData(existingRune);
    if (normalizedExisting) {
      return normalizedExisting;
    }

    // If not in DB, fetch from Ordiscan
    const ordiscan = getOrdiscanClient();
    const runeData = await ordiscan.rune.getInfo({ name: runeName });

    const normalizedApiRune = normalizeRuneData(runeData as Partial<RuneData>);
    if (!normalizedApiRune) {
      return null;
    }

    // Store in Supabase using centralized utility (non-critical if it fails)
    const success = await upsertRuneData(normalizedApiRune);
    if (!success) {
      logDbError('upsertRuneData', 'Failed to cache rune data');
    }

    return normalizedApiRune;
  } catch (error) {
    logApiError('getRuneData', error);
    return null;
  }
}

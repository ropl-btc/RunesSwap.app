import { logApiError, logDbError } from './logger';
import { getOrdiscanClient } from './serverUtils';
import { fetchRuneByName, upsertRuneData } from './supabaseQueries';

export interface RuneData {
  id: string;
  name: string;
  formatted_name: string | null;
  spacers: number | null;
  number: number | null;
  inscription_id: string | null;
  decimals: number | null;
  mint_count_cap: string | null;
  symbol: string | null;
  etching_txid: string | null;
  amount_per_mint: string | null;
  timestamp_unix: string | null;
  premined_supply: string; // Changed to match API response
  mint_start_block: number | null;
  mint_end_block: number | null;
  current_supply: string | null;
  current_mint_count: number | null;
}

export async function getRuneData(runeName: string): Promise<RuneData | null> {
  try {
    // First, try to get from Supabase using centralized utility
    const existingRune = await fetchRuneByName(runeName);

    if (existingRune) {
      return existingRune as RuneData;
    }

    // If not in DB, fetch from Ordiscan
    const ordiscan = getOrdiscanClient();
    const runeData = await ordiscan.rune.getInfo({ name: runeName });

    if (!runeData) {
      return null;
    }

    // Store in Supabase using centralized utility (non-critical if it fails)
    const success = await upsertRuneData(runeData as RuneData);
    if (!success) {
      logDbError('upsertRuneData', 'Failed to cache rune data');
    }

    return runeData as RuneData;
  } catch (error) {
    logApiError('getRuneData', error);
    return null;
  }
}

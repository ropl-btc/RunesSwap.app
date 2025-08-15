/**
 * Centralized Supabase query utilities
 * Reduces duplicate query patterns throughout the codebase
 */

import type { RuneMarketInfo } from '@/types/ordiscan';
import type { RuneData } from '@/lib/runesData';
import { supabase } from '@/lib/supabase';

// Types for database tables
export interface RuneRecord {
  id?: string;
  name: string;
  formatted_name?: string | null;
  spacers?: number | null;
  number?: number | null;
  inscription_id?: string | null;
  decimals: number | null;
  mint_count_cap?: string | null;
  symbol?: string | null;
  etching_txid?: string | null;
  amount_per_mint?: string | null;
  timestamp_unix?: string | null;
  premined_supply?: string | null;
  mint_start_block?: number | null;
  mint_end_block?: number | null;
  current_supply?: string | null;
  current_mint_count?: number | null;
  last_updated_at?: string;
}

export interface RuneMarketRecord {
  rune_name: string;
  price_in_sats?: number;
  price_in_usd?: number;
  market_cap_in_btc?: number;
  market_cap_in_usd?: number;
  last_updated_at?: string;
}

/**
 * Batch fetch rune information by names
 */
export async function batchFetchRunes(
  runeNames: string[],
): Promise<RuneRecord[]> {
  if (runeNames.length === 0) return [];

  const { data, error } = await supabase
    .from('runes')
    .select('*')
    .in('name', runeNames);

  if (error) {
    console.warn('Error fetching runes from Supabase:', error);
    return [];
  }

  return data || [];
}

/**
 * Batch fetch market data by rune names
 */
export async function batchFetchRuneMarketData(
  runeNames: string[],
): Promise<RuneMarketRecord[]> {
  if (runeNames.length === 0) return [];

  const { data, error } = await supabase
    .from('rune_market_data')
    .select('*')
    .in('rune_name', runeNames)
    .gt('last_updated_at', new Date(Date.now() - 3600000).toISOString()); // Last hour

  if (error) {
    console.warn('Error fetching rune market data from Supabase:', error);
    return [];
  }

  return data || [];
}

/**
 * Upsert rune data (insert or update if exists)
 */
export async function upsertRuneData(runeData: RuneData): Promise<boolean> {
  const dataToInsert: RuneRecord = {
    name: runeData.name,
    formatted_name: runeData.formatted_name,
    spacers: runeData.spacers,
    number: runeData.number,
    inscription_id: runeData.inscription_id,
    decimals: runeData.decimals,
    mint_count_cap: runeData.mint_count_cap,
    symbol: runeData.symbol,
    etching_txid: runeData.etching_txid,
    amount_per_mint: runeData.amount_per_mint,
    timestamp_unix: runeData.timestamp_unix,
    premined_supply: runeData.premined_supply,
    mint_start_block: runeData.mint_start_block,
    mint_end_block: runeData.mint_end_block,
    current_supply: runeData.current_supply,
    current_mint_count: runeData.current_mint_count,
  };

  const { error } = await supabase
    .from('runes')
    .upsert([dataToInsert], { onConflict: 'name' })
    .select();

  if (error) {
    console.warn('Error upserting rune data:', error);
    return false;
  }

  return true;
}

/**
 * Upsert market data for a rune
 */
export async function upsertRuneMarketData(
  runeName: string,
  marketData: RuneMarketInfo,
): Promise<boolean> {
  const upsertData: Omit<RuneMarketRecord, 'last_updated_at'> = {
    rune_name: runeName,
    price_in_sats: marketData.price_in_sats,
    price_in_usd: marketData.price_in_usd,
    market_cap_in_btc: marketData.market_cap_in_btc,
    market_cap_in_usd: marketData.market_cap_in_usd,
  };

  const { error } = await supabase
    .from('rune_market_data')
    .upsert(upsertData, { onConflict: 'rune_name' });

  if (error) {
    console.warn('Error upserting market data:', error);
    return false;
  }

  return true;
}

/**
 * Get single rune by name with fallback
 */
export async function fetchRuneByName(
  runeName: string,
): Promise<RuneRecord | null> {
  const { data, error } = await supabase
    .from('runes')
    .select('*')
    .eq('name', runeName)
    .single();

  if (error) {
    if (error.code !== 'PGRST116') {
      // PGRST116 is "not found", which is expected
      console.warn('Error fetching rune by name:', error);
    }
    return null;
  }

  return data;
}

/**
 * Get market data for a single rune with freshness check
 */
export async function fetchRuneMarketDataByName(
  runeName: string,
  maxAgeHours = 1,
): Promise<RuneMarketRecord | null> {
  const cutoffTime = new Date(Date.now() - maxAgeHours * 3600000).toISOString();

  const { data, error } = await supabase
    .from('rune_market_data')
    .select('*')
    .eq('rune_name', runeName)
    .gt('last_updated_at', cutoffTime)
    .single();

  if (error) {
    if (error.code !== 'PGRST116') {
      console.warn('Error fetching market data by name:', error);
    }
    return null;
  }

  return data;
}

/**
 * Batch insert/update multiple runes efficiently
 */
export async function batchUpsertRunes(runesData: RuneData[]): Promise<number> {
  if (runesData.length === 0) return 0;

  const dataToInsert: RuneRecord[] = runesData.map((rune) => ({
    name: rune.name,
    formatted_name: rune.formatted_name,
    spacers: rune.spacers,
    number: rune.number,
    inscription_id: rune.inscription_id,
    decimals: rune.decimals,
    mint_count_cap: rune.mint_count_cap,
    symbol: rune.symbol,
    etching_txid: rune.etching_txid,
    amount_per_mint: rune.amount_per_mint,
    timestamp_unix: rune.timestamp_unix,
    premined_supply: rune.premined_supply,
    mint_start_block: rune.mint_start_block,
    mint_end_block: rune.mint_end_block,
    current_supply: rune.current_supply,
    current_mint_count: rune.current_mint_count,
  }));

  const { error } = await supabase
    .from('runes')
    .upsert(dataToInsert, { onConflict: 'name' });

  if (error) {
    console.warn('Error batch upserting runes:', error);
    return 0;
  }

  return runesData.length;
}

/**
 * Clean up old market data to prevent database bloat
 */
export async function cleanupOldMarketData(olderThanHours = 24): Promise<void> {
  const cutoffTime = new Date(
    Date.now() - olderThanHours * 3600000,
  ).toISOString();

  const { error } = await supabase
    .from('rune_market_data')
    .delete()
    .lt('last_updated_at', cutoffTime);

  if (error) {
    console.warn('Error cleaning up old market data:', error);
  }
}

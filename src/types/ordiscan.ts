import type { RuneBalance as OrdiscanRuneBalance } from 'ordiscan';

// Re-export the RuneBalance type from the SDK for consistency if needed elsewhere
export type RuneBalance = OrdiscanRuneBalance;

/**
 * API response format for rune balances (transforms amount -> balance).
 */
export interface ApiRuneBalance {
  /** Name of the rune. */
  name: string;
  /** Balance amount as a string. */
  balance: string;
}

/**
 * Detailed information about a specific Rune, based on Ordiscan API response.
 */
export interface RuneInfo {
  /** Unique identifier for the Rune (block:tx). */
  id: string;
  /** Name of the Rune. */
  name: string;
  /** Formatted name with spacers (e.g., "DOG•GO•TO•THE•MOON"). */
  formatted_name: string;
  /** Rune number. */
  number: number;
  /** Inscription ID associated with the Rune etching. */
  inscription_id: string | null;
  /** Number of decimal places. */
  decimals: number;
  /** Symbol character for the Rune. */
  symbol: string | null;
  /** Transaction ID of the etching. */
  etching_txid: string | null;
  /** Unix timestamp of the etching. */
  timestamp_unix: string | null;
  /** Premined supply amount. */
  premined_supply: string;
  /** Amount per mint. */
  amount_per_mint: string | null;
  /** Maximum number of mints allowed. */
  mint_count_cap: string | null;
  /** Block height where minting starts. */
  mint_start_block: number | null;
  /** Block height where minting ends. */
  mint_end_block: number | null;
  /** Current circulating supply. */
  current_supply?: string;
  /** Current number of mints. */
  current_mint_count?: number;
}

/**
 * Market information for a Rune.
 */
export interface RuneMarketInfo {
  /** Price in Satoshis. */
  price_in_sats: number;
  /** Price in USD. */
  price_in_usd: number;
  /** Market capitalization in BTC. */
  market_cap_in_btc: number;
  /** Market capitalization in USD. */
  market_cap_in_usd: number;
}

/**
 * Represents a message within a Runestone.
 */
export interface RunestoneMessage {
  /** Name of the Rune involved. */
  rune: string;
  /** Type of operation: ETCH, MINT, or TRANSFER. */
  type: 'ETCH' | 'MINT' | 'TRANSFER';
}

/**
 * Represents an input in a Rune transaction.
 */
export interface RunicInput {
  /** Address of the input owner. */
  address: string;
  /** Previous output reference (txid:vout). */
  output: string; // txid:vout
  /** Name of the Rune. */
  rune: string;
  /** Amount of the Rune. */
  rune_amount: string;
}

/**
 * Represents an output in a Rune transaction.
 */
export interface RunicOutput {
  /** Destination address. */
  address: string;
  /** Output index. */
  vout: number;
  /** Name of the Rune. */
  rune: string;
  /** Amount of the Rune. */
  rune_amount: string;
}

/**
 * Represents a Rune activity event (transaction).
 */
export interface RuneActivityEvent {
  /** Transaction ID. */
  txid: string;
  /** List of Runestone messages in the transaction. */
  runestone_messages: RunestoneMessage[];
  /** List of inputs involving Runes. */
  inputs: RunicInput[];
  /** List of outputs involving Runes. */
  outputs: RunicOutput[];
  /** ISO 8601 timestamp of the transaction. */
  timestamp: string; // ISO datetime string
}

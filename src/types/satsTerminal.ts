/**
 * Types related to SatsTerminal SDK interactions and API responses.
 */

import { z } from 'zod';

/**
 * Represents a Rune as returned by SatsTerminal or enriched from Ordiscan.
 */
export interface Rune {
  /** Unique identifier for the Rune. */
  id: string;
  /** Name of the Rune. */
  name: string;
  /** URI for the asset image. Required for type safety. */
  imageURI: string;
  /** Formatted amount string (optional). */
  formattedAmount?: string | undefined;
  /** Formatted unit price string (optional). */
  formattedUnitPrice?: string | undefined;
  /** Price value (optional). */
  price?: number | undefined;
}

// Add other SatsTerminal specific types here as needed, e.g.:
// export interface SatsTerminalQuote {
//   ...
// }

export const runeOrderSchema = z
  .object({
    id: z.string().min(1, 'Order ID is required'),
    market: z.string().min(1, 'Market is required'),
    price: z.number(),
    formattedAmount: z.number(),
    fromTokenAmount: z.string().optional(),
    slippage: z.number().optional(),
    listingAmount: z.number().optional(),
    sellerAddress: z.string().optional(),
    tokenAmount: z.string().optional(),
    listingPrice: z.string().optional(),
    updatedAt: z.string().optional(),
    formattedUnitPrice: z.string().optional(),
    alkanesId: z.string().optional(),
    name: z.string().optional(),
    amount: z.string().optional(),
  })
  .passthrough();

// Define the RuneOrder type to match the actual SatsTerminal SDK Order interface
/**
 * Represents a Rune Order, matching the SatsTerminal SDK Order interface.
 */
export interface RuneOrder {
  /** Unique order ID. */
  id: string;
  /** Market identifier. */
  market: string;
  /** Price of the order. */
  price: number;
  /** Formatted amount of the order. */
  formattedAmount: number;
  /** Amount of token from source (optional). */
  fromTokenAmount?: string | undefined;
  /** Slippage tolerance (optional). */
  slippage?: number | undefined;
  /** Listing amount (optional). */
  listingAmount?: number | undefined;
  /** Seller's address (optional). */
  sellerAddress?: string | undefined;
  /** Token amount string (optional). */
  tokenAmount?: string | undefined;
  /** Listing price string (optional). */
  listingPrice?: string | undefined;
  /** Last updated timestamp (optional). */
  updatedAt?: string | undefined;
  /** Formatted unit price string (optional). */
  formattedUnitPrice?: string | undefined;
  /** Alkanes ID (optional). */
  alkanesId?: string | undefined;
  /** Name of the Rune (optional). */
  name?: string | undefined;
  /** Amount string (optional). */
  amount?: string | undefined;
}

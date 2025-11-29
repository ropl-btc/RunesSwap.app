/**
 * Represents a generic asset, which can be BTC or a Rune.
 */
export interface Asset {
  /** Unique identifier for the asset. Rune ID or 'BTC'. */
  id: string;
  /** Display name of the asset. Rune name or 'BTC'. */
  name: string;
  /** URI for the asset image. Required for UI display. */
  imageURI: string;
  /** Optional flag to explicitly identify Bitcoin. */
  isBTC?: boolean | undefined;
}

// Re-export RuneData for tests
export type { RuneData } from '@/lib/runesData';

/**
 * Represents Bitcoin (BTC) as a selectable asset.
 */
export const BTC_ASSET: Asset = {
  id: 'BTC',
  name: 'BTC',
  imageURI: '/Bitcoin.svg',
  isBTC: true,
};

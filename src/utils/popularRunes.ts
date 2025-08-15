import type { Asset } from '@/types/common';
import type { Rune } from '@/types/satsTerminal';

type PopularRuneItem = {
  token_id: string;
  token: string;
  symbol: string;
  icon: string;
  is_verified: boolean;
};

// Convert popular rune items to Asset format (handles both our format and API response)
export const mapPopularToAsset = (
  items: PopularRuneItem[] | Record<string, unknown>[],
): Asset[] =>
  items.map((item) => ({
    id: String(
      (item as PopularRuneItem).token_id ||
        (item as Record<string, unknown>).id ||
        '',
    ),
    name: String(
      (item as PopularRuneItem).token ||
        (item as Record<string, unknown>).name ||
        (item as Record<string, unknown>).rune ||
        '',
    ),
    imageURI: String(
      (item as PopularRuneItem).icon ||
        (item as Record<string, unknown>).imageURI ||
        '',
    ),
    isBTC: false,
  }));

// Convert popular rune items to Rune format (handles both our format and API response)
export const mapPopularToRune = (
  items: PopularRuneItem[] | Record<string, unknown>[],
): Rune[] =>
  items.map((item) => ({
    id: String(
      (item as PopularRuneItem).token_id ||
        (item as Record<string, unknown>).id ||
        '',
    ),
    name: String(
      (item as PopularRuneItem).token ||
        (item as Record<string, unknown>).name ||
        (item as Record<string, unknown>).rune ||
        '',
    ),
    imageURI: String(
      (item as PopularRuneItem).icon ||
        (item as Record<string, unknown>).imageURI ||
        '',
    ),
  }));

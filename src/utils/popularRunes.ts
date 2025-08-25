import type { Asset } from '@/types/common';
import type { Rune } from '@/types/satsTerminal';

type PopularRuneItem = {
  token_id: string;
  token: string;
  symbol: string;
  icon: string;
  is_verified: boolean;
};

type BasePopularItem = {
  id: string;
  name: string;
  imageURI: string;
};

export const mapPopularItems = <T>(
  items: PopularRuneItem[] | Record<string, unknown>[],
  transform: (item: BasePopularItem) => T,
): T[] =>
  items.map((item) => {
    const base: BasePopularItem = {
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
    };
    return transform(base);
  });

export const mapPopularToAsset = (
  items: PopularRuneItem[] | Record<string, unknown>[],
): Asset[] => mapPopularItems(items, (item) => ({ ...item, isBTC: false }));

export const mapPopularToRune = (
  items: PopularRuneItem[] | Record<string, unknown>[],
): Rune[] => mapPopularItems(items, (item) => item);

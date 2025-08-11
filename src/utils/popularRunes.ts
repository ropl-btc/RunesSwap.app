import type { Asset } from '@/types/common';
import type { Rune } from '@/types/satsTerminal';

type UnknownRecord = Record<string, unknown>;

// Normalize a popular collections item to a common shape
const normalizePopularItem = (
  item: UnknownRecord,
): {
  id: string;
  name: string;
  imageURI: string;
} => {
  const id =
    (item?.rune as string) ||
    (item?.token as string) ||
    `unknown_${Math.random()}`;
  const name =
    ((item?.etching as UnknownRecord)?.runeName as string) ||
    (item?.rune as string) ||
    (item?.token as string) ||
    'Unknown';
  const imageURI =
    (item?.icon_content_url_data as string) ||
    (item?.imageURI as string) ||
    ((item as UnknownRecord).icon as string) ||
    (item?.imageUrl as string) ||
    '';
  return { id, name, imageURI };
};

export const mapPopularToRune = (items: UnknownRecord[]): Rune[] =>
  items.map((it) => {
    const { id, name, imageURI } = normalizePopularItem(it);
    return { id, name, imageURI };
  });

export const mapPopularToAsset = (items: UnknownRecord[]): Asset[] =>
  items.map((it) => {
    const { id, name, imageURI } = normalizePopularItem(it);
    return { id, name, imageURI, isBTC: false };
  });

export const dedupeById = <T extends { id: string }>(arr: T[]): T[] => {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const item of arr) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    out.push(item);
  }
  return out;
};

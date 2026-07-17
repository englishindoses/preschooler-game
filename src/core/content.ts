import itemsJson from '../data/items.json';
import levelsJson from '../data/levels.json';
import type { Item, Progression, ListenLevel, OddLevel, MemoryLevel } from '../data/types';

// Loaded once from the JSON data files. Games read from these.
export const ITEMS = itemsJson.items as Item[];
export const PROGRESSION = levelsJson.progression as Progression;
export const LISTEN_LEVELS = levelsJson.listen_and_tap as ListenLevel[];
export const ODD_LEVELS = levelsJson.odd_one_out as OddLevel[];
export const MEMORY_LEVELS = levelsJson.memory_pairs as MemoryLevel[];

export function shuffle<T>(arr: readonly T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = a[i];
    a[i] = a[j];
    a[j] = tmp;
  }
  return a;
}

export function pickOne<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function distinctCategories(): string[] {
  return [...new Set(ITEMS.map((it) => it.category))];
}

// Names of categories that have at least `min` members (falls back to all
// categories if none is that big, so a round can always be built).
export function categoriesWithAtLeast(min: number): string[] {
  const counts = new Map<string, number>();
  for (const it of ITEMS) {
    counts.set(it.category, (counts.get(it.category) ?? 0) + 1);
  }
  const big = [...counts.entries()].filter(([, c]) => c >= min).map(([cat]) => cat);
  return big.length > 0 ? big : [...counts.keys()];
}

// Pick n distinct items, optionally restricted to a category and excluding some.
export function pickItems(
  n: number,
  opts: { category?: string; exclude?: string[] } = {},
): Item[] {
  const excluded = new Set(opts.exclude ?? []);
  const pool = ITEMS.filter(
    (it) => !excluded.has(it.id) && (!opts.category || it.category === opts.category),
  );
  return shuffle(pool).slice(0, n);
}

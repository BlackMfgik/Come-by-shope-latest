/**
 * Lightweight fuzzy search for product catalog.
 *
 * Priority ladder (score 0–1, threshold > 0 = shown):
 *  1.0  — exact substring in name
 *  0.85 — exact substring in description / category
 *  0.75 — every query word is a substring of the combined text
 *  0.55 — fuzzy window match (edit distance ≤ 1 over sliding windows in name)
 *   0   — no match
 *
 * Results are sorted by score DESC, so best matches bubble up.
 */

/** Levenshtein edit distance (early-exit optimised). */
function editDistance(a: string, b: string): number {
  if (Math.abs(a.length - b.length) > 2) return 99;
  const m = a.length;
  const n = b.length;
  // Use two rows to save memory
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  let curr = new Array<number>(n + 1);
  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      curr[j] =
        a[i - 1] === b[j - 1]
          ? prev[j - 1]
          : 1 + Math.min(prev[j], curr[j - 1], prev[j - 1]);
    }
    [prev, curr] = [curr, prev];
  }
  return prev[n];
}

/**
 * Sliding-window fuzzy match:
 * looks for any substring of `text` (window ±1 the query length)
 * that is within edit distance 1 of `query`.
 */
function fuzzyWindowMatch(text: string, query: string): boolean {
  if (query.length < 3) return false;
  const lo = Math.max(2, query.length - 1);
  const hi = query.length + 1;
  for (let len = lo; len <= hi; len++) {
    for (let i = 0; i <= text.length - len; i++) {
      if (editDistance(text.slice(i, i + len), query) <= 1) return true;
    }
  }
  return false;
}

const norm = (s: string) => s.toLowerCase().trim();

export interface Searchable {
  name: string;
  description?: string | null;
  category?: string | null;
}

/**
 * Returns a score 0–1 for a single item against a query.
 * Score 0 means "do not show".
 */
export function scoreItem<T extends Searchable>(
  item: T,
  query: string,
): number {
  if (!query) return 1;

  const q = norm(query);
  if (!q) return 1;

  const name = norm(item.name);
  const desc = norm(item.description ?? "");
  const cat = norm(item.category ?? "");

  // 1. Exact substring in name
  if (name.includes(q)) return 1.0;

  // 2. Exact substring in description or category
  if (desc.includes(q) || cat.includes(q)) return 0.85;

  // 3. Every query word is found as substring in combined text
  const combined = `${name} ${desc} ${cat}`;
  const words = q.split(/\s+/).filter(Boolean);
  if (words.length > 1 && words.every((w) => combined.includes(w))) return 0.75;

  // 4. Single-word fuzzy window (edit distance ≤ 1)
  //    Applicable only when there are no spaces in query
  if (!q.includes(" ") && fuzzyWindowMatch(name, q)) return 0.55;

  return 0;
}

/**
 * Filter + sort an array of items by fuzzy query.
 * Items with score 0 are removed; rest are sorted best-first.
 */
export function fuzzyFilter<T extends Searchable>(
  items: T[],
  query: string,
): T[] {
  if (!query.trim()) return items;

  return items
    .map((item) => ({ item, score: scoreItem(item, query) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .map(({ item }) => item);
}

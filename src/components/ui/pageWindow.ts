/** Page numbers to show around the current page: 1 … 4 5 [6] 7 8 … 20 */
export function pageWindow(page: number, pageCount: number, radius = 1): (number | 'gap')[] {
  const pages = new Set<number>([1, pageCount]);
  for (let p = page - radius; p <= page + radius; p++) if (p >= 1 && p <= pageCount) pages.add(p);
  const sorted = [...pages].sort((a, b) => a - b);
  const out: (number | 'gap')[] = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) out.push(p - sorted[i - 1] === 2 ? p - 1 : 'gap');
    out.push(p);
  });
  return out;
}

/** Reads a positive page number from a query-string value. */
export function parsePage(value: string | null) {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : 1;
}

// "Build schedule" options and the game count it shows before creating (public.sk_build_schedule).

export type BuildFormat = 'bracket' | 'round_robin' | 'round_robin_final';

export const buildFormats: { value: BuildFormat; label: string; help: string }[] = [
  { value: 'bracket', label: 'Single elimination', help: 'Winners move on; semifinal losers play the bronze game. Top seeds get a bye when the field isn’t 2, 4, 8 or 16.' },
  { value: 'round_robin', label: 'Round robin', help: 'Everyone plays everyone once. Each round’s matchups appear once the round before it is finished.' },
  { value: 'round_robin_final', label: 'Round robin + final', help: 'A round robin, then 1st and 2nd play the final and 3rd and 4th the bronze game.' },
];

/** How many games a build creates (same rules as public.sk_build_schedule). */
export function scheduleSize(format: BuildFormat, n: number, bronze: boolean) {
  if (n < 2) return { games: 0, rounds: 0 };
  if (format === 'bracket') {
    let size = 1;
    while (size < n) size *= 2;
    const rounds = Math.log2(size);
    const bronzeGame = bronze && size >= 4 && !(size === 4 && n === 3);
    return { games: n - 1 + (bronzeGame ? 1 : 0), rounds };
  }
  const rounds = n % 2 ? n : n - 1;
  const rr = (n * (n - 1)) / 2;
  if (format === 'round_robin') return { games: rr, rounds };
  return { games: rr + 1 + (bronze && n >= 4 ? 1 : 0), rounds: rounds + 1 };
}

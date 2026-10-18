// Generated Salingkusog games know where their sides come from (sk_matches.source_a/_b, filled in
// by app.sk_resolve in supabase/v2/salingkusog.sql). These helpers turn that into words.
import type { SkMatchRow } from './database.types';

type Game = Pick<SkMatchRow, 'id' | 'round' | 'round_order' | 'source_a' | 'source_b'>;

const ordinal = (n: number) => `${n}${n % 10 === 1 && n % 100 !== 11 ? 'st' : n % 10 === 2 && n % 100 !== 12 ? 'nd' : n % 10 === 3 && n % 100 !== 13 ? 'rd' : 'th'}`;

/** A round-robin (group) game: not fed by a winner, loser or standings place. */
export const isGroupGame = (m: Pick<SkMatchRow, 'source_a'>) => !/^(winner|loser|rank):/.test(m.source_a ?? '');

/** Words for a side that isn't known yet: "Winner of Semifinal 1", "2nd in the standings", "After Round 1". */
export function pendingSide(match: Game, side: 'a' | 'b', games: Pick<SkMatchRow, 'id' | 'round'>[]): string | null {
  const source = side === 'a' ? match.source_a : match.source_b;
  if (!source) return null;
  const [kind, ref] = source.split(':');
  if (kind === 'winner' || kind === 'loser') {
    const from = games.find((g) => g.id === ref)?.round ?? 'the previous game';
    return `${kind === 'winner' ? 'Winner' : 'Loser'} of ${from}`;
  }
  if (kind === 'rank') return `${ordinal(Number(ref))} in the standings`;
  if (kind === 'seed') return match.round_order > 1 ? `After Round ${match.round_order - 1}` : `Seed ${ref}`;
  return null;
}

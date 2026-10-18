import type { SkAwardKind, SkCategory, SkDivision, SkFormat } from '@/lib/database.types';

export const categoryLabels: Record<SkCategory, string> = {
  ball_games: 'Ball games',
  athletics: 'Athletics',
  combat_sports: 'Combat sports',
  racket_sports: 'Racket sports',
  aquatics: 'Aquatics',
  mind_games: 'Mind games',
  esports: 'Esports',
  dance_cheer: 'Dance & cheer',
  pageant: 'Pageant',
  others: 'Others',
};

export const divisionLabels: Record<SkDivision, string> = { men: 'Men', women: 'Women', mixed: 'Mixed', open: 'Open' };

export const formatLabels: Record<SkFormat, string> = {
  bracket: 'Bracket (knockout)',
  round_robin: 'Round robin',
  round_robin_final: 'Round robin + final',
  timed: 'Timed / measured',
  judged: 'Judged',
};

export const categories = Object.keys(categoryLabels) as SkCategory[];
export const divisions = Object.keys(divisionLabels) as SkDivision[];
export const formats = Object.keys(formatLabels) as SkFormat[];

export const awardKindLabels: Record<SkAwardKind, string> = { mvp_of_day: 'MVP of the Day', athlete_of_day: 'Athlete of the Day', finals_mvp: 'Finals MVP' };
export const awardKinds = Object.keys(awardKindLabels) as SkAwardKind[];

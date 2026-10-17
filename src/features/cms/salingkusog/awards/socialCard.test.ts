import { skFixture } from '@/dev/skFixtures';
import { cardFileName, socialCardData, wrapText } from './socialCard';

const award = (id: string) => skFixture.awards.find((a) => a.id === id)!;
const data = (id: string) => socialCardData(award(id), skFixture, skFixture.edition, skFixture.matches, skFixture.placements, []);

describe('social cards', () => {
  it('MVP of the Day: portrait, stats and game footer', () => {
    const d = data('aw1');
    expect(d).toMatchObject({ layout: 'mvp', width: 1080, height: 1350, edition: 'SALINGKUSOG 2026', dayLabel: 'DAY 2', kicker: 'MVP OF THE DAY', name: 'Marco Villanueva' });
    expect(d.faction).toMatchObject({ name: 'Primordial Tiamat', short: 'PT' });
    expect(d.stats).toEqual([{ label: 'PTS', value: '24' }, { label: 'REB', value: '9' }]);
    expect(d.footer).toBe('Basketball · Men · Semifinal 1  ·  78–71 vs Sylvan Dragons');
    expect(d.stripe).toHaveLength(4);
  });

  it('Athlete of the Day: square, medal line and big result', () => {
    const d = data('aw2');
    expect(d).toMatchObject({ layout: 'athlete', width: 1080, height: 1080, kicker: 'ATHLETE OF THE DAY', name: 'Jessa Abad', big: '12.84s', subline: 'Gold  ·  100m Dash, Women' });
  });

  it('Finals MVP uses the portrait layout', () => {
    expect(data('aw3')).toMatchObject({ layout: 'mvp', kicker: 'FINALS MVP', dayLabel: 'DAY 3' });
  });

  it('wraps long names and builds a file name', () => {
    const measure = (s: string) => s.length * 10;
    expect(wrapText(measure, 'Angela Mercado', 100)).toEqual(['Angela', 'Mercado']);
    expect(wrapText(measure, 'Ana Maria Clara de la Cruz', 100, 2)).toEqual(['Ana Maria', 'Clara de la Cruz']);
    expect(cardFileName({ kicker: 'MVP OF THE DAY', dayLabel: 'DAY 3', name: 'Rafael Dela Peña' })).toBe('mvp-of-the-day-day-3-rafael-dela-pena.png');
  });
});

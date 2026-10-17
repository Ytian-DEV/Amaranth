import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { skFixture } from '@/dev/skFixtures';
import { dateSpan, hubPhase, liveAndNext, phasePill, podiumOrder, raceSeries, readableOn, standingsHeadline, whenLabel } from './hub';
import { MedalTallyView } from './MedalTallyView';
import { SalingkusogHeader } from './SalingkusogHeader';

const edition = { starts_on: '2026-11-02', ends_on: '2026-11-07' };
const hub = { factions: skFixture.factions, sports: skFixture.sports, events: skFixture.events, venues: skFixture.venues, logos: [], matches: skFixture.matches };
const phase = { kind: 'during', day: 4, of: 6 } as const;

describe('hub helpers', () => {
  it('knows where the edition stands', () => {
    expect(hubPhase(edition, '2026-10-30')).toEqual({ kind: 'before', startsIn: 3 });
    expect(hubPhase(edition, '2026-11-05')).toEqual({ kind: 'during', day: 4, of: 6 });
    expect(hubPhase(edition, '2026-11-09')).toEqual({ kind: 'after', of: 6 });
    expect(phasePill({ kind: 'during', day: 4, of: 6 })).toBe('Day 4 of 6');
    expect(phasePill({ kind: 'before', startsIn: 1 })).toBe('Starts tomorrow');
    expect(dateSpan('2026-10-26', '2026-10-30')).toBe('Oct 26–30, 2026');
    expect(dateSpan('2026-10-30', '2026-11-03')).toBe('Oct 30 – Nov 3, 2026');
  });

  it('writes the podium headline', () => {
    const t = skFixture.medalTable;
    expect(standingsHeadline(t)).toBe('Primordial Tiamat leads by a single point');
    expect(standingsHeadline([{ ...t[0], points: 20 }, { ...t[1], points: 14 }])).toBe('Primordial Tiamat leads by 6 points');
    expect(standingsHeadline([{ ...t[0], points: 9 }, { ...t[1], points: 9, rank: 1 }])).toBe('Primordial Tiamat and Centicore Vanguard are tied at the top');
    expect(standingsHeadline(t.map((r) => ({ ...r, points: 0 })))).toBe('The race for the overall title is on');
    expect(podiumOrder(t).map((r) => r.rank)).toEqual([2, 1, 3, 4]);
  });

  it('live games first, then the next ones', () => {
    const list = liveAndNext(skFixture.matches, new Date('2026-11-03T01:30:00Z'));
    expect(list.map((m) => m.id)).toEqual(['m2', 'm3', 'm4']);
  });

  it('points race stops at the current day', () => {
    const s = raceSeries(skFixture.pointsByDay, 4);
    expect(s.get('pt')?.map((p) => p.points)).toEqual([22, 47, 70, 90]);
  });

  it('picks readable text on faction colours', () => {
    expect(readableOn('rgb(37 99 201)')).toBe('light');
    expect(readableOn('rgb(168 208 42)')).toBe('dark');
    expect(readableOn('rgb(18 148 107)')).toBe('dark'); // small text: white is only 3.9:1
    expect(readableOn('rgb(18 148 107)', 3)).toBe('light'); // large podium numbers
  });

  it('formats times in Philippine time', () => {
    expect(whenLabel('2026-11-03T07:00:00Z', '2026-11-03')).toBe('Today · 3:00 PM');
    expect(whenLabel('2026-11-04T00:00:00Z', '2026-11-03')).toBe('Nov 4 · 8:00 AM');
  });
});

describe('Medal Tally', () => {
  it('header shows the edition, live count and day', () => {
    render(
      <MemoryRouter initialEntries={['/salingkusog']}>
        <SalingkusogHeader edition={skFixture.edition} factions={skFixture.factions} sportsCount={18} liveCount={2} phase={phase} />
      </MemoryRouter>,
    );
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Salingkusog 2026');
    expect(screen.getByText('2 matches live now')).toBeInTheDocument();
    expect(screen.getByText(/VSU Intramural Games · Nov 2–7, 2026 · 4 factions, 18 sports/)).toBeInTheDocument();
    expect(within(screen.getByRole('navigation', { name: 'Salingkusog' })).getByRole('link', { name: 'Medal Tally' })).toHaveAttribute('aria-current', 'page');
  });

  it('podium, table and live games', () => {
    render(
      <MemoryRouter>
        <MedalTallyView edition={skFixture.edition} hub={hub} table={skFixture.medalTable} race={skFixture.pointsByDay} phase={phase} now={new Date('2026-11-03T01:30:00Z')} />
      </MemoryRouter>,
    );
    expect(screen.getByRole('heading', { name: 'Primordial Tiamat leads by a single point' })).toBeInTheDocument();
    expect(screen.getByText('Overall standings after Day 4')).toBeInTheDocument();
    expect(screen.getAllByRole('listitem', { name: /^1st: Primordial Tiamat, 90 points/ })).toHaveLength(1);
    const table = screen.getByRole('table', { name: 'Medal Table' });
    const first = within(table).getAllByRole('row')[1];
    expect(first).toHaveTextContent('Primordial Tiamat');
    expect(first).toHaveTextContent('12 gold');
    expect(first).toHaveTextContent('90');
    expect(screen.getByRole('article', { name: /Basketball · Men: Centicore Vanguard vs Mystic Moirai/ })).toHaveTextContent('Live');
    expect(screen.getByRole('link', { name: /Full schedule/ })).toHaveAttribute('href', '/salingkusog/schedule');
  });
});

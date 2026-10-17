import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { skFixture } from '@/dev/skFixtures';
import { dateSpan, hubPhase, liveAndNext, phasePill, podiumOrder, raceSeries, readableOn, scheduleDay, scheduleGroups, standingsHeadline, whenLabel } from './hub';
import { ScheduleView } from './ScheduleView';
import { completedCount, winnerCards } from './winners';
import { WinnersView } from './WinnersView';
import { factionProfile } from './factions';
import { FactionView } from './FactionView';
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
    expect(list.map((m) => m.id)).toEqual(['m2', 'm3', 'm6']);
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

describe('Schedule & Results', () => {
  const sportOf = (eventId: string) => skFixture.events.find((e) => e.id === eventId)?.sport_id;

  it('opens on today during the games, else the first or last day', () => {
    expect(scheduleDay(edition, null, '2026-11-03')).toBe('2026-11-03');
    expect(scheduleDay(edition, '2026-11-05', '2026-11-03')).toBe('2026-11-05');
    expect(scheduleDay(edition, '2026-12-25', '2026-10-01')).toBe('2026-11-02');
    expect(scheduleDay(edition, null, '2027-01-01')).toBe('2026-11-07');
  });

  it('groups a day into live, later, completed and postponed', () => {
    const groups = scheduleGroups(skFixture.matches, '2026-11-03', { show: 'all' }, sportOf, '2026-11-03');
    expect(groups.map((g) => [g.title, g.matches.map((m) => m.id)])).toEqual([
      ['Live now', ['m2']],
      ['Later today', ['m3', 'm6']],
      ['Completed today', ['m1', 'm5']],
      ['Postponed or cancelled', ['m7']],
    ]);
    expect(scheduleGroups(skFixture.matches, '2026-11-03', { show: 'results' }, sportOf, '2026-11-03').map((g) => g.key)).toEqual(['completed']);
    expect(scheduleGroups(skFixture.matches, '2026-11-03', { show: 'all', sport: 'vb' }, sportOf, '2026-11-03').flatMap((g) => g.matches.map((m) => m.id))).toEqual(['m3', 'm6', 'm7']);
    expect(scheduleGroups(skFixture.matches, '2026-11-03', { show: 'all', faction: 'mm' }, sportOf, '2026-11-03').flatMap((g) => g.matches.map((m) => m.id))).toEqual(['m2', 'm6', 'm7']);
    expect(scheduleGroups(skFixture.matches, '2026-11-04', { show: 'all' }, sportOf, '2026-11-03')[0].title).toBe('Scheduled');
  });

  it('day tabs, filters and the PDF button', () => {
    const onDay = vi.fn();
    const onFilters = vi.fn();
    render(
      <MemoryRouter>
        <ScheduleView edition={skFixture.edition} hub={hub} pdf={{ bucket: 'archives', path: 'salingkusog/2026/schedule.pdf' }} day="2026-11-03" filters={{ show: 'all' }} onDay={onDay} onFilters={onFilters} today="2026-11-03" />
      </MemoryRouter>,
    );
    expect(screen.getByRole('button', { name: /Day 2/ })).toHaveAttribute('aria-current', 'date');
    fireEvent.click(screen.getByRole('button', { name: /Day 3/ }));
    expect(onDay).toHaveBeenCalledWith('2026-11-04');
    fireEvent.click(screen.getByRole('button', { name: 'Results' }));
    expect(onFilters).toHaveBeenCalledWith({ show: 'results' });
    fireEvent.change(screen.getByLabelText('Faction'), { target: { value: 'pt' } });
    expect(onFilters).toHaveBeenLastCalledWith({ show: 'all', faction: 'pt' });
    expect(screen.getByRole('link', { name: /Download PDF schedule/ }).getAttribute('href')).toMatch(/archives\/salingkusog\/2026\/schedule\.pdf$/);
    expect(screen.getByRole('heading', { name: /Live now/ })).toBeInTheDocument();
    expect(screen.getAllByRole('article')).toHaveLength(6);
  });
});

describe('Winners per game', () => {
  const cards = winnerCards(hub, skFixture.placements, skFixture.athletes);

  it('builds one card per event with results, newest first', () => {
    expect(cards.map((c) => c.title)).toEqual(['Basketball · Men', '100m Dash · Women']);
    const bb = cards[0];
    expect(bb).toMatchObject({ category: 'ball_games', final: true, venue: 'VSU Main Gymnasium', recapMatchId: 'm8' });
    expect(bb.rows.map((r) => [r.place, r.name, r.note, r.result])).toEqual([
      [1, 'Primordial Tiamat', 'Champion · beat CV in the final', '78–71'],
      [2, 'Centicore Vanguard', 'Runner-up', '71–78'],
      [3, 'Sylvan Dragons', 'Won the bronze game', '66–60'],
      [4, 'Mystic Moirai', 'Fourth place', '60–66'],
    ]);
    // individual event: athlete name, faction as the note, typed result
    expect(cards[1].rows[0]).toMatchObject({ name: 'Jessa Abad', note: 'Sylvan Dragons', result: '12.84s' });
    expect(completedCount(hub, skFixture.placements)).toEqual({ done: 2, total: 4 });
  });

  it('filters by category and links the recap', () => {
    const onCategory = vi.fn();
    render(
      <MemoryRouter>
        <WinnersView cards={cards} hub={hub} completed={{ done: 2, total: 4 }} category={null} onCategory={onCategory} />
      </MemoryRouter>,
    );
    expect(screen.getByText('2 of 4 events completed')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '2');
    fireEvent.click(screen.getByRole('button', { name: 'Athletics' }));
    expect(onCategory).toHaveBeenCalledWith('athletics');
    const card = screen.getByRole('article', { name: 'Basketball · Men' });
    expect(within(card).getByRole('link', { name: /Read the game recap/ })).toHaveAttribute('href', '/salingkusog/match/m8');
    expect(within(card).getByLabelText('gold, place 1')).toBeInTheDocument();
  });
});

describe('Faction profile', () => {
  it('computes recent results, head-to-head, medals and top athletes', () => {
    const p = factionProfile('pt', hub, skFixture.placements, skFixture.athletes);
    expect(p.recent.map((r) => [r.outcome, r.label, r.opponentId, r.score])).toEqual([
      ['W', 'Basketball · Men · Final', 'cv', '78–71'],
      ['W', 'Basketball · Men · Semifinal 1', 'sd', '78–71'],
      ['L', 'Basketball · Women · Semifinal 1', 'sd', '58–64'],
    ]);
    expect(p.headToHead).toEqual([
      { opponentId: 'cv', wins: 1, losses: 0 },
      { opponentId: 'sd', wins: 1, losses: 1 },
      { opponentId: 'mm', wins: 0, losses: 0 },
    ]);
    expect(p.medalsBySport).toEqual([
      { label: 'Basketball · Men', medal: 'gold' },
      { label: '100m Dash · Women', medal: 'silver' },
    ]);
    expect(p.topAthletes.map((t) => [t.athlete.name, t.line])).toEqual([['Marco Villanueva', 'Athletics · 1 silver']]);
  });

  it('renders the hero, switcher and panels', () => {
    render(
      <MemoryRouter initialEntries={['/salingkusog/factions/primordial-tiamat']}>
        <FactionView faction={skFixture.factions[0]} hub={hub} table={skFixture.medalTable} placements={skFixture.placements} athletes={skFixture.athletes} />
      </MemoryRouter>,
    );
    expect(screen.getByRole('heading', { name: 'Primordial Tiamat' })).toBeInTheDocument();
    expect(screen.getByText('“From the deep, we rise.”')).toBeInTheDocument();
    const hero = screen.getByRole('region', { name: 'Primordial Tiamat' });
    expect(within(hero).getByText('1st')).toBeInTheDocument();
    expect(within(hero).getByText('90')).toBeInTheDocument();
    expect(within(screen.getByRole('navigation', { name: 'Factions' })).getByRole('link', { name: /Primordial Tiamat/ })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: /Full history/ })).toHaveAttribute('href', '/salingkusog/schedule?faction=pt&show=results');
    expect(within(screen.getByRole('region', { name: 'Head-to-head' })).getByText('1W – 1L')).toBeInTheDocument();
    expect(screen.getAllByLabelText('Won')).toHaveLength(2);
  });
});

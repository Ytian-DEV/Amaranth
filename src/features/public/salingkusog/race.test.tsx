import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { skFixture } from '@/dev/skFixtures';
import { finalHeadline, resultsProgress, stepLabel, timelineSeries } from './hub';
import { MedalTallyView } from './MedalTallyView';
import type { HubData } from './skData';

describe('points race steps', () => {
  it('labels step ends in Manila time', () => {
    expect(stepLabel('2026-10-15T06:00:00Z', false)).toBe('2 PM'); // 14:00 Manila
    expect(stepLabel('2026-10-15T04:00:00Z', false)).toBe('12 PM');
    expect(stepLabel('2026-10-15T16:00:00Z', false)).toBe('midnight');
    expect(stepLabel('2026-10-15T16:00:00Z', true)).toBe('Oct 15, midnight'); // end of the 15th
    expect(stepLabel('2026-10-15T04:00:00Z', true)).toBe('Oct 15, 12 PM');
  });

  it('turns hour-step rows into ordered steps per faction', () => {
    const rows = [
      { faction_id: 'a', bucket_end: '2026-10-15T02:00:00Z', points: 3 },
      { faction_id: 'b', bucket_end: '2026-10-15T01:00:00Z', points: 0 },
      { faction_id: 'a', bucket_end: '2026-10-15T01:00:00Z', points: 0 },
      { faction_id: 'b', bucket_end: '2026-10-15T02:00:00Z', points: 5 },
    ];
    const { steps, series } = timelineSeries(rows);
    expect(steps).toEqual(['2026-10-15T01:00:00Z', '2026-10-15T02:00:00Z']);
    expect(series.get('a')).toEqual([0, 3]);
    expect(series.get('b')).toEqual([0, 5]);
  });

  it('offers 1h, 3h, 6h, 12h and Day, and reports the choice', () => {
    const hub = { factions: skFixture.factions, sports: [], events: [], venues: [], logos: [], matches: [] } as unknown as HubData;
    const onRange = vi.fn();
    render(
      <MemoryRouter>
        <MedalTallyView edition={skFixture.edition} hub={hub} table={skFixture.medalTable} race={skFixture.pointsByDay} phase={{ kind: 'during', day: 2, of: 5 } as never} range="day" onRange={onRange} />
      </MemoryRouter>,
    );
    const group = screen.getByRole('group', { name: 'Time steps' });
    expect([...group.querySelectorAll('button')].map((b) => b.textContent)).toEqual(['1h', '3h', '6h', '12h', 'Day']);
    expect(screen.getByRole('button', { name: 'Day' })).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(screen.getByRole('button', { name: '3h' }));
    expect(onRange).toHaveBeenCalledWith(3);
  });
});

describe('official tally', () => {
  const rows = skFixture.medalTable;

  it('counts finished matches, leaving cancelled ones out', () => {
    expect(resultsProgress([{ status: 'final' }, { status: 'live' }, { status: 'cancelled' }, { status: 'postponed' }])).toEqual({ done: 1, total: 3, final: false });
    expect(resultsProgress([{ status: 'final' }, { status: 'cancelled' }])).toEqual({ done: 1, total: 1, final: true });
    expect(resultsProgress([]).final).toBe(false);
  });

  it('declares the champions once every match is final', () => {
    const top = [...rows].sort((a, b) => a.rank - b.rank)[0];
    expect(finalHeadline(rows)).toBe(`${top.name} are the overall champions`);
    expect(finalHeadline([{ ...top, rank: 1 }, { ...top, name: 'Other', rank: 1 }])).toBe(`${top.name} and Other share the overall title`);
    const hub = { factions: skFixture.factions, sports: [], events: [], venues: [], logos: [], matches: [{ id: 'x', status: 'final' }] } as unknown as HubData;
    render(
      <MemoryRouter>
        <MedalTallyView edition={skFixture.edition} hub={hub} table={rows} race={skFixture.pointsByDay} phase={{ kind: 'after' } as never} />
      </MemoryRouter>,
    );
    expect(screen.getByText('Official and final medal tally')).toBeInTheDocument();
    expect(screen.getByRole('list', { name: 'Winners' })).toHaveTextContent('Overall champion');
  });

  it('shows results in while matches are left', () => {
    const hub = { factions: skFixture.factions, sports: [], events: [], venues: [], logos: [], matches: [{ id: 'x', status: 'final' }, { id: 'y', status: 'upcoming' }] } as unknown as HubData;
    render(
      <MemoryRouter>
        <MedalTallyView edition={skFixture.edition} hub={hub} table={rows} race={skFixture.pointsByDay} phase={{ kind: 'during', day: 2, of: 5 } as never} />
      </MemoryRouter>,
    );
    expect(screen.getByRole('progressbar', { name: 'Matches finished' })).toHaveAttribute('aria-valuenow', '1');
    expect(screen.queryByText('Official and final medal tally')).not.toBeInTheDocument();
  });
});

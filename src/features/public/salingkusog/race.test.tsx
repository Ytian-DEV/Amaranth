import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { skFixture } from '@/dev/skFixtures';
import { stepLabel, timelineSeries } from './hub';
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

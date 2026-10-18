import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { skFixture } from '@/dev/skFixtures';
import type { SkEntryRow, SkMatchRow } from '@/lib/database.types';
import { SportsView } from '../setup/SportsTab';
import { ContestScorekeeper } from './ContestScorekeeper';

const noop = () => undefined;
const race = skFixture.events[3]; // 100m dash: timed, individual, seconds
const session = { ...skFixture.matches[0], id: 'c1', event_id: race.id, side_a_id: null, side_b_id: null, is_contest: true, status: 'live', round: 'Final' } as SkMatchRow;
const entry = (id: string, faction_id: string, lane: number, extra: Partial<SkEntryRow> = {}) =>
  ({ id, edition_id: 'e1', match_id: 'c1', faction_id, athlete_id: null, lane, result: null, place: null, status: 'ok', created_at: '', updated_at: '', ...extra }) as SkEntryRow;
const lookups = { ...skFixture, events: skFixture.events };

const view = (entries: SkEntryRow[], event = race) =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter>
        <ContestScorekeeper match={session} event={event} entries={entries} lookups={lookups} confirmMedals={false} />
      </MemoryRouter>
    </QueryClientProvider>,
  );

describe('contest scorekeeper', () => {
  it('lists the line-up in order and places the results as they come in', () => {
    view([entry('x2', 'sd', 2, { result: 12.61 }), entry('x1', 'pt', 1, { result: 12.84 }), entry('x3', 'cv', 3)]);
    const rows = screen.getAllByRole('listitem');
    expect(rows[0]).toHaveTextContent('Primordial Tiamat');
    expect(screen.getByLabelText('Place: 1st')).toBeInTheDocument();
    expect(screen.getByLabelText('Result, Sylvan Dragons')).toHaveValue('12.61s');
    expect(screen.getByRole('combobox', { name: 'Athlete, Primordial Tiamat' })).toBeInTheDocument();
  });

  it('won’t finish while a result is missing', () => {
    view([entry('x1', 'pt', 1, { result: 12.84 }), entry('x3', 'cv', 3)]);
    fireEvent.click(screen.getByRole('button', { name: 'Finish contest' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Enter every result first');
  });

  it('judged events take places, not results', () => {
    const dance = { ...race, format: 'judged' as const, is_team: true, result_unit: null };
    view([entry('y1', 'pt', 1, { place: 2 }), entry('y2', 'sd', 2, { place: 1 })], dance);
    expect(screen.getByLabelText('Place, Primordial Tiamat')).toHaveValue('2');
    expect(screen.queryByRole('combobox', { name: /Athlete/ })).not.toBeInTheDocument();
    expect(screen.getByText(/as the judges announce it/)).toBeInTheDocument();
  });
});

describe('Create contest', () => {
  it('is offered for timed and judged events', () => {
    const onContest = vi.fn();
    render(<SportsView sports={skFixture.sports} events={skFixture.events} venues={skFixture.venues} onAddSport={noop} onEditSport={noop} onDeleteSport={noop} onAddEvent={noop} onEditEvent={noop} onDeleteEvent={noop} onContest={onContest} />);
    expect(screen.getAllByRole('button', { name: /Create contest/ })).toHaveLength(1);
    fireEvent.click(screen.getByRole('button', { name: /Create contest/ }));
    expect(onContest).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ id: race.id }));
  });
});

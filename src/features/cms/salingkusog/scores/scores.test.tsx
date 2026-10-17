import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { skFixture } from '@/dev/skFixtures';
import { AwardsView } from '../awards/AwardsTab';
import { toPlacementInput, toRow } from '../results/placementForm';
import { ResultsEditorView } from '../results/ResultsTab';
import { formatStatLine, parseStatLine } from '../scoring';
import { ScorekeeperView } from './Scorekeeper';
import { ScoresView } from './ScoresTab';

const lookups = skFixture;
const noop = () => undefined;
const inRouter = (ui: React.ReactNode) => render(<MemoryRouter>{ui}</MemoryRouter>);

describe('ScoresView', () => {
  it('shows one day: live, then upcoming, then finished', () => {
    const onDay = vi.fn();
    inRouter(<ScoresView edition={skFixture.edition} matches={skFixture.matches} lookups={lookups} day="2026-11-03" onDay={onDay} sportId="" onSport={noop} onAdd={noop} />);
    const rows = within(screen.getByRole('list', { name: /Games on/ })).getAllByRole('link');
    expect(rows.map((r) => r.getAttribute('href'))).toEqual(['m2', 'm3', 'm6', 'm7', 'm5', 'm1'].map((id) => `/admin/salingkusog/scores/${id}`));
    expect(rows[0]).toHaveTextContent('Live');
    expect(screen.getByText('1 live now')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('tab', { name: /Day 3/ }));
    expect(onDay).toHaveBeenCalledWith('2026-11-04');
  });
});

describe('ScorekeeperView', () => {
  const live = skFixture.matches[1];

  it('basketball gets +1/+2/+3 and the live actions', () => {
    const onDraft = vi.fn();
    const onStatus = vi.fn();
    inRouter(<ScorekeeperView match={live} lookups={lookups} saving="idle" error={null} onDraft={onDraft} onStatus={onStatus} onEdit={noop} onDelete={noop} />);
    fireEvent.click(screen.getByRole('button', { name: 'Centicore Vanguard plus 3' }));
    expect(onDraft).toHaveBeenCalledWith({ score_a: 57 });
    fireEvent.click(screen.getByRole('button', { name: 'Mystic Moirai minus 1' }));
    expect(onDraft).toHaveBeenCalledWith({ score_b: 57 });
    fireEvent.click(screen.getByRole('button', { name: 'Add Q4' }));
    expect(onDraft).toHaveBeenLastCalledWith({ periods: [...live.periods, { label: 'Q4', a: null, b: null }] });
    fireEvent.click(screen.getByRole('button', { name: 'Finish game' }));
    expect(onStatus).toHaveBeenCalledWith('final');
    expect(screen.getByLabelText('Live note')).toHaveValue('Q3 · 4:12');
  });

  it('a final game is locked until reopened', () => {
    inRouter(<ScorekeeperView match={skFixture.matches[0]} lookups={lookups} saving="saved" error={null} onDraft={noop} onStatus={noop} onEdit={noop} onDelete={noop} />);
    expect(screen.getByRole('button', { name: 'Primordial Tiamat plus 1' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Reopen (fix the score)' })).toBeEnabled();
    expect(screen.getByText('Saved')).toBeInTheDocument();
  });
});

describe('results', () => {
  it('validates the form rows', () => {
    expect(toPlacementInput([toRow({ place: 1 }, '2026-11-03')], true)).toEqual([]); // empty rows are dropped
    expect(toPlacementInput([toRow({ place: 1, result: '12.8s' }, '2026-11-03')], true)).toMatch(/faction/);
    expect(toPlacementInput([toRow({ place: 1, faction_id: 'pt' }, '2026-11-03')], false)).toMatch(/athlete/);
    expect(toPlacementInput([toRow({ place: 1, faction_id: 'pt', result: ' 12.8s ' }, '2026-11-03')], true)).toEqual([
      { place: 1, faction_id: 'pt', athlete_id: null, result: '12.8s', awarded_on: '2026-11-03' },
    ]);
  });

  it('fills the podium from finished games and saves', () => {
    const onSave = vi.fn();
    const event = skFixture.events[0];
    const final = { ...skFixture.matches[0], id: 'f', round: 'Final', round_order: 2 };
    inRouter(<ResultsEditorView event={event} lookups={lookups} games={[final]} placements={[]} day="2026-11-03" onSave={onSave} />);
    fireEvent.click(screen.getByRole('button', { name: 'Fill from games' }));
    fireEvent.click(screen.getByRole('button', { name: 'Save results' }));
    expect(onSave).toHaveBeenCalledWith([
      expect.objectContaining({ place: 1, faction_id: 'pt' }),
      expect.objectContaining({ place: 2, faction_id: 'sd' }),
    ]);
  });
});

it('AwardsView groups awards by day', () => {
  inRouter(<AwardsView edition={skFixture.edition} awards={skFixture.awards} lookups={lookups} onAdd={noop} onEdit={noop} onDelete={noop} />);
  const day = screen.getByRole('region', { name: /Day 2/ });
  expect(day).toHaveTextContent('MVP of the Day');
  expect(day).toHaveTextContent('Marco Villanueva');
  expect(day).toHaveTextContent('PTS 24, REB 9');
});

it('stat lines round-trip', () => {
  expect(parseStatLine('PTS 24, REB: 9; FG% 46%, note=hot')).toEqual({ PTS: 24, REB: 9, 'FG%': '46%', note: 'hot' });
  expect(formatStatLine({ PTS: 24, AST: 5 })).toBe('PTS 24, AST 5');
});

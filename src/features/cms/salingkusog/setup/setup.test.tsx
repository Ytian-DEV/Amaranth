import { fireEvent, render, screen } from '@testing-library/react';
import { skFixture } from '@/dev/skFixtures';
import { parseCsv } from '../scheduleCsv';
import { FactionsView } from './FactionsTab';
import { ImportView } from './ImportTab';
import { SportsView } from './SportsTab';

const noop = () => undefined;

describe('FactionsView', () => {
  it('lists factions with short names and edit/delete per row', () => {
    const onDelete = vi.fn();
    render(<FactionsView factions={skFixture.factions} logos={[]} onAdd={noop} onEdit={noop} onDelete={onDelete} />);
    expect(screen.getByText('Primordial Tiamat')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Delete Sylvan Dragons' }));
    expect(onDelete).toHaveBeenCalledWith(expect.objectContaining({ slug: 'sylvan-dragons' }));
  });
});

describe('SportsView', () => {
  it('groups events under their sport', () => {
    const onAddEvent = vi.fn();
    render(
      <SportsView
        sports={skFixture.sports}
        events={skFixture.events}
        venues={skFixture.venues}
        onAddSport={noop}
        onEditSport={noop}
        onDeleteSport={noop}
        onAddEvent={onAddEvent}
        onEditEvent={noop}
        onDeleteEvent={noop}
      />,
    );
    const basketball = screen.getByRole('region', { name: /Basketball/ });
    expect(basketball).toHaveTextContent('Men');
    expect(basketball).toHaveTextContent('VSU Main Gymnasium');
    fireEvent.click(screen.getByRole('button', { name: 'Add event to Athletics' }));
    expect(onAddEvent).toHaveBeenCalledWith(expect.objectContaining({ slug: 'athletics' }));
  });
});

describe('ImportView', () => {
  it('previews pasted rows and imports only the ready ones', () => {
    const onImport = vi.fn();
    render(<ImportView setup={{ ...skFixture, existing: [] }} onImport={onImport} />);
    fireEvent.change(screen.getByLabelText(/paste the rows/), {
      target: { value: 'date,time,sport,event,side_a,side_b\n2026-11-03,08:00,Basketball,Men,PT,SD\n2026-11-03,09:00,Chess,,PT,SD' },
    });
    expect(screen.getByText(/1 ready · 1 with problems · 0 already/)).toBeInTheDocument();
    expect(screen.getByText('Unknown sport “Chess”.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Import 1 game' }));
    expect(onImport).toHaveBeenCalledWith([expect.objectContaining({ scheduled_at: '2026-11-03T08:00:00+08:00', round: null })]);
  });
});

it('parseCsv drops a byte-order mark', () => {
  expect(parseCsv(`${String.fromCharCode(0xfeff)}date\n1`)).toEqual([['date'], ['1']]);
});

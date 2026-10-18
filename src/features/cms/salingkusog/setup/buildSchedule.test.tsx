import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import { skFixture } from '@/dev/skFixtures';
import { BuildScheduleModal } from './BuildScheduleModal';
import { SportsView } from './SportsTab';

const noop = () => undefined;

// jsdom has no <dialog> methods
beforeAll(() => {
  HTMLDialogElement.prototype.showModal ??= function (this: HTMLDialogElement) {
    this.open = true;
  };
  HTMLDialogElement.prototype.close ??= function (this: HTMLDialogElement) {
    this.open = false;
  };
});
const wrap = (ui: React.ReactElement) => render(<QueryClientProvider client={new QueryClient()}>{ui}</QueryClientProvider>);

describe('Build schedule', () => {
  it('is offered for team brackets and round robins only', () => {
    const onBuild = vi.fn();
    render(<SportsView sports={skFixture.sports} events={skFixture.events} venues={skFixture.venues} onAddSport={noop} onEditSport={noop} onDeleteSport={noop} onAddEvent={noop} onEditEvent={noop} onDeleteEvent={noop} onBuild={onBuild} />);
    expect(screen.getAllByRole('button', { name: /Build schedule/ })).toHaveLength(3); // not the 100m dash
    fireEvent.click(screen.getByRole('button', { name: 'Build schedule for Basketball Men' }));
    expect(onBuild).toHaveBeenCalledWith(expect.objectContaining({ slug: 'basketball' }), expect.objectContaining({ id: 'bb-m' }));
  });

  it('is offered for individual events too (chess, arnis, taekwondo)', () => {
    const chess = { ...skFixture.events[0], id: 'chess-m', name: 'Chess Men', is_team: false, format: 'round_robin_final' as const };
    render(<SportsView sports={skFixture.sports} events={[chess]} venues={skFixture.venues} onAddSport={noop} onEditSport={noop} onDeleteSport={noop} onAddEvent={noop} onEditEvent={noop} onDeleteEvent={noop} onBuild={noop} />);
    expect(screen.getByRole('button', { name: /Build schedule for Basketball Chess Men/ })).toBeInTheDocument();
  });

  it('orders the seeds and says how many games it creates', () => {
    wrap(<BuildScheduleModal edition={skFixture.edition} sport={skFixture.sports[0]} event={skFixture.events[0]} factions={skFixture.factions} venues={skFixture.venues} games={[]} onClose={noop} />);
    expect(screen.getByText(/Creates 4 games over 2 rounds/)).toBeInTheDocument();
    const first = skFixture.factions[0].name;
    fireEvent.click(screen.getByRole('button', { name: `Move ${first} down` }));
    expect(screen.getAllByRole('listitem')[1]).toHaveTextContent(first);
    fireEvent.click(screen.getByRole('radio', { name: /Round robin \+ final/ }));
    expect(screen.getByText(/Creates 8 games over 4 rounds/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('checkbox', { name: skFixture.factions[3].name }));
    expect(screen.getByText(/Creates 4 games over 4 rounds/)).toBeInTheDocument(); // 3 factions: 3 games + final
  });

  it('won’t rebuild once games are played', () => {
    wrap(<BuildScheduleModal edition={skFixture.edition} sport={skFixture.sports[0]} event={skFixture.events[0]} factions={skFixture.factions} venues={skFixture.venues} games={skFixture.matches.filter((m) => m.event_id === 'bb-m')} onClose={noop} />);
    expect(screen.getByText(/already has games played/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Rebuild schedule' })).toBeDisabled();
  });
});

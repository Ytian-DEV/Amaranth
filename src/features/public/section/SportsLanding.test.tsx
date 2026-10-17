import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { fixtureSection } from '@/dev/fixtures';
import { skFixture } from '@/dev/skFixtures';
import { latestResults, shortEventLabel } from '@/features/public/salingkusog/hub';
import { SportsLanding } from './SportsLanding';

const hub = { factions: skFixture.factions, sports: skFixture.sports, events: skFixture.events, venues: skFixture.venues, logos: [], matches: skFixture.matches };
const sk = {
  edition: skFixture.edition,
  hub,
  table: skFixture.medalTable,
  phase: { kind: 'during', day: 4, of: 6 } as const,
  spotlight: { award: skFixture.awards.find((a) => a.id === 'aw2')!, athlete: skFixture.athletes[1], photo: null },
};
const renderLanding = (props: Partial<Parameters<typeof SportsLanding>[0]> = {}) =>
  render(
    <MemoryRouter>
      <SportsLanding categories={[{ slug: 'basketball', name: 'Basketball' }]} items={fixtureSection.items} hasMore sk={sk} {...props} />
    </MemoryRouter>,
  );

it('results strip helpers', () => {
  expect(latestResults(skFixture.matches).map((m) => m.id)).toEqual(['m2', 'm8', 'm9', 'm1', 'm5']);
  expect(shortEventLabel('Volleyball', { name: 'Women', division: 'women' })).toBe('Volleyball W');
  expect(shortEventLabel('Athletics', { name: '100m Dash · Women', division: 'women' })).toBe('100m Dash · Women');
});

describe('SportsLanding', () => {
  it('shows results, the Salingkusog block, latest stories and the spotlight', () => {
    renderLanding();
    const strip = screen.getByRole('region', { name: 'Latest Salingkusog results' });
    expect(within(strip).getAllByRole('link')[0]).toHaveAttribute('href', '/salingkusog/match/m2');
    expect(within(strip).getAllByRole('link')[0]).toHaveTextContent(/Basketball M\s*Live/);
    const block = screen.getByRole('complementary', { name: 'Salingkusog 2026' });
    expect(within(block).getAllByRole('listitem')).toHaveLength(4);
    expect(within(block).getByRole('link', { name: /Open the Salingkusog hub/ })).toHaveAttribute('href', '/salingkusog');
    expect(screen.getByRole('link', { name: 'Salingkusog 2026' })).toHaveAttribute('href', '/salingkusog');
    expect(screen.getByRole('link', { name: 'Basketball' })).toHaveAttribute('href', '/sports?category=basketball');
    expect(screen.getByRole('heading', { name: fixtureSection.items[0].title })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Latest in Sports' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '“I ran for my block.”' })).toBeInTheDocument();
  });

  it('works without a Salingkusog edition', () => {
    renderLanding({ sk: null, hasMore: false });
    expect(screen.queryByRole('region', { name: 'Latest Salingkusog results' })).not.toBeInTheDocument();
    expect(screen.queryByRole('complementary')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: fixtureSection.items[0].title })).toBeInTheDocument();
  });
});

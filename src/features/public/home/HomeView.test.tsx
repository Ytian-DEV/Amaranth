import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { fixtureHome, fixtureHomeEmpty } from '@/dev/fixtures';
import { HomeView } from './HomeView';

const renderHome = (data = fixtureHome) =>
  render(
    <MemoryRouter>
      <HomeView data={data} />
    </MemoryRouter>,
  );

describe('HomeView', () => {
  it('renders the lead story as the page h1 and every Figma block', () => {
    renderHome();
    expect(screen.getByRole('heading', { level: 1, name: fixtureHome.lead!.title })).toBeInTheDocument();
    for (const name of ['Latest Stories', 'Literary Folio', 'Sports', 'Views & Opinion', 'Have a story the campus needs to hear?']) {
      expect(screen.getByRole('heading', { level: 2, name })).toBeInTheDocument();
    }
    expect(screen.getAllByRole('heading', { level: 2, name: 'Most Read' }).length).toBeGreaterThan(0);
    expect(screen.getByRole('link', { name: 'Submit an Article' })).toHaveAttribute('href', '/submit');
  });

  it('shows the ticker with links', () => {
    renderHome();
    expect(screen.getByRole('region', { name: 'Latest headlines' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: fixtureHome.ticker[0].text })).toBeInTheDocument();
  });

  it('has an empty state before anything is published', () => {
    renderHome(fixtureHomeEmpty);
    expect(screen.getByText('The first stories are on their way')).toBeInTheDocument();
  });
});

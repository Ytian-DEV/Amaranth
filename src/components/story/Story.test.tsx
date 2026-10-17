import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { fixtureStories } from '@/dev/fixtures';
import { SectionHeader, StoryCard, StoryRow } from './Story';

describe('story components', () => {
  it('StoryCard links the headline to the article and shows meta', () => {
    render(
      <MemoryRouter>
        <StoryCard story={fixtureStories[1]} />
      </MemoryRouter>,
    );
    const link = screen.getByRole('link', { name: fixtureStories[1].title });
    expect(link).toHaveAttribute('href', `/article/${fixtureStories[1].slug}`);
    expect(screen.getByText(/By Juan Dela Cruz · Oct 14, 2026 · 4 min read/)).toBeInTheDocument();
  });

  it('StoryRow pads the number', () => {
    render(
      <MemoryRouter>
        <StoryRow story={fixtureStories[6]} index={1} />
      </MemoryRouter>,
    );
    expect(screen.getByText('01')).toBeInTheDocument();
  });

  it('SectionHeader gives the see-all link an accessible name', () => {
    render(
      <MemoryRouter>
        <SectionHeader title="Sports" href="/section/sports" linkLabel="All sports" />
      </MemoryRouter>,
    );
    expect(screen.getByRole('heading', { name: 'Sports' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /All sports.*Sports/ })).toHaveAttribute('href', '/section/sports');
  });
});

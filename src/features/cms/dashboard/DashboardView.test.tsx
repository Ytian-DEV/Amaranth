import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { fixtureQueue, fixtureRecent, fixtureStats } from '@/dev/fixtures';
import { DashboardView } from './DashboardView';
import { greeting } from './greeting';

const renderView = (props: Partial<React.ComponentProps<typeof DashboardView>> = {}) =>
  render(
    <MemoryRouter>
      <DashboardView name="Ana Reyes" canReview stats={fixtureStats} recent={fixtureRecent} queue={fixtureQueue} {...props} />
    </MemoryRouter>,
  );

describe('DashboardView', () => {
  it('greets by first name and shows the four stats', () => {
    renderView();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/, Ana$/);
    const stats = within(screen.getByRole('list', { name: 'Newsroom at a glance' }));
    expect(stats.getByText('128')).toBeInTheDocument();
    expect(stats.getByText('8.4k')).toBeInTheDocument();
    expect(stats.getByText('Oldest: 2 days')).toBeInTheDocument();
  });

  it('lists recent articles with edit links and the submission queue', () => {
    renderView();
    const byHref = (href: string) => screen.getAllByRole('link').filter((l) => l.getAttribute('href') === href);
    expect(byHref('/admin/articles/r1')[0]).toHaveTextContent('Edit Inside the campus fight');
    expect(byHref('/admin/submissions/q1')[0]).toHaveTextContent('Review A love letter');
    expect(byHref('/admin/events/q2')[0]).toHaveTextContent('Review Event: Org Fair');
  });

  it('hides editor-only blocks for writers', () => {
    renderView({ canReview: false, stats: { ...fixtureStats, pending_submissions: null } });
    expect(screen.queryByRole('heading', { name: 'Submission Queue' })).not.toBeInTheDocument();
    expect(screen.getByText('My drafts')).toBeInTheDocument();
  });

  it('greets by Manila time', () => {
    expect(greeting(new Date('2026-10-17T00:30:00Z'))).toBe('Good morning'); // 08:30 Manila
    expect(greeting(new Date('2026-10-17T07:00:00Z'))).toBe('Good afternoon'); // 15:00
    expect(greeting(new Date('2026-10-17T12:00:00Z'))).toBe('Good evening'); // 20:00
  });
});

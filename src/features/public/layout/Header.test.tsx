import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { defaultSections } from '../nav';
import { MorePanel, SiteHeader } from './Header';

// jsdom has no <dialog> methods (the mobile drawer)
beforeAll(() => {
  HTMLDialogElement.prototype.showModal ??= function (this: HTMLDialogElement) {
    this.open = true;
  };
  HTMLDialogElement.prototype.close ??= function (this: HTMLDialogElement) {
    this.open = false;
  };
});

const more = defaultSections.filter((s) => s.nav_placement === 'more');

describe('More menu', () => {
  it('shows each section with its pitch and latest story, plus the Also links', () => {
    render(
      <MemoryRouter>
        <MorePanel sections={more} latest={{ investigative: { title: 'Where did the lab equipment fund go?', slug: 'lab-fund' } }} />
      </MemoryRouter>,
    );
    expect(screen.getByRole('link', { name: /^S&T\s*\(Science & Technology\)$/ })).toHaveAttribute('href', '/science-technology');
    expect(screen.getByText('Campus policies, explained simply.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Where did the lab equipment fund go/ })).toHaveAttribute('href', '/article/lab-fund');
    expect(screen.getAllByText('Latest')).toHaveLength(1);
    expect(screen.getByRole('link', { name: 'Salingkusog 2026' })).toHaveAttribute('href', '/salingkusog');
  });

  it('opens from the header and closes with Escape, returning focus', () => {
    render(
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <MemoryRouter>
          <SiteHeader />
        </MemoryRouter>
      </QueryClientProvider>,
    );
    const nav = screen.getAllByRole('navigation', { name: 'Sections' })[0];
    const button = within(nav).getByRole('button', { name: 'More' });
    fireEvent.click(button);
    expect(button).toHaveAttribute('aria-expanded', 'true');
    const panel = document.getElementById(button.getAttribute('aria-controls')!)!;
    expect(within(panel).getByRole('link', { name: 'Bulletin' })).toHaveAttribute('href', '/bulletin');
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(button).toHaveFocus();
    expect(screen.queryByText('Also on Amaranth')).not.toBeInTheDocument();
  });
});

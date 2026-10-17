import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { skFixture } from '@/dev/skFixtures';
import { EditionTab } from '@/features/cms/salingkusog/setup/EditionTab';
import { defaultCountdownAt, remaining, remainingSentence, startLine } from '@/lib/countdown';
import { CountdownView } from './CountdownView';

const countdown = vi.hoisted(() => ({ value: { isPending: false, error: null as unknown, data: null as null | { title: string; subtitle: null; starts_on: string; countdown_at: string } } }));
vi.mock('./skData', () => ({ useCountdown: () => countdown.value }));
const { CountdownPage } = await import('./CountdownPage');

describe('countdown maths (Asia/Manila target, same for everyone)', () => {
  it('splits the time left and stops at zero', () => {
    const target = '2026-11-02T08:00:00+08:00';
    expect(remaining(target, new Date('2026-10-30T22:59:30Z'))).toEqual({ days: 2, hours: 1, minutes: 0, seconds: 30, done: false });
    expect(remaining(target, new Date('2026-11-02T00:00:00Z'))).toMatchObject({ done: true, seconds: 0 });
    expect(remaining('not a date')).toMatchObject({ done: true });
    expect(defaultCountdownAt('2026-11-02')).toBe('2026-11-02T08:00:00+08:00');
    expect(startLine(target)).toBe('Monday, November 2, 2026 · 8:00 AM, Philippine time');
  });

  it('says it in words for screen readers', () => {
    expect(remainingSentence({ days: 2, hours: 1, minutes: 0, seconds: 30, done: false })).toBe('2 days, 1 hour and 0 minutes until the games begin.');
    expect(remainingSentence({ days: 0, hours: 0, minutes: 5, seconds: 2, done: false })).toBe('5 minutes until the games begin.');
    expect(remainingSentence({ days: 0, hours: 0, minutes: 0, seconds: 0, done: true })).toBe('The games have begun.');
  });
});

describe('CountdownView', () => {
  const wrap = (ui: React.ReactNode) => render(<MemoryRouter>{ui}</MemoryRouter>);

  it('shows days, hours, minutes, seconds and an accessible timer', () => {
    wrap(<CountdownView title="Salingkusog 2026" target="2026-11-02T08:00:00+08:00" now={new Date('2026-10-30T22:59:30Z')} />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Salingkusog 2026');
    const timer = screen.getByRole('timer', { name: 'Countdown to Salingkusog 2026' });
    expect(timer).toHaveTextContent('2 days, 1 hour and 0 minutes until the games begin.');
    expect(timer).toHaveTextContent(/2\s*Days\s*01\s*Hours\s*00\s*Minutes\s*30\s*Seconds/);
    expect(screen.getByText(/Opening: Monday, November 2, 2026/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Continue to Salingkusog/ })).toHaveAttribute('href', '/salingkusog-2026');
  });

  it('switches to "The games have begun" at zero', () => {
    wrap(<CountdownView title="Salingkusog 2026" target="2026-11-02T08:00:00+08:00" now={new Date('2026-11-02T01:00:00Z')} />);
    expect(screen.queryByRole('timer')).not.toBeInTheDocument();
    expect(screen.getByText('The games have begun')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Continue to Salingkusog/ })).toHaveClass('px-8');
  });
});

describe('Continue launch', () => {
  const routed = () =>
    render(
      <MemoryRouter initialEntries={['/c']}>
        <Routes>
          <Route path="/c" element={<CountdownView title="Salingkusog 2026" target="2099-01-01T08:00:00+08:00" />} />
          <Route path="/salingkusog-2026" element={<p>Hub</p>} />
        </Routes>
      </MemoryRouter>,
    );
  afterEach(() => vi.useRealTimers());

  it('plays the launch, then opens the hub', () => {
    vi.useFakeTimers();
    routed();
    fireEvent.click(screen.getByRole('link', { name: /Continue to Salingkusog/ }));
    expect(screen.getByRole('status')).toHaveTextContent('Let the games begin');
    expect(screen.queryByText('Hub')).not.toBeInTheDocument();
    act(() => vi.advanceTimersByTime(2800));
    expect(screen.getByText('Hub')).toBeInTheDocument();
  });

  it('a click on the launch skips straight to the hub', () => {
    vi.useFakeTimers();
    routed();
    fireEvent.click(screen.getByRole('link', { name: /Continue to Salingkusog/ }));
    fireEvent.click(screen.getByRole('status'));
    expect(screen.getByText('Hub')).toBeInTheDocument();
  });

  it('ctrl/cmd-click opens normally (no animation)', () => {
    routed();
    fireEvent.click(screen.getByRole('link', { name: /Continue to Salingkusog/ }), { ctrlKey: true });
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});

describe('CountdownPage', () => {
  const page = () =>
    render(
      <MemoryRouter initialEntries={['/salingkusog-2026/countdown']}>
        <Routes>
          <Route path="/salingkusog-2026/countdown" element={<CountdownPage />} />
          <Route path="/salingkusog-2026" element={<p>Hub</p>} />
        </Routes>
      </MemoryRouter>,
    );

  it('switched off: sends visitors to the Salingkusog hub', () => {
    countdown.value = { isPending: false, error: null, data: null };
    page();
    expect(screen.getByText('Hub')).toBeInTheDocument();
  });

  it('switched on: shows the countdown', () => {
    countdown.value = { isPending: false, error: null, data: { title: 'Salingkusog 2026', subtitle: null, starts_on: '2099-01-01', countdown_at: '2099-01-01T08:00:00+08:00' } };
    page();
    expect(screen.getByRole('timer')).toBeInTheDocument();
  });
});

describe('newsroom setting', () => {
  const tab = (canManage: boolean) =>
    render(
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter>
          <EditionTab edition={skFixture.edition} canManage={canManage} onSelect={() => undefined} />
        </MemoryRouter>
      </QueryClientProvider>,
    );

  it('only the managing roles see "Show Countdown Page"', () => {
    tab(true);
    expect(screen.getByLabelText('Show Countdown Page')).not.toBeChecked();
    expect(screen.getByLabelText(/Count down to/)).toHaveValue('2026-11-02T08:00');
  });

  it('team members do not', () => {
    tab(false);
    expect(screen.queryByLabelText('Show Countdown Page')).not.toBeInTheDocument();
  });
});

import { ExternalLink, LogOut, Menu, X } from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { SkipLink } from '@/components/ui/a11y';
import { Lockup } from '@/components/ui/Logo';
import { isEditor, roleLabels } from '@/features/auth/permissions';
import { useAuth } from '@/features/auth/AuthProvider';
import { cn } from '@/lib/cn';
import type { ProfileRow } from '@/lib/database.types';
import { navFor } from '../nav';
import { useOnSkTeam } from '../salingkusog/skApi';
import { usePendingCount } from './usePendingCount';
import { useStaffHeartbeat } from './useStaffHeartbeat';

type ShellProfile = Pick<ProfileRow, 'display_name' | 'role' | 'avatar_url' | 'email'>;

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

type NavProps = { profile: ShellProfile; pending: number; skTeam: boolean; onNavigate?: () => void };

function SidebarNav({ profile, pending, skTeam, onNavigate }: NavProps) {
  return (
    <ul className="flex flex-col gap-1.5">
      {navFor(profile.role, { skTeam }).map((item) => (
        <li key={item.to}>
          <NavLink
            to={item.to}
            end={item.end}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-[8px] px-3 py-2.5 text-button transition-colors',
                isActive ? 'bg-green-700 text-lime' : 'text-on-dark hover:bg-green-800',
              )
            }
          >
            <item.icon className="size-[18px] shrink-0 opacity-80" aria-hidden />
            <span className="flex-1">{item.label}</span>
            {item.badge === 'submissions' && pending > 0 && (
              <span className="grid h-[22px] min-w-[25px] place-items-center rounded-full bg-lime px-1.5 text-[13px] font-semibold text-green-900">
                {pending}
                <span className="sr-only"> waiting</span>
              </span>
            )}
          </NavLink>
        </li>
      ))}
    </ul>
  );
}

function ProfileBlock({ profile, onSignOut }: { profile: ShellProfile; onSignOut: () => void }) {
  return (
    <div className="flex items-center gap-2.5 border-t border-green-700 pt-4">
      <span className="grid size-9 shrink-0 place-items-center overflow-hidden rounded-full bg-green-500 text-[13px] font-semibold text-on-dark">
        {profile.avatar_url ? <img src={profile.avatar_url} alt="" className="size-full object-cover" /> : initials(profile.display_name)}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[14px] font-semibold text-on-dark">{profile.display_name}</p>
        <p className="truncate text-meta font-normal text-on-dark-muted">{roleLabels[profile.role]}</p>
      </div>
      <button
        type="button"
        onClick={onSignOut}
        className="grid size-9 place-items-center rounded-md text-on-dark-muted hover:bg-green-800 hover:text-on-dark"
        aria-label="Log out"
        title="Log out"
      >
        <LogOut className="size-[18px]" aria-hidden />
      </button>
    </div>
  );
}

function SidebarContent({ profile, pending, skTeam, onSignOut, onNavigate }: NavProps & { onSignOut: () => void }) {
  return (
    <div className="flex h-full flex-col gap-6 px-5 pb-6 pt-7">
      <Link to="/admin" onClick={onNavigate} className="text-[24px]" aria-label="Newsroom overview">
        <Lockup tone="light" subtitle="Newsroom" />
      </Link>
      <nav aria-label="Newsroom" className="flex-1 overflow-y-auto">
        <SidebarNav profile={profile} pending={pending} skTeam={skTeam} onNavigate={onNavigate} />
      </nav>
      <Link to="/" className="inline-flex items-center gap-2 text-meta text-on-dark-muted hover:text-on-dark">
        <ExternalLink className="size-4" aria-hidden /> View the site
      </Link>
      <p className="text-[12px] leading-snug text-on-dark-muted">
        Your active time in the newsroom is recorded for the editorial board.{' '}
        <Link to="/privacy#staff" className="underline hover:text-on-dark" onClick={onNavigate}>
          Privacy
        </Link>
      </p>
      <ProfileBlock profile={profile} onSignOut={onSignOut} />
    </div>
  );
}

/** Newsroom chrome: fixed sidebar ≥1024px, top bar + drawer below. */
export function AdminShell({
  profile,
  pending,
  skTeam = false,
  onSignOut,
  children,
}: {
  profile: ShellProfile;
  pending: number;
  /** on the Salingkusog team: shows the Salingkusog item to roles that don't always get it */
  skTeam?: boolean;
  onSignOut: () => void;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const location = useLocation();

  useEffect(() => setOpen(false), [location.pathname]);
  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <div className="min-h-dvh bg-paper lg:pl-[260px]">
      <SkipLink />
      <aside className="fixed inset-y-0 left-0 hidden w-[260px] bg-green-900 lg:block">
        <SidebarContent profile={profile} pending={pending} skTeam={skTeam} onSignOut={onSignOut} />
      </aside>

      <div className="sticky top-0 z-20 flex h-14 items-center justify-between bg-green-900 px-2 lg:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="grid size-11 place-items-center rounded-md text-on-dark"
          aria-label="Open newsroom menu"
          aria-haspopup="dialog"
        >
          <Menu className="size-6" aria-hidden />
        </button>
        <Link to="/admin" className="text-[20px]" aria-label="Newsroom overview">
          <Lockup tone="light" />
        </Link>
        <span className="size-11" aria-hidden />
      </div>
      <dialog
        ref={dialog}
        aria-label="Newsroom menu"
        onClose={() => setOpen(false)}
        onClick={(e) => e.target === dialog.current && setOpen(false)}
        className="m-0 h-dvh max-h-none w-[min(300px,86vw)] max-w-none bg-green-900 p-0 backdrop:bg-scrim lg:hidden"
      >
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="absolute right-3 top-5 grid size-10 place-items-center rounded-md text-on-dark hover:bg-green-700"
          aria-label="Close menu"
        >
          <X className="size-6" aria-hidden />
        </button>
        <SidebarContent profile={profile} pending={pending} skTeam={skTeam} onSignOut={onSignOut} onNavigate={() => setOpen(false)} />
      </dialog>

      <main id="main" className="mx-auto w-full max-w-[1180px] px-4 py-6 md:px-10 md:py-8">
        {children}
      </main>
    </div>
  );
}

/** Route element under RequireStaff. */
export function AdminLayout() {
  const { profile, signOut } = useAuth();
  const pending = usePendingCount(isEditor(profile?.role));
  const skTeam = useOnSkTeam();
  useStaffHeartbeat(Boolean(profile?.is_active));
  if (!profile) return null;
  return (
    <AdminShell profile={profile} pending={pending.data ?? 0} skTeam={skTeam.data ?? false} onSignOut={() => void signOut()}>
      <Outlet />
    </AdminShell>
  );
}

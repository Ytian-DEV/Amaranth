import { NavLink, Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from '@/features/auth/AuthProvider';
import { canGrantPublishing, canPublish, isAdmin } from '@/features/auth/permissions';
import { cn } from '@/lib/cn';
import { useDocumentTitle } from '@/lib/useDocumentTitle';
import { CmsPageHeader } from '../ui';
import { BoardTab } from './BoardTab';
import { ContributorsTab } from './ContributorsTab';
import { InvitesTab } from './InvitesTab';
import { StaffTab } from './StaffTab';

/** /admin/staff/* — accounts (admins; the Managing editor for publishing access), invites (admins), bylines and the editorial board (editors). */
export function PeoplePage() {
  useDocumentTitle('Staff');
  const { profile } = useAuth();
  const admin = isAdmin(profile?.role);
  const accounts = canGrantPublishing(profile?.role);
  const tabs = [
    accounts && { to: '/admin/staff', label: 'Accounts', end: true },
    admin && { to: '/admin/staff/invites', label: 'Invites' },
    { to: '/admin/staff/contributors', label: 'Contributors' },
    canPublish(profile?.role) && { to: '/admin/staff/board', label: 'Editorial board' },
  ].filter(Boolean) as { to: string; label: string; end?: boolean }[];

  return (
    <div className="flex flex-col gap-6">
      <CmsPageHeader title="Staff" subtitle="Newsroom accounts, public bylines and the editorial board." />
      <nav aria-label="Staff sections" className="-mx-4 md:mx-0">
        <ul data-scroll-x className="no-scrollbar flex gap-1 overflow-x-auto border-b border-line px-4 md:px-0">
          {tabs.map((t) => (
            <li key={t.to} className="shrink-0">
              <NavLink
                to={t.to}
                end={t.end}
                className={({ isActive }) =>
                  cn('-mb-px block border-b-2 px-3 py-2.5 text-button', isActive ? 'border-green-700 text-green-700' : 'border-transparent text-ink-muted hover:text-ink')
                }
              >
                {t.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <Routes>
        <Route index element={accounts ? <StaffTab /> : <Navigate to="contributors" replace />} />
        {admin && <Route path="invites" element={<InvitesTab />} />}
        <Route path="contributors" element={<ContributorsTab />} />
        {canPublish(profile?.role) && <Route path="board" element={<BoardTab />} />}
        <Route path="*" element={<Navigate to="/admin/staff" replace />} />
      </Routes>
    </div>
  );
}

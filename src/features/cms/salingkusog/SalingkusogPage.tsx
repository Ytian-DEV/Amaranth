import { NavLink, Navigate, Route, Routes } from 'react-router-dom';
import { Skeleton } from '@/components/ui/Feedback';
import { useAuth } from '@/features/auth/AuthProvider';
import { canEditSk, canManageSkTeam } from '@/features/auth/permissions';
import { cn } from '@/lib/cn';
import { useDocumentTitle } from '@/lib/useDocumentTitle';
import { CmsPageHeader } from '../ui';
import { useOnSkTeam } from './skApi';
import { TeamTab } from './TeamTab';

/** /admin/salingkusog/* — intramurals data. Managing roles and Salingkusog team members only. */
export function SalingkusogPage() {
  useDocumentTitle('Salingkusog');
  const { profile } = useAuth();
  const onTeam = useOnSkTeam();
  const manager = canManageSkTeam(profile?.role);

  if (!manager && onTeam.isPending) return <Skeleton className="h-64" />;
  if (!canEditSk(profile?.role, onTeam.data ?? false)) return <Navigate to="/admin" replace />;

  const tabs = [{ to: '/admin/salingkusog/team', label: 'Team' }];

  return (
    <div className="flex flex-col gap-6">
      <CmsPageHeader title="Salingkusog" subtitle="VSU intramurals: who enters the data, and (soon) the schedule, live scores and medals." />
      <nav aria-label="Salingkusog sections" className="-mx-4 md:mx-0">
        <ul data-scroll-x className="no-scrollbar flex gap-1 overflow-x-auto border-b border-line px-4 md:px-0">
          {tabs.map((t) => (
            <li key={t.to} className="shrink-0">
              <NavLink
                to={t.to}
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
        <Route index element={<Navigate to="team" replace />} />
        <Route path="team" element={<TeamTab canManage={manager} />} />
        <Route path="*" element={<Navigate to="/admin/salingkusog" replace />} />
      </Routes>
    </div>
  );
}

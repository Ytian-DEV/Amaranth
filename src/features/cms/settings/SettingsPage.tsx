import { NavLink, Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from '@/features/auth/AuthProvider';
import { canPublish, isAdmin, isEditor } from '@/features/auth/permissions';
import { cn } from '@/lib/cn';
import { useDocumentTitle } from '@/lib/useDocumentTitle';
import { CmsPageHeader } from '../ui';
import { ContactsTab, GeneralTab, SectionsTab } from './AdminTabs';
import { HomeTab } from './HomeTab';
import { CommentsTab, InboxTab } from './ModerationTabs';

/** /admin/settings/* — tabs depend on the role. */
export function SettingsPage() {
  useDocumentTitle('Settings');
  const { profile } = useAuth();
  const role = profile?.role;
  const tabs = [
    canPublish(role) && { path: 'home', label: 'Front page', element: <HomeTab /> },
    isEditor(role) && { path: 'comments', label: 'Comments', element: <CommentsTab /> },
    isEditor(role) && { path: 'inbox', label: 'Inbox', element: <InboxTab /> },
    isAdmin(role) && { path: 'sections', label: 'Sections', element: <SectionsTab /> },
    isAdmin(role) && { path: 'contacts', label: 'Desks', element: <ContactsTab /> },
    isAdmin(role) && { path: 'general', label: 'General', element: <GeneralTab /> },
  ].filter(Boolean) as { path: string; label: string; element: React.ReactNode }[];

  return (
    <div className="flex flex-col gap-6">
      <CmsPageHeader title="Settings" subtitle="Front page, moderation and how the site is organised." />
      <nav aria-label="Settings sections" className="-mx-4 md:mx-0">
        <ul data-scroll-x className="no-scrollbar flex gap-1 overflow-x-auto border-b border-line px-4 md:px-0">
          {tabs.map((t) => (
            <li key={t.path} className="shrink-0">
              <NavLink
                to={`/admin/settings/${t.path}`}
                className={({ isActive }) => cn('-mb-px block border-b-2 px-3 py-2.5 text-button', isActive ? 'border-green-700 text-green-700' : 'border-transparent text-ink-muted hover:text-ink')}
              >
                {t.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <Routes>
        <Route index element={tabs[0] ? <Navigate to={tabs[0].path} replace /> : null} />
        {tabs.map((t) => (
          <Route key={t.path} path={t.path} element={t.element} />
        ))}
        <Route path="*" element={<Navigate to="/admin/settings" replace />} />
      </Routes>
    </div>
  );
}

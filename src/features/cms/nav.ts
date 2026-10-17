import { FileText, FolderInput, Images, LayoutDashboard, Megaphone, Settings, Users, type LucideIcon } from 'lucide-react';
import type { AppRole } from '@/lib/database.types';
import { isAdmin, isEditor } from '@/features/auth/permissions';

export type CmsNavItem = {
  to: string;
  label: string;
  icon: LucideIcon;
  allow: (role: AppRole) => boolean;
  /** show the pending-submissions badge */
  badge?: 'submissions';
  end?: boolean;
};

const everyone = () => true;

export const cmsNav: CmsNavItem[] = [
  { to: '/admin', label: 'Overview', icon: LayoutDashboard, allow: everyone, end: true },
  { to: '/admin/articles', label: 'Articles', icon: FileText, allow: everyone },
  { to: '/admin/submissions', label: 'Submissions', icon: FolderInput, allow: isEditor, badge: 'submissions' },
  { to: '/admin/events', label: 'Events', icon: Megaphone, allow: isEditor },
  { to: '/admin/media', label: 'Media Library', icon: Images, allow: everyone },
  { to: '/admin/staff', label: 'Staff', icon: Users, allow: isAdmin },
  { to: '/admin/settings', label: 'Settings', icon: Settings, allow: isAdmin },
];

export const navFor = (role: AppRole) => cmsNav.filter((item) => item.allow(role));

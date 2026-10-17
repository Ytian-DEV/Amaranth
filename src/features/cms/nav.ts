import { BarChart3, FileText, FolderInput, Images, LayoutDashboard, Megaphone, Settings, Trophy, Users, type LucideIcon } from 'lucide-react';
import type { AppRole } from '@/lib/database.types';
import { canEditSk, canViewStats, isEditor } from '@/features/auth/permissions';

export type NavContext = {
  /** on the Salingkusog team (sk_team) */
  skTeam: boolean;
};

export type CmsNavItem = {
  to: string;
  label: string;
  icon: LucideIcon;
  allow: (role: AppRole, ctx: NavContext) => boolean;
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
  { to: '/admin/salingkusog', label: 'Salingkusog', icon: Trophy, allow: (role, ctx) => canEditSk(role, ctx.skTeam) },
  { to: '/admin/statistics', label: 'Statistics', icon: BarChart3, allow: canViewStats },
  { to: '/admin/staff', label: 'Staff', icon: Users, allow: isEditor },
  { to: '/admin/settings', label: 'Settings', icon: Settings, allow: isEditor },
];

export const navFor = (role: AppRole, ctx: NavContext = { skTeam: false }) => cmsNav.filter((item) => item.allow(role, ctx));

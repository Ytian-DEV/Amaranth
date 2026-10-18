// Client-side mirror of the permission helpers in supabase/v2/schema.sql
// (app.is_admin, app.can_publish, app.is_editor, app.article_before_write) and
// supabase/v2/salingkusog.sql (app.can_manage_sk_team, app.can_edit_sk).
// The database is the source of truth; these only decide what the UI offers.
import type { AppRole, ArticleStatus } from '@/lib/database.types';

export const roleLabels: Record<AppRole, string> = {
  super_admin: 'Super admin',
  editor_in_chief: 'Executive Editor',
  managing_editor: 'Managing editor',
  business_manager: 'Business Manager',
  section_editor: 'Section editor',
  staff_writer: 'Staff writer',
  contributor: 'Contributor',
};

export const roleOrder: AppRole[] = [
  'super_admin',
  'editor_in_chief',
  'managing_editor',
  'business_manager',
  'section_editor',
  'staff_writer',
  'contributor',
];

export const isAdmin = (role?: AppRole | null) => role === 'super_admin' || role === 'editor_in_chief';
export const canPublish = (role?: AppRole | null) => isAdmin(role) || role === 'managing_editor';
/** Publish and schedule articles (app.can_publish_articles): the managing roles, the Business Manager,
 *  and anyone given publishing access in Staff. Everyone else saves drafts and submits for review. */
export const canPublishArticles = (role?: AppRole | null, granted?: boolean | null) =>
  canPublish(role) || role === 'business_manager' || (!!role && !!granted);
/** Roles that always publish, so Staff shows "Always" instead of a switch. */
export const publishesByRole = (role?: AppRole | null) => canPublish(role) || role === 'business_manager';
/** Super admin, Executive Editor and Managing editor give or take publishing access (public.set_publish_access). */
export const canGrantPublishing = (role?: AppRole | null) => canPublish(role);
export const isEditor = (role?: AppRole | null) => canPublish(role) || role === 'section_editor';

/** Statistics (and staff usage): Super admin, Executive Editor and Managing editor (app.can_view_stats). */
export const canViewStats = (role?: AppRole | null) => role === 'super_admin' || role === 'editor_in_chief' || role === 'managing_editor';

/** Super admin, Executive Editor and Managing editor choose the Salingkusog team (and always edit its data). */
export const canManageSkTeam = (role?: AppRole | null) => canPublish(role);
/** Can enter Salingkusog data: the three managing roles, or a member of the Salingkusog team. */
export const canEditSk = (role: AppRole | null | undefined, onSkTeam: boolean) => canManageSkTeam(role) || (!!role && onSkTeam);

/** Roles a user may assign to others (only super admins hand out super admin). */
export function assignableRoles(role?: AppRole | null): AppRole[] {
  if (role === 'super_admin') return roleOrder;
  if (role === 'editor_in_chief') return roleOrder.filter((r) => r !== 'super_admin');
  return [];
}

export type ArticleContext = {
  status: ArticleStatus;
  /** created the article or is one of its authors */
  isOwner: boolean;
  /** publisher, or section editor assigned to the article's section */
  canEditSection: boolean;
  /** the user's own publishing access from Staff (profiles.can_publish) */
  publishAccess?: boolean;
};

/** Statuses the user may move the article to (same rules as the DB trigger). */
export function allowedTransitions(role: AppRole | null | undefined, ctx: ArticleContext): ArticleStatus[] {
  const publisher = canPublishArticles(role, ctx.publishAccess);
  const editor = ctx.canEditSection;
  const { status: from, isOwner } = ctx;
  const out = new Set<ArticleStatus>();

  if (publisher && from !== 'published') out.add('published');
  if (publisher && ['draft', 'submitted', 'in_review'].includes(from)) out.add('scheduled');
  if (publisher && from === 'published') out.add('archived');

  if (from === 'draft' || from === 'rejected') {
    if (isOwner || editor) out.add('submitted');
  }
  if (from === 'submitted' && editor) out.add('in_review');
  if ((from === 'submitted' || from === 'in_review') && editor) out.add('rejected');

  if (from === 'submitted' || from === 'rejected') {
    if (isOwner || editor) out.add('draft');
  }
  if (from === 'in_review' && editor) out.add('draft');
  if ((from === 'scheduled' || from === 'published' || from === 'archived') && publisher) out.add('draft');

  out.delete(from);
  return [...out];
}

/** Can the user edit the article's content right now? */
export function canEditContent(ctx: ArticleContext) {
  return ctx.canEditSection || (ctx.isOwner && (ctx.status === 'draft' || ctx.status === 'rejected'));
}

export const transitionLabels: Partial<Record<ArticleStatus, string>> = {
  submitted: 'Submit for review',
  in_review: 'Start review',
  draft: 'Return to draft',
  rejected: 'Reject',
  scheduled: 'Schedule',
  published: 'Publish',
  archived: 'Archive',
};

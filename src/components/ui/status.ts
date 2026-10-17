import type { ArticleStatus } from '@/lib/database.types';

export type Tone = 'neutral' | 'green' | 'lime' | 'review' | 'alert' | 'blue';

export const tones: Record<Tone, string> = {
  neutral: 'bg-status-archived-soft text-ink-muted',
  green: 'bg-green-soft text-green-700',
  lime: 'bg-lime-soft text-lime-dark-text',
  review: 'bg-status-review-soft text-status-review',
  alert: 'bg-alert-soft text-alert',
  blue: 'bg-status-scheduled-soft text-status-scheduled',
};

export const statusInfo: Record<ArticleStatus, { label: string; tone: Tone }> = {
  draft: { label: 'Draft', tone: 'lime' },
  submitted: { label: 'Submitted', tone: 'review' },
  in_review: { label: 'In review', tone: 'review' },
  scheduled: { label: 'Scheduled', tone: 'blue' },
  published: { label: 'Published', tone: 'green' },
  archived: { label: 'Archived', tone: 'neutral' },
  rejected: { label: 'Rejected', tone: 'alert' },
};


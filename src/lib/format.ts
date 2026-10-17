const TZ = 'Asia/Manila';

const dateFmt = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: TZ });
const shortFmt = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: TZ });
const longFmt = new Intl.DateTimeFormat('en-US', {
  weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', timeZone: TZ,
});
const dateTimeFmt = new Intl.DateTimeFormat('en-US', {
  month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: TZ,
});

const toDate = (value: string | Date) => (value instanceof Date ? value : new Date(value));

/** "Oct 15, 2026" */
export function formatDate(value?: string | Date | null) {
  return value ? dateFmt.format(toDate(value)) : '';
}

/** "Oct 15" */
export function formatShortDate(value?: string | Date | null) {
  return value ? shortFmt.format(toDate(value)) : '';
}

/** "Friday, October 16, 2026" */
export function formatLongDate(value: string | Date = new Date()) {
  return longFmt.format(toDate(value));
}

/** "Oct 15, 2026, 8:30 AM" */
export function formatDateTime(value?: string | Date | null) {
  return value ? dateTimeFmt.format(toDate(value)) : '';
}

/** "8 min read" */
export function formatReadingTime(minutes?: number | null) {
  return `${Math.max(1, minutes ?? 1)} min read`;
}

/** "5 hours ago", "2 days ago" */
export function formatRelative(value: string | Date, now: Date = new Date()) {
  const diff = (toDate(value).getTime() - now.getTime()) / 1000;
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ['year', 31536000], ['month', 2592000], ['week', 604800], ['day', 86400], ['hour', 3600], ['minute', 60],
  ];
  for (const [unit, seconds] of units) {
    if (Math.abs(diff) >= seconds) return rtf.format(Math.round(diff / seconds), unit);
  }
  return 'just now';
}

/** "8.4k" */
export function formatCompact(value: number) {
  return new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(value).toLowerCase();
}

/** Joins non-empty parts with " · " */
export function joinMeta(...parts: (string | null | undefined | false)[]) {
  return parts.filter(Boolean).join(' · ');
}

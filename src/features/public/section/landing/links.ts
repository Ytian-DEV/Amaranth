import { formatShortDate } from '@/lib/format';
import { manilaDate, manilaTime } from '@/lib/manila';

/** The paginated list of everything in a section (the shared template). */
export const allHref = (slug: string) => `/${slug}?view=all`;
export const categoryHref = (slug: string, category: string) => `/${slug}?category=${encodeURIComponent(category)}`;

/** "2:15 PM" today, "Yesterday", else "Oct 12" (Manila time). */
export function briefTime(at?: string | null, now = new Date()) {
  if (!at) return '';
  const day = manilaDate(at);
  if (day === manilaDate(now)) {
    const [h, m] = manilaTime(at).split(':').map(Number);
    return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
  }
  if (day === manilaDate(new Date(now.getTime() - 86_400_000))) return 'Yesterday';
  return formatShortDate(at);
}

// Sample content for /dev/* screens (copy from the Figma file). Dev builds only.
import type { StoryItem } from '@/components/story/types';

const day = (d: number) => `2026-10-${String(d).padStart(2, '0')}T08:00:00+08:00`;

export const fixtureStories: StoryItem[] = [
  {
    id: 'f1',
    slug: 'inside-the-campus-fight-to-protect-the-forests-of-mt-pangasugan',
    title: 'Inside the campus fight to protect the forests of Mt. Pangasugan',
    label: 'News · Environment',
    excerpt:
      'Student researchers, forest rangers and upland communities explain what is at stake for the mountain that gives VSU its water, its wildlife and much of its identity.',
    byline: 'Staff Writer',
    publishedAt: day(15),
    readingMinutes: 8,
  },
  {
    id: 'f2',
    slug: 'vsu-researchers-develop-drought-tolerant-sweet-potato',
    title: 'VSU researchers develop drought-tolerant sweet potato for Eastern Visayas farms',
    label: 'News',
    excerpt: 'A two-year field trial in Baybay shows yields holding steady through the dry season.',
    byline: 'Juan Dela Cruz',
    publishedAt: day(14),
    readingMinutes: 4,
  },
  {
    id: 'f3',
    slug: 'the-night-shift',
    title: 'The night shift: a week with the students who keep the dorms running',
    label: 'Feature',
    excerpt: 'Working scholars balance thesis deadlines with 10 p.m. rounds and early-morning duties.',
    byline: 'Staff Writer',
    publishedAt: day(12),
    readingMinutes: 6,
  },
  {
    id: 'f4',
    slug: 'climate-ready-campus',
    title: 'Climate-ready campus: what VSU is doing before the next super typhoon',
    label: 'Specials',
    excerpt: 'From early-warning drills to reinforced labs, a look at the university’s preparedness plan.',
    byline: 'Staff Writer',
    publishedAt: day(10),
    readingMinutes: 7,
  },
  {
    id: 'f5',
    slug: 'vipers-rally-from-two-sets-down',
    title: 'Vipers rally from two sets down to reach the regional semifinals',
    label: 'Sports',
    byline: 'Sports Desk',
    publishedAt: day(13),
    readingMinutes: 5,
  },
  {
    id: 'f6',
    slug: 'track-team-breaks-two-school-records',
    title: 'Track team breaks two school records at the provincial meet',
    label: 'Sports',
    publishedAt: day(11),
  },
  {
    id: 'f7',
    slug: 'to-protect-the-press',
    title: 'To Protect the Press is to Protect Democracy',
    label: 'Editorial',
    excerpt: 'Campus journalism is not a club activity. It is a public service, and it deserves protection.',
    publishedAt: '2026-09-20T08:00:00+08:00',
  },
  {
    id: 'f8',
    slug: 'the-algorithm-ate-my-homework',
    title: 'The Algorithm Ate My Homework (and My Job, Too)',
    label: 'Opinion',
    excerpt: 'AI tools are reshaping how we study. Are we learning faster, or just learning less?',
    publishedAt: '2026-09-18T08:00:00+08:00',
  },
];

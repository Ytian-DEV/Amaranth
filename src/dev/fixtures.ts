// Sample content for /dev/* screens (copy from the Figma file). Dev builds only.
import type { StoryItem } from '@/components/story/types';
import type { HomeData } from '@/features/public/home/homeData';
import type { ArticleComment, ArticleDetail } from '@/features/public/article/articleData';
import type { ArchiveMonth, Issue } from '@/features/public/archives/archivesData';

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

const literary = (id: string, slug: string, title: string, kind: string, minutes: number): StoryItem => ({
  id,
  slug,
  title,
  label: `Literary · ${kind}`,
  readingMinutes: minutes,
  publishedAt: day(9),
});

export const fixtureHome: HomeData = {
  ticker: [
    { text: 'Second-semester enrollment opens January 5', href: '/article/enrollment' },
    { text: 'University Library extends hours for finals week', href: '/article/library-hours' },
    { text: 'Vipers advance to the regional semifinals', href: '/article/vipers-rally-from-two-sets-down' },
  ],
  lead: fixtureStories[0],
  latest: fixtureStories.slice(1, 4),
  mostRead: [
    fixtureStories[6],
    fixtureStories[7],
    {
      id: 'm3',
      slug: 'from-the-courts-to-the-clicks',
      title: 'From the Courts to the Clicks: Why Reality Wins in the Information Wars',
      label: 'Feature',
      publishedAt: '2026-09-15T08:00:00+08:00',
    },
    { id: 'm4', slug: 'hiv-surge', title: 'HIV Surge: Progress or Crisis?', label: 'Health', publishedAt: '2026-09-12T08:00:00+08:00' },
  ],
  folio: {
    quote: '“We write the river down so the river will remember us.”',
    attribution: '— from “Baybay at Dusk,” a poem from this semester’s folio',
    href: '/literary',
    items: [
      literary('l1', 'baybay-at-dusk', 'Baybay at Dusk', 'Poetry', 6),
      literary('l2', 'the-last-jeepney', 'The Last Jeepney to Brgy. Gabas', 'Fiction', 12),
      literary('l3', 'on-leaving-home', 'On Leaving Home for the First Time', 'Essay', 8),
    ],
  },
  sports: [
    fixtureStories[4],
    fixtureStories[5],
    { id: 's3', slug: 'intramurals-2026', title: 'Intramurals 2026: full schedule and team rosters', label: 'Sports', publishedAt: day(9) },
  ],
  views: [
    fixtureStories[6],
    fixtureStories[7],
    {
      id: 'v3',
      slug: 'notes-from-the-fourth-floor',
      title: 'Notes from the Fourth Floor',
      label: 'Views · Column',
      excerpt: 'A graduating senior on deadlines, dorm food and the friends who carried her through.',
      publishedAt: day(9),
    },
  ],
};

export const fixtureHomeEmpty: HomeData = {
  ticker: [],
  lead: null,
  latest: [],
  mostRead: [],
  folio: null,
  sports: [],
  views: [],
};

export const fixtureSection = {
  title: 'News',
  description: 'Campus, community, regional, national and global reporting.',
  categories: [
    { slug: 'campus-news', name: 'Campus News' },
    { slug: 'community-news', name: 'Community News' },
    { slug: 'regional-news', name: 'Regional News' },
    { slug: 'environment', name: 'Environment' },
  ],
  items: [...fixtureStories, ...fixtureStories.slice(1, 5).map((s) => ({ ...s, id: `${s.id}-b`, slug: `${s.slug}-b` }))],
  page: 1,
  pageCount: 7,
  total: 80,
};

export const fixtureArticle: ArticleDetail = {
  id: 'f1',
  slug: fixtureStories[0].slug,
  title: fixtureStories[0].title,
  dek: 'Student researchers, forest rangers and upland communities explain what is at stake for the mountain that gives VSU its water, its wildlife and much of its identity.',
  excerpt: fixtureStories[0].excerpt ?? '',
  label: 'News · Environment',
  sectionSlug: 'news',
  sectionName: 'News',
  status: 'published',
  isLive: true,
  publishedAt: day(15),
  updatedAt: day(15),
  readingMinutes: 8,
  byline: 'Maria Santos, Paolo Reyes',
  bodyHtml: `<p>At dawn the ridge of Mt. Pangasugan is hidden behind cloud, and the only sign of the forest is the sound: hornbills, water and the occasional chainsaw far down the slope.</p>
<p>For the students of Visayas State University the mountain is not scenery. It is <a href="https://example.org/watershed">the watershed</a> that fills the campus taps, a living laboratory for forestry majors, and a line on the horizon that has meant home for generations.</p>
<h2>A forest under pressure</h2>
<p>Researchers from the Department of Forest Science have tracked canopy loss along the lower slopes for six years. Their data shows small clearings spreading upward each dry season.</p>
<blockquote><p>“We are not fighting the farmers. We are trying to give them a reason to keep the trees standing.”</p></blockquote>
<p>Upland communities say the problem is economic. Abaca and coconut pay; standing forest does not.</p>
<ul><li>Six years of canopy monitoring</li><li>Three barangays in the buffer zone</li><li>One shared water supply</li></ul>
<h3>What comes next</h3>
<p>The university's environmental council will present a co-management proposal to the provincial board in November.</p>`,
  cover: null,
  coverCaption: 'The ridge of Mt. Pangasugan seen from the upper campus.',
  allowComments: true,
  seoTitle: null,
  seoDescription: null,
  authors: [
    { id: 'a1', name: 'Maria Santos', slug: 'maria-santos', credit: 'Author', position: 'News Editor', bio: 'Maria covers the environment and campus governance. She is a BS Forestry senior.', avatar: null },
    { id: 'a2', name: 'Paolo Reyes', slug: 'paolo-reyes', credit: 'Photos', position: 'Staff Photojournalist', bio: null, avatar: null },
  ],
  tags: [
    { slug: 'environment', name: 'environment' },
    { slug: 'mt-pangasugan', name: 'Mt. Pangasugan' },
    { slug: 'research', name: 'research' },
  ],
};

export const fixtureComments: ArticleComment[] = [
  { id: 'c1', parentId: null, authorName: 'Ana', body: 'Thank you for covering this. My family farms near Brgy. Gabas and the water has changed in ten years.', createdAt: '2026-10-15T10:00:00+08:00' },
  { id: 'c2', parentId: 'c1', authorName: 'Rico', body: 'Same in our sitio. Would love a follow-up on the co-management plan.', createdAt: '2026-10-15T12:30:00+08:00' },
];

export const fixtureIssues: Issue[] = [
  { id: 'i1', title: 'The Harvest Issue', slug: 'harvest-2026', volume: 52, issueNumber: 1, type: 'regular', date: '2026-09-30', description: null, cover: null, pdfUrl: '/documents/amaranth-charter.pdf' },
  { id: 'i2', title: 'Graduation Special 2026', slug: 'graduation-2026', volume: 51, issueNumber: 4, type: 'graduation', date: '2026-06-20', description: null, cover: null, pdfUrl: null },
  { id: 'i3', title: 'Typhoon Season', slug: 'typhoon-2025', volume: 51, issueNumber: 2, type: 'special', date: '2025-11-15', description: null, cover: null, pdfUrl: null },
];

export const fixtureMonths: ArchiveMonth[] = [
  { month: '2026-10-01', articles: 18 },
  { month: '2026-09-01', articles: 24 },
  { month: '2026-08-01', articles: 21 },
  { month: '2025-12-01', articles: 9 },
  { month: '2025-11-01', articles: 15 },
];

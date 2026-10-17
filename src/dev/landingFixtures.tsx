// /dev/section/:slug — section landings with sample copy from the Figma "Sections" page. Dev builds only.
import { useParams } from 'react-router-dom';
import type { StoryItem } from '@/components/story/types';
import { sectionLandings } from '@/features/public/section/landing';
import type { LandingSection } from '@/features/public/section/landing/blocks';

type Sample = { section: LandingSection; categories: { slug: string; name: string }[]; stories: [category: string, title: string, excerpt?: string, byline?: string][] };

const at = (i: number) => new Date(Date.now() - i * 5 * 3600_000).toISOString();

const samples: Record<string, Sample> = {
  news: {
    section: { slug: 'news', name: 'News', description: 'Campus reporting on the administration, academics, student government and research at Visayas State University.', nav_placement: 'primary' },
    categories: [
      { slug: 'campus-news', name: 'Campus News' },
      { slug: 'community-news', name: 'Community News' },
      { slug: 'regional-news', name: 'Regional News' },
      { slug: 'national-news', name: 'National News' },
      { slug: 'environment', name: 'Environment' },
    ],
    stories: [
      ['campus-news', 'USC passes resolution asking for later library hours during finals week', 'The University Student Council voted unanimously to request 24-hour access to the main library in the two weeks before final exams.'],
      ['campus-news', 'Registrar posts second-semester enrollment schedule'],
      ['campus-news', 'Water interruption at Lower Campus dorms until 5 PM'],
      ['campus-news', 'College of Engineering board passers to be honored Friday'],
      ['community-news', 'Shuttle route adds a stop at the new Agri complex'],
      ['campus-news', 'Scholarship stipends released through campus bank'],
      ['campus-news', 'New BS Data Science program approved for next school year', 'The Board of Regents approved the curriculum, with the first batch of 40 students expected in August.'],
      ['environment', 'VSU team maps abaca disease hotspots using drone imagery', 'The project could help farmers in Leyte catch outbreaks weeks earlier.'],
      ['campus-news', 'Dormitory rates to stay the same for second semester', 'Housing office cites a new solar array for keeping utility costs flat.'],
      ['regional-news', 'Baybay City opens a new evacuation center beside the campus', 'The facility can shelter 600 families and doubles as a training venue.'],
      ['campus-news', 'Faculty union and administration reach a deal on overload pay', 'Teachers handling extra classes will be paid within the same semester.'],
      ['campus-news', 'Lost-and-found goes online with a new student portal', 'Items found on campus will be listed with photos for 30 days.'],
      ['national-news', 'College councils push for a uniform org fee policy', 'A draft caps yearly organization fees and requires published budgets.'],
    ],
  },
};

function build(sample: Sample): StoryItem[] {
  const names = Object.fromEntries(sample.categories.map((c) => [c.slug, c.name]));
  return sample.stories.map(([category, title, excerpt, byline], i) => ({
    id: `${sample.section.slug}-${i}`,
    slug: `sample-${sample.section.slug}-${i}`,
    title,
    label: sample.section.name,
    category,
    categoryName: names[category] ?? sample.section.name,
    excerpt: excerpt ?? null,
    byline: byline ?? 'Staff Writer',
    publishedAt: at(i),
    readingMinutes: 4 + (i % 6),
  }));
}

export default function FixtureLanding({ empty }: { empty?: boolean }) {
  const { slug = '' } = useParams();
  const sample = samples[slug];
  const Landing = sectionLandings[slug];
  if (!sample || !Landing) return <p className="container-page py-16">No landing fixture for “{slug}”.</p>;
  const items = empty ? [] : build(sample);
  return <Landing section={sample.section} categories={sample.categories} items={items} mostRead={items.slice(6, 9)} />;
}

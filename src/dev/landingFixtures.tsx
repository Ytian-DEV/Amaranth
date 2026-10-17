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
  feature: {
    section: { slug: 'feature', name: 'Feature', description: 'Long-form human-interest stories, campus life and experiences.', nav_placement: 'primary' },
    categories: [
      { slug: 'campus-feature', name: 'Campus Feature' },
      { slug: 'people-events', name: 'People & Events' },
      { slug: 'experiences', name: 'Experiences' },
      { slug: 'lifestyle', name: 'Lifestyle' },
    ],
    stories: [
      ['campus-feature', 'The keepers of the seed bank', 'Inside the quiet room where VSU stores thousands of rootcrop varieties, and the people who make sure none of them disappear.'],
      ['campus-feature', 'The night shift: a week with the students who keep the dorms running', 'Working scholars balance thesis deadlines with 10 p.m. rounds, broken faucets and homesick freshmen.'],
      ['lifestyle', 'Sounds of Baybay: the student band reviving Waray folk songs', 'Five friends from the College of Arts and Sciences are recording songs their grandparents used to sing.'],
      ['people-events', 'Mang Ruben', 'I don’t remember every name. I remember every face.'],
      ['people-events', 'Prof. Liza Ramos', 'The farm is my second classroom.'],
      ['people-events', 'Jun Abarquez', 'Students tell me their problems. I just drive and listen.'],
      ['people-events', 'Bea Lagunzad', 'I learned time management the hard way.'],
      ['experiences', 'Sunrise over the rice paddies of the Lower Campus'],
      ['experiences', 'A student checks moisture levels'],
      ['experiences', 'Sacks ready for the cooperative'],
      ['lifestyle', 'Thrifting in Baybay: where students shop on a budget', 'A guide to the ukay-ukay stalls near the terminal.'],
    ],
  },
  literary: {
    section: { slug: 'literary', name: 'Literary', description: 'Poetry, prose and creative writing.', nav_placement: 'primary' },
    categories: [
      { slug: 'poetry', name: 'Poetry' },
      { slug: 'fiction', name: 'Fiction' },
      { slug: 'essay', name: 'Essay' },
    ],
    stories: [
      ['essay', 'Tides & Thresholds', 'Thirty-two poems, stories, essays and artworks by VSU students about leaving, staying and the places in between.'],
      ['poetry', 'Baybay at Dusk', 'The tide forgets the shape of every foot\nbut keeps the salt.\nI have been leaving this town for years,\nand every time the sea says stay,\nI believe it.', 'a 3rd-year BS Marine Biology student'],
      ['fiction', 'The Last Jeepney to Brgy. Gabas', 'The driver knew I was not going home.'],
      ['essay', 'On Leaving Home for the First Time', 'My mother packed rice in three different bags.'],
      ['poetry', 'Inventory of a Dorm Room', 'One electric fan, borrowed. One rosary, unprayed.'],
      ['poetry', 'Rain over the Lower Campus', 'Even the carabaos stop to listen.'],
      ['fiction', 'What the Sea Took Back', 'After the storm, the shoreline moved three meters inland.'],
      ['essay', 'Ate, I Made It', 'A performance piece recorded at Open Mic Night.'],
    ],
  },
  blogs: {
    section: { slug: 'blogs', name: 'Blogs', description: 'Personal takes, campus diaries and student voices, written by the people living it.', nav_placement: 'primary' },
    categories: [{ slug: 'blogs', name: 'Blogs' }],
    stories: [
      ['blogs', 'Things nobody tells you about your first typhoon in the dorm', 'Pack a power bank, befriend the guard and never, ever leave your window open.', 'Mika Santos'],
      ['blogs', 'I tried studying with AI for a week. Here’s what happened', 'Spoiler: it helped me understand more and remember less.', 'Paolo Reyes'],
      ['blogs', 'Ranking every canteen ulam under ₱60', 'A highly scientific, deeply personal, totally biased guide.', 'Jessa Cruz'],
      ['blogs', 'What a semester on the demo farm taught me about patience', 'Rice doesn’t care about your deadlines.', 'Rico Villamor'],
      ['blogs', 'The dorm curfew diaries, part two', 'We timed the walk from the library. It is not possible.', 'Mika Santos'],
      ['blogs', 'My thesis playlist, explained', 'Twelve songs that got me through chapter three.', 'Paolo Reyes'],
    ],
  },
  specials: {
    section: { slug: 'specials', name: 'Specials', description: 'Comics, multimedia and special storytelling formats.', nav_placement: 'primary' },
    categories: [
      { slug: 'comics', name: 'Comics' },
      { slug: 'multimedia', name: 'Multimedia' },
    ],
    stories: [
      ['multimedia', 'Climate-Ready Campus', 'How prepared is VSU for the next super typhoon? Our reporters spent three months inside the university’s disaster plans, labs and dormitories.'],
      ['multimedia', 'Inside the labs that can’t lose power'],
      ['multimedia', 'The storm we weren’t ready for'],
      ['comics', 'Graduation Issue: The Class That Came Back'],
      ['comics', 'Water Watch: Where Our Campus Water Comes From'],
      ['multimedia', 'To Protect the Press: Campus Journalism Under Pressure'],
      ['comics', 'Freshman Survival Guide'],
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

import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { StoryItem } from '@/components/story/types';
import type { LandingSection } from './blocks';
import { picker } from './data';
import { sectionLandings } from './index';
import { briefTime } from './links';

const story = (i: number, extra: Partial<StoryItem> = {}): StoryItem => ({
  id: `s${i}`,
  slug: `story-${i}`,
  title: `Story number ${i}`,
  label: 'News',
  category: i % 2 ? 'campus-news' : 'environment',
  categoryName: i % 2 ? 'Campus News' : 'Environment',
  excerpt: `Excerpt ${i}`,
  publishedAt: new Date(Date.now() - i * 3600_000).toISOString(),
  ...extra,
});

describe('landing helpers', () => {
  it('hands out each story once', () => {
    const p = picker([story(1), story(2), story(3), story(4)]);
    expect(p.nextWhere((s) => s.category === 'environment', 1).map((s) => s.id)).toEqual(['s2']);
    expect(p.next(2).map((s) => s.id)).toEqual(['s1', 's3']);
    expect(p.rest().map((s) => s.id)).toEqual(['s4']);
    expect(p.next(1)).toEqual([]);
  });

  it('formats brief times in Manila', () => {
    const now = new Date('2026-10-16T08:00:00Z'); // 4:00 PM Manila
    expect(briefTime('2026-10-16T06:15:00Z', now)).toBe('2:15 PM');
    expect(briefTime('2026-10-15T01:00:00Z', now)).toBe('Yesterday');
    expect(briefTime('2026-10-10T01:00:00Z', now)).toBe('Oct 10');
  });
});

const sections: Record<string, LandingSection> = {
  news: { slug: 'news', name: 'News', description: 'Campus reporting.', nav_placement: 'primary' },
  feature: { slug: 'feature', name: 'Feature', description: 'Long-form stories.', nav_placement: 'primary' },
  literary: { slug: 'literary', name: 'Literary', description: 'Poetry and prose.', nav_placement: 'primary' },
  blogs: { slug: 'blogs', name: 'Blogs', description: 'Personal takes.', nav_placement: 'primary' },
  specials: { slug: 'specials', name: 'Specials', description: 'Special reports.', nav_placement: 'primary' },
};
const categories = [
  { slug: 'campus-news', name: 'Campus News' },
  { slug: 'environment', name: 'Environment' },
];

describe.each(Object.keys(sections))('%s landing', (slug) => {
  const Landing = sectionLandings[slug];
  const renderIt = (items: StoryItem[]) =>
    render(
      <MemoryRouter>
        <Landing section={sections[slug]} categories={categories} items={items} mostRead={items.slice(0, 3)} />
      </MemoryRouter>,
    );

  it('renders every story once, linked to the article, with one h1', () => {
    const items = Array.from({ length: 14 }, (_, i) => story(i + 1));
    renderIt(items);
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    for (const s of items.slice(0, 7)) {
      const links = screen.getAllByRole('link', { name: new RegExp(`^${s.title}`) });
      expect(links[0]).toHaveAttribute('href', `/article/${s.slug}`);
    }
    expect(screen.getAllByRole('link', { name: /Campus News/ })[0]).toHaveAttribute('href', `/${slug}?category=campus-news`);
  });

  it('shows an empty state with no stories', () => {
    renderIt([]);
    expect(screen.getByText('No stories here yet')).toBeInTheDocument();
  });
});

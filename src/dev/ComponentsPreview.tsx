import { SectionHeader, StoryCard, StoryCompact, StoryRow } from '@/components/story/Story';
import { Button } from '@/components/ui/Button';
import { Checkbox, Field, Input, Select, Textarea } from '@/components/ui/Field';
import { Alert, EmptyState, ErrorState, Skeleton, Spinner } from '@/components/ui/Feedback';
import { Lockup } from '@/components/ui/Logo';
import { Pill, StatusPill } from '@/components/ui/StatusPill';
import { statusInfo } from '@/components/ui/status';
import { Kicker, Tag } from '@/components/ui/Tag';
import type { ArticleStatus } from '@/lib/database.types';
import { useDocumentTitle } from '@/lib/useDocumentTitle';
import { fixtureStories } from './fixtures';

const swatches = [
  'paper', 'surface', 'ink', 'ink-muted', 'line', 'photo', 'green-900', 'green-700', 'green-500', 'green-500-text',
  'green-soft', 'lime', 'lime-dark', 'lime-dark-text', 'lime-soft', 'alert',
];

/** Mirror of the Figma "Components" frame plus form and feedback states. */
export function ComponentsPreview() {
  useDocumentTitle('Components');
  return (
    <main id="main" className="container-page flex flex-col gap-12 py-12">
      <h1 className="font-serif text-headline-l">Amaranth — Components</h1>

      <section aria-labelledby="tokens" className="flex flex-col gap-4">
        <h2 id="tokens" className="text-headline-m">Colour tokens</h2>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
          {swatches.map((name) => (
            <li key={name} className="flex flex-col gap-1.5 text-meta">
              <span className="h-12 rounded-md border border-line" style={{ background: `var(--color-${name})` }} />
              {name}
            </li>
          ))}
        </ul>
        <div className="flex flex-col gap-2">
          <p className="font-serif text-display-xl">Display XL</p>
          <p className="font-serif text-headline-l">Headline L</p>
          <p className="font-serif text-headline-m">Headline M</p>
          <p className="font-serif text-headline-s">Headline S</p>
          <p className="text-body-l">Body L — Amaranth is written by students, for students.</p>
          <p className="text-body-m">Body M — Our editors review every submission within 3 to 5 school days.</p>
          <p className="text-meta text-ink-muted">Meta · Oct 15, 2026 · 8 min read</p>
          <Kicker>Label / Kicker</Kicker>
        </div>
        <Lockup className="text-[34px]" subtitle="The Official Student Publication of Visayas State University" />
      </section>

      <section aria-labelledby="atoms" className="flex flex-col gap-4">
        <h2 id="atoms" className="text-headline-m">Tags, buttons, status</h2>
        <div className="flex flex-wrap items-center gap-3">
          <Tag>Editorial</Tag>
          <Button>Button</Button>
          <Button variant="outline">Button</Button>
          <Button variant="accent">Button</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Delete</Button>
          <Button loading>Saving</Button>
          <Button disabled>Disabled</Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(statusInfo) as ArticleStatus[]).map((s) => (
            <StatusPill key={s} status={s} />
          ))}
          <Pill tone="alert">Oldest: 2 days</Pill>
        </div>
      </section>

      <section aria-labelledby="stories" className="flex flex-col gap-8">
        <SectionHeader id="stories" title="Latest Stories" href="/dev" />
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-3">
          {fixtureStories.slice(1, 4).map((s) => (
            <StoryCard key={s.id} story={s} />
          ))}
        </div>
        <div className="grid gap-8 md:grid-cols-2">
          <div className="flex flex-col gap-6">
            <StoryCompact story={fixtureStories[4]} />
            <StoryCompact story={fixtureStories[5]} />
          </div>
          <div>
            {fixtureStories.slice(6, 8).map((s, i) => (
              <StoryRow key={s.id} story={s} index={i + 1} />
            ))}
          </div>
        </div>
      </section>

      <section aria-labelledby="forms" className="grid max-w-xl gap-4">
        <h2 id="forms" className="text-headline-m">Form controls</h2>
        <Field label="Your name" required hint="As it should appear in the byline.">
          {({ id, describedBy, invalid }) => <Input id={id} aria-describedby={describedBy} aria-invalid={invalid} />}
        </Field>
        <Field label="Email" required error="Please enter a valid email address.">
          {({ id, describedBy, invalid }) => (
            <Input id={id} type="email" defaultValue="juan@" aria-describedby={describedBy} aria-invalid={invalid} />
          )}
        </Field>
        <Field label="Section">
          {({ id }) => (
            <Select id={id} defaultValue="news">
              <option value="news">News</option>
              <option value="sports">Sports</option>
            </Select>
          )}
        </Field>
        <Field label="Message">{({ id }) => <Textarea id={id} />}</Field>
        <Checkbox label="Allow comments" defaultChecked />
      </section>

      <section aria-labelledby="feedback" className="grid gap-4">
        <h2 id="feedback" className="text-headline-m">Feedback</h2>
        <Spinner />
        <div className="grid gap-3 md:grid-cols-3">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
        <Alert tone="success">Thanks! Your story was sent to the editors.</Alert>
        <Alert tone="error">The file is larger than 20 MB.</Alert>
        <EmptyState title="No stories yet">New articles in this section will show up here.</EmptyState>
        <ErrorState error={new Error('relation "articles" does not exist')} onRetry={() => undefined} />
      </section>
    </main>
  );
}

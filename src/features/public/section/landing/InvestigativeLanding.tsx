import { Link } from 'react-router-dom';
import { SectionHeader } from '@/components/story/Story';
import { articlePath } from '@/components/story/types';
import { ButtonLink } from '@/components/ui/Button';
import { Img } from '@/components/ui/Img';
import { formatShortDate, joinMeta } from '@/lib/format';
import { CtaBand, LandingEmpty, SeeAll, YearList, type LandingProps } from './blocks';
import { picker } from './data';

/** /investigative (Figma 39:763): dark lead investigation, past investigations by year, the desk's call. */
export function InvestigativeLanding({ section, items }: LandingProps) {
  const pick = picker(items);
  const lead = pick.next(1)[0];
  const past = pick.next(10);

  return (
    <div>
      <header className="bg-green-900 text-on-dark">
        <div className="container-page py-12 md:py-16">
          {lead ? (
            <div className="grid items-center gap-8 md:grid-cols-2 md:gap-12">
              <div className="flex flex-col gap-4">
                <p className="text-kicker uppercase text-lime">
                  Investigation{lead.readingMinutes && lead.readingMinutes >= 10 ? ` · ${lead.readingMinutes} min read` : ''}
                </p>
                <h1 className="font-serif text-[40px] font-bold leading-[1.04] tracking-[-1px] md:text-[60px]">
                  <Link to={articlePath(lead.slug)} className="hover:underline">
                    {lead.title}
                  </Link>
                </h1>
                {lead.excerpt && <p className="max-w-[560px] text-body-m text-on-dark-muted md:text-body-l">{lead.excerpt}</p>}
                <div className="flex flex-wrap items-center gap-4 pt-1">
                  <ButtonLink to={articlePath(lead.slug)} variant="accent">
                    Read the investigation
                  </ButtonLink>
                  <span className="text-meta text-on-dark-muted">{joinMeta(lead.byline ? `By ${lead.byline}` : 'By the Investigations Desk', formatShortDate(lead.publishedAt))}</span>
                </div>
              </div>
              <Img {...lead.image} ratio="560/420" priority sizes="(min-width: 768px) 560px, 100vw" className="rounded-[12px] bg-green-800" />
            </div>
          ) : (
            <h1 className="font-serif text-[44px] font-bold md:text-[64px]">{section.name}</h1>
          )}
          <p className="mt-8 max-w-[720px] rounded-[12px] border border-green-700 p-5 text-meta text-on-dark-muted">
            <span className="block pb-1 text-kicker uppercase text-lime">How we report</span>
            Every claim in our investigations is backed by documents or on-record interviews.
          </p>
        </div>
      </header>

      {!lead && <LandingEmpty section={section} />}

      {past.length > 0 && (
        <section aria-labelledby="past-investigations" className="container-page flex flex-col gap-2 pt-12">
          <SectionHeader id="past-investigations" title="Our investigations" />
          <YearList items={past} />
        </section>
      )}
      {lead && <SeeAll section={section} label="Every investigation" />}

      <CtaBand
        eyebrow="Investigations desk"
        title="Know something the campus should know? Have documents?"
        body="Reach our investigations editors directly. We protect our sources and verify everything before we publish."
        to="/contact"
        label="Contact the desk"
      />
    </div>
  );
}

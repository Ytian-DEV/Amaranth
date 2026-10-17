import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { SectionHeader } from '@/components/story/Story';
import { useDocumentTitle } from '@/lib/useDocumentTitle';
import { PageHeader } from '../PageHeader';

function Part({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="flex scroll-mt-24 flex-col gap-4">
      <SectionHeader id={`${id}-title`} title={title} />
      <div className="prose-article max-w-[720px]">{children}</div>
    </section>
  );
}

/** /privacy — what the site records and why (Data Privacy Act of 2012, RA 10173). */
export function PrivacyPage() {
  useDocumentTitle('Privacy');
  return (
    <div className="pb-16">
      <PageHeader title="Privacy" intro="What this website records, why, and how long we keep it." />
      <div className="container-page flex flex-col gap-14 pt-10 md:pt-14">
        <Part id="readers" title="Readers">
          <p>
            We count visits so the editorial board knows which stories people read and how they find them. We do this
            ourselves, without advertising trackers, and without cookies.
          </p>
          <ul>
            <li>
              <strong>What we record:</strong> the page you open, the site that sent you (for example facebook.com,
              never the full link), your device type, browser and operating system, how far you scroll an article,
              how long you actively read it, and which share button you press.
            </li>
            <li>
              <strong>What we don’t record:</strong> your name, your IP address, your location or anything you type.
              We never sell or share this data, and we don’t build profiles of readers.
            </li>
            <li>
              <strong>Anonymous ids:</strong> your browser keeps a random id in its local storage so a reader isn’t
              counted twice. Our server only stores a scrambled version of it, and the key that scrambles it changes
              every day, so visits on different days can’t be linked together.
            </li>
            <li>
              <strong>Do Not Track:</strong> if your browser sends Do Not Track or Global Privacy Control, we count the
              page visit with no id at all and record nothing else about it.
            </li>
            <li>
              <strong>How long:</strong> individual visits are deleted after 13 months. After that we keep only daily
              totals, such as “1,204 views on 3 March”, which can’t identify anyone.
            </li>
          </ul>
          <p>
            Our hosting provider, Vercel, also measures page loads for us (Vercel Web Analytics), also without cookies.
          </p>
        </Part>

        <Part id="forms" title="Forms and comments">
          <p>
            When you submit a story, propose an event, contact us or comment, we keep what you send, including the name
            and email address you give, so the newsroom can reply and credit you. Only Amaranth editors can see your
            email address.
          </p>
        </Part>

        <Part id="staff" title="Newsroom staff">
          <p>
            For members of Amaranth who sign in to the newsroom, the site also records active time: how long the
            newsroom is open, visible and in use each day. Idle or hidden tabs don’t count. Visits you make to the
            public site while signed in aren’t counted as reader visits.
          </p>
          <p>
            Only the Super admin, the Executive Editor and the Managing editor can see this, to plan workloads and
            recognise members’ work. Staff activity is kept for 24 months, then deleted.
          </p>
        </Part>

        <Part id="rights" title="Your rights">
          <p>
            Under the Data Privacy Act of 2012 (Republic Act No. 10173), you may ask what we hold about you, ask us to
            correct it, or ask us to delete it. Because reader statistics are anonymous, we usually can’t tell which
            visits are yours, but you can clear this site’s data in your browser at any time to reset your id.
          </p>
          <p>
            For any privacy question, <Link to="/contact">contact the newsroom</Link>.
          </p>
        </Part>
      </div>
    </div>
  );
}

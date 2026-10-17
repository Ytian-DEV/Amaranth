import { FileText } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SectionHeader } from '@/components/story/Story';
import { ButtonLink } from '@/components/ui/Button';
import { useDocumentTitle } from '@/lib/useDocumentTitle';
import { PageHeader } from '../PageHeader';

// Copy adapted from the Amaranth Charter (public/documents/amaranth-charter.pdf).
const objectives = [
  'Publish news, issues, opinions and other items directly or indirectly affecting students — on campus, in the community, the nation and the world.',
  'Provide a venue for students’ ideas, questions, demands, grievances and problems, and for responses to them.',
  'Train students in the technical and ethical practice of journalism and media production.',
  'Support the sound educational and cultural development of the student, the school, the community and the country.',
  'Serve as a pool of learning experiences for student journalists.',
  'Build working links with other student publications, organizations and the professional media.',
  'Advocate social consciousness and uphold the interests of the Filipino people.',
  'Advance students’ rights and responsibilities and promote their general welfare.',
];

const freedoms = [
  'To think freely, and to obtain and share ideas and information — unencumbered, unhampered and unrestricted.',
  'To hold personal opinions, and to be heard and listened to.',
  'To fully serve the people’s right to know: to publish, to speak out, and to express individual and collective views and grievances.',
  'To access public information and documents.',
  'To circulate and continue publishing.',
];

export function AboutPage() {
  useDocumentTitle('About Amaranth');
  return (
    <div className="pb-16">
      <PageHeader
        title="About Amaranth"
        intro="The official student media organization of Visayas State University — independent, student-run and proudly campus-first."
      />
      <div className="container-page grid gap-14 pt-10 md:pt-14 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-16">
        <div className="flex flex-col gap-14">
          <section aria-labelledby="who" className="flex flex-col gap-4">
            <SectionHeader id="who" title="Who we are" />
            <div className="prose-article max-w-[720px]">
              <p>
                Amaranth began as the campus newspaper of Visayas State University and has grown into its student media
                organization, publishing journalism and creative work in print and online. Its publishers are the
                students themselves.
              </p>
              <p>
                By its charter, Amaranth is independent and autonomous from the university administration, faculty,
                student council and other organizations in planning, direction, finances and policy. No form of
                censorship or pressure against press freedom may be used on it.
              </p>
              <blockquote>
                <p>Press freedom belongs to the people: the right to inform, and the right to be informed.</p>
              </blockquote>
            </div>
          </section>

          <section aria-labelledby="objectives" className="flex flex-col gap-4">
            <SectionHeader id="objectives" title="What we do" />
            <ol className="flex max-w-[720px] flex-col gap-3">
              {objectives.map((o, i) => (
                <li key={o} className="flex gap-4">
                  <span className="w-8 shrink-0 font-serif text-[26px] italic leading-none text-lime-dark" aria-hidden>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <p className="text-body-l text-ink">{o}</p>
                </li>
              ))}
            </ol>
          </section>

          <section aria-labelledby="freedoms" className="flex flex-col gap-4">
            <SectionHeader id="freedoms" title="Rights we uphold" />
            <ul className="flex max-w-[720px] list-disc flex-col gap-2 pl-6 text-body-l text-ink">
              {freedoms.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          </section>
        </div>

        <aside className="flex flex-col gap-5 self-start lg:sticky lg:top-6">
          <div className="flex flex-col gap-3 rounded-xl bg-green-900 p-6 text-on-dark">
            <FileText className="size-6 text-lime" aria-hidden />
            <h2 className="font-serif text-headline-m">The Amaranth Charter</h2>
            <p className="text-body-m text-on-dark-muted">Our constitution: governance, funding, membership and editorial independence.</p>
            <a
              href="/documents/amaranth-charter.pdf"
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-[41px] items-center justify-center self-start rounded-[8px] bg-lime px-5 text-button text-green-900 hover:bg-on-dark"
            >
              Read the charter (PDF)
            </a>
          </div>
          <div className="flex flex-col gap-3 rounded-xl bg-lime-soft p-6">
            <h2 className="font-serif text-headline-m text-green-900">Meet the board</h2>
            <p className="text-body-m text-ink-muted">The editors, section heads and advisers behind this term’s Amaranth.</p>
            <ButtonLink to="/editorial-board" variant="outline" className="self-start">
              Editorial Board
            </ButtonLink>
          </div>
          <p className="text-body-m text-ink-muted">
            Want to write for us? <Link to="/submit" className="text-green-700 underline">Submit a story</Link> or{' '}
            <Link to="/contact" className="text-green-700 underline">contact the newsroom</Link>.
          </p>
        </aside>
      </div>
    </div>
  );
}

import { Link } from 'react-router-dom';
import { LogoMark } from '@/components/ui/Logo';
import { env } from '@/lib/env';
import { publicationLinks, sectionPath, useNavSections } from '../nav';
import { useSocialLinks } from '../settings';

function Column({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <h2 className="font-sans text-kicker uppercase text-lime">{title}</h2>
      <ul className="flex flex-col gap-3 text-[15px] text-on-dark">{children}</ul>
    </div>
  );
}

export function SiteFooter() {
  const siteHost = new URL(env.siteUrl).host.replace(/^www\./, '');
  const { primary } = useNavSections();
  const social = useSocialLinks();
  const year = new Date().getFullYear();

  return (
    <footer className="bg-green-900 text-on-dark">
      <div className="container-page py-8 md:pt-16">
        <div className="grid gap-10 md:grid-cols-[minmax(0,420px)_1fr] lg:gap-20">
          <div className="flex flex-col gap-4">
            <Link to="/" className="flex items-center gap-3" aria-label="Amaranth — front page">
              <LogoMark className="hidden h-10 md:block" />
              <span className="font-wordmark text-[26px] font-bold leading-none tracking-[0.08em] text-lime md:text-[32px]">AMARANTH</span>
            </Link>
            <p className="hidden max-w-[340px] text-body-m text-on-dark-muted md:block">
              The Official Student Media Organization of Visayas State University. 
            </p>
            <ul className="flex flex-wrap gap-x-3 gap-y-1 text-meta md:hidden">
              {social.map((s, i) => (
                <li key={s.platform} className="flex gap-3">
                  {i > 0 && <span aria-hidden className="text-on-dark-muted">·</span>}
                  <a href={s.url} target="_blank" rel="noreferrer" className="text-lime">
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="hidden grid-cols-3 gap-8 md:grid">
            <Column title="Sections">
              {primary.map((s) => (
                <li key={s.slug}>
                  <Link to={sectionPath(s.slug)} className="hover:text-lime">
                    {s.name}
                  </Link>
                </li>
              ))}
            </Column>
            <Column title="The Publication">
              {publicationLinks
                .filter((l) => l.to !== '/archives')
                .map((l) => (
                  <li key={l.to}>
                    <Link to={l.to} className="hover:text-lime">
                      {l.label}
                    </Link>
                  </li>
                ))}
            </Column>
            <Column title="Follow">
              {social.map((s) => (
                <li key={s.platform}>
                  <a href={s.url} target="_blank" rel="noreferrer" className="hover:text-lime">
                    {s.label}
                  </a>
                </li>
              ))}
            </Column>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 border-on-dark/15 pt-0 text-meta text-on-dark-muted md:mt-12 md:flex-row md:items-center md:justify-between md:border-t md:pt-6">
          <p>
            <span className="font-bold text-on-dark">@AMARANTHVSU</span> <span aria-hidden>·</span> © {year} Amaranth · Visayas State University
          </p>
          <div className="flex items-center gap-5">
            <span className="hidden font-bold uppercase tracking-[0.04em] text-on-dark md:inline">{siteHost}</span>
            <Link to="/privacy" className="hover:text-on-dark">
              Privacy
            </Link>
            <Link to="/admin/login" className="hidden hover:text-on-dark md:inline">
              Staff login
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

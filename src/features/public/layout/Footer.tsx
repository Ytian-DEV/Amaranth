import { Link } from 'react-router-dom';
import { LogoMark } from '@/components/ui/Logo';
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
              <span className="font-serif text-[26px] font-bold leading-none tracking-[0.06em] md:text-[32px]">AMARANTH</span>
            </Link>
            <p className="hidden max-w-[340px] text-body-m text-on-dark-muted md:block">
              The official student publication of Visayas State University, Baybay City, Leyte. Independent, student-run
              and proudly campus-first.
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

        <div className="mt-6 flex items-center justify-between border-green-700 pt-0 text-meta text-on-dark-muted md:mt-12 md:border-t md:pt-6">
          <p>© {year} Amaranth · Visayas State University</p>
          <Link to="/admin/login" className="hidden hover:text-on-dark md:inline">
            Staff login
          </Link>
        </div>
      </div>
    </footer>
  );
}

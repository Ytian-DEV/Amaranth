import { ChevronDown, Menu, Search, UserRound, X } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { ButtonLink } from '@/components/ui/Button';
import { LogoMark } from '@/components/ui/Logo';
import { cn } from '@/lib/cn';
import { formatLongDate } from '@/lib/format';
import { publicationLinks, sectionPath, useNavSections, type NavSection } from '../nav';
import { alsoLinks, menuMeta, useMenuLatest, type MenuLatest } from './moreMenu';

function UtilityBar() {
  return (
    <div className="hidden bg-green-900 text-meta text-green-soft md:block">
      <div className="container-page flex h-[38px] items-center justify-between">
        <p>
          {formatLongDate()} <span aria-hidden>·</span> Baybay City, Leyte
        </p>
        <nav aria-label="About Amaranth">
          <ul className="flex gap-6">
            {publicationLinks
              .filter((l) => l.to !== '/submit#guidelines')
              .map((l) => (
                <li key={l.to}>
                  <Link to={l.to} className="hover:text-on-dark hover:underline">
                    {l.short}
                  </Link>
                </li>
              ))}
          </ul>
        </nav>
      </div>
    </div>
  );
}

function Masthead() {
  return (
    <div className="hidden border-b border-line bg-paper md:block">
      <div className="container-page grid h-[113px] grid-cols-[1fr_auto_1fr] items-center gap-6">
        <span aria-hidden />
        <Link to="/" className="flex items-center gap-4" aria-label="Amaranth — front page">
          <LogoMark className="h-[64px] lg:h-[76px]" />
          <span className="flex flex-col gap-0.5">
            <span className="font-serif text-[40px] font-bold leading-none tracking-[0.06em] text-green-900 lg:text-[52px]">
              AMARANTH
            </span>
            <span className="text-meta text-ink-muted">The Official Student Media Organization of Visayas State University</span>
          </span>
        </Link>
        <div className="flex items-center justify-end gap-5">
          <Link to="/admin/login" className="hidden items-center gap-1.5 text-button text-ink hover:text-green-700 lg:inline-flex">
            <UserRound className="size-[18px]" aria-hidden />
            Log in
          </Link>
          <ButtonLink to="/submit" variant="accent">
            Submit a Story
          </ButtonLink>
        </div>
      </div>
    </div>
  );
}

/** Salingkusog pages live under Sports. */
const useSectionActive = () => {
  const { pathname } = useLocation();
  return (slug: string, isActive: boolean) => isActive || (slug === 'sports' && pathname.startsWith('/salingkusog'));
};

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'flex h-[52px] items-center border-b-[3px] text-nav uppercase transition-colors',
    isActive ? 'border-lime text-lime' : 'border-transparent text-on-dark hover:border-on-dark-muted',
  );

/** The "More" mega menu panel (Figma 42:1077): one card per section with its latest story. */
export function MorePanel({ id, sections, latest, onNavigate }: { id?: string; sections: NavSection[]; latest?: MenuLatest; onNavigate?: () => void }) {
  const { pathname } = useLocation();
  return (
    <div id={id} className="border-t border-green-900/10 bg-surface shadow-[0_16px_40px_rgb(10_46_31/0.18)]">
      <ul className="container-page grid gap-4 py-7 md:grid-cols-3 lg:grid-cols-5 lg:gap-6 lg:py-9">
        {sections.map((s, i) => {
          const meta = menuMeta(s.slug, s.description);
          const Icon = meta.icon;
          const story = latest?.[s.slug];
          const current = pathname === sectionPath(s.slug);
          return (
            <li key={s.slug} className={cn('group relative flex flex-col gap-2.5 rounded-xl p-[18px] transition-colors hover:bg-paper focus-within:bg-paper', current && 'bg-paper')}>
              <span className={cn('grid size-11 place-items-center rounded-[10px] text-green-900', i % 2 ? 'bg-lime-soft' : 'bg-green-soft')} aria-hidden>
                <Icon className="size-[22px]" />
              </span>
              <Link
                to={sectionPath(s.slug)}
                onClick={onNavigate}
                aria-current={current ? 'page' : undefined}
                className="font-serif text-[22px] font-semibold leading-tight text-ink after:absolute after:inset-0 after:rounded-xl group-hover:text-green-700"
              >
                {meta.label ?? s.name}
                {meta.label && <span className="sr-only"> ({s.name})</span>}
              </Link>
              {meta.blurb && <p className="text-meta text-ink-muted">{meta.blurb}</p>}
              {story && (
                <div className="mt-auto flex flex-col gap-1 border-t border-line pt-2.5">
                  <span className="text-kicker uppercase text-green-500-text">Latest</span>
                  <Link to={`/article/${story.slug}`} onClick={onNavigate} className="relative z-10 text-button text-green-700 hover:underline">
                    {story.title} <span aria-hidden>→</span>
                  </Link>
                </div>
              )}
            </li>
          );
        })}
      </ul>
      <div className="bg-green-soft">
        <div className="container-page flex flex-wrap items-center gap-x-7 gap-y-2 py-4">
          <p className="text-kicker uppercase text-green-700">Also on Amaranth</p>
          <ul className="flex flex-wrap gap-x-7 gap-y-2">
            {alsoLinks.map((l) => (
              <li key={l.to}>
                <Link to={l.to} onClick={onNavigate} className="text-button text-green-900 hover:text-green-700 hover:underline">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function MoreMenu({ sections }: { sections: NavSection[] }) {
  const [open, setOpen] = useState(false);
  const [opened, setOpened] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const menuId = useId();
  const location = useLocation();
  const active = sections.some((s) => location.pathname === sectionPath(s.slug));
  const latest = useMenuLatest(
    sections.map((s) => s.slug),
    opened,
  );

  useEffect(() => setOpen(false), [location.pathname]);
  useEffect(() => {
    if (!open) return;
    setOpened(true);
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      setOpen(false);
      button.current?.focus();
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (!sections.length) return null;
  return (
    <div ref={ref}>
      <button
        ref={button}
        type="button"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((v) => !v)}
        onMouseEnter={() => setOpened(true)}
        className={cn(navLinkClass({ isActive: active || open }), 'gap-1')}
      >
        More
        <ChevronDown className={cn('size-3.5 transition-transform', open && 'rotate-180')} aria-hidden />
      </button>
      {open && (
        <>
          <div className="absolute inset-x-0 top-full z-20 h-[100dvh] bg-paper/50" aria-hidden onMouseDown={() => setOpen(false)} />
          <div className="absolute inset-x-0 top-full z-30">
            <MorePanel id={menuId} sections={sections} latest={latest.data} onNavigate={() => setOpen(false)} />
          </div>
        </>
      )}
    </div>
  );
}

function PrimaryNav() {
  const { primary, more } = useNavSections();
  const sectionActive = useSectionActive();
  return (
    <nav aria-label="Sections" className="relative hidden bg-green-700 md:block">
      <div className="container-page flex items-center justify-between">
        <ul className="flex gap-4 lg:gap-9">
          {primary.map((s) => (
            <li key={s.slug}>
              <NavLink to={sectionPath(s.slug)} className={({ isActive }) => navLinkClass({ isActive: sectionActive(s.slug, isActive) })}>
                {s.name}
              </NavLink>
            </li>
          ))}
          <li>
            <MoreMenu sections={more} />
          </li>
        </ul>
        <Link to="/search" className="inline-flex items-center gap-2 text-button text-on-dark hover:text-lime">
          <Search className="size-5" aria-hidden />
          <span className="sr-only lg:not-sr-only">Search</span>
        </Link>
      </div>
    </nav>
  );
}

function MobileDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const { all } = useNavSections();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-label="Menu"
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      className="m-0 h-dvh max-h-none w-[min(320px,86vw)] max-w-none bg-green-900 p-0 text-on-dark backdrop:bg-scrim"
    >
      <div className="flex h-full flex-col">
        <div className="flex h-[58px] items-center justify-between border-b border-green-700 px-4">
          <span className="font-serif text-[20px] font-bold tracking-[0.06em]">AMARANTH</span>
          <button type="button" onClick={onClose} className="grid size-10 place-items-center rounded-md hover:bg-green-700" aria-label="Close menu">
            <X className="size-6" aria-hidden />
          </button>
        </div>
        <nav aria-label="Sections" className="flex-1 overflow-y-auto px-4 py-4">
          <p className="mb-2 text-kicker uppercase text-lime">Sections</p>
          <ul className="flex flex-col">
            {all.map((s) => (
              <li key={s.slug}>
                <NavLink
                  to={sectionPath(s.slug)}
                  onClick={onClose}
                  className={({ isActive }) => cn('block py-2.5 text-[16px] font-semibold', isActive ? 'text-lime' : 'text-on-dark')}
                >
                  {s.name}
                </NavLink>
              </li>
            ))}
          </ul>
          <p className="mb-2 mt-6 text-kicker uppercase text-lime">The Publication</p>
          <ul className="flex flex-col">
            {publicationLinks.map((l) => (
              <li key={l.to}>
                <Link to={l.to} onClick={onClose} className="block py-2 text-[15px] text-green-soft">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="flex flex-col gap-3 border-t border-green-700 p-4">
          <ButtonLink to="/submit" variant="accent" onClick={onClose}>
            Submit a Story
          </ButtonLink>
          <Link to="/admin/login" onClick={onClose} className="text-center text-button text-green-soft">
            Staff log in
          </Link>
        </div>
      </div>
    </dialog>
  );
}

function SectionChips() {
  const { primary, more } = useNavSections();
  const sectionActive = useSectionActive();
  return (
    <nav aria-label="Sections" className="bg-green-700 md:hidden">
      <ul data-scroll-x className="no-scrollbar flex gap-2 overflow-x-auto px-4 py-2.5">
        {[...primary, ...more].map((s) => (
          <li key={s.slug} className="shrink-0">
            <NavLink
              to={sectionPath(s.slug)}
              className={({ isActive }) =>
                cn(
                  'inline-flex h-8 items-center rounded-full border px-3.5 text-nav uppercase',
                  sectionActive(s.slug, isActive) ? 'border-lime bg-lime text-green-900' : 'border-green-500 text-on-dark',
                )
              }
            >
              {s.name}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function MobileHeader() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  useEffect(() => setOpen(false), [location.pathname]);
  return (
    <>
      <div className="sticky top-0 z-20 bg-green-900 md:hidden">
        <div className="flex h-[58px] items-center justify-between px-2">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="grid size-11 place-items-center rounded-md text-on-dark"
            aria-label="Open menu"
            aria-haspopup="dialog"
          >
            <Menu className="size-6" aria-hidden />
          </button>
          <Link to="/" className="flex items-center gap-2 text-on-dark" aria-label="Amaranth — front page">
            <LogoMark className="h-7" />
            <span className="font-serif text-[24px] font-bold leading-none tracking-[0.06em]">AMARANTH</span>
          </Link>
          <Link to="/search" className="grid size-11 place-items-center rounded-md text-on-dark" aria-label="Search">
            <Search className="size-[22px]" aria-hidden />
          </Link>
        </div>
      </div>
      <SectionChips />
      <MobileDrawer open={open} onClose={() => setOpen(false)} />
    </>
  );
}

export function SiteHeader() {
  return (
    <header>
      <UtilityBar />
      <Masthead />
      <PrimaryNav />
      <MobileHeader />
    </header>
  );
}

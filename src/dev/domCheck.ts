// window.__domCheck() in dev builds: overflow, accessible names, heading order,
// missing alt text. Used for the 375 / 768 / 1024 / 1440 checks of every screen.
function domCheck() {
  const w = document.documentElement.clientWidth;
  const offenders = [...document.querySelectorAll<HTMLElement>('body *')]
    .filter((e) => e.getBoundingClientRect().right > w + 1 && getComputedStyle(e).position !== 'fixed')
    .filter((e) => !e.closest('[data-scroll-x]'))
    .slice(0, 10)
    .map((e) => `${e.tagName.toLowerCase()}.${String(e.className).slice(0, 60)}`);
  const unnamed = [...document.querySelectorAll<HTMLElement>('button, a[href], input:not([type="hidden"]), select, textarea, [role="button"]')]
    .filter((e) => !e.closest('[aria-hidden="true"]'))
    .filter(
      (e) =>
        !(
          e.getAttribute('aria-label') ||
          e.getAttribute('aria-labelledby') ||
          e.textContent?.trim() ||
          (e as HTMLInputElement).labels?.length ||
          e.getAttribute('title') ||
          e.querySelector('img[alt]:not([alt=""])')
        ),
    )
    .map((e) => e.outerHTML.slice(0, 100));
  const headings = [...document.querySelectorAll('h1, h2, h3, h4, h5, h6')].map((h) => Number(h.tagName[1]));
  const headingSkips = headings.filter((h, i) => i > 0 && h > headings[i - 1] + 1).length;
  return {
    width: w,
    pageOverflow: document.documentElement.scrollWidth > w,
    offenders,
    unnamed,
    h1Count: headings.filter((h) => h === 1).length,
    firstHeading: headings[0],
    headingSkips,
    imagesWithoutAlt: [...document.querySelectorAll('img:not([alt])')].length,
    title: document.title,
  };
}

type SweepResult = { checked: number; width: number; issues: Record<string, string[]> };
type DevWindow = Window & { __domCheck: typeof domCheck; __startSweep: (paths?: string[]) => void; __sweepResult: SweepResult | null; __devPaths?: string[] };

/** Visits every /dev screen with client-side navigation and records problems in window.__sweepResult. */
async function sweep(paths: string[]) {
  const w = window as unknown as DevWindow;
  w.__sweepResult = null;
  const issues: Record<string, string[]> = {};
  for (const p of paths) {
    history.pushState({}, '', p);
    dispatchEvent(new PopStateEvent('popstate'));
    await new Promise((r) => setTimeout(r, 1500));
    const c = domCheck();
    const found: string[] = [];
    if (c.pageOverflow) found.push(`overflow: ${c.offenders.slice(0, 3).join(' | ')}`);
    if (c.unnamed.length) found.push(`unnamed: ${c.unnamed.slice(0, 2).join(' | ')}`);
    if (c.h1Count !== 1) found.push(`h1=${c.h1Count}`);
    if (c.headingSkips) found.push(`heading skips=${c.headingSkips}`);
    if (c.imagesWithoutAlt) found.push(`images without alt=${c.imagesWithoutAlt}`);
    if (found.length) issues[p] = found;
  }
  w.__sweepResult = { checked: paths.length, width: document.documentElement.clientWidth, issues };
}

const w = window as unknown as DevWindow;
w.__domCheck = domCheck;
w.__sweepResult = null;
w.__startSweep = (paths) => void sweep(paths ?? w.__devPaths ?? []);

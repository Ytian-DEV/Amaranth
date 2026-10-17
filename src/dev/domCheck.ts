// window.__domCheck() in dev builds: overflow, accessible names, heading order,
// missing alt text. Used for the 375 / 768 / 1024 / 1440 checks of every screen.
function domCheck() {
  const w = document.documentElement.clientWidth;
  const offenders = [...document.querySelectorAll<HTMLElement>('body *')]
    .filter((e) => e.getBoundingClientRect().right > w + 1 && getComputedStyle(e).position !== 'fixed')
    .filter((e) => !e.closest('[data-scroll-x]'))
    .slice(0, 10)
    .map((e) => `${e.tagName.toLowerCase()}.${String(e.className).slice(0, 60)}`);
  const unnamed = [...document.querySelectorAll<HTMLElement>('button, a[href], input, select, textarea, [role="button"]')]
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

(window as unknown as { __domCheck: typeof domCheck }).__domCheck = domCheck;

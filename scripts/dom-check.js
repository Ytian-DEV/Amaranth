// Paste into the browser console (or run via the preview tool) on any screen.
// Reports horizontal overflow, controls without accessible names, heading order
// and images without alt. Used for the 375 / 768 / 1024 / 1440 checks.
(() => {
  const w = document.documentElement.clientWidth;
  const offenders = [...document.querySelectorAll('body *')]
    .filter((e) => e.getBoundingClientRect().right > w + 1 && getComputedStyle(e).position !== 'fixed')
    .slice(0, 10)
    .map((e) => `${e.tagName.toLowerCase()}.${String(e.className).slice(0, 60)}`);
  const unnamed = [...document.querySelectorAll('button, a[href], input, select, textarea, [role="button"]')]
    .filter((e) => !(e.getAttribute('aria-label') || e.getAttribute('aria-labelledby') || e.textContent.trim() || e.labels?.length || e.getAttribute('title') || e.querySelector('img[alt]:not([alt=""])')))
    .map((e) => e.outerHTML.slice(0, 80));
  const headings = [...document.querySelectorAll('h1, h2, h3, h4, h5, h6')].map((h) => Number(h.tagName[1]));
  const skips = headings.filter((h, i) => i > 0 && h > headings[i - 1] + 1);
  const noAlt = [...document.querySelectorAll('img:not([alt])')].map((i) => i.src.slice(-60));
  return {
    width: w,
    pageOverflow: document.documentElement.scrollWidth > w,
    offenders,
    unnamed,
    h1Count: headings.filter((h) => h === 1).length,
    headingSkips: skips.length,
    imagesWithoutAlt: noAlt,
    title: document.title,
  };
})();

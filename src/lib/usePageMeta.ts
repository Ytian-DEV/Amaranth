import { useEffect } from 'react';
import { env } from './env';
import { useDocumentTitle } from './useDocumentTitle';

export const DEFAULT_DESCRIPTION =
  'Amaranth — the official student publication of Visayas State University, Baybay City, Leyte. News, sports, features, literary and views written by students, for students.';

type PageMeta = { title?: string | null; description?: string | null; path?: string; image?: string | null; type?: 'website' | 'article' };

function setTag(selector: string, create: () => HTMLElement, attr: string, value: string) {
  let el = document.head.querySelector<HTMLElement>(selector);
  if (!el) {
    el = create();
    document.head.appendChild(el);
  }
  el.setAttribute(attr, value);
}

const meta = (key: 'name' | 'property', name: string, content: string) =>
  setTag(
    `meta[${key}="${name}"]`,
    () => {
      const el = document.createElement('meta');
      el.setAttribute(key, name);
      return el;
    },
    'content',
    content,
  );

/**
 * Title, description, canonical URL and Open Graph tags for the current route.
 * Crawlers that don't run JavaScript get the same tags from middleware.ts.
 */
export function usePageMeta({ title, description, path, image, type = 'website' }: PageMeta) {
  useDocumentTitle(title);
  useEffect(() => {
    const desc = description?.trim() || DEFAULT_DESCRIPTION;
    const url = `${env.siteUrl}${path ?? window.location.pathname}`;
    const fullTitle = title ? `${title} · Amaranth` : 'Amaranth | The Official Student Publication of Visayas State University';
    meta('name', 'description', desc);
    setTag('link[rel="canonical"]', () => Object.assign(document.createElement('link'), { rel: 'canonical' }), 'href', url);
    for (const [prop, value] of [
      ['og:title', fullTitle],
      ['og:description', desc],
      ['og:url', url],
      ['og:type', type],
      ['og:image', image || `${env.siteUrl}/og-default.jpg`],
    ] as const) {
      meta('property', prop, value);
    }
  }, [title, description, path, image, type]);
}

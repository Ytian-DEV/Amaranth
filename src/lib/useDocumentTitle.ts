import { useEffect } from 'react';

const SITE = 'Amaranth';

/** Sets document.title for the current route: "Page · Amaranth" or the site title. */
export function useDocumentTitle(title?: string | null) {
  useEffect(() => {
    document.title = title ? `${title} · ${SITE}` : `${SITE} | The Official Student Publication of Visayas State University`;
  }, [title]);
}

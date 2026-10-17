import { useState } from 'react';
import { slugify } from '@/lib/slug';

/** Name + slug pair: the slug follows the name until someone edits it. */
export function useNameSlug(initialName = '', initialSlug = '', prefix = '') {
  const [name, setName] = useState(initialName);
  const [slug, setSlug] = useState(initialSlug);
  const [touched, setTouched] = useState(!!initialSlug);
  return {
    name,
    slug: touched ? slug : slugify(`${prefix} ${name}`),
    setName,
    setSlug: (s: string) => {
      setTouched(true);
      setSlug(s);
    },
  };
}

export const validSlug = (s: string) => /^[a-z0-9]+(-[a-z0-9]+)*$/.test(s);

/** Optional number input value: '' ↔ null. */
export const numOrNull = (v: string) => (v.trim() === '' ? null : Number(v));

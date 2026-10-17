import type { MediaVariant } from './database.types';
import { env } from './env';

export type ImageSource = {
  bucket?: string | null;
  path?: string | null;
  width?: number | null;
  height?: number | null;
  alt?: string | null;
  variants?: MediaVariant[] | null;
};

/** Public URL of an object in a public bucket ("media" or "archives"). */
export function publicUrl(bucket: string | null | undefined, path: string | null | undefined) {
  if (!bucket || !path) return undefined;
  if (/^https?:\/\//.test(path) || path.startsWith('/')) return path; // fixtures / absolute
  const base = env.supabaseUrl?.replace(/\/$/, '') ?? '';
  return `${base}/storage/v1/object/public/${bucket}/${path.split('/').map(encodeURIComponent).join('/')}`;
}

/** srcset from stored resized variants plus the original. */
export function srcSet(source: ImageSource) {
  const entries = [...(source.variants ?? [])]
    .filter((v) => v.width > 0 && v.path)
    .sort((a, b) => a.width - b.width)
    .map((v) => `${publicUrl(source.bucket, v.path)} ${v.width}w`);
  if (source.width && source.path) entries.push(`${publicUrl(source.bucket, source.path)} ${source.width}w`);
  return entries.length > 1 ? entries.join(', ') : undefined;
}

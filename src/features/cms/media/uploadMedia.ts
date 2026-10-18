import type { MediaAssetRow, MediaVariant } from '@/lib/database.types';
import { compressImage, safeFileName } from '@/lib/images';
import { publicUrl } from '@/lib/media';
import { getSupabase, unwrap } from '@/lib/supabase';

export const MEDIA_MAX_BYTES = 10 * 1024 * 1024;
export const MEDIA_ACCEPT = 'image/jpeg,image/png,image/webp,image/avif,image/gif';
// 320: thumbnails · 640/960: phone-width photos (a 412px phone at 2x needs ~800) · 1280: desktop
export const VARIANT_WIDTHS = [320, 640, 960, 1280];

export function mediaProblem(file: File) {
  if (!file.type.startsWith('image/')) return `${file.name} is not an image.`;
  // dropped files skip the picker's accept list; the media bucket only stores these types
  if (!MEDIA_ACCEPT.split(',').includes(file.type)) return `${file.name} can’t be used (${file.type.replace('image/', '').toUpperCase()}). Save it as PNG, JPG or WebP first.`;
  if (file.size > 40 * 1024 * 1024) return `${file.name} is too large (max 40 MB before compression).`;
  return null;
}

/**
 * Uploads an image to the public "media" bucket: a compressed WebP original (≤2400px)
 * plus 320/640/960/1280px variants for srcset, then records it in media_assets.
 */
export async function uploadMediaImage(
  file: File,
  uploadedBy: string,
  meta: { alt?: string; caption?: string; credit?: string } = {},
): Promise<MediaAssetRow> {
  const supabase = getSupabase();
  const storage = supabase.storage.from('media');
  const now = new Date();
  const folder = `articles/${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${crypto.randomUUID().slice(0, 8)}`;
  const base = safeFileName(file.name).replace(/\.[^.]+$/, '');

  const isGif = file.type === 'image/gif';
  const main = isGif ? { file, width: undefined, height: undefined } : await compressImage(file, { maxDimension: 2400 });
  if (main.file.size > MEDIA_MAX_BYTES) throw new Error(`${file.name} is still larger than 10 MB after compression.`);

  const ext = main.file.type === 'image/webp' ? 'webp' : (main.file.name.split('.').pop() ?? 'img');
  const path = `${folder}/${base}.${ext}`;
  const { error } = await storage.upload(path, main.file, { contentType: main.file.type, cacheControl: '31536000' });
  if (error) throw new Error(`Upload failed: ${error.message}`);

  const variants: MediaVariant[] = [];
  if (!isGif && main.width) {
    for (const width of VARIANT_WIDTHS.filter((w) => w < main.width!)) {
      const v = await compressImage(file, { maxDimension: width, quality: 0.78 });
      const vPath = `${folder}/${base}-${width}.webp`;
      const up = await storage.upload(vPath, v.file, { contentType: v.file.type, cacheControl: '31536000' });
      if (!up.error) variants.push({ width: v.width ?? width, path: vPath });
    }
  }

  return unwrap(
    await supabase
      .from('media_assets')
      .insert({
        bucket: 'media',
        path,
        kind: 'image',
        mime_type: main.file.type,
        size_bytes: main.file.size,
        width: main.width ?? null,
        height: main.height ?? null,
        alt_text: meta.alt ?? '',
        caption: meta.caption ?? null,
        credit: meta.credit ?? null,
        variants,
        uploaded_by: uploadedBy,
      })
      .select('*')
      .single(),
  );
}

type SizedAsset = Pick<MediaAssetRow, 'id' | 'bucket' | 'path' | 'kind' | 'mime_type' | 'width' | 'variants'>;

/** Standard widths an image is missing (by file name: portrait variants store a smaller actual width). */
export function missingWidths(asset: Pick<SizedAsset, 'path' | 'kind' | 'mime_type' | 'width' | 'variants'>) {
  if (asset.kind !== 'image' || asset.mime_type === 'image/gif' || !asset.width) return [];
  const base = asset.path.replace(/\.[^./]+$/, '');
  const have = new Set((asset.variants ?? []).map((v) => v.path));
  return VARIANT_WIDTHS.filter((w) => w < asset.width! && !have.has(`${base}-${w}.webp`));
}

/** Makes the missing srcset sizes for an image uploaded before they existed. Returns how many it added. */
export async function addMissingSizes(asset: SizedAsset): Promise<number> {
  const widths = missingWidths(asset);
  const src = publicUrl(asset.bucket, asset.path);
  if (!widths.length || !src) return 0;
  const res = await fetch(src);
  if (!res.ok) throw new Error(`Couldn’t download ${asset.path} (${res.status}).`);
  const blob = await res.blob();
  const original = new File([blob], asset.path.split('/').pop() ?? 'image', { type: blob.type || asset.mime_type || 'image/webp' });
  const storage = getSupabase().storage.from(asset.bucket);
  const base = asset.path.replace(/\.[^./]+$/, '');
  const added: MediaVariant[] = [];
  for (const width of widths) {
    const v = await compressImage(original, { maxDimension: width, quality: 0.78 });
    if (!v.width) continue; // the browser couldn't decode it
    const path = `${base}-${width}.webp`;
    const up = await storage.upload(path, v.file, { contentType: v.file.type, cacheControl: '31536000', upsert: true });
    if (!up.error) added.push({ width: v.width, path });
  }
  if (!added.length) return 0;
  const variants = [...(asset.variants ?? []).filter((v) => !added.some((a) => a.path === v.path)), ...added].sort((a, b) => a.width - b.width);
  unwrap(await getSupabase().from('media_assets').update({ variants }).eq('id', asset.id).select('id'));
  return added.length;
}

// Client-side image compression before upload (intake files and the media library).

export type CompressOptions = {
  /** longest edge in px */
  maxDimension?: number;
  quality?: number;
  type?: 'image/webp' | 'image/jpeg';
};

const COMPRESSIBLE = /^image\/(jpeg|png|webp)$/;

export function isCompressible(file: File) {
  return COMPRESSIBLE.test(file.type);
}

/** Target size that keeps the aspect ratio and fits inside maxDimension. */
export function fitWithin(width: number, height: number, max: number) {
  if (width <= max && height <= max) return { width, height };
  const scale = max / Math.max(width, height);
  return { width: Math.round(width * scale), height: Math.round(height * scale) };
}

/**
 * Downscales and re-encodes JPEG/PNG/WebP images. Returns the original file when it
 * can't be compressed or the result would not be smaller.
 */
export async function compressImage(
  file: File,
  { maxDimension = 2400, quality = 0.82, type = 'image/webp' }: CompressOptions = {},
): Promise<{ file: File; width?: number; height?: number }> {
  if (!isCompressible(file) || typeof createImageBitmap !== 'function') return { file };
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    return { file };
  }
  const original = { width: bitmap.width, height: bitmap.height };
  const { width, height } = fitWithin(original.width, original.height, maxDimension);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return { file, ...original };
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));
  if (!blob || (blob.size >= file.size && width === original.width)) return { file, ...original };
  const ext = type === 'image/webp' ? 'webp' : 'jpg';
  const name = file.name.replace(/\.[^.]+$/, '') + `.${ext}`;
  return { file: new File([blob], name, { type }), width, height };
}

/** Safe storage object name: lowercase, ascii, no spaces. */
export function safeFileName(name: string) {
  const dot = name.lastIndexOf('.');
  const base = (dot > 0 ? name.slice(0, dot) : name)
    .normalize('NFKD')
    .replace(/[^\w-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase()
    .slice(0, 60);
  const ext = dot > 0 ? name.slice(dot + 1).toLowerCase().replace(/[^a-z0-9]/g, '') : '';
  return `${base || 'file'}${ext ? `.${ext}` : ''}`;
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

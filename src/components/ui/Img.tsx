import { useState } from 'react';
import { cn } from '@/lib/cn';
import { publicUrl, srcSet, type ImageSource } from '@/lib/media';

type ImgProps = ImageSource & {
  className?: string;
  /** e.g. "(min-width: 1024px) 368px, 100vw" */
  sizes?: string;
  /** Above-the-fold images: eager + high fetch priority. */
  priority?: boolean;
  /** CSS aspect-ratio of the frame, e.g. "16/9". Defaults to the image's own ratio. */
  ratio?: string;
  rounded?: boolean;
};

/**
 * Responsive image in a photo-coloured frame (the Figma "Photo" placeholder).
 * Lazy by default; shows the empty frame when there's no image or it fails.
 */
export function Img({ bucket, path, width, height, alt, variants, className, sizes, priority, ratio, rounded = true }: ImgProps) {
  const [failed, setFailed] = useState(false);
  const src = publicUrl(bucket, path);
  const aspect = ratio ?? (width && height ? `${width}/${height}` : '16/9');
  return (
    <div className={cn('relative overflow-hidden bg-photo', rounded && 'rounded-md', className)} style={{ aspectRatio: aspect }}>
      {src && !failed && (
        <img
          src={src}
          srcSet={srcSet({ bucket, path, width, variants })}
          sizes={sizes}
          width={width ?? undefined}
          height={height ?? undefined}
          alt={alt ?? ''}
          loading={priority ? 'eager' : 'lazy'}
          decoding={priority ? 'sync' : 'async'}
          fetchPriority={priority ? 'high' : 'auto'}
          onError={() => setFailed(true)}
          className="absolute inset-0 size-full object-cover"
        />
      )}
    </div>
  );
}

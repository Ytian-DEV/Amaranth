import { Check, Facebook, Link2, Share2 } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/cn';
import { trackShare } from '../analytics/tracker';

function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className} fill="currentColor">
      <path d="M17.75 3h3.07l-6.7 7.66L22 21h-6.17l-4.83-6.32L5.47 21H2.4l7.17-8.2L2 3h6.33l4.37 5.77L17.75 3Zm-1.08 16.2h1.7L7.4 4.73H5.58l11.1 14.47Z" />
    </svg>
  );
}

function MessengerIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className} fill="currentColor">
      <path d="M12 2C6.36 2 2 6.13 2 11.7c0 2.91 1.19 5.43 3.14 7.17.16.15.26.35.27.57l.05 1.78c.02.57.6.94 1.12.71l1.98-.87c.17-.08.36-.09.53-.04.91.25 1.88.38 2.91.38 5.64 0 10-4.13 10-9.7S17.64 2 12 2Zm6 7.46-2.94 4.66c-.47.74-1.47.93-2.17.4l-2.34-1.75a.6.6 0 0 0-.72 0l-3.16 2.4c-.42.32-.97-.18-.69-.63l2.94-4.66c.47-.74 1.47-.93 2.17-.4l2.34 1.75a.6.6 0 0 0 .72 0l3.16-2.4c.42-.32.97.18.69.63Z" />
    </svg>
  );
}

const button =
  'inline-grid size-10 place-items-center rounded-full border border-line text-ink transition-colors hover:border-lime hover-lime';

/** Facebook, Messenger, X, copy link — and the native share sheet where available. */
export function ShareButtons({ url, title, className }: { url: string; title: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  const enc = encodeURIComponent;
  const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  async function copy() {
    trackShare('copy');
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt('Copy this link', url);
    }
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <span className="mr-1 text-meta text-ink-muted">Share</span>
      <a
        className={button}
        href={`https://www.facebook.com/sharer/sharer.php?u=${enc(url)}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Share on Facebook"
        onClick={() => trackShare('facebook')}
      >
        <Facebook className="size-[18px]" aria-hidden />
      </a>
      <a
        className={cn(button, 'md:hidden')}
        href={`fb-messenger://share/?link=${enc(url)}`}
        aria-label="Send in Messenger"
        onClick={() => trackShare('messenger')}
      >
        <MessengerIcon className="size-[18px]" />
      </a>
      <a
        className={button}
        href={`https://twitter.com/intent/tweet?url=${enc(url)}&text=${enc(title)}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Share on X"
        onClick={() => trackShare('x')}
      >
        <XIcon className="size-4" />
      </a>
      <button type="button" className={button} onClick={() => void copy()} aria-label={copied ? 'Link copied' : 'Copy link'}>
        {copied ? <Check className="size-[18px] text-green-700" aria-hidden /> : <Link2 className="size-[18px]" aria-hidden />}
      </button>
      {canShare && (
        <button
          type="button"
          className={cn(button, 'md:hidden')}
          onClick={() => {
            trackShare('native');
            void navigator.share({ title, url }).catch(() => undefined);
          }}
          aria-label="More sharing options"
        >
          <Share2 className="size-[18px]" aria-hidden />
        </button>
      )}
      <span className="sr-only" aria-live="polite">
        {copied ? 'Link copied to clipboard' : ''}
      </span>
    </div>
  );
}

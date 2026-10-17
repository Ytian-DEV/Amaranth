import { Download } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Feedback';
import { Modal } from '@/components/ui/Modal';
import { cardFileName, drawSocialCard, type SocialCardData } from './socialCard';

/** Preview of a social card at full resolution, scaled down, with a PNG download. */
export function SocialCardModal({ data, onClose }: { data: SocialCardData; onClose: () => void }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setReady(false);
    if (canvas.current) {
      void drawSocialCard(canvas.current, data)
        .then(() => !cancelled && setReady(true))
        .catch(() => !cancelled && setError('Couldn’t draw the card.'));
    }
    return () => {
      cancelled = true;
    };
  }, [data]);

  function download() {
    setError(null);
    try {
      canvas.current?.toBlob((blob) => {
        if (!blob) return setError('Couldn’t create the image.');
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = cardFileName(data);
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      }, 'image/png');
    } catch {
      // a photo served without CORS headers "taints" the canvas
      setError('The photo blocks downloading (it isn’t from the media library). Remove it from the athlete, or upload it to the media library.');
    }
  }

  return (
    <Modal
      open
      size="lg"
      onClose={onClose}
      title={`${data.kicker[0]}${data.kicker.slice(1).toLowerCase()} card`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
          <Button icon={<Download className="size-4" aria-hidden />} disabled={!ready} onClick={download}>
            Download PNG ({data.width}×{data.height})
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        {error && <Alert tone="error">{error}</Alert>}
        <canvas
          ref={canvas}
          width={data.width}
          height={data.height}
          role="img"
          aria-label={`${data.kicker}: ${data.name}${data.faction ? `, ${data.faction.name}` : ''}`}
          className="mx-auto h-auto w-full max-w-[420px] rounded-md border border-line"
        />
        <p className="text-meta font-normal text-ink-muted">
          Ready for Instagram and Facebook. The photo comes from the athlete’s profile; add one in the Athletes tab for a fuller card.
        </p>
      </div>
    </Modal>
  );
}

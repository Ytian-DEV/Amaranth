import { useEffect, useRef } from 'react';
import { loadApi, turnstileSiteKey, turnstileWidget, type Api } from '@/lib/turnstile';

/** Cloudflare Turnstile check; place inside a public form, above its submit button. Renders nothing until a check needs the reader. */
export function Turnstile({ className }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!turnstileSiteKey || !ref.current) return;
    let id: string | null = null;
    let api: Api | null = null;
    let gone = false;
    loadApi()
      .then((a) => {
        if (gone || !ref.current) return;
        api = a;
        id = a.render(ref.current, {
          sitekey: turnstileSiteKey,
          execution: 'execute',
          appearance: 'interaction-only',
          size: 'flexible',
          callback: turnstileWidget.token,
          'error-callback': turnstileWidget.failed,
        });
        turnstileWidget.attach(a, id);
      })
      .catch(() => undefined); // getTurnstileToken explains it to the reader
    return () => {
      gone = true;
      if (api && id) {
        api.remove(id);
        turnstileWidget.detach(id);
      }
    };
  }, []);
  if (!turnstileSiteKey) return null;
  return <div ref={ref} className={className} />;
}

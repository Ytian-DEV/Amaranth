// Cloudflare Turnstile, the CAPTCHA on the public forms. Most people never see it: it checks
// in the background and only shows a checkbox when a visit looks automated.
// A form renders <Turnstile />; its submit code calls getTurnstileToken() (src/lib/sendForm.ts).

export type Api = {
  render: (el: HTMLElement, options: Record<string, unknown>) => string;
  execute: (id: string) => void;
  reset: (id: string) => void;
  remove: (id: string) => void;
};
declare global {
  interface Window {
    turnstile?: Api;
  }
}

/** Cloudflare's always-pass test key in development; the real key comes from VITE_TURNSTILE_SITE_KEY. */
export const turnstileSiteKey: string =
  import.meta.env.VITE_TURNSTILE_SITE_KEY || (import.meta.env.DEV && import.meta.env.MODE !== 'test' ? '1x00000000000000000000AA' : '');

const SCRIPT = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
let loading: Promise<Api> | null = null;

export function loadApi(): Promise<Api> {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  loading ??= new Promise<Api>((resolve, reject) => {
    const s = document.createElement('script');
    s.src = SCRIPT;
    s.async = true;
    s.onload = () => (window.turnstile ? resolve(window.turnstile) : reject(new Error('Turnstile did not load')));
    s.onerror = () => {
      loading = null;
      reject(new Error('Turnstile did not load'));
    };
    document.head.appendChild(s);
  });
  return loading;
}

// the widget on the page (one form is sent at a time)
let active: { api: Api; id: string } | null = null;
let waiting: { resolve: (t: string) => void; reject: (e: Error) => void } | null = null;

/** Called by <Turnstile /> (src/components/ui/Turnstile.tsx). */
export const turnstileWidget = {
  attach: (api: Api, id: string) => (active = { api, id }),
  detach: (id: string) => {
    if (active?.id === id) active = null;
  },
  token: (token: string) => waiting?.resolve(token),
  failed: () => waiting?.reject(new Error('The security check failed. Please try again.')),
};

/** Runs the check and resolves with a one-time token for /api/submit. */
export async function getTurnstileToken(): Promise<string> {
  if (!turnstileSiteKey) return '';
  if (!active) throw new Error('The security check is still loading. Please try again in a moment.');
  const { api, id } = active;
  waiting?.reject(new Error('cancelled'));
  return new Promise<string>((resolve, reject) => {
    const timer = window.setTimeout(() => finish(new Error('The security check took too long. Please try again.')), 120_000);
    const finish = (r: string | Error) => {
      window.clearTimeout(timer);
      waiting = null;
      if (typeof r === 'string') resolve(r);
      else reject(r);
    };
    waiting = { resolve: (t) => finish(t), reject: (e) => finish(e) };
    api.reset(id);
    api.execute(id);
  });
}


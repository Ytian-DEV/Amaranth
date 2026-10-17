import { Navigate } from 'react-router-dom';
import { COUNTDOWN_OG_IMAGE, COUNTDOWN_PATH, HUB_ALIAS_PATH } from '@/lib/countdown';
import { env } from '@/lib/env';
import { usePageMeta } from '@/lib/usePageMeta';
import { CountdownView } from './CountdownView';
import { useCountdown } from './skData';

/** /salingkusog-2026/countdown — public only while the newsroom switch is on; otherwise to the hub. */
export function CountdownPage() {
  const countdown = useCountdown();
  usePageMeta({
    title: countdown.data ? `${countdown.data.title} Countdown` : 'Salingkusog Countdown',
    description: 'The countdown to the VSU intramural games is on. May the odds be ever in your faction’s favor.',
    path: COUNTDOWN_PATH,
    image: `${env.siteUrl}${COUNTDOWN_OG_IMAGE}`,
  });

  if (countdown.isPending) return <div className="min-h-dvh bg-charcoal" aria-busy="true" />;
  // switched off, no current edition, or not loadable: send visitors on, so shared links never dead-end
  if (countdown.error || !countdown.data) return <Navigate to={HUB_ALIAS_PATH} replace />;
  return <CountdownView title={countdown.data.title} target={countdown.data.countdown_at} />;
}

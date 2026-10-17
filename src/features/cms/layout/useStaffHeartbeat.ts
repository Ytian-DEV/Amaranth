import { useEffect } from 'react';
import { getSupabase } from '@/lib/supabase';

const BEAT_MS = 30_000;
const IDLE_MS = 60_000;

/** Should this tick report active time? Visible tab and some input in the last minute. */
export function shouldBeat(visible: boolean, lastActivity: number, now: number) {
  return visible && now - lastActivity < IDLE_MS;
}

/**
 * Reports newsroom active time (statistics: staff usage). The database credits at most 45 s per
 * beat and nothing after a gap, so a tab left open or idle stops counting.
 */
export function useStaffHeartbeat(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    let lastActivity = Date.now();
    const activity = () => {
      lastActivity = Date.now();
    };
    const events = ['pointerdown', 'keydown', 'mousemove', 'wheel', 'touchstart', 'scroll'] as const;
    for (const ev of events) window.addEventListener(ev, activity, { passive: true });
    const beat = () => {
      if (!shouldBeat(document.visibilityState === 'visible', lastActivity, Date.now())) return;
      void getSupabase()
        .rpc('staff_heartbeat')
        .then(() => undefined, () => undefined);
    };
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        activity();
        beat();
      }
    };
    beat();
    const timer = window.setInterval(beat, BEAT_MS);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
      for (const ev of events) window.removeEventListener(ev, activity);
    };
  }, [enabled]);
}

import { ExternalLink } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Checkbox, Field, Input } from '@/components/ui/Field';
import { Alert } from '@/components/ui/Feedback';
import type { SkEditionRow } from '@/lib/database.types';
import { COUNTDOWN_PATH, defaultCountdownAt } from '@/lib/countdown';
import { formatDateTime } from '@/lib/format';
import { Card, CardHeader } from '../../ui';
import { fromLocalInput, toLocalInput } from '../scoring';
import { skErrorText, useSaveCountdown } from '../skApi';
import { SetupNote } from './shared';

/** "Show Countdown Page" switch and the time it counts down to. Managing roles only. */
export function CountdownCard({ edition }: { edition: SkEditionRow }) {
  const save = useSaveCountdown(edition.id);
  const [enabled, setEnabled] = useState(edition.countdown_enabled);
  const [when, setWhen] = useState(toLocalInput(edition.countdown_at ?? defaultCountdownAt(edition.starts_on)));
  const [message, setMessage] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);
  const dirty = enabled !== edition.countdown_enabled || fromLocalInput(when) !== fromLocalInput(toLocalInput(edition.countdown_at ?? defaultCountdownAt(edition.starts_on)));

  async function submit() {
    setMessage(null);
    if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(when)) return setMessage({ tone: 'error', text: 'Choose the date and time the games start.' });
    const at = fromLocalInput(when);
    try {
      // the default time is not stored, so moving the edition dates moves the countdown too
      await save.mutateAsync({ countdown_enabled: enabled, countdown_at: at === defaultCountdownAt(edition.starts_on) ? null : at });
      setMessage({ tone: 'success', text: enabled ? 'Saved. The countdown page is public.' : 'Saved. The countdown page is hidden (visitors go to the Salingkusog hub).' });
    } catch (err) {
      setMessage({ tone: 'error', text: skErrorText(err) });
    }
  }

  return (
    <Card aria-labelledby="sk-countdown">
      <CardHeader
        id="sk-countdown"
        title="Countdown page"
        action={
          <a href={COUNTDOWN_PATH} target="_blank" rel="noopener" className="inline-flex items-center gap-1.5 text-button text-green-700 hover:underline">
            Open <ExternalLink className="size-4" aria-hidden />
          </a>
        }
      />
      <div className="flex flex-col gap-4 px-5 pb-5">
        <SetupNote>
          A shareable Hunger Games–style countdown at <code className="text-ink">{COUNTDOWN_PATH}</code>. When it’s off, that link goes to the Salingkusog hub.
          Only Super admin, Executive Editor and Managing editor can change this.
        </SetupNote>
        {message && <Alert tone={message.tone}>{message.text}</Alert>}
        <Checkbox label="Show Countdown Page" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
        <Field label="Count down to (Philippine time)" hint={`Default: first day, 8:00 AM (${formatDateTime(defaultCountdownAt(edition.starts_on))})`}>
          {({ id, describedBy }) => <Input id={id} aria-describedby={describedBy} type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} className="sm:w-64" />}
        </Field>
        <Button loading={save.isPending} disabled={!dirty} className="self-start" onClick={() => void submit()}>
          Save countdown
        </Button>
      </div>
    </Card>
  );
}

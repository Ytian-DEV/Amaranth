import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Field, Input, Textarea } from '@/components/ui/Field';
import { Alert } from '@/components/ui/Feedback';
import { errorText } from '@/lib/errors';
import { useDocumentTitle } from '@/lib/useDocumentTitle';
import { PageHeader } from '../PageHeader';
import { FileField } from './FileField';
import { Honeypot, SuccessPanel } from './FormBits';
import { useSubmitEvent, type EventSubmission } from './intakeData';
import { focusFirstError, hasErrors, validate, type Errors } from './validate';

type Key = 'organization' | 'contactName' | 'email' | 'title' | 'date' | 'venue' | 'summary';
const empty: EventSubmission = { organization: '', contactName: '', email: '', title: '', date: '', venue: '', summary: '', website: '', files: [] };

export function SubmitEventForm({ onSubmit }: { onSubmit: (values: EventSubmission) => Promise<unknown> }) {
  const [values, setValues] = useState(empty);
  const [errors, setErrors] = useState<Errors<Key>>({});
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [failure, setFailure] = useState<string | null>(null);
  const set = (key: Key) => (e: { target: { value: string } }) => setValues((v) => ({ ...v, [key]: e.target.value }));

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formEl = event.currentTarget;
    const next = validate<Key>(values, {
      organization: { label: 'Organization', required: true, min: 2, max: 160 },
      contactName: { label: 'Contact name', required: true, min: 2, max: 120 },
      email: { label: 'Email', required: true, email: true },
      title: { label: 'Event title', required: true, min: 3, max: 200 },
      summary: { label: 'What happened', required: true, min: 20, max: 10000 },
    });
    setErrors(next);
    if (hasErrors(next)) return focusFirstError(formEl);
    setFailure(null);
    setStatus('sending');
    try {
      await onSubmit(values);
      setStatus('sent');
    } catch (err) {
      setStatus('idle');
      setFailure(errorText(err) ?? 'Your report could not be sent.');
    }
  }

  if (status === 'sent') {
    return (
      <SuccessPanel title="Thanks — your event report was received" againLabel="Report another event" onAgain={() => { setValues(empty); setStatus('idle'); }}>
        <p>Our editors may contact {values.email} for details or more photos.</p>
      </SuccessPanel>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="relative flex flex-col gap-5">
      {failure && <Alert tone="error">{failure}</Alert>}
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Organization or office" required error={errors.organization}>
          {({ id, describedBy, invalid }) => <Input id={id} aria-describedby={describedBy} aria-invalid={invalid} value={values.organization} onChange={set('organization')} />}
        </Field>
        <Field label="Contact person" required error={errors.contactName}>
          {({ id, describedBy, invalid }) => <Input id={id} autoComplete="name" aria-describedby={describedBy} aria-invalid={invalid} value={values.contactName} onChange={set('contactName')} />}
        </Field>
        <Field label="Email" required error={errors.email}>
          {({ id, describedBy, invalid }) => <Input id={id} type="email" autoComplete="email" aria-describedby={describedBy} aria-invalid={invalid} value={values.email} onChange={set('email')} />}
        </Field>
        <Field label="Date of the event">
          {({ id }) => <Input id={id} type="date" value={values.date} onChange={set('date')} />}
        </Field>
      </div>
      <Field label="Event title" required error={errors.title}>
        {({ id, describedBy, invalid }) => <Input id={id} aria-describedby={describedBy} aria-invalid={invalid} value={values.title} onChange={set('title')} />}
      </Field>
      <Field label="Venue">{({ id }) => <Input id={id} value={values.venue} onChange={set('venue')} />}</Field>
      <Field label="What happened" required error={errors.summary} hint="Who, what, when, where — and why it mattered. Include names and titles of speakers.">
        {({ id, describedBy, invalid }) => (
          <Textarea id={id} rows={8} className="min-h-48" aria-describedby={describedBy} aria-invalid={invalid} value={values.summary} onChange={set('summary')} />
        )}
      </Field>
      <FileField label="Photos and documents" files={values.files} onChange={(files) => setValues((v) => ({ ...v, files }))} hint="Up to 5 photos or documents, 20 MB each. Large photos are resized before upload." />
      <Honeypot value={values.website} onChange={(website) => setValues((v) => ({ ...v, website }))} />
      <Button type="submit" size="lg" loading={status === 'sending'} className="self-start">
        {status === 'sending' ? 'Sending…' : 'Send event report'}
      </Button>
    </form>
  );
}

export function SubmitEventLayout({ form }: { form: React.ReactNode }) {
  return (
    <div className="pb-16">
      <PageHeader
        title="Report an event"
        intro={
          <>
            Tell us about org activities, seminars, competitions and campus events. Writing a full article instead?{' '}
            <Link to="/submit" className="text-green-700 underline">Submit a story</Link>.
          </>
        }
      />
      <div className="container-page max-w-[860px] pt-10">{form}</div>
    </div>
  );
}

export function SubmitEventPage() {
  useDocumentTitle('Report an event');
  const submit = useSubmitEvent();
  return <SubmitEventLayout form={<SubmitEventForm onSubmit={(v) => submit.mutateAsync(v)} />} />;
}

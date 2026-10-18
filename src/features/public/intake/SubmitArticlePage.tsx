import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Checkbox, Field, Input, Select, Textarea } from '@/components/ui/Field';
import { Alert } from '@/components/ui/Feedback';
import { errorText } from '@/lib/errors';
import { useDocumentTitle } from '@/lib/useDocumentTitle';
import { PageHeader } from '../PageHeader';
import { FileField } from './FileField';
import { Turnstile } from '@/components/ui/Turnstile';
import { Honeypot, SuccessPanel } from './FormBits';
import { useSubmissionSections, useSubmitArticle, type ArticleSubmission } from './intakeData';
import { focusFirstError, hasErrors, validate, type Errors } from './validate';

type Key = 'name' | 'email' | 'affiliation' | 'section' | 'title' | 'summary' | 'body';
const empty: ArticleSubmission = { name: '', email: '', affiliation: '', section: '', title: '', summary: '', body: '', website: '', files: [] };

export function Guidelines() {
  return (
    <aside id="guidelines" aria-labelledby="guidelines-title" className="flex flex-col gap-4 self-start rounded-xl bg-lime-soft p-6 lg:sticky lg:top-6">
      <h2 id="guidelines-title" className="font-serif text-headline-m text-green-900">
        Submission guidelines
      </h2>
      <ul className="flex list-disc flex-col gap-2 pl-5 text-body-m text-ink">
        <li>Any VSU student, employee or alumnus may submit. Write in English or Filipino.</li>
        <li>News: 400–900 words. Features and essays: up to 2,000 words. Poems: up to three per submission.</li>
        <li>Send original, unpublished work only. Name your sources; don’t invent quotes.</li>
        <li>Attach photos you took or have permission to use, with a caption and credit.</li>
        <li>Editors may edit for length, clarity and style. We’ll contact you before publishing major changes.</li>
      </ul>
      <p className="text-meta font-normal text-ink-muted">
        Editors review every submission within 3 to 5 school days. Questions? <Link to="/contact" className="text-green-700 underline">Contact us</Link>.
      </p>
    </aside>
  );
}

export function SubmitArticleForm({
  sections,
  onSubmit,
}: {
  sections: { slug: string; name: string }[];
  onSubmit: (values: ArticleSubmission) => Promise<unknown>;
}) {
  const [values, setValues] = useState(empty);
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<Errors<Key | 'consent'>>({});
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [failure, setFailure] = useState<string | null>(null);

  const set = (key: Key) => (e: { target: { value: string } }) => setValues((v) => ({ ...v, [key]: e.target.value }));

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formEl = event.currentTarget;
    const next: Errors<Key | 'consent'> = validate<Key>(values, {
      name: { label: 'Name', required: true, min: 2, max: 120 },
      email: { label: 'Email', required: true, email: true },
      title: { label: 'Title', required: true, min: 3, max: 200 },
    });
    if (values.body.trim().length < 50 && values.files.length === 0) next.body = 'Paste your article (at least 50 characters) or attach a file.';
    if (!consent) next.consent = 'Please confirm before sending.';
    setErrors(next);
    if (hasErrors(next)) return focusFirstError(formEl);
    setFailure(null);
    setStatus('sending');
    try {
      await onSubmit(values);
      setStatus('sent');
    } catch (err) {
      setStatus('idle');
      setFailure(errorText(err) ?? 'Your submission could not be sent.');
    }
  }

  if (status === 'sent') {
    return (
      <SuccessPanel
        title="Thank you — your story is with our editors"
        againLabel="Submit another story"
        onAgain={() => {
          setValues(empty);
          setConsent(false);
          setStatus('idle');
        }}
      >
        <p>
          An editor will reply to <strong>{values.email}</strong> within 3 to 5 school days.
        </p>
      </SuccessPanel>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="relative flex flex-col gap-5">
      {failure && <Alert tone="error">{failure}</Alert>}
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Your name" required error={errors.name}>
          {({ id, describedBy, invalid }) => (
            <Input id={id} autoComplete="name" aria-describedby={describedBy} aria-invalid={invalid} value={values.name} onChange={set('name')} />
          )}
        </Field>
        <Field label="Email" required error={errors.email}>
          {({ id, describedBy, invalid }) => (
            <Input id={id} type="email" autoComplete="email" aria-describedby={describedBy} aria-invalid={invalid} value={values.email} onChange={set('email')} />
          )}
        </Field>
        <Field label="Program, year or organization" hint="e.g. BS Agriculture 3, or VSU Student Council">
          {({ id, describedBy }) => <Input id={id} aria-describedby={describedBy} value={values.affiliation} onChange={set('affiliation')} />}
        </Field>
        <Field label="Section">
          {({ id }) => (
            <Select id={id} value={values.section} onChange={set('section')}>
              <option value="">Not sure — let the editors decide</option>
              {sections.map((s) => (
                <option key={s.slug} value={s.slug}>
                  {s.name}
                </option>
              ))}
            </Select>
          )}
        </Field>
      </div>
      <Field label="Title" required error={errors.title}>
        {({ id, describedBy, invalid }) => (
          <Input id={id} maxLength={200} aria-describedby={describedBy} aria-invalid={invalid} value={values.title} onChange={set('title')} />
        )}
      </Field>
      <Field label="Short summary" hint="One or two sentences about the piece.">
        {({ id, describedBy }) => <Textarea id={id} rows={2} className="min-h-20" aria-describedby={describedBy} value={values.summary} onChange={set('summary')} />}
      </Field>
      <Field label="Your article" error={errors.body} hint="Paste the full text here, or attach it as a file below.">
        {({ id, describedBy, invalid }) => (
          <Textarea id={id} rows={12} className="min-h-64" aria-describedby={describedBy} aria-invalid={invalid} value={values.body} onChange={set('body')} />
        )}
      </Field>
      <FileField label="Attachments" files={values.files} onChange={(files) => setValues((v) => ({ ...v, files }))} />
      <div className="flex flex-col gap-1">
        <Checkbox
          data-invalid={errors.consent ? 'true' : undefined}
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          label="This is my original work (or I have permission to share it), and Amaranth may edit it for publication."
        />
        {errors.consent && (
          <p role="alert" className="text-meta text-alert">
            {errors.consent}
          </p>
        )}
      </div>
      <Honeypot value={values.website} onChange={(website) => setValues((v) => ({ ...v, website }))} />
      <Turnstile />
      <Button type="submit" size="lg" loading={status === 'sending'} className="self-start">
        {status === 'sending' ? 'Sending…' : 'Send to the editors'}
      </Button>
    </form>
  );
}

export function SubmitArticleLayout({ form }: { form: React.ReactNode }) {
  return (
    <div className="pb-16">
      <PageHeader
        title="Submit a story"
        intro={
          <>
            Amaranth is written by students, for students. Send us news, features, essays, poems or opinion pieces. Covering an
            event? <Link to="/submit/event" className="text-green-700 underline">Report it here</Link>.
          </>
        }
      />
      <div className="container-page grid gap-10 pt-10 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-16">
        <div>{form}</div>
        <Guidelines />
      </div>
    </div>
  );
}

export function SubmitArticlePage() {
  useDocumentTitle('Submit a story');
  const sections = useSubmissionSections();
  const submit = useSubmitArticle();
  return <SubmitArticleLayout form={<SubmitArticleForm sections={sections} onSubmit={(v) => submit.mutateAsync(v)} />} />;
}

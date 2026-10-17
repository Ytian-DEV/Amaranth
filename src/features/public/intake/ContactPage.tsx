import { Clock, Mail, MapPin, Phone } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { Field, Input, Select, Textarea } from '@/components/ui/Field';
import { Alert } from '@/components/ui/Feedback';
import type { ContactCategory } from '@/lib/database.types';
import { errorText } from '@/lib/errors';
import { useDocumentTitle } from '@/lib/useDocumentTitle';
import { PageHeader } from '../PageHeader';
import { useSiteSettings } from '../settings';
import { Honeypot, SuccessPanel } from './FormBits';
import { useDepartmentContacts, useSendContact, type ContactInput } from './intakeData';
import { focusFirstError, hasErrors, validate, type Errors } from './validate';

export type ContactInfo = { office_address: string[]; phones: string[]; emails: string[]; office_hours: string[] };
export type Department = { id: string; name: string; email: string | null; phone: string | null; description: string | null };

const defaultContact: ContactInfo = {
  office_address: ['Amaranth Publication Office', 'Student Center Building', 'Visayas State University', 'Baybay City, Leyte 6521-A'],
  phones: [],
  emails: ['amaranth@vsu.edu.ph'],
  office_hours: ['Monday – Friday: 8:00 AM – 5:00 PM'],
};

const categories: { value: ContactCategory; label: string }[] = [
  { value: 'general', label: 'General question' },
  { value: 'editorial', label: 'Editorial / corrections' },
  { value: 'submission', label: 'About a submission' },
  { value: 'feedback', label: 'Feedback' },
  { value: 'advertising', label: 'Partnerships & advertising' },
  { value: 'technical', label: 'Website problem' },
];

type Key = 'name' | 'email' | 'subject' | 'message';
const empty: ContactInput = { name: '', email: '', subject: '', category: 'general', message: '', website: '' };

export function ContactForm({ onSubmit }: { onSubmit: (v: ContactInput) => Promise<unknown> }) {
  const [values, setValues] = useState(empty);
  const [errors, setErrors] = useState<Errors<Key>>({});
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [failure, setFailure] = useState<string | null>(null);
  const set = (key: Key | 'category') => (e: { target: { value: string } }) => setValues((v) => ({ ...v, [key]: e.target.value }));

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formEl = event.currentTarget;
    const next = validate<Key>(values as Record<Key, string>, {
      name: { label: 'Name', required: true, min: 2, max: 120 },
      email: { label: 'Email', required: true, email: true },
      subject: { label: 'Subject', required: true, min: 2, max: 200 },
      message: { label: 'Message', required: true, min: 10, max: 5000 },
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
      setFailure(errorText(err) ?? 'Your message could not be sent.');
    }
  }

  if (status === 'sent') {
    return (
      <SuccessPanel title="Message sent" againLabel="Send another message" onAgain={() => { setValues(empty); setStatus('idle'); }}>
        <p>Thanks, {values.name.split(' ')[0]}. We’ll reply to {values.email} as soon as we can.</p>
      </SuccessPanel>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="relative flex flex-col gap-5">
      {failure && <Alert tone="error">{failure}</Alert>}
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Name" required error={errors.name}>
          {({ id, describedBy, invalid }) => <Input id={id} autoComplete="name" aria-describedby={describedBy} aria-invalid={invalid} value={values.name} onChange={set('name')} />}
        </Field>
        <Field label="Email" required error={errors.email}>
          {({ id, describedBy, invalid }) => <Input id={id} type="email" autoComplete="email" aria-describedby={describedBy} aria-invalid={invalid} value={values.email} onChange={set('email')} />}
        </Field>
      </div>
      <div className="grid gap-5 sm:grid-cols-[2fr_1fr]">
        <Field label="Subject" required error={errors.subject}>
          {({ id, describedBy, invalid }) => <Input id={id} aria-describedby={describedBy} aria-invalid={invalid} value={values.subject} onChange={set('subject')} />}
        </Field>
        <Field label="Topic">
          {({ id }) => (
            <Select id={id} value={values.category} onChange={set('category')}>
              {categories.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </Select>
          )}
        </Field>
      </div>
      <Field label="Message" required error={errors.message}>
        {({ id, describedBy, invalid }) => (
          <Textarea id={id} rows={6} className="min-h-40" aria-describedby={describedBy} aria-invalid={invalid} value={values.message} onChange={set('message')} />
        )}
      </Field>
      <Honeypot value={values.website} onChange={(website) => setValues((v) => ({ ...v, website }))} />
      <Button type="submit" size="lg" loading={status === 'sending'} className="self-start">
        Send message
      </Button>
    </form>
  );
}

function InfoBlock({ icon, title, lines }: { icon: React.ReactNode; title: string; lines: React.ReactNode[] }) {
  if (!lines.length) return null;
  return (
    <div className="flex gap-3">
      <span className="mt-0.5 text-green-700" aria-hidden>
        {icon}
      </span>
      <div>
        <h3 className="text-[14px] font-semibold text-ink">{title}</h3>
        <ul className="text-body-m text-ink-muted">
          {lines.map((l, i) => (
            <li key={i}>{l}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function ContactLayout({ info, departments, form }: { info: ContactInfo; departments: Department[]; form: React.ReactNode }) {
  return (
    <div className="pb-16">
      <PageHeader title="Contact us" intro="Story tips, corrections, partnerships or questions — the Amaranth newsroom reads every message." />
      <div className="container-page grid gap-12 pt-10 lg:grid-cols-[360px_minmax(0,1fr)] lg:gap-16">
        <aside aria-labelledby="office-details" className="flex flex-col gap-6">
          <h2 id="office-details" className="sr-only">
            Office details
          </h2>
          <InfoBlock icon={<MapPin className="size-5" />} title="Office" lines={info.office_address} />
          <InfoBlock
            icon={<Mail className="size-5" />}
            title="Email"
            lines={info.emails.map((e) => (
              <a key={e} href={`mailto:${e}`} className="text-green-700 hover:underline">
                {e}
              </a>
            ))}
          />
          <InfoBlock icon={<Phone className="size-5" />} title="Phone" lines={info.phones} />
          <InfoBlock icon={<Clock className="size-5" />} title="Office hours" lines={info.office_hours} />
          {departments.length > 0 && (
            <div className="border-t border-line pt-6">
              <h2 className="font-serif text-headline-s text-ink">Desks</h2>
              <ul className="mt-3 flex flex-col gap-3">
                {departments.map((d) => (
                  <li key={d.id} className="text-body-m">
                    <p className="font-semibold text-ink">{d.name}</p>
                    {d.email && (
                      <a href={`mailto:${d.email}`} className="text-green-700 hover:underline">
                        {d.email}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>
        <section aria-labelledby="contact-form-title">
          <h2 id="contact-form-title" className="mb-5 font-serif text-headline-m text-ink">
            Send a message
          </h2>
          {form}
        </section>
      </div>
    </div>
  );
}

export function ContactPage() {
  useDocumentTitle('Contact us');
  const settings = useSiteSettings();
  const departments = useDepartmentContacts();
  const send = useSendContact();
  const info = { ...defaultContact, ...((settings.data?.contact as Partial<ContactInfo> | undefined) ?? {}) };
  return <ContactLayout info={info} departments={departments.data ?? []} form={<ContactForm onSubmit={(v) => send.mutateAsync(v)} />} />;
}

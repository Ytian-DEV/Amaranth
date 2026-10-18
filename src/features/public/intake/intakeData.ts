import { useMutation, useQuery } from '@tanstack/react-query';
import type { ContactCategory, DepartmentContactRow } from '@/lib/database.types';
import { isSupabaseConfigured } from '@/lib/env';
import { getSupabase, unwrap } from '@/lib/supabase';
import { defaultSections } from '../nav';
import { sendForm } from '@/lib/sendForm';
import { prepareIntakeFiles } from './uploads';

export function useSubmissionSections() {
  const query = useQuery({
    queryKey: ['submission-sections'],
    enabled: isSupabaseConfigured,
    staleTime: 30 * 60_000,
    queryFn: async () =>
      unwrap(await getSupabase().from('sections').select('slug, name').eq('accepts_submissions', true).order('nav_order')),
  });
  return query.data?.length ? query.data : defaultSections.filter((s) => s.slug !== 'bulletin');
}

export function useDepartmentContacts() {
  return useQuery({
    queryKey: ['department-contacts'],
    staleTime: 30 * 60_000,
    queryFn: async (): Promise<Pick<DepartmentContactRow, 'id' | 'name' | 'email' | 'phone' | 'description'>[]> =>
      unwrap(await getSupabase().from('department_contacts').select('id, name, email, phone, description').order('sort_order')),
  });
}

export type ArticleSubmission = {
  name: string;
  email: string;
  affiliation: string;
  section: string;
  title: string;
  summary: string;
  body: string;
  website: string;
  files: File[];
};

export function useSubmitArticle() {
  return useMutation({
    mutationFn: async (v: ArticleSubmission) =>
      sendForm(
        'article',
        {
          p_name: v.name.trim(),
          p_email: v.email.trim(),
          p_affiliation: v.affiliation.trim() || null,
          p_section_slug: v.section || null,
          p_title: v.title.trim(),
          p_summary: v.summary.trim() || null,
          p_body: v.body.trim() || null,
          p_website: v.website || null,
        },
        await prepareIntakeFiles(v.files),
      ),
  });
}

export type EventSubmission = {
  organization: string;
  contactName: string;
  email: string;
  title: string;
  date: string;
  venue: string;
  summary: string;
  website: string;
  files: File[];
};

export function useSubmitEvent() {
  return useMutation({
    mutationFn: async (v: EventSubmission) =>
      sendForm(
        'event',
        {
          p_organization: v.organization.trim(),
          p_contact_name: v.contactName.trim(),
          p_contact_email: v.email.trim(),
          p_event_title: v.title.trim(),
          p_event_date: v.date || null,
          p_venue: v.venue.trim() || null,
          p_summary: v.summary.trim(),
          p_website: v.website || null,
        },
        await prepareIntakeFiles(v.files),
      ),
  });
}

export type ContactInput = { name: string; email: string; subject: string; category: ContactCategory; message: string; website: string };

export function useSendContact() {
  return useMutation({
    mutationFn: async (v: ContactInput) =>
      sendForm('contact', {
        p_name: v.name.trim(),
        p_email: v.email.trim(),
        p_subject: v.subject.trim(),
        p_category: v.category,
        p_message: v.message.trim(),
        p_website: v.website || null,
      }),
  });
}

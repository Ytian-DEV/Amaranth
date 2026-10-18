import { filePaths, makeTicket, pickArgs, pickFiles, readTicket, safeName } from './forms';

const key = 'k'.repeat(40);
const args = { p_name: 'Juan', p_email: 'juan@example.com', p_affiliation: null, p_section_slug: 'news', p_title: 'T', p_summary: null, p_body: 'Body', p_website: null };
const files = [{ name: 'story.pdf', mime: 'application/pdf', size: 1000 }];

describe('form api', () => {
  it('keeps only the form’s own fields', () => {
    expect(pickArgs('contact', { p_name: 'A', p_email: 'a@b.co', p_subject: 'S', p_category: 'general', p_message: 'Hi', p_files: 'x', evil: 1 })).toEqual({
      p_name: 'A', p_email: 'a@b.co', p_subject: 'S', p_category: 'general', p_message: 'Hi', p_website: null,
    });
    expect(pickArgs('contact', { p_name: 5 })).toBe('A form field is too long.');
  });

  it('checks attachments like the form and the bucket do', () => {
    expect(pickFiles(files)).toEqual(files);
    expect(pickFiles(Array(6).fill(files[0]))).toBe('Attach at most 5 files.');
    expect(pickFiles([{ name: 'x.exe', mime: 'application/x-msdownload', size: 10 }])).toMatch(/use JPG/);
    expect(pickFiles([{ name: 'big.pdf', mime: 'application/pdf', size: 21 * 1024 * 1024 }])).toMatch(/larger than 20 MB/);
  });

  it('names upload paths safely inside the folder', () => {
    expect(safeName('../../Résumé final.PDF')).toBe('Resume-final.pdf');
    const [p] = filePaths('submissions', files);
    expect(p).toMatch(/^submissions\/[0-9a-f-]{36}\/1-story\.pdf$/);
  });

  it('accepts its own ticket only for the same content, before it expires', () => {
    const t = makeTicket('article', args, files, ['submissions/a/1-story.pdf'], key, 1000);
    expect(readTicket(t, 'article', args, files, key, 2000)).toEqual(['submissions/a/1-story.pdf']);
    expect(readTicket(t, 'article', { ...args, p_title: 'Other' }, files, key, 2000)).toBeNull();
    expect(readTicket(t, 'event', args, files, key, 2000)).toBeNull();
    expect(readTicket(t, 'article', args, files, 'other-key', 2000)).toBeNull();
    expect(readTicket(t, 'article', args, files, key, 1000 + 31 * 60_000)).toBeNull();
    expect(readTicket(`${t}x`, 'article', args, files, key, 2000)).toBeNull();
  });
});

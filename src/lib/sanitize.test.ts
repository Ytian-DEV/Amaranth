import { sanitizeArticleHtml } from './sanitize';

describe('sanitizeArticleHtml', () => {
  it('removes scripts, handlers and inline styles', () => {
    const out = sanitizeArticleHtml('<p style="color:red" onclick="x()">Hi<script>alert(1)</script></p>');
    expect(out).toBe('<p>Hi</p>');
  });

  it('keeps known embeds and drops unknown iframes', () => {
    const ok = sanitizeArticleHtml('<iframe src="https://www.youtube.com/embed/abc"></iframe>');
    const bad = sanitizeArticleHtml('<iframe src="https://evil.example/x"></iframe>');
    expect(ok).toContain('youtube.com/embed/abc');
    expect(bad).toBe('');
  });

  it('opens external links in a new tab safely', () => {
    const out = sanitizeArticleHtml('<a href="https://example.com">x</a>');
    expect(out).toContain('rel="noopener noreferrer"');
    expect(out).toContain('target="_blank"');
  });

  it('blocks javascript: URLs', () => {
    expect(sanitizeArticleHtml('<a href="javascript:alert(1)">x</a>')).toBe('<a>x</a>');
  });
});

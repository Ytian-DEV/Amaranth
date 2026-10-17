import DOMPurify from 'dompurify';

const EMBED_HOSTS = /^https:\/\/(www\.)?(youtube\.com|youtube-nocookie\.com|player\.vimeo\.com|www\.facebook\.com|open\.spotify\.com)\//;

let configured = false;
function configure() {
  if (configured) return;
  configured = true;
  // Only allow iframes from known embed providers; open external links safely.
  DOMPurify.addHook('uponSanitizeElement', (node, data) => {
    if (data.tagName === 'iframe') {
      const src = (node as Element).getAttribute('src') ?? '';
      if (!EMBED_HOSTS.test(src)) node.parentNode?.removeChild(node);
    }
  });
  DOMPurify.addHook('afterSanitizeAttributes', (node) => {
    if (node.tagName === 'A') {
      const href = node.getAttribute('href') ?? '';
      if (/^https?:\/\//.test(href) && !href.startsWith(window.location.origin)) {
        node.setAttribute('target', '_blank');
        node.setAttribute('rel', 'noopener noreferrer');
      }
    }
    if (node.tagName === 'IMG') {
      node.setAttribute('loading', 'lazy');
      node.setAttribute('decoding', 'async');
    }
  });
}

/** Sanitises article HTML from the editor before it is rendered. */
export function sanitizeArticleHtml(html: string) {
  configure();
  return DOMPurify.sanitize(html, {
    ADD_TAGS: ['iframe', 'figure', 'figcaption'],
    ADD_ATTR: ['allow', 'allowfullscreen', 'frameborder', 'target', 'loading'],
    FORBID_TAGS: ['style', 'form', 'input', 'button'],
    FORBID_ATTR: ['style'],
  });
}

import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

// Teach tailwind-merge about the Figma text styles so `text-meta` and
// `text-ink` aren't treated as conflicting.
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [
        {
          text: [
            'display-xl', 'display-l', 'headline-l', 'headline-m', 'headline-s', 'numeral',
            'body-l', 'body-m', 'meta', 'button', 'nav', 'kicker',
          ],
        },
      ],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

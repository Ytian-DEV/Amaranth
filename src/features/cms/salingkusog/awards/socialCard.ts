// Social cards drawn on a <canvas>: MVP of the Day (1080×1350) and Athlete of the Day (1080×1080).
import type { MediaAssetRow, SkAwardRow, SkEditionRow, SkMatchRow, SkPlacementRow } from '@/lib/database.types';
import { publicUrl } from '@/lib/media';
import { dayRange } from '@/lib/manila';
import { slugify } from '@/lib/slug';
import type { SkLookups } from '../scores/lookups';

export type CardSide = { name: string; short: string; color: string; logoUrl?: string };

export type SocialCardData = {
  layout: 'mvp' | 'athlete';
  width: number;
  height: number;
  edition: string;
  dayLabel: string | null;
  kicker: string;
  name: string;
  faction: CardSide | null;
  photoUrl?: string;
  stats: { label: string; value: string }[];
  /** athlete card: big result ("12.84s") and the line above it ("Gold · 100m Dash, Women") */
  big: string | null;
  subline: string | null;
  /** MVP card footer: "Basketball · Men · Final  ·  78–71 vs Centicore Vanguard" */
  footer: string | null;
  stripe: string[];
};

const medalWord = { gold: 'Gold', silver: 'Silver', bronze: 'Bronze' } as const;

export function socialCardData(
  award: SkAwardRow,
  l: SkLookups,
  edition: Pick<SkEditionRow, 'title' | 'starts_on' | 'ends_on'>,
  matches: SkMatchRow[],
  placements: SkPlacementRow[],
  media: MediaAssetRow[],
): SocialCardData {
  const athlete = l.athletes.find((a) => a.id === award.athlete_id);
  const f = l.factions.find((x) => x.id === athlete?.faction_id);
  const asset = (id: string | null | undefined) => media.find((m) => m.id === id);
  const url = (m: MediaAssetRow | undefined) => (m ? publicUrl(m.bucket, m.path) : undefined);
  const match = matches.find((m) => m.id === award.match_id);
  const eventId = award.event_id ?? match?.event_id ?? null;
  const event = l.events.find((e) => e.id === eventId);
  const sport = l.sports.find((s) => s.id === event?.sport_id);
  const eventLabel = event ? (event.name.includes('·') ? event.name : `${sport?.name ?? ''} · ${event.name}`) : '';
  const day = dayRange(edition.starts_on, edition.ends_on).find((d) => d.date === award.day);
  const athleteCard = award.kind === 'athlete_of_day';

  let footer: string | null = null;
  if (match) {
    const mineA = match.side_a_id === f?.id;
    const opp = l.factions.find((x) => x.id === (mineA ? match.side_b_id : match.side_a_id));
    const score = match.score_a !== null && match.score_b !== null ? (mineA ? `${match.score_a}–${match.score_b}` : `${match.score_b}–${match.score_a}`) : null;
    footer = [[eventLabel, match.round].filter(Boolean).join(' · '), score && opp ? `${score} vs ${opp.name}` : null].filter(Boolean).join('  ·  ');
  } else if (eventLabel) footer = eventLabel;

  const placing = placements.find((p) => p.event_id === eventId && p.athlete_id === award.athlete_id && p.medal);
  const shortHeadline = award.headline && award.headline.length <= 10 ? award.headline : null;

  return {
    layout: athleteCard ? 'athlete' : 'mvp',
    width: 1080,
    height: athleteCard ? 1080 : 1350,
    edition: edition.title.toUpperCase(),
    dayLabel: day ? `DAY ${day.number}` : null,
    kicker: award.kind === 'mvp_of_day' ? 'MVP OF THE DAY' : award.kind === 'finals_mvp' ? 'FINALS MVP' : 'ATHLETE OF THE DAY',
    name: athlete?.name ?? 'Athlete',
    faction: f ? { name: f.name, short: f.short_name ?? f.name.slice(0, 2).toUpperCase(), color: f.color, logoUrl: url(asset(f.logo_asset_id)) } : null,
    photoUrl: url(asset(athlete?.photo_asset_id)),
    stats: award.stat_line.slice(0, 4),
    big: athleteCard ? (shortHeadline ?? placing?.result ?? award.stat_line[0]?.value ?? null) : null,
    subline: athleteCard ? ([placing?.medal ? medalWord[placing.medal] : null, eventLabel.replace(' · ', ', ')].filter(Boolean).join('  ·  ') || award.headline) : null,
    footer,
    stripe: l.factions.map((x) => x.color),
  };
}

/** Splits text into lines that fit `maxWidth` with the current font. */
export function wrapText(measure: (s: string) => number, text: string, maxWidth: number, maxLines = 2) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = '';
  for (const w of words) {
    const next = line ? `${line} ${w}` : w;
    if (measure(next) <= maxWidth || !line) line = next;
    else {
      lines.push(line);
      line = w;
    }
  }
  if (line) lines.push(line);
  if (lines.length > maxLines) return [...lines.slice(0, maxLines - 1), lines.slice(maxLines - 1).join(' ')];
  return lines;
}

export const cardFileName = (d: Pick<SocialCardData, 'kicker' | 'name' | 'dayLabel'>) => `${slugify([d.kicker, d.dayLabel, d.name].filter(Boolean).join(' '))}.png`;

// ---------------------------------------------------------------- drawing

type Palette = Record<'night' | 'night2' | 'lime' | 'gold' | 'white' | 'muted' | 'green900', string>;

/** Colours from the design tokens (so no hex lives in the code). */
export function readPalette(): Palette {
  const css = getComputedStyle(document.documentElement);
  const v = (name: string) => css.getPropertyValue(`--color-${name}`).trim();
  return { night: v('night'), night2: v('night-2'), lime: v('lime'), gold: v('gold'), white: v('on-dark'), muted: v('on-dark-muted'), green900: v('green-900') };
}

const SERIF = '"Fraunces Variable", Georgia, serif';
const SANS = '"Inter Variable", system-ui, sans-serif';

export async function loadCardFonts() {
  await Promise.all([document.fonts.load(`700 100px ${SERIF}`), document.fonts.load(`700 30px ${SANS}`), document.fonts.load(`500 30px ${SANS}`), document.fonts.load(`600 30px ${SANS}`)]);
}

export function loadImage(src: string | undefined): Promise<HTMLImageElement | null> {
  if (!src) return Promise.resolve(null);
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous'; // keeps the canvas exportable (public buckets send CORS headers)
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

/** Draws `img` to fill the box, cropping the overflow (CSS object-fit: cover). */
function drawCover(ctx: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, w: number, h: number) {
  const s = Math.max(w / img.naturalWidth, h / img.naturalHeight);
  const sw = w / s;
  const sh = h / s;
  ctx.drawImage(img, (img.naturalWidth - sw) / 2, (img.naturalHeight - sh) / 2, sw, sh, x, y, w, h);
}

function spaced(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, spacing: number, align: 'left' | 'right' = 'left') {
  ctx.letterSpacing = `${spacing}px`;
  ctx.textAlign = align;
  ctx.fillText(text, x, y);
  ctx.letterSpacing = '0px';
  ctx.textAlign = 'left';
}

function emblem(ctx: CanvasRenderingContext2D, side: CardSide, logo: HTMLImageElement | null, x: number, y: number, size: number, p: Palette) {
  ctx.save();
  roundRect(ctx, x, y, size, size, size * 0.2);
  ctx.clip();
  if (logo) drawCover(ctx, logo, x, y, size, size);
  else {
    ctx.fillStyle = side.color;
    ctx.fillRect(x, y, size, size);
    ctx.fillStyle = p.white;
    ctx.font = `700 ${Math.round(size * 0.34)}px ${SANS}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(side.short, x + size / 2, y + size / 2 + 1);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
  }
  ctx.restore();
}

/** Largest font size (down to `min`) at which `text` fits `maxWidth`. */
function fitFont(ctx: CanvasRenderingContext2D, text: string, weight: number, family: string, start: number, min: number, maxWidth: number) {
  let size = start;
  for (; size > min; size -= 4) {
    ctx.font = `${weight} ${size}px ${family}`;
    if (ctx.measureText(text).width <= maxWidth) break;
  }
  ctx.font = `${weight} ${size}px ${family}`;
  return size;
}

export async function drawSocialCard(canvas: HTMLCanvasElement, d: SocialCardData, p: Palette = readPalette()) {
  await loadCardFonts();
  const [photo, logo] = await Promise.all([loadImage(d.photoUrl), loadImage(d.faction?.logoUrl)]);
  canvas.width = d.width;
  canvas.height = d.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.fillStyle = p.night;
  ctx.fillRect(0, 0, d.width, d.height);
  if (d.layout === 'mvp') drawMvp(ctx, d, p, photo, logo);
  else drawAthlete(ctx, d, p, photo, logo);
}

function drawMvp(ctx: CanvasRenderingContext2D, d: SocialCardData, p: Palette, photo: HTMLImageElement | null, logo: HTMLImageElement | null) {
  const pad = 72;
  const inner = d.width - pad * 2;

  ctx.fillStyle = p.white;
  ctx.font = `700 40px ${SERIF}`;
  spaced(ctx, d.edition, pad, 102, 1.2);

  if (d.dayLabel) {
    ctx.font = `700 26px ${SANS}`;
    ctx.letterSpacing = '1px';
    const w = ctx.measureText(d.dayLabel).width + 52;
    roundRect(ctx, d.width - pad - w, 62, w, 50, 25);
    ctx.fillStyle = p.lime;
    ctx.fill();
    ctx.fillStyle = p.green900;
    ctx.textAlign = 'center';
    ctx.fillText(d.dayLabel, d.width - pad - w / 2, 96);
    ctx.textAlign = 'left';
    ctx.letterSpacing = '0px';
  }

  const photoY = 148;
  const photoH = 640;
  ctx.save();
  roundRect(ctx, pad, photoY, inner, photoH, 24);
  ctx.fillStyle = p.night2;
  ctx.fill();
  ctx.clip();
  if (photo) drawCover(ctx, photo, pad, photoY, inner, photoH);
  ctx.restore();

  ctx.fillStyle = p.lime;
  ctx.font = `700 28px ${SANS}`;
  spaced(ctx, d.kicker, pad, 852, 3.4);

  ctx.fillStyle = p.white;
  fitFont(ctx, d.name, 700, SERIF, 112, 64, inner);
  ctx.fillText(d.name, pad, 972);

  // faction + stats row
  let x = pad;
  const rowY = 1020;
  if (d.faction) {
    emblem(ctx, d.faction, logo, x, rowY, 52, p);
    x += 52 + 22;
    ctx.fillStyle = p.white;
    ctx.font = `600 26px ${SANS}`;
    ctx.fillText(d.faction.name, x, rowY + 35);
    x += ctx.measureText(d.faction.name).width + 30;
  }
  for (const s of d.stats) {
    ctx.fillStyle = p.lime;
    ctx.font = `700 54px ${SERIF}`;
    ctx.fillText(s.value, x, rowY + 44);
    x += ctx.measureText(s.value).width + 10;
    ctx.fillStyle = p.white;
    ctx.font = `700 21px ${SANS}`;
    ctx.fillText(s.label.toUpperCase(), x, rowY + 44);
    x += ctx.measureText(s.label.toUpperCase()).width + 30;
    if (x > d.width - pad) break;
  }

  // faction stripe
  const stripeY = 1112;
  const seg = inner / Math.max(1, d.stripe.length);
  d.stripe.forEach((c, i) => {
    ctx.fillStyle = c;
    ctx.fillRect(pad + i * seg, stripeY, seg, 7);
  });

  ctx.font = `700 34px ${SERIF}`;
  const brandW = ctx.measureText('AMARANTH').width + 8 * 3;
  if (d.footer) {
    ctx.fillStyle = p.muted;
    fitFont(ctx, d.footer, 500, SANS, 25, 18, inner - brandW - 40);
    ctx.fillText(d.footer, pad, 1180);
  }
  ctx.fillStyle = p.white;
  ctx.font = `700 34px ${SERIF}`;
  spaced(ctx, 'AMARANTH', d.width - pad, 1182, 3, 'right');
}

function drawAthlete(ctx: CanvasRenderingContext2D, d: SocialCardData, p: Palette, photo: HTMLImageElement | null, logo: HTMLImageElement | null) {
  const split = 660;
  const pad = 65;
  ctx.fillStyle = d.faction?.color ?? p.night2;
  ctx.fillRect(split, 0, d.width - split, d.height);
  if (photo) drawCover(ctx, photo, split, 0, d.width - split, d.height);

  ctx.fillStyle = p.white;
  ctx.font = `700 30px ${SERIF}`;
  spaced(ctx, d.edition, pad, 100, 1);

  ctx.fillStyle = p.lime;
  ctx.font = `700 25px ${SANS}`;
  spaced(ctx, d.kicker, pad, 505, 3);

  ctx.fillStyle = p.white;
  const size = fitFont(ctx, d.name.split(' ').sort((a, b) => b.length - a.length)[0] ?? d.name, 700, SERIF, 90, 56, split - pad * 2);
  const lines = wrapText((s) => ctx.measureText(s).width, d.name, split - pad * 2, 2);
  lines.forEach((ln, i) => ctx.fillText(ln, pad, 600 + i * size * 1.0));
  let y = 600 + (lines.length - 1) * size + 70;

  if (d.subline) {
    ctx.fillStyle = p.white;
    fitFont(ctx, d.subline, 500, SANS, 28, 20, split - pad * 2);
    ctx.fillText(d.subline, pad, y);
    y += 30;
  }
  if (d.big) {
    ctx.fillStyle = p.gold;
    fitFont(ctx, d.big, 700, SERIF, 128, 64, split - pad * 2);
    ctx.fillText(d.big, pad, y + 112);
  }
  if (d.faction) {
    emblem(ctx, d.faction, logo, pad, 958, 52, p);
    ctx.fillStyle = p.white;
    ctx.font = `600 25px ${SANS}`;
    ctx.fillText(d.faction.name, pad + 52 + 18, 993);
  }
}

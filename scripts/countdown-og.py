"""Builds public/images/salingkusog/countdown-og.png (1200x630 link preview for the countdown page).

Flat "official notice" style matching the page: charcoal, one gold accent, hairline rules,
and the line mark (a flame between two wings in a ring), drawn with Pillow:
    python scripts/countdown-og.py
Colours match src/styles/tokens.css (charcoal, gold-light, ash, ember).
"""
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

W, H = 1200, 630
CHARCOAL = (18, 13, 11)
GOLD_LIGHT = (242, 199, 92)
ASH = (205, 188, 170)
RULE = (62, 52, 46)
WATERMARK = (30, 24, 21)
WHITE = (255, 255, 255)
FONTS = Path("C:/Windows/Fonts")
PAD = 72


def font(name, size):
    try:
        return ImageFont.truetype(str(FONTS / name), size)
    except OSError:
        return ImageFont.truetype("DejaVuSerif-Bold.ttf", size)


def spaced(draw, xy, text, fnt, fill, spacing):
    x, y = xy
    for ch in text:
        draw.text((x, y), ch, font=fnt, fill=fill)
        x += draw.textlength(ch, font=fnt) + spacing
    return x


def bezier(p0, c1, c2, p3, steps=20):
    pts = []
    for k in range(steps + 1):
        t = k / steps
        pts.append(tuple((1 - t) ** 3 * p0[i] + 3 * (1 - t) ** 2 * t * c1[i] + 3 * (1 - t) * t ** 2 * c2[i] + t ** 3 * p3[i] for i in range(2)))
    return pts


def emblem(draw, cx, cy, size, colour, width):
    """The 64x64 line mark from CountdownView, scaled to `size`."""
    s = size / 64

    def P(x, y):
        return (cx + (x - 32) * s, cy + (y - 32) * s)

    r = 29 * s
    draw.ellipse((cx - r, cy - r, cx + r, cy + r), outline=colour, width=width)
    # outer flame
    outer = bezier(P(32, 12), P(37, 19), P(41, 24), P(40.5, 32)) + bezier(P(40.5, 32), P(40, 39), P(36.5, 43), P(32, 45)) + bezier(P(32, 45), P(27.5, 43), P(24, 39), P(23.5, 32)) + bezier(P(23.5, 32), P(23, 24), P(27, 19), P(32, 12))
    draw.line(outer, fill=colour, width=width, joint="curve")
    inner = bezier(P(32, 24), P(34.5, 27.5), P(36, 30), P(35.8, 33.5)) + bezier(P(35.8, 33.5), P(35.5, 37), P(34, 38.5), P(32, 39.5)) + bezier(P(32, 39.5), P(30, 38.5), P(28.5, 37), P(28.2, 33.5)) + bezier(P(28.2, 33.5), P(28, 30), P(29.5, 27.5), P(32, 24))
    draw.line(inner, fill=colour, width=width, joint="curve")
    # wings
    draw.line([P(23.5, 38), P(17, 36), P(12.5, 32), P(9.5, 26), P(14, 28.5), P(18, 29.5), P(22.5, 29.5)], fill=colour, width=width, joint="curve")
    draw.line([P(40.5, 38), P(47, 36), P(51.5, 32), P(54.5, 26), P(50, 28.5), P(46, 29.5), P(41.5, 29.5)], fill=colour, width=width, joint="curve")
    draw.line([P(24, 47), P(40, 47)], fill=colour, width=width)


img = Image.new("RGB", (W, H), CHARCOAL)
d = ImageDraw.Draw(img)

# faint mark on the right, like a watermark on a printed notice
emblem(d, 1010, 330, 560, WATERMARK, 10)

# header
emblem(d, PAD + 16, 66, 34, GOLD_LIGHT, 2)
spaced(d, (PAD + 44, 52), "AMARANTH", font("georgiab.ttf", 24), GOLD_LIGHT, 5)
d.line([(PAD, 110), (W - PAD, 110)], fill=RULE, width=2)

# notice
d.line([(PAD, 196), (PAD + 48, 196)], fill=GOLD_LIGHT, width=2)
spaced(d, (PAD + 64, 184), "OFFICIAL NOTICE", font("segoeuib.ttf", 22), GOLD_LIGHT, 4)
title = font("georgiab.ttf", 112)
d.text((PAD - 4, 232), "Salingkusog 2026", font=title, fill=WHITE)
d.text((PAD, 378), "The countdown to the VSU intramural games has begun.", font=font("segoeui.ttf", 30), fill=ASH)

# footer
d.line([(PAD, 520), (W - PAD, 520)], fill=RULE, width=2)
d.text((PAD, 548), "May the odds be ever in your faction\u2019s favor.", font=font("georgiaz.ttf", 30), fill=GOLD_LIGHT)
link = "amaranth.vsu.edu.ph"
f_link = font("segoeui.ttf", 22)
d.text((W - PAD - d.textlength(link, font=f_link), 556), link, font=f_link, fill=ASH)

out = Path(__file__).resolve().parent.parent / "public" / "images" / "salingkusog" / "countdown-og.png"
img.save(out, optimize=True)
print(out, img.size)

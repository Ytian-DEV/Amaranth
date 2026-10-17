"""Builds public/images/salingkusog/countdown-og.png (1200x630 link preview for the countdown page).

Original artwork (a flame between two wings in a ring), drawn with Pillow:
    python scripts/countdown-og.py
Colours match src/styles/tokens.css (charcoal, ember, gold-light, ash).
"""
import math
import random
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

W, H = 1200, 630
CHARCOAL = (18, 13, 11)
EMBER = (255, 106, 26)
EMBER_DEEP = (156, 47, 12)
GOLD = (212, 160, 23)
GOLD_LIGHT = (242, 199, 92)
ASH = (205, 188, 170)
WHITE = (255, 255, 255)
FONTS = Path("C:/Windows/Fonts")


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


img = Image.new("RGB", (W, H), CHARCOAL)

# ember glow from the bottom
glow = Image.new("RGB", (W, H), CHARCOAL)
g = ImageDraw.Draw(glow)
for i in range(60, 0, -1):
    t = i / 60
    r = int(CHARCOAL[0] + (EMBER_DEEP[0] - CHARCOAL[0]) * (1 - t) * 0.9)
    gg = int(CHARCOAL[1] + (EMBER_DEEP[1] - CHARCOAL[1]) * (1 - t) * 0.9)
    b = int(CHARCOAL[2] + (EMBER_DEEP[2] - CHARCOAL[2]) * (1 - t) * 0.9)
    g.ellipse((W / 2 - 900 * t, H - 260 * t, W / 2 + 900 * t, H + 300 * t), fill=(r, gg, b))
img = Image.blend(img, glow.filter(ImageFilter.GaussianBlur(40)), 0.9)

# embers
sparks = Image.new("RGBA", (W, H), (0, 0, 0, 0))
s = ImageDraw.Draw(sparks)
rnd = random.Random(2026)
for _ in range(70):
    x, y, rr = rnd.uniform(0, W), rnd.uniform(H * 0.25, H), rnd.uniform(1.2, 3.6)
    s.ellipse((x - rr, y - rr, x + rr, y + rr), fill=EMBER + (int(rnd.uniform(90, 230)),))
img.paste(sparks.filter(ImageFilter.GaussianBlur(0.6)), (0, 0), sparks)

d = ImageDraw.Draw(img)

# emblem (scaled from the 160x160 SVG in CountdownView)
cx, cy, sc = 300, 315, 2.3
def P(x, y):
    return (cx + (x - 80) * sc, cy + (y - 80) * sc)
d.ellipse((cx - 74 * sc, cy - 74 * sc, cx + 74 * sc, cy + 74 * sc), outline=GOLD_LIGHT, width=7)
for a in range(0, 360, 8):
    rad = math.radians(a)
    x, y = cx + 64 * sc * math.cos(rad), cy + 64 * sc * math.sin(rad)
    d.ellipse((x - 2, y - 2, x + 2, y + 2), fill=GOLD)

def curve(points, steps=18):
    """Cubic-bezier path from SVG-like segments: start, then (c1, c2, end) triples."""
    out = [points[0]]
    p0 = points[0]
    for i in range(1, len(points), 3):
        c1, c2, p3 = points[i], points[i + 1], points[i + 2]
        for k in range(1, steps + 1):
            t = k / steps
            x = (1 - t) ** 3 * p0[0] + 3 * (1 - t) ** 2 * t * c1[0] + 3 * (1 - t) * t ** 2 * c2[0] + t ** 3 * p3[0]
            y = (1 - t) ** 3 * p0[1] + 3 * (1 - t) ** 2 * t * c1[1] + 3 * (1 - t) * t ** 2 * c2[1] + t ** 3 * p3[1]
            out.append(P(x, y))
        p0 = p3
    out[0] = P(*points[0])
    return out

wing_l = [(78, 98), (58, 92), (40, 80), (26, 62), (44, 70), (56, 72), (66, 70), (54, 66), (46, 60), (40, 52), (54, 58), (64, 60), (72, 60)]
wing_r = [(160 - x, y) for x, y in wing_l]
d.polygon(curve(wing_l), fill=GOLD)
d.polygon(curve(wing_r), fill=GOLD)
d.polygon(curve([(80, 30), (92, 48), (102, 60), (100, 80), (98, 98), (90, 108), (80, 112), (70, 108), (62, 98), (60, 80), (58, 62), (70, 50), (80, 30)]), fill=EMBER_DEEP)
d.polygon(curve([(80, 46), (88, 60), (94, 70), (92, 84), (90, 98), (85, 104), (80, 106), (75, 104), (70, 98), (68, 84), (66, 70), (72, 60), (80, 46)]), fill=EMBER)
d.polygon(curve([(80, 66), (84, 74), (87, 80), (86, 88), (85, 96), (82, 99), (80, 100), (78, 99), (75, 96), (74, 88), (73, 80), (76, 74), (80, 66)]), fill=GOLD_LIGHT)
d.polygon([P(58, 118), P(102, 118), P(96, 126), P(64, 126)], fill=GOLD)

# text
x0 = 540
spaced(d, (x0, 118), "AMARANTH  ·  SPECIAL COVERAGE", font("segoeuib.ttf", 22), GOLD_LIGHT, 4)
# largest title size that fits the right column
size = 78
while size > 40:
    f_title = font("georgiab.ttf", size)
    if sum(d.textlength(ch, font=f_title) + 5 for ch in "SALINGKUSOG") <= W - 60 - x0:
        break
    size -= 2
spaced(d, (x0, 178), "SALINGKUSOG", f_title, WHITE, 5)
spaced(d, (x0, 178 + size + 14), "2026", f_title, WHITE, 5)
spaced(d, (x0, 372), "THE COUNTDOWN IS ON", font("georgiab.ttf", 34), EMBER, 5)
d.text((x0, 440), "\u201cMay the odds be ever", font=font("georgiaz.ttf", 34), fill=GOLD_LIGHT)
d.text((x0, 484), "in your faction\u2019s favor.\u201d", font=font("georgiaz.ttf", 34), fill=GOLD_LIGHT)
d.text((x0, 560), "VSU Intramural Games  ·  amaranth.vsu.edu.ph", font=font("segoeui.ttf", 22), fill=ASH)

out = Path(__file__).resolve().parent.parent / "public" / "images" / "salingkusog" / "countdown-og.png"
img.save(out, optimize=True)
print(out, img.size)

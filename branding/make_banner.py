#!/usr/bin/env python3
"""Generate a LinkedIn banner for AceurExam, matching the website's brand."""
import math
from PIL import Image, ImageDraw, ImageFont, ImageFilter

# ---- Brand palette (from src/app/globals.css) ----
BG          = (20, 17, 14)        # #14110e
BG_ELEV     = (28, 24, 19)        # #1c1813
INK         = (241, 234, 217)     # #f1ead9
INK_SOFT    = (212, 203, 181)     # #d4cbb5
ACCENT      = (239, 90, 43)       # #ef5a2b
ACCENT_2    = (255, 122, 74)      # #ff7a4a
TXT_SEC     = (184, 173, 148)     # #b8ad94
TXT_MUTED   = (110, 101, 87)      # #6e6557

FONTS = "/tmp/fonts"
S = 3  # supersample factor
W, H = 1584, 396
CW, CH = W * S, H * S

# ---- Font helpers ----
def fraunces(size, wght=600, italic=False, opsz=72, soft=0, wonky=0):
    f = ImageFont.truetype(f"{FONTS}/Fraunces{'-Italic' if italic else ''}.ttf", size * S)
    f.set_variation_by_axes([opsz, wght, soft, wonky])
    return f

def inter(size, wght=500):
    f = ImageFont.truetype(f"{FONTS}/Inter.ttf", size * S)
    f.set_variation_by_axes([min(max(size,14),32), wght])
    return f

def mono(size, wght=500):
    f = ImageFont.truetype(f"{FONTS}/JetBrainsMono.ttf", size * S)
    f.set_variation_by_axes([wght])
    return f

def px(v):
    return int(round(v * S))

# ---- Radial glow ----
def radial_glow(diameter, color, max_alpha, exp=1.7):
    d = px(diameter)
    small = 260
    g = Image.new("L", (small, small), 0)
    gd = ImageDraw.Draw(g)
    c = small / 2
    steps = 130
    for i in range(steps, 0, -1):
        r = c * i / steps
        a = int(max_alpha * (1 - i / steps) ** exp)
        gd.ellipse([c - r, c - r, c + r, c + r], fill=a)
    g = g.resize((d, d), Image.LANCZOS)
    layer = Image.new("RGBA", (d, d), color + (0,))
    layer.putalpha(g)
    return layer

def add_letter_spacing_text(draw, xy, text, font, fill, tracking, anchor_v="top"):
    """Draw text with manual letter spacing (px tracking already scaled)."""
    x, y = xy
    for ch in text:
        draw.text((x, y), ch, font=font, fill=fill)
        w = draw.textlength(ch, font=font)
        x += w + tracking
    return x

# ---- Canvas ----
img = Image.new("RGB", (CW, CH), BG)
draw = ImageDraw.Draw(img, "RGBA")

# Background radial glows (mirrors body background gradient)
for cx, cy, dia, col, alpha in [
    (0.90 * W, 0.06 * H, 760, ACCENT, 70),
    (0.04 * W, 1.02 * H, 640, ACCENT, 48),
    (0.62 * W, 0.95 * H, 520, ACCENT_2, 26),
]:
    glow = radial_glow(dia, col, alpha)
    img.paste(glow, (px(cx) - glow.width // 2, px(cy) - glow.height // 2), glow)

draw = ImageDraw.Draw(img, "RGBA")

# Faint concentric arc texture (mirrors body::before rings)
ring = Image.new("RGBA", (CW, CH), (0, 0, 0, 0))
rd = ImageDraw.Draw(ring)
for cx, cy, rr, a in [
    (1.18 * W, 0.5 * H, 0.62 * W, 14),
    (1.18 * W, 0.5 * H, 0.50 * W, 11),
    (1.18 * W, 0.5 * H, 0.40 * W, 9),
    (-0.10 * W, 1.1 * H, 0.45 * W, 10),
]:
    bb = [px(cx - rr), px(cy - rr), px(cx + rr), px(cy + rr)]
    rd.ellipse(bb, outline=INK + (a,), width=px(1.2))
img = Image.alpha_composite(img.convert("RGBA"), ring).convert("RGB")
draw = ImageDraw.Draw(img, "RGBA")

# Hairline border frame
draw.rectangle([px(1), px(1), CW - px(1), CH - px(1)], outline=INK + (22,), width=px(1))

# ---------------------------------------------------------------------------
# LEFT BLOCK
# ---------------------------------------------------------------------------
LX = 116  # left margin

# Brand starburst icon (from src/app/icon.svg) + wordmark
def draw_starburst(cx, cy, scale, color):
    # spoke: tip (32,5) base (34,32)-(30,32) in 64 viewbox, center (32,32)
    pts0 = [(32, 5), (34, 32), (30, 32)]
    for ang in range(0, 360, 45):
        a = math.radians(ang)
        poly = []
        for (px0, py0) in pts0:
            dx, dy = px0 - 32, py0 - 32
            rx = dx * math.cos(a) - dy * math.sin(a)
            ry = dx * math.sin(a) + dy * math.cos(a)
            poly.append((px((cx + rx * scale)), px((cy + ry * scale))))
        draw.polygon(poly, fill=color)
    draw.ellipse([px(cx - 4 * scale), px(cy - 4 * scale), px(cx + 4 * scale), px(cy + 4 * scale)], fill=BG)
    draw.ellipse([px(cx - 2.5 * scale), px(cy - 2.5 * scale), px(cx + 2.5 * scale), px(cy + 2.5 * scale)], fill=color)

brand_y = 58
draw_starburst(LX + 16, brand_y + 15, 0.95, ACCENT)
fb = fraunces(27, wght=600, opsz=40)
draw.text((px(LX + 42), px(brand_y - 2)), "AceurExam", font=fb, fill=INK)

# Eyebrow: status dot + mono coordinates (mirrors hero eyebrow)
eb_y = 122
draw.ellipse([px(LX), px(eb_y + 3), px(LX + 9), px(eb_y + 12)], fill=ACCENT)
# soft halo on dot
halo = radial_glow(34, ACCENT, 120)
img.paste(halo, (px(LX + 4.5) - halo.width // 2, px(eb_y + 7.5) - halo.height // 2), halo)
draw = ImageDraw.Draw(img, "RGBA")
ef = mono(12, wght=500)
add_letter_spacing_text(draw, (px(LX + 20), px(eb_y)),
                        "52.2053° N / 0.1218° E   ·   CAMBRIDGE ARCHIVE",
                        ef, TXT_SEC + (255,), px(0.6))

# Headline: "Past papers, made useful." (Fraunces, 'useful' italic + accent)
hy = 150
hf = fraunces(62, wght=580, opsz=80)
hfi = fraunces(62, wght=560, italic=True, opsz=80)
x = px(LX)
draw.text((x, px(hy)), "Past papers, made ", font=hf, fill=INK)
x += draw.textlength("Past papers, made ", font=hf)
draw.text((x, px(hy)), "useful", font=hfi, fill=ACCENT_2)
x += draw.textlength("useful", font=hfi)
draw.text((x, px(hy)), ".", font=hf, fill=INK)

# Sub-copy (Inter)
sy = 236
sf = inter(18, wght=500)
draw.text((px(LX), px(sy)),
          "Cambridge AS & A-Level past papers by topic · examiner notes · an AI tutor.",
          font=sf, fill=TXT_SEC)

# Subject code chips
chip_y = 286
chips = [("9709", "Maths"), ("9702", "Physics"), ("9701", "Chemistry"), ("9700", "Biology")]
cf = mono(12, wght=600)
lf = inter(12, wght=500)
cx = LX
for code, name in chips:
    cw = draw.textlength(code, font=cf) / S
    nw = draw.textlength(name, font=lf) / S
    pad = 13
    gap = 8
    chip_w = pad * 2 + cw + gap + nw
    chip_h = 28
    draw.rounded_rectangle([px(cx), px(chip_y), px(cx + chip_w), px(chip_y + chip_h)],
                           radius=px(3), fill=BG_ELEV + (200,), outline=INK + (30,), width=px(1))
    ty = chip_y + (chip_h - 14) / 2 - 1
    draw.text((px(cx + pad), px(ty)), code, font=cf, fill=ACCENT)
    draw.text((px(cx + pad + cw + gap), px(ty)), name, font=lf, fill=TXT_SEC)
    cx += chip_w + 12

# ---------------------------------------------------------------------------
# RIGHT BLOCK — workspace console card (mirrors hero console)
# ---------------------------------------------------------------------------
PX0, PY0, PX1, PY1 = 1058, 70, 1500, 326
# panel
draw.rounded_rectangle([px(PX0), px(PY0), px(PX1), px(PY1)], radius=px(8),
                       fill=BG_ELEV + (235,), outline=INK + (28,), width=px(1))
# top accent line
draw.line([px(PX0 + 8), px(PY0), px(PX0 + 70), px(PY0)], fill=ACCENT + (220,), width=px(2))

# console top bar: search field + sparkle
sb_x, sb_y = PX0 + 22, PY0 + 22
sb_w, sb_h = (PX1 - PX0) - 44 - 40, 34
draw.rounded_rectangle([px(sb_x), px(sb_y), px(sb_x + sb_w), px(sb_y + sb_h)],
                       radius=px(4), fill=BG + (180,), outline=INK + (24,), width=px(1))
ssf = inter(12, wght=400)
draw.text((px(sb_x + 14), px(sb_y + 9)), "Search subject, topic, paper, or mark scheme",
          font=ssf, fill=TXT_MUTED)
# sparkle (4-point star) at right of bar
spx, spy = PX1 - 32, sb_y + sb_h / 2
for (dx, dy) in [(0, -8), (0, 8), (-8, 0), (8, 0)]:
    pass
draw.line([px(spx), px(spy - 8), px(spx), px(spy + 8)], fill=ACCENT, width=px(1))
draw.line([px(spx - 8), px(spy), px(spx + 8), px(spy)], fill=ACCENT, width=px(1))
draw.line([px(spx - 4), px(spy - 4), px(spx + 4), px(spy + 4)], fill=ACCENT + (140,), width=px(1))
draw.line([px(spx - 4), px(spy + 4), px(spx + 4), px(spy - 4)], fill=ACCENT + (140,), width=px(1))

# metric tiles
metrics = [("38", "pages matched"), ("12", "papers scanned"), ("2", "PDFs ready")]
mt_y = PY0 + 76
tile_gap = 12
tile_w = ((PX1 - PX0) - 44 - tile_gap * 2) / 3
mvf = fraunces(30, wght=620, opsz=40)
mlf = inter(11, wght=500)
mx = PX0 + 22
for val, lab in metrics:
    draw.rounded_rectangle([px(mx), px(mt_y), px(mx + tile_w), px(mt_y + 64)],
                           radius=px(5), fill=BG + (140,), outline=INK + (20,), width=px(1))
    draw.text((px(mx + 13), px(mt_y + 9)), val, font=mvf, fill=INK)
    draw.text((px(mx + 14), px(mt_y + 44)), lab, font=mlf, fill=TXT_MUTED)
    mx += tile_w + tile_gap

# extraction queue rows
q_y = PY0 + 156
qlf = mono(10, wght=500)
draw.text((px(PX0 + 22), px(q_y)), "ACTIVE EXTRACTION QUEUE", font=qlf, fill=TXT_MUTED)
rows = [("9702", "Circular motion", 0.74), ("9709", "Integration", 0.92)]
rcf = mono(13, wght=600)
rtf = inter(13, wght=600)
rvf = mono(11, wght=500)
ry = q_y + 22
for code, topic, frac in rows:
    draw.text((px(PX0 + 22), px(ry + 2)), code, font=rcf, fill=ACCENT)
    draw.text((px(PX0 + 78), px(ry)), topic, font=rtf, fill=INK)
    # progress bar
    bar_x0 = PX0 + 78
    bar_x1 = PX1 - 70
    bar_y = ry + 22
    draw.rounded_rectangle([px(bar_x0), px(bar_y), px(bar_x1), px(bar_y + 4)],
                           radius=px(2), fill=INK + (24,))
    fillw = (bar_x1 - bar_x0) * frac
    draw.rounded_rectangle([px(bar_x0), px(bar_y), px(bar_x0 + fillw), px(bar_y + 4)],
                           radius=px(2), fill=ACCENT)
    draw.text((px(PX1 - 56), px(ry + 2)), f"{int(frac*100)}%", font=rvf, fill=TXT_SEC)
    ry += 44

# ---------------------------------------------------------------------------
# Footer URL (right-aligned, away from avatar zone bottom-left)
# ---------------------------------------------------------------------------
uf = mono(13, wght=500)
url = "aceurexam.com"
uw = draw.textlength(url, font=uf)
draw.text((px(PX1) - uw, px(346)), url, font=uf, fill=TXT_SEC)

# ---- Downsample ----
final = img.resize((W, H), Image.LANCZOS)
final.save("/tmp/aceurexam_linkedin_banner.png")
print("saved", final.size)

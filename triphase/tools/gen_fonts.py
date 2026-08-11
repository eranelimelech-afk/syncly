#!/usr/bin/env python3
"""Generate Connect IQ bitmap fonts (BMFont .fnt + PNG atlas) for TriPhase.

The spec (section 4) calls for Barlow Semi Condensed at exact pixel sizes with
tabular figures, one .fnt per size, filtered to only the glyphs each role
needs. Garmin's built-in fonts are far taller than the spec's assumed sizes,
which makes the 11-field ladder overlap - these fonts restore the intended
metrics.

Digits are forced tabular: every digit advances by the widest digit's advance,
with the glyph centered inside it, so the time never jitters.

Usage:
  python3 gen_fonts.py <barlow-500.ttf> <barlow-600.ttf> <project_root>

Writes resources-scale{454,416,280,260}/fonts/ with per-scale .fnt/.png pairs
and a fonts.xml listing them.
"""
import math
import os
import sys

from PIL import Image, ImageDraw, ImageFont

DIGITS = "0123456789"
UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
LOWER = "abcdefghijklmnopqrstuvwxyz"
NUMERIC_EXTRA = "%h:-.,/ "
TEXT_SET = DIGITS + UPPER + LOWER + NUMERIC_EXTRA + "·+&'"

# (id, px_size at 454, weight, charset, extra letter spacing px at 454)
# Sizes were bumped from the spec's originals after on-device review found
# them too small at arm's length (spec section 14 rule 1: legibility at a
# glance beats density).
FONTS = [
    ("time82",   82, 600, DIGITS + ":",             0),
    ("sec22",    24, 500, DIGITS,                   0),
    ("val32",    34, 600, DIGITS + NUMERIC_EXTRA,   0),
    ("val29",    30, 600, DIGITS + NUMERIC_EXTRA,   0),
    ("val28",    30, 600, DIGITS + NUMERIC_EXTRA,   0),
    ("val22",    24, 500, TEXT_SET,                 0),
    ("val21",    24, 500, TEXT_SET,                 0),
    ("label11",  13, 600, DIGITS + UPPER + " /·",   2),
    ("date16",   17, 500, DIGITS + UPPER + " .·",   1),
    ("week12",   13, 600, UPPER,                    0),
]

SCALES = {"454": 1.0, "416": 416 / 454.0, "280": 280 / 454.0, "260": 260 / 454.0}
MIN_SIZE = 8


def build_font(out_dir, name, ttf_path, px, charset, spacing):
    font = ImageFont.truetype(ttf_path, px)
    ascent, descent = font.getmetrics()

    glyphs = []
    max_digit_adv = 0
    for ch in charset:
        bbox = font.getbbox(ch)  # (x0, y0, x1, y1) relative to origin at top
        adv = font.getlength(ch)
        glyphs.append([ch, bbox, adv])
        if ch in DIGITS:
            max_digit_adv = max(max_digit_adv, adv)

    # Tabular figures: every digit gets the widest digit advance.
    for g in glyphs:
        if g[0] in DIGITS:
            g[2] = max_digit_adv

    # Tight vertical box across the charset (ink extents).
    top = min((g[1][1] for g in glyphs if g[1][3] > g[1][1]), default=0)
    bottom = max((g[1][3] for g in glyphs if g[1][3] > g[1][1]), default=px)
    line_h = bottom - top + 2  # +1px breathing room each side
    base = ascent - top + 1

    pad = 1
    # Pack glyphs in rows into a roughly square atlas.
    entries = []
    total_w = sum(int(math.ceil(g[1][2] - g[1][0])) + 2 * pad + 1
                  for g in glyphs if g[1][3] > g[1][1])
    row_w = max(64, int(math.sqrt(max(total_w, 1) * (line_h + 2 * pad))) + 8)
    x = y = 0
    row_used = 0
    for ch, bbox, adv in glyphs:
        has_ink = bbox[3] > bbox[1]
        gw = int(math.ceil(bbox[2] - bbox[0])) if has_ink else 0
        cell_w = gw + 2 * pad
        if has_ink and x + cell_w > row_w:
            x = 0
            y += line_h + 2 * pad
        entries.append((ch, bbox, adv, x if has_ink else 0, y if has_ink else 0, gw))
        if has_ink:
            x += cell_w + 1
            row_used = max(row_used, x)
    atlas_w = max(row_used, 16)
    atlas_h = y + line_h + 2 * pad

    img = Image.new("RGBA", (atlas_w, atlas_h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    chars = []
    for ch, bbox, adv, gx, gy, gw in entries:
        has_ink = bbox[3] > bbox[1]
        gh = (bbox[3] - bbox[1]) if has_ink else 0
        if has_ink:
            # Draw so glyph ink starts at (gx+pad, gy+pad).
            draw.text((gx + pad - bbox[0], gy + pad - bbox[1]), ch,
                      font=font, fill=(255, 255, 255, 255))
        xoffset = int(round((adv - gw) / 2.0)) if ch in DIGITS else (bbox[0] if has_ink else 0)
        chars.append({
            "id": ord(ch),
            "x": gx + pad if has_ink else 0,
            "y": gy + pad if has_ink else 0,
            "width": gw,
            "height": gh,
            "xoffset": xoffset,
            "yoffset": (bbox[1] - top + 1) if has_ink else 0,
            "xadvance": int(round(adv)) + spacing,
        })

    png_name = f"{name}.png"
    img.save(os.path.join(out_dir, png_name))

    lines = [
        f'info face="BarlowSemiCondensed" size={px} bold=0 italic=0 charset="" '
        f'unicode=1 stretchH=100 smooth=1 aa=1 padding=0,0,0,0 spacing=1,1 outline=0',
        f'common lineHeight={line_h + 2} base={base} scaleW={atlas_w} scaleH={atlas_h} '
        f'pages=1 packed=0 alphaChnl=1 redChnl=0 greenChnl=0 blueChnl=0',
        f'page id=0 file="{png_name}"',
        f'chars count={len(chars)}',
    ]
    for c in chars:
        lines.append(
            "char id={id:<4} x={x:<5} y={y:<5} width={width:<5} height={height:<5} "
            "xoffset={xoffset:<5} yoffset={yoffset:<5} xadvance={xadvance:<5} "
            "page=0  chnl=15".format(**c))
    with open(os.path.join(out_dir, f"{name}.fnt"), "w") as f:
        f.write("\n".join(lines) + "\n")
    return line_h


def main():
    ttf500, ttf600, root = sys.argv[1], sys.argv[2], sys.argv[3]
    ttf = {500: ttf500, 600: ttf600}
    for scale_name, factor in SCALES.items():
        out_dir = os.path.join(root, f"resources-scale{scale_name}", "fonts")
        os.makedirs(out_dir, exist_ok=True)
        xml = ['<?xml version="1.0" encoding="UTF-8"?>', "<resources>", "    <fonts>"]
        for name, size, weight, charset, spacing in FONTS:
            px = max(MIN_SIZE, int(round(size * factor)))
            sp = max(0, int(round(spacing * factor)))
            lh = build_font(out_dir, name, ttf[weight], px, charset, sp)
            xml.append(f'        <font id="{name}" filename="fonts/{name}.fnt" antialias="true"/>')
            print(f"scale{scale_name}: {name} px={px} lineHeight={lh}")
        xml += ["    </fonts>", "</resources>", ""]
        with open(os.path.join(root, f"resources-scale{scale_name}", "fonts.xml"), "w") as f:
            f.write("\n".join(xml))


if __name__ == "__main__":
    main()

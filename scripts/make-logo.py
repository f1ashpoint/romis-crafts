# Generates public/logo.svg (vector, text converted to outlines). Needs fontTools and the two .woff files named below.
import math, sys
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
F = sys.argv[1]  # fonts dir
def text_path(font_path, text, size, x, y, spacing=0, anchor='start'):
    f = TTFont(font_path); gs = f.getGlyphSet(); cmap = f.getBestCmap(); upm = f['head'].unitsPerEm; s = size / upm
    names = [cmap[ord(c)] for c in text]
    adv = [gs[n].width * s + spacing for n in names]; total = sum(adv) - spacing
    if anchor == 'middle': x -= total / 2
    pen = SVGPathPen(gs); cx = x
    for n, a in zip(names, adv):
        gs[n].draw(TransformPen(pen, (s, 0, 0, -s, cx, y))); cx += a
    return pen.getCommands(), total
OLIVE, DEEP = '#4a5a3a', '#3b4a2d'
def petal(cx, cy, ang, r0, r1, w, fill):
    return f'<ellipse cx="{cx + math.cos(ang) * (r0 + r1) / 2:.1f}" cy="{cy + math.sin(ang) * (r0 + r1) / 2:.1f}" rx="{(r1 - r0) / 2:.1f}" ry="{w:.1f}" transform="rotate({math.degrees(ang):.1f} {cx + math.cos(ang) * (r0 + r1) / 2:.1f} {cy + math.sin(ang) * (r0 + r1) / 2:.1f})" fill="{fill}"/>'
def sunflower(cx, cy, R):
    o = []
    for i in range(18): o.append(petal(cx, cy, i * 2 * math.pi / 18, R * .35, R, R * .14, '#d58a17'))
    for i in range(18): o.append(petal(cx, cy, (i + .5) * 2 * math.pi / 18, R * .32, R * .93, R * .15, '#f2b52c'))
    for i in range(18): o.append(petal(cx, cy, (i + .5) * 2 * math.pi / 18, R * .4, R * .8, R * .045, '#ffd766'))
    o.append(f'<circle cx="{cx}" cy="{cy}" r="{R * .42:.1f}" fill="url(#disk)"/>')
    for k in range(1, 150):
        r = R * .40 * math.sqrt(k / 150); a = k * 2.399963
        o.append(f'<circle cx="{cx + r * math.cos(a):.1f}" cy="{cy + r * math.sin(a):.1f}" r="{R * .018:.1f}" fill="{"#2b1608" if k % 3 else "#8a5a26"}"/>')
    return ''.join(o)
def leaf(x, y, ang, L, W, fill='#6f8a47'):
    return f'<g transform="translate({x} {y}) rotate({ang})"><path d="M0 0 C{L*.25} {-W} {L*.75} {-W} {L} 0 C{L*.75} {W} {L*.25} {W} 0 0Z" fill="{fill}"/><path d="M0 0 L{L*.92} 0" stroke="#4d6530" stroke-width="3" fill="none" stroke-linecap="round"/></g>'
def sprig(x, y, pts):
    d = f'M{x} {y} ' + ' '.join(f'L{px} {py}' for px, py in pts)
    return f'<path d="{d}" stroke="#6b7a4f" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>' + ''.join(f'<circle cx="{px}" cy="{py}" r="9" fill="#fffdf6" stroke="#6b7a4f" stroke-width="2.5"/><circle cx="{px}" cy="{py}" r="2.6" fill="#d8a53a"/>' for px, py in pts)
simply, wS = text_path(F + '/great-vibes-latin-400-normal.woff', 'Simply', 330, 0, 0)
romi, wR = text_path(F + '/cormorant-garamond-latin-600-normal.woff', 'ROMI', 215, 0, 0, spacing=46)
tag, wT = text_path(F + '/cormorant-garamond-latin-600-normal.woff', 'HANDMADE GIFTS & BOUQUETS', 44, 0, 0, spacing=13)
svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 1200" role="img" aria-label="Simply Romi, handmade gifts and bouquets">
<defs><radialGradient id="disk" cx=".4" cy=".35" r=".8"><stop offset="0" stop-color="#7a4a1c"/><stop offset=".55" stop-color="#4a280e"/><stop offset="1" stop-color="#2b1608"/></radialGradient>
<radialGradient id="paper" cx=".5" cy=".4" r=".8"><stop offset="0" stop-color="#fbf4e6"/><stop offset="1" stop-color="#f3e8d2"/></radialGradient></defs>
<rect width="1200" height="1200" fill="url(#paper)"/>
<g transform="translate(0 -62)"><g fill="none" stroke="{OLIVE}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round">
<path d="M250 380 L250 470 L560 470"/><path d="M250 380 L520 380"/>
<path d="M395 380 C340 300 270 270 270 330 C270 380 340 390 395 380 C340 370 280 400 270 430"/>
<path d="M395 380 C450 300 520 270 520 330 C520 380 450 390 395 380 C450 370 510 400 520 430"/>
<path d="M395 380 C385 420 380 470 380 540" stroke-width="5"/></g>
<circle cx="395" cy="380" r="15" fill="{OLIVE}"/></g>
<g transform="rotate(14 700 560)"><rect x="672" y="530" width="56" height="78" rx="10" fill="#fffaf0" stroke="{OLIVE}" stroke-width="4"/><circle cx="700" cy="548" r="6" fill="none" stroke="{OLIVE}" stroke-width="3"/></g>
{sprig(620, 300, [(640, 255), (668, 205), (700, 160)])}{sprig(655, 215, [(612, 190), (585, 150)])}{sprig(990, 520, [(1010, 470), (1040, 420), (1062, 360)])}
{leaf(850, 480, 150, 190, 42)}{leaf(900, 470, 40, 200, 44)}{leaf(960, 360, -20, 170, 40, '#7f9a52')}{leaf(780, 460, 195, 150, 36, '#5f7a3c')}
{sunflower(820, 330, 190)}
<path transform="translate(150 720)" d="{simply}" fill="{OLIVE}"/>
<path transform="translate({600 - wR / 2 + 0} 930)" d="{romi}" fill="{DEEP}"/>
<g stroke="{OLIVE}" stroke-width="3" stroke-linecap="round"><path d="M210 1030 H470"/><path d="M730 1030 H990"/></g>
<g transform="translate(600 1030)" fill="none" stroke="{OLIVE}" stroke-width="3" stroke-linecap="round"><path d="M0 -26 V28 M-17 -9 H17"/></g>
<path transform="translate({600 - wT / 2} 1112)" d="{tag}" fill="{OLIVE}"/>
</svg>'''
open('public/logo.svg', 'w').write(svg); print(len(svg))

# Compact sunflower-only mark for small sizes (header, favicon): same artwork, cropped viewBox.
open('public/mark.svg', 'w').write(svg.replace('viewBox="0 0 1200 1200"', 'viewBox="585 105 545 545"', 1))

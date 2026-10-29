"""
Generates the circuit-board hero on the home page.

    python3 _tools/board.py

writes _includes/board-wide.svg (desktop) and _includes/board-tall.svg (phones).
Edit the PARTS lists below to move or relabel chips, then re-run.
"""
from pathlib import Path

OUT = Path(__file__).resolve().parent.parent / "_includes"


# ── primitives ────────────────────────────────────────────────

def esc(s):
    return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def chamfer(points, c=14):
    """Orthogonal polyline -> SVG path with 45° corners, like a real trace."""
    out = [points[0]]
    for i in range(1, len(points) - 1):
        (x0, y0), (x1, y1), (x2, y2) = points[i - 1], points[i], points[i + 1]
        d_in = abs(x1 - x0) + abs(y1 - y0)
        d_out = abs(x2 - x1) + abs(y2 - y1)
        k = min(c, d_in / 2, d_out / 2)
        sx = (x1 - x0) / d_in if d_in else 0
        sy = (y1 - y0) / d_in if d_in else 0
        tx = (x2 - x1) / d_out if d_out else 0
        ty = (y2 - y1) / d_out if d_out else 0
        out.append((x1 - sx * k, y1 - sy * k))
        out.append((x1 + tx * k, y1 + ty * k))
    out.append(points[-1])
    return "M" + " L".join(f"{x:.1f} {y:.1f}" for x, y in out)


class Board:
    def __init__(self, w, h):
        self.w, self.h = w, h
        self.traces, self.parts, self.silk, self.extra = [], [], [], []
        self.pins = {}

    # traces ----------------------------------------------------
    def trace(self, pts, net="", width=4, via_end=False):
        self.traces.append(
            f'<path class="cu" data-net="{net}" stroke-width="{width}" d="{chamfer(pts)}"/>'
        )
        if via_end:
            self.via(*pts[-1], net)

    def via(self, x, y, net=""):
        self.traces.append(f'<circle class="via" data-net="{net}" cx="{x}" cy="{y}" r="6"/>')

    # parts -----------------------------------------------------
    def chip(self, ref, name, sub, cx, cy, w, h, href, net, pins="tb", n=4, label=None):
        x, y = cx - w / 2, cy - h / 2
        g = [f'<a class="part chip" href="{href}" data-net="{net}" aria-label="{esc(label or name)}">',
             f'<g>']
        pad_len, pad_w = 12, 7
        coords = {"t": [], "b": [], "l": [], "r": []}
        for side in pins:
            span = w if side in "tb" else h
            pitch = span / (n + 1)
            for k in range(n):
                if side in "tb":
                    px = x + pitch * (k + 1)
                    py = y - pad_len if side == "t" else y + h
                    g.append(f'<rect class="pad" x="{px - pad_w / 2:.1f}" y="{py:.1f}" width="{pad_w}" height="{pad_len}" rx="1"/>')
                    coords[side].append((px, y - pad_len if side == "t" else y + h + pad_len))
                else:
                    py = y + pitch * (k + 1)
                    px = x - pad_len if side == "l" else x + w
                    g.append(f'<rect class="pad" x="{px:.1f}" y="{py - pad_w / 2:.1f}" width="{pad_len}" height="{pad_w}" rx="1"/>')
                    coords[side].append((x - pad_len if side == "l" else x + w + pad_len, py))
        g.append(f'<rect class="pkg" x="{x}" y="{y}" width="{w}" height="{h}" rx="3"/>')
        g.append(f'<circle class="pin1" cx="{x + 8}" cy="{y + 8}" r="2.4"/>')
        g.append(f'<text class="mark" x="{cx}" y="{cy - (2 if sub else -4)}" text-anchor="middle">{esc(name)}</text>')
        if sub:
            g.append(f'<text class="mark-sub" x="{cx}" y="{cy + 13}" text-anchor="middle">{esc(sub)}</text>')
        ry = y - (24 if "t" in pins else 8)
        g.append(f'<text class="silk refdes" x="{x}" y="{ry}">{ref}</text>')
        g.append("</g></a>")
        self.parts.append("".join(g))
        self.pins[ref] = coords
        return coords

    def led(self, ref, cx, cy, label, i):
        s = 26
        g = [f'<g class="led" style="--i:{i}" tabindex="0" aria-label="{esc(label)}">',
             f'<rect class="led-body" x="{cx - s / 2}" y="{cy - s / 2}" width="{s}" height="{s}" rx="3"/>',
             f'<circle class="led-lens" cx="{cx}" cy="{cy}" r="8.5"/>',
             f'<circle class="led-glow" cx="{cx}" cy="{cy}" r="20"/>',
             f'<text class="silk refdes" x="{cx - s / 2}" y="{cy - s / 2 - 7}">{ref}</text>',
             f'<text class="silk led-label" x="{cx}" y="{cy + s / 2 + 18}" text-anchor="middle">{esc(label)}</text>',
             "</g>"]
        self.parts.append("".join(g))
        return (cx - s / 2, cy), (cx + s / 2, cy)

    def usbc(self, ref, label, cx, y_edge, href, w=92):
        h = 40
        x = cx - w / 2
        y = y_edge - h + 12   # sticks out past the board edge, like a real connector
        g = [f'<a class="part conn" href="{href}" aria-label="{esc(label)}">',
             f'<rect class="shell" x="{x}" y="{y}" width="{w}" height="{h}" rx="9"/>',
             f'<rect class="slot" x="{x + 12}" y="{y + 12}" width="{w - 24}" height="{h - 24}" rx="6"/>',
             f'<text class="silk refdes" x="{x}" y="{y - 12}">{ref}</text>',
             f'<text class="silk conn-label" x="{x + 30}" y="{y - 12}">{esc(label)}</text>',
             "</a>"]
        self.parts.append("".join(g))
        return (cx, y)

    def header(self, ref, label, cx, cy, href, n=4):
        pitch = 20
        x0 = cx - pitch * (n - 1) / 2
        g = [f'<a class="part conn" href="{href}" aria-label="{esc(label)}">',
             f'<rect class="hdr-outline" x="{x0 - 14}" y="{cy - 14}" width="{pitch * (n - 1) + 28}" height="28"/>']
        for k in range(n):
            px = x0 + k * pitch
            if k == 0:
                g.append(f'<rect class="thpad" x="{px - 7.5}" y="{cy - 7.5}" width="15" height="15"/>')
            else:
                g.append(f'<circle class="thpad" cx="{px}" cy="{cy}" r="7.5"/>')
            g.append(f'<circle class="drill" cx="{px}" cy="{cy}" r="3"/>')
        g.append(f'<text class="silk refdes" x="{x0 - 14}" y="{cy - 22}">{ref}</text>')
        g.append(f'<text class="silk conn-label" x="{x0 + 12}" y="{cy - 22}">{esc(label)}</text>')
        g.append("</a>")
        self.parts.append("".join(g))
        return (x0, cy)

    def passive(self, ref, cx, cy, vertical=False):
        w, h = (14, 30) if vertical else (30, 14)
        p = [f'<g class="passive">']
        if vertical:
            p += [f'<rect class="pad" x="{cx - 7}" y="{cy - 15}" width="14" height="8" rx="1"/>',
                  f'<rect class="pad" x="{cx - 7}" y="{cy + 7}" width="14" height="8" rx="1"/>',
                  f'<rect class="smd" x="{cx - 6}" y="{cy - 7}" width="12" height="14"/>']
            tx, ty = cx + 12, cy + 4
        else:
            p += [f'<rect class="pad" x="{cx - 15}" y="{cy - 7}" width="8" height="14" rx="1"/>',
                  f'<rect class="pad" x="{cx + 7}" y="{cy - 7}" width="8" height="14" rx="1"/>',
                  f'<rect class="smd" x="{cx - 7}" y="{cy - 6}" width="14" height="12"/>']
            tx, ty = cx - 15, cy - 14
        p.append(f'<text class="silk refdes small" x="{tx}" y="{ty}">{ref}</text></g>')
        self.parts.append("".join(p))

    def text(self, x, y, s, cls="silk", anchor="start"):
        self.silk.append(f'<text class="{cls}" x="{x}" y="{y}" text-anchor="{anchor}">{esc(s)}</text>')

    def hole(self, x, y):
        self.extra.append(f'<circle class="hole-ring" cx="{x}" cy="{y}" r="17"/><circle class="hole" cx="{x}" cy="{y}" r="10"/>')

    def svg(self, title, cls):
        w, h = self.w, self.h
        return "\n".join([
            f'<svg class="board {cls}" viewBox="0 0 {w} {h}" role="img" aria-labelledby="{cls}-title">',
            f'<title id="{cls}-title">{esc(title)}</title>',
            '<defs><pattern id="weave-' + cls + '" width="6" height="6" patternUnits="userSpaceOnUse">'
            '<path d="M0 6L6 0" class="weave"/></pattern></defs>',
            f'<rect class="mask" x="10" y="10" width="{w - 20}" height="{h - 20}" rx="26"/>',
            f'<rect x="10" y="10" width="{w - 20}" height="{h - 20}" rx="26" fill="url(#weave-{cls})"/>',
            f'<rect class="edge" x="10" y="10" width="{w - 20}" height="{h - 20}" rx="26"/>',
            '<g class="traces">', *self.traces, '</g>',
            *self.extra,
            '<g class="silkscreen">', *self.silk, '</g>',
            '<g class="parts">', *self.parts, '</g>',
            '</svg>',
        ])


# ── helpers for routing buses ─────────────────────────────────

def bus(b, src, dst, turn, net, axis="y", gap=14, via=False):
    """Route parallel traces from src pins to dst pins, keeping order so nothing crosses.
    axis="y": go vertical, turn horizontal at `turn` (y), then vertical into dst.
    axis="x": go horizontal, turn vertical at `turn` (x), then horizontal into dst."""
    n = len(src)
    if axis == "y":
        src, dst = sorted(src), sorted(dst)
        going_left = dst[0][0] < src[0][0]
        up = dst[0][1] < src[0][1]
        for i, (s, d) in enumerate(zip(src, dst)):
            k = i if going_left else n - 1 - i
            ty = turn + (k * gap if up else -k * gap)
            b.trace([s, (s[0], ty), (d[0], ty), d], net)
    else:
        src, dst = sorted(src, key=lambda p: p[1]), sorted(dst, key=lambda p: p[1])
        going_up = dst[0][1] < src[0][1]
        left = dst[0][0] < src[0][0]
        for i, (s, d) in enumerate(zip(src, dst)):
            k = i if going_up else n - 1 - i
            tx = turn + (k * gap if left else -k * gap)
            b.trace([s, (tx, s[1]), (tx, d[1]), d], net)


INTERESTS = ["BADMINTON", "SEA SWIM", "MUSIC", "TRAVEL", "NOVELS", "ROBOTS"]


# ── desktop board ─────────────────────────────────────────────

def wide():
    b = Board(1200, 740)
    for x, y in [(50, 50), (1150, 50), (50, 690), (1150, 690)]:
        b.hole(x, y)

    b.text(82, 152, "KAMAYA", "silk name")
    b.text(82, 236, "GOGNA", "silk name")
    b.text(86, 280, "REV 18 · DUBLIN, IE · PHYSICS @ DCU", "silk meta")
    b.text(86, 330, "I build robots, circuit boards and", "silk intro")
    b.text(86, 354, "medical devices, and read far too", "silk intro")
    b.text(86, 378, "many classic novels.", "silk intro")
    b.text(86, 416, "Every part on this board is a link.", "silk hint")

    u1 = b.chip("U1", "KG-18", "ABOUT ME", 890, 380, 150, 150, "#about", "about", pins="tblr", n=6,
                label="About me")
    u2 = b.chip("U2", "AKARA", "VIOLET HRI", 640, 120, 132, 52, "/work/#akara", "akara", label="Akara Robotics: Violet's lights")
    u3 = b.chip("U3", "ANAULA", "BIOREACTOR", 890, 120, 132, 52, "/work/#anaula", "anaula", label="Anaula: photobioreactor control")
    u5 = b.chip("U5", "FIACLA", "X-RAY AI", 1080, 150, 112, 52, "/work/#fiacla", "fiacla", n=3, label="Fiacla: AI for dental X-rays")
    u4 = b.chip("U4", "SCOPELAB", "PATCH ’25", 1094, 380, 88, 132, "/work/#patch", "patch", pins="lr", n=4, label="ScopeLab at Patch")
    m1 = b.chip("M1", "ROBO", "WARS", 640, 380, 64, 132, "/work/#robowars", "robowars", pins="lr", n=4, label="Robowars combat robot")
    u6 = b.chip("U6", "SCANNER", "INTRAORAL", 640, 620, 132, 52, "/work/#intraoral", "intraoral", label="Intraoral scanner")
    u7 = b.chip("U7", "ISS-CAM", "AGE 14", 890, 620, 132, 52, "/work/#iss", "iss", label="A camera on the ISS")
    u8 = b.chip("U8", "ACCEL", "LAB", 1080, 610, 112, 52, "/work/#accellab", "accellab", n=3, label="AccelLab")

    T, B, L, R = u1["t"], u1["b"], u1["l"], u1["r"]
    bus(b, T[0:2], u2["b"][2:4], 250, "akara")
    bus(b, T[2:4], u3["b"][1:3], 232, "anaula")
    bus(b, T[4:6], u5["b"][0:2], 250, "fiacla")
    bus(b, R[1:5], u4["l"], 1000, "patch", axis="x")
    bus(b, L[1:5], m1["r"], 760, "robowars", axis="x")
    bus(b, B[1:3], u6["t"][2:4], 510, "intraoral")
    bus(b, B[3:5], u7["t"][1:3], 528, "iss")
    bus(b, [B[5]], [u8["t"][0]], 510, "accellab")

    # WS2812 chain: data hops LED to LED, then into the MCU (a nod to FastLED)
    prev = None
    for i, name in enumerate(INTERESTS):
        din, dout = b.led(f"D{i + 1}", 104 + i * 76, 505, name, i)
        if prev:
            b.trace([prev, din], "leds", width=3)
        prev = dout
    b.trace([prev, (540, 505), (540, 470), (690, 470)], "leds", width=3, via_end=True)
    b.trace([(690, 470), (760, 470), (760, L[5][1]), L[5]], "leds", width=3)
    b.text(104, 556, "WS2812 · DATA →", "silk tiny")

    # connectors = navigation
    for ref, label, cx, href in [("J1", "ESSAYS", 180, "/essays/"), ("J2", "BOOKSHELF", 340, "/bookshelf/"),
                                 ("J3", "WORK", 500, "/work/"), ("J4", "TRAVEL", 660, "/travel/")]:
        b.usbc(ref, label, cx, 740, href, w=104)
    b.header("J5", "GITHUB", 120, 616, "https://github.com/gognakamaya-dev", n=3)

    for ref, x, y, v in [("C1", 818, 278, False), ("C2", 962, 278, False), ("R1", 980, 470, True),
                         ("R2", 800, 470, True), ("C3", 760, 300, True)]:
        b.passive(ref, x, y, v)

    b.text(1150, 718, "KG-PCB-01 · 2 LAYERS · 1.6 MM · ENIG · MADE IN DUBLIN", "silk tiny", "end")
    return b.svg("A circuit board with my name on it. Each chip is a project, each connector is a page.", "wide")


# ── phone board ───────────────────────────────────────────────

def tall():
    b = Board(420, 1240)
    for x, y in [(44, 44), (376, 44), (44, 1150), (376, 1150)]:
        b.hole(x, y)
    b.text(36, 128, "KAMAYA", "silk name")
    b.text(36, 190, "GOGNA", "silk name")
    b.text(40, 226, "REV 18 · DUBLIN · PHYSICS @ DCU", "silk meta")
    b.text(40, 266, "I build robots, circuit boards and", "silk intro")
    b.text(40, 288, "medical devices, and read far too", "silk intro")
    b.text(40, 310, "many classic novels.", "silk intro")
    b.text(40, 342, "Tap any part.", "silk hint")

    u2 = b.chip("U2", "AKARA", "VIOLET HRI", 110, 420, 132, 50, "/work/#akara", "akara", label="Akara Robotics")
    u3 = b.chip("U3", "ANAULA", "BIOREACTOR", 310, 420, 132, 50, "/work/#anaula", "anaula", label="Anaula")
    u1 = b.chip("U1", "KG-18", "ABOUT ME", 210, 590, 124, 124, "#about", "about", pins="tblr", n=5, label="About me")
    m1 = b.chip("M1", "ROBO", "WARS", 62, 590, 58, 110, "/work/#robowars", "robowars", pins="r", n=3, label="Robowars")
    u4 = b.chip("U4", "SCOPE", "LAB", 358, 590, 58, 110, "/work/#patch", "patch", pins="l", n=3, label="ScopeLab")
    u5 = b.chip("U5", "FIACLA", "X-RAY AI", 110, 770, 132, 50, "/work/#fiacla", "fiacla", label="Fiacla")
    u6 = b.chip("U6", "SCANNER", "INTRAORAL", 310, 770, 132, 50, "/work/#intraoral", "intraoral", label="Intraoral scanner")
    u7 = b.chip("U7", "ISS-CAM", "AGE 14", 110, 880, 132, 50, "/work/#iss", "iss", label="ISS camera")
    u8 = b.chip("U8", "ACCEL", "LAB", 310, 880, 132, 50, "/work/#accellab", "accellab", label="AccelLab")

    T, B, L, R = u1["t"], u1["b"], u1["l"], u1["r"]
    bus(b, T[0:2], u2["b"][2:4], 494, "akara", gap=10)
    bus(b, T[3:5], u3["b"][0:2], 494, "anaula", gap=10)
    bus(b, L[1:4], m1["r"], 122, "robowars", axis="x", gap=8)
    bus(b, R[1:4], u4["l"], 298, "patch", axis="x", gap=8)
    bus(b, B[0:2], u5["t"][2:4], 688, "fiacla", gap=10)
    bus(b, B[3:5], u6["t"][0:2], 688, "intraoral", gap=10)
    b.trace([u5["b"][0], (u5["b"][0][0], 820), u7["t"][0]], "iss")
    b.trace([u6["b"][3], (u6["b"][3][0], 820), u8["t"][3]], "accellab")

    prev = None
    for i, name in enumerate(INTERESTS):
        col, row = i % 3, i // 3
        din, dout = b.led(f"D{i + 1}", 90 + col * 120, 990 + row * 78, name, i)
        if prev and col:
            b.trace([prev, din], "leds", width=3)
        prev = dout

    for ref, label, cx, href in [("J1", "ESSAYS", 64, "/essays/"), ("J2", "BOOKS", 162, "/bookshelf/"),
                                 ("J3", "WORK", 260, "/work/"), ("J4", "TRAVEL", 358, "/travel/")]:
        b.usbc(ref, label, cx, 1240, href, w=72)
    return b.svg("A circuit board with my name on it. Each chip is a project, each connector is a page.", "tall")


if __name__ == "__main__":
    (OUT / "board-wide.svg").write_text(wide())
    (OUT / "board-tall.svg").write_text(tall())
    print("wrote", OUT / "board-wide.svg", OUT / "board-tall.svg")

#!/usr/bin/env python3
"""生成 PJPC 临时 App 图标（Android 全套 mipmap）。

设计：深炭底 + 白色几何 P + 底部一条琥珀短线。
字形与短线整体按「合并后的外接框」居中，避免偏右下。

用法：python3 scripts/make-app-icon.py
"""
from PIL import Image, ImageDraw
from pathlib import Path

RES = Path(__file__).resolve().parent.parent / "mobile/android/app/src/main/res"
BG = (16, 16, 20, 255)         # #101014
FG = (248, 250, 252, 255)      # #f8fafc
ACCENT = (245, 158, 11, 255)   # #f59e0b

LEGACY = {"mdpi": 48, "hdpi": 72, "xhdpi": 96, "xxhdpi": 144, "xxxhdpi": 192}
ADAPTIVE = {"mdpi": 108, "hdpi": 162, "xhdpi": 216, "xxhdpi": 324, "xxxhdpi": 432}


def _mark(size: int, safe: float) -> Image.Image:
    """画「P + 短线」到透明画布，返回合成后的图层（已居中）。"""
    ss = 4
    S = size * ss
    inner = S * safe

    layer = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)

    # ---- 字形 P ----
    stem_w = inner * 0.165
    x0 = inner * 0.30
    y0 = inner * 0.24
    h = inner * 0.50
    d.rounded_rectangle([x0, y0, x0 + stem_w, y0 + h], radius=stem_w * 0.30, fill=FG)
    bowl_r = inner * 0.150
    cx = x0 + stem_w + bowl_r * 0.70
    cy = y0 + bowl_r
    d.ellipse([cx - bowl_r, cy - bowl_r, cx + bowl_r, cy + bowl_r],
              outline=FG, width=max(2, int(stem_w * 0.88)))

    gb = layer.getbbox()

    # ---- 短线（按字形外接框居中） ----
    bar_w = (gb[2] - gb[0]) * 0.80
    bar_h = stem_w * 0.40
    gap = inner * 0.085
    bx = gb[0] + ((gb[2] - gb[0]) - bar_w) / 2
    by = gb[3] + gap
    d.rounded_rectangle([bx, by, bx + bar_w, by + bar_h], radius=bar_h / 2, fill=ACCENT)

    # ---- 整组居中 ----
    cb = layer.getbbox()
    w, hgt = cb[2] - cb[0], cb[3] - cb[1]
    out = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    out.paste(layer.crop(cb), (int((S - w) / 2), int((S - hgt) / 2)))

    return out.resize((size, size), Image.LANCZOS)


def draw_mark(size: int, *, bg: bool, circle: bool = False, safe: float = 0.66) -> Image.Image:
    mark = _mark(size, safe)
    if not bg:
        return mark

    ss = 4
    S = size * ss
    base = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(base)
    if circle:
        d.ellipse((0, 0, S - 1, S - 1), fill=BG)
    else:
        d.rounded_rectangle((0, 0, S - 1, S - 1), radius=int(S * 0.225), fill=BG)
    base = base.resize((size, size), Image.LANCZOS)
    base.alpha_composite(mark)
    return base


def main() -> None:
    for density, px in LEGACY.items():
        out = RES / f"mipmap-{density}"
        out.mkdir(parents=True, exist_ok=True)
        draw_mark(px, bg=True, safe=0.90).save(out / "ic_launcher.png")
        draw_mark(px, bg=True, circle=True, safe=0.80).save(out / "ic_launcher_round.png")
        draw_mark(ADAPTIVE[density], bg=False, safe=0.60).save(out / "ic_launcher_foreground.png")
        print(f"{density}: legacy {px}px · adaptive {ADAPTIVE[density]}px")

    (RES / "values/ic_launcher_background.xml").write_text(
        '<?xml version="1.0" encoding="utf-8"?>\n<resources>\n'
        '    <color name="ic_launcher_background">#101014</color>\n</resources>\n',
        encoding="utf-8",
    )
    print("背景色 → #101014")

    prev = Path(__file__).resolve().parent.parent / "mobile/icon-preview.png"
    draw_mark(512, bg=True, safe=0.90).save(prev)
    print("预览:", prev)


if __name__ == "__main__":
    main()

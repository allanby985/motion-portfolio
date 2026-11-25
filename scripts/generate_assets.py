"""
生成作品集占位素材（16:9 视频 / 封面 / 关键帧 / 过程图）。

用法：
    python scripts/generate_assets.py --preview aura
    python scripts/generate_assets.py --project aura
    python scripts/generate_assets.py --all
    python scripts/generate_assets.py --showreel
"""
from __future__ import annotations

import argparse
import math
import subprocess
from pathlib import Path

import numpy as np
from PIL import Image, ImageChops, ImageColor, ImageDraw, ImageFilter, ImageFont, ImageOps

ROOT = Path(__file__).resolve().parents[1]
MEDIA = ROOT / "public" / "media"
W, H = 1920, 1080
FPS = 30
DURATION = 8.0
PRODUCT_SECONDS = 6.4

FONT_DISPLAY = "C:/Windows/Fonts/bahnschrift.ttf"
FONT_MONO = "C:/Windows/Fonts/consola.ttf"
FONT_MONO_BOLD = "C:/Windows/Fonts/consolab.ttf"


# ---------------------------------------------------------------- helpers
def hx(value: str) -> np.ndarray:
    value = value.lstrip("#")
    return np.array([int(value[i : i + 2], 16) for i in (0, 2, 4)], dtype=np.float64)


def lerp(a: float, b: float, t: float) -> float:
    return a + (b - a) * t


def smoothstep(x: float) -> float:
    x = max(0.0, min(1.0, x))
    return x * x * (3 - 2 * x)


def ease_in_out(x: float) -> float:
    x = max(0.0, min(1.0, x))
    return 0.5 - 0.5 * math.cos(math.pi * x)


def gradient_bg(
    top: str,
    bottom: str,
    light_center: tuple[float, float] = (0.5, 0.18),
    light_radius: float = 0.9,
    light_color: str = "#ffffff",
    light_strength: float = 0.5,
    vignette: float = 0.35,
    seed: int = 7,
) -> np.ndarray:
    y = np.linspace(0, 1, H)[:, None, None]
    base = hx(top) * (1 - y) + hx(bottom) * y
    arr = np.repeat(base, W, axis=1).astype(np.float64)

    yy, xx = np.mgrid[0:H, 0:W]
    nx = (xx / W - light_center[0]) / light_radius
    ny = (yy / H - light_center[1]) / light_radius
    dist = np.sqrt(nx * nx + ny * ny)
    falloff = np.clip(1 - dist, 0, 1) ** 2 * light_strength
    arr = arr * (1 - falloff[..., None]) + hx(light_color) * falloff[..., None]

    vx = (xx / W - 0.5) * 2
    vy = (yy / H - 0.5) * 2
    vig = 1 - vignette * np.clip((vx * vx + vy * vy) * 0.55, 0, 1)
    arr *= vig[..., None]

    rng = np.random.default_rng(seed)
    noise = rng.normal(0, 2.2, (H, W, 1))
    arr += noise

    return np.clip(arr, 0, 255)


def to_image(arr: np.ndarray) -> Image.Image:
    return Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8), "RGB")


def rounded_mask(w: int, h: int, radius: int, ss: int = 3) -> Image.Image:
    mask = Image.new("L", (w * ss, h * ss), 0)
    draw = ImageDraw.Draw(mask)
    draw.rounded_rectangle((0, 0, w * ss - 1, h * ss - 1), radius * ss, fill=255)
    return mask.resize((w, h), Image.LANCZOS)


def ellipse_mask(w: int, h: int, ss: int = 3) -> Image.Image:
    mask = Image.new("L", (w * ss, h * ss), 0)
    draw = ImageDraw.Draw(mask)
    draw.ellipse((0, 0, w * ss - 1, h * ss - 1), fill=255)
    return mask.resize((w, h), Image.LANCZOS)


def gradient_fill(
    w: int,
    h: int,
    top: str,
    bottom: str,
    side_shade: float = 0.18,
    highlight_at: float | None = -0.35,
    highlight_width: float = 0.22,
    highlight_strength: float = 0.1,
) -> np.ndarray:
    y = np.linspace(0, 1, h)[:, None, None]
    base = hx(top) * (1 - y) + hx(bottom) * y
    arr = np.repeat(base, w, axis=1)
    x = np.linspace(-1, 1, w)[None, :, None]
    arr *= 1 - side_shade * (x**2)
    if highlight_at is not None:
        g = np.exp(-(((x - highlight_at) / highlight_width) ** 2))
        arr = arr * (1 - highlight_strength) + 255 * highlight_strength * g
    return np.clip(arr, 0, 255)


def rgba_from(arr: np.ndarray, mask: Image.Image) -> Image.Image:
    rgb = Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8), "RGB")
    layer = rgb.convert("RGBA")
    layer.putalpha(mask)
    return layer


def soft_ellipse_layer(w: int, h: int, color: str, alpha: float, softness: float = 2.2) -> Image.Image:
    yy, xx = np.mgrid[0:h, 0:w]
    nx = (xx - (w - 1) / 2) / (w / 2)
    ny = (yy - (h - 1) / 2) / (h / 2)
    d = np.sqrt(nx * nx + ny * ny)
    a = (np.clip(1 - d, 0, 1) ** softness) * alpha * 255
    rgb = np.ones((h, w, 3), dtype=np.uint8) * hx(color).astype(np.uint8)
    rgba = np.dstack([rgb, a.astype(np.uint8)])
    return Image.fromarray(rgba, "RGBA")


def diagonal_sweep(w: int, h: int, position: float, strength: float = 0.55) -> Image.Image:
    x = np.linspace(-0.3, 1.3, w)[None, :]
    y = np.linspace(0, 1, h)[:, None]
    center = position + (y[:, ::-1] - 0.5) * 0.18
    dist = (x - center) / 0.07
    band = np.exp(-(dist**2)) * strength
    band = np.clip(band, 0, 1)
    alpha = (band * 255).astype(np.uint8)
    rgb = np.ones((h, w, 3), dtype=np.uint8) * 255
    return Image.fromarray(np.dstack([rgb, alpha]), "RGBA")


def apply_product_light(product: Image.Image, sweep: Image.Image | None) -> Image.Image:
    if sweep is None:
        return product
    product = product.copy()
    sweep = sweep.resize(product.size, Image.BILINEAR)
    step = Image.alpha_composite(product, sweep)
    step.putalpha(product.getchannel("A"))
    return step


def end_card(
    title: str,
    subtitle: str,
    bg_top: str,
    bg_bottom: str,
    fg: str,
    accent: str,
    progress: float,
) -> Image.Image:
    arr = gradient_bg(
        bg_top,
        bg_bottom,
        light_center=(0.5, 0.4),
        light_strength=0.25,
        vignette=0.4,
        seed=3,
    )
    card = to_image(arr).convert("RGBA")
    draw = ImageDraw.Draw(card)
    font_big = ImageFont.truetype(FONT_DISPLAY, 230)
    font_sub = ImageFont.truetype(FONT_MONO, 26)
    font_small = ImageFont.truetype(FONT_MONO, 20)

    opacity = smoothstep(progress)
    draw.text((120, 150), subtitle.upper(), font=font_sub, fill=accent)
    draw.line((120, 200, 120 + 380 * progress, 200), fill=accent, width=2)
    draw.text((112, 400), title, font=font_big, fill=fg)
    draw.text((120, H - 150), "PRODUCT FILM / 2026", font=font_small, fill=fg)
    draw.text((W - 120, H - 150), "SAMPLE", font=font_small, fill=accent, anchor="ra")

    veil = Image.new("RGBA", (W, H), (0, 0, 0, int((1 - opacity) * 255)))
    card = Image.alpha_composite(card, veil)
    return card.convert("RGB")


def contact_shadow(width: int, height: int, color: str, alpha: float) -> Image.Image:
    return soft_ellipse_layer(width, height, color, alpha, 2.0)


# ---------------------------------------------------------------- AURA
AURA_W, AURA_H = 520, 660


def aura_pedestal() -> Image.Image:
    w, h = 860, 240
    layer = Image.new("RGBA", (w, h), (0, 0, 0, 0))

    top_w, top_h = 700, 120
    side_w, side_h = 700, 95
    left = (w - top_w) // 2
    top_center_y = 86

    side_fill = gradient_fill(side_w, side_h, "#D2C3AB", "#B19D82", side_shade=0.28)
    side = rgba_from(side_fill, rounded_mask(side_w, side_h, 4))
    layer.alpha_composite(side, (left, top_center_y))

    top_fill = gradient_fill(
        top_w,
        top_h,
        "#F3EBDD",
        "#D6C6AE",
        side_shade=0.12,
        highlight_at=-0.45,
        highlight_strength=0.2,
    )
    top = rgba_from(top_fill, ellipse_mask(top_w, top_h))
    layer.alpha_composite(top, (left, top_center_y - top_h // 2))

    draw = ImageDraw.Draw(layer)
    draw.ellipse(
        (left + 4, top_center_y - top_h // 2 + 4, left + top_w - 4, top_center_y + top_h // 2 - 8),
        outline=(255, 250, 240, 120),
        width=2,
    )
    return layer


def aura_product(t: float) -> tuple[Image.Image, Image.Image]:
    w, h = AURA_W, AURA_H
    layer = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    glow = Image.new("RGBA", (w, h), (0, 0, 0, 0))

    body_w, body_h = 400, 560
    body_x = (w - body_w) // 2
    body_top = 60

    mask = rounded_mask(body_w, body_h, 48)
    fill = gradient_fill(
        body_w,
        body_h,
        "#FAF5EC",
        "#C9BAA3",
        side_shade=0.26,
        highlight_at=-0.45,
        highlight_width=0.16,
        highlight_strength=0.22,
    )
    body = rgba_from(fill, mask)

    texture = Image.new("L", (body_w, body_h), 0)
    tdraw = ImageDraw.Draw(texture)
    for x in range(0, body_w, 7):
        tdraw.line((x, 0, x, body_h), fill=10 if (x // 7) % 2 else 5)
    rng = np.random.default_rng(21)
    noise = (rng.normal(0, 5, (body_h, body_w)) + 5).clip(0, 18).astype(np.uint8)
    texture = ImageChops.add(texture, Image.fromarray(noise, "L").filter(ImageFilter.GaussianBlur(1.2)))
    texture = texture.filter(ImageFilter.GaussianBlur(0.7))
    shade = Image.new("RGBA", (body_w, body_h), (58, 43, 28, 255))
    shade.putalpha(texture)
    body = Image.alpha_composite(body, shade)

    left_shadow = Image.new("L", (body_w, body_h), 0)
    ImageDraw.Draw(left_shadow).rectangle((0, 0, 26, body_h), fill=120)
    left_shadow = left_shadow.filter(ImageFilter.GaussianBlur(18))
    left_layer = Image.new("RGBA", (body_w, body_h), (40, 30, 20, 255))
    left_layer.putalpha(left_shadow)
    body = Image.alpha_composite(body, left_layer)

    rim = Image.new("L", (body_w, body_h), 0)
    ImageDraw.Draw(rim).rectangle((body_w - 14, 30, body_w - 2, body_h - 40), fill=150)
    rim = rim.filter(ImageFilter.GaussianBlur(7))
    rim_layer = Image.new("RGBA", (body_w, body_h), (255, 246, 230, 255))
    rim_layer.putalpha(rim)
    body = Image.alpha_composite(body, rim_layer)

    seam = Image.new("RGBA", (body_w, body_h), (0, 0, 0, 0))
    sd = ImageDraw.Draw(seam)
    sd.line((26, 44, body_w - 26, 44), fill=(120, 100, 74, 55), width=1)
    sd.line((26, body_h - 52, body_w - 26, body_h - 52), fill=(120, 100, 74, 40), width=1)
    body = Image.alpha_composite(body, seam)

    logo = ImageDraw.Draw(body)
    font_logo = ImageFont.truetype(FONT_MONO, 15)
    logo.text((body_w // 2, body_h - 34), "AURA", font=font_logo, fill=(118, 102, 82, 210), anchor="mm")
    logo.line((body_w // 2 - 24, body_h - 20, body_w // 2 + 24, body_h - 20), fill=(140, 124, 102, 90), width=1)

    cap_w, cap_h = body_w, 94
    cap_center = (w // 2, body_top + 2)
    cap = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    cap_fill = gradient_fill(
        cap_w,
        cap_h,
        "#FFFDF8",
        "#E4D7C4",
        side_shade=0.1,
        highlight_at=-0.3,
        highlight_strength=0.18,
    )
    cap.alpha_composite(rgba_from(cap_fill, ellipse_mask(cap_w, cap_h)), ((w - cap_w) // 2, cap_center[1] - cap_h // 2))

    cdraw = ImageDraw.Draw(cap)
    for i, ratio in enumerate((0.88, 0.72, 0.56, 0.4, 0.24)):
        rx = (cap_w / 2 - 12) * ratio
        ry = (cap_h / 2 - 6) * ratio
        cdraw.ellipse(
            (cap_center[0] - rx, cap_center[1] - ry, cap_center[0] + rx, cap_center[1] + ry),
            outline=(126, 108, 84, 70 if i < 4 else 95),
            width=1,
        )
    cdraw.ellipse((cap_center[0] - 26, cap_center[1] - 7, cap_center[0] + 26, cap_center[1] + 7), fill=(150, 130, 102, 90))
    cdraw.ellipse((cap_center[0] - 8, cap_center[1] - 3, cap_center[0] + 8, cap_center[1] + 3), fill=(96, 80, 60, 130))

    ring_box = (cap_center[0] - 178, cap_center[1] - 42, cap_center[0] + 178, cap_center[1] + 42)
    pulse = 0.55 + 0.45 * math.sin(t * math.pi * 4)
    ring = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    ImageDraw.Draw(ring).ellipse(ring_box, outline=(255, 150, 70, 245), width=3)
    ring_glow = ring.filter(ImageFilter.GaussianBlur(11))
    ring_glow.putalpha(ring_glow.getchannel("A").point(lambda v: int(v * (0.45 + 0.4 * pulse))))
    glow = Image.alpha_composite(glow, ring_glow)
    cap = Image.alpha_composite(cap, ring)

    layer.alpha_composite(body, (body_x, body_top))
    layer = Image.alpha_composite(layer, cap)
    return glow, layer


def aura_frame(t: float, bg: np.ndarray) -> Image.Image:
    canvas = to_image(bg).convert("RGBA")
    ease = ease_in_out(t)

    halo = soft_ellipse_layer(1000, 780, "#FFF6E6", 0.16, 2.0)
    halo_layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    halo_layer.alpha_composite(halo, (int(W / 2 - halo.width / 2), int(470 - halo.height / 2)))
    canvas = Image.alpha_composite(canvas, halo_layer)

    floor_y = 846
    # 地面暗部
    floor = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    fdraw = ImageDraw.Draw(floor)
    for y in range(760, H):
        alpha = int(26 * smoothstep((y - 760) / 320))
        fdraw.line((0, y, W, y), fill=(60, 44, 28, alpha))
    canvas = Image.alpha_composite(canvas, floor)

    shadow = soft_ellipse_layer(640, 90, "#3E2F1F", 0.4, 2.1)
    shadow_layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    shadow_layer.alpha_composite(shadow, (int(W / 2 - shadow.width / 2), int(848 - shadow.height / 2)))
    canvas = Image.alpha_composite(canvas, shadow_layer)

    contact = contact_shadow(430, 44, "#4A3824", 0.4)
    contact_layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    contact_layer.alpha_composite(contact, (int(W / 2 - contact.width / 2), int(floor_y - 18)))
    canvas = Image.alpha_composite(canvas, contact_layer)

    scale = 1.06 + 0.03 * ease
    bob = math.sin(t * math.tau * 1.2) * 2.5
    glow, product = aura_product(t)

    glow = glow.resize((int(glow.width * scale), int(glow.height * scale)), Image.LANCZOS)
    product = product.resize((int(product.width * scale), int(product.height * scale)), Image.LANCZOS)

    sweep = diagonal_sweep(product.width, product.height, lerp(-0.25, 1.2, ease), 0.45)
    product = apply_product_light(product, sweep)

    bottom_in_layer = 620 * scale
    top = int(floor_y + bob - bottom_in_layer)
    left = int(W / 2 - product.width / 2)

    # 地面倒影（低透明度）
    reflection = product.transpose(Image.FLIP_TOP_BOTTOM).copy()
    fade = Image.new("L", reflection.size, 0)
    fade_draw = ImageDraw.Draw(fade)
    for y in range(reflection.height):
        alpha = int(22 * (1 - y / reflection.height) ** 1.6)
        fade_draw.line((0, y, reflection.width, y), fill=alpha)
    reflection.putalpha(ImageChops.multiply(fade, product.getchannel("A")))
    refl_layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    refl_layer.alpha_composite(reflection, (left, int(floor_y + bob + 2)))
    canvas = Image.alpha_composite(canvas, refl_layer)

    glow_layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    glow_layer.alpha_composite(glow, (left, top))
    canvas = Image.alpha_composite(canvas, glow_layer)

    product_layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    product_layer.alpha_composite(product, (left, top))
    canvas = Image.alpha_composite(canvas, product_layer)

    frame = canvas.convert("RGB")

    if t * DURATION > PRODUCT_SECONDS:
        card_t = (t * DURATION - PRODUCT_SECONDS) / (DURATION - PRODUCT_SECONDS)
        card = end_card("AURA", "AIR / PURIFIER", "#EBE2D3", "#CFC2AD", "#1B1814", "#E86A2C", card_t)
        frame = Image.blend(frame, card, smoothstep(card_t))

    return frame


# ---------------------------------------------------------------- SERUM
SERUM_W, SERUM_H = 460, 680


def serum_product(t: float) -> Image.Image:
    w, h = SERUM_W, SERUM_H
    layer = Image.new("RGBA", (w, h), (0, 0, 0, 0))

    body_w, body_h = 300, 470
    body_x = (w - body_w) // 2
    body_top = 120

    body_mask = rounded_mask(body_w, body_h, 42).point(lambda v: int(v * 0.94))
    body_fill = gradient_fill(
        body_w,
        body_h,
        "#F2F7EE",
        "#BFD0B8",
        side_shade=0.32,
        highlight_at=-0.42,
        highlight_width=0.14,
        highlight_strength=0.24,
    )
    body = rgba_from(body_fill, body_mask)

    # 液体
    liquid_top = 245
    liquid_h = body_h - (liquid_top - body_top) - 14
    liquid_mask = rounded_mask(body_w - 16, liquid_h, 34).point(lambda v: int(v * 0.9))
    liquid_fill = gradient_fill(body_w - 16, liquid_h, "#C3D3AC", "#94AE83", side_shade=0.25)
    liquid = rgba_from(liquid_fill, liquid_mask)
    body.alpha_composite(liquid, (8, liquid_top - body_top))

    # 液面
    meniscus = Image.new("RGBA", (body_w, 36), (0, 0, 0, 0))
    ImageDraw.Draw(meniscus).ellipse((10, 4, body_w - 10, 32), fill=(219, 231, 202, 195))
    body.alpha_composite(meniscus, (0, liquid_top - body_top - 14))

    # 玻璃边缘
    edge = Image.new("RGBA", (body_w, body_h), (0, 0, 0, 0))
    ImageDraw.Draw(edge).rounded_rectangle((1, 1, body_w - 2, body_h - 2), 42, outline=(255, 255, 255, 130), width=2)
    body = Image.alpha_composite(body, edge)

    # 标签
    label_w, label_h = 212, 158
    label = Image.new("RGBA", (label_w, label_h), (0, 0, 0, 0))
    lmask = rounded_mask(label_w, label_h, 3)
    lfill = gradient_fill(label_w, label_h, "#FBF8F0", "#EDE7DA", side_shade=0.06, highlight_at=None)
    label = rgba_from(lfill, lmask)
    ld = ImageDraw.Draw(label)
    ld.text((18, 16), "SERUM", font=ImageFont.truetype(FONT_MONO_BOLD, 15), fill=(34, 40, 32, 230))
    ld.text((18, 34), "01", font=ImageFont.truetype(FONT_DISPLAY, 64), fill=(34, 40, 32, 240))
    ld.line((18, 112, label_w - 18, 112), fill=(90, 100, 80, 90), width=1)
    ld.text((18, 124), "30 ML / CONCEPT", font=ImageFont.truetype(FONT_MONO, 10), fill=(90, 100, 80, 210))
    body.alpha_composite(label, ((body_w - label_w) // 2, 310 - body_top))

    # 瓶盖
    cap_w, cap_h = 148, 168
    cap = Image.new("RGBA", (cap_w, cap_h), (0, 0, 0, 0))
    cap_fill = gradient_fill(cap_w, cap_h, "#4E534A", "#191C17", side_shade=0.35, highlight_at=-0.5, highlight_strength=0.18)
    cap = rgba_from(cap_fill, rounded_mask(cap_w, cap_h, 22))
    cd = ImageDraw.Draw(cap)
    for y in range(18, cap_h - 18, 11):
        cd.line((10, y, cap_w - 10, y), fill=(255, 255, 255, 14), width=1)
    cd.rounded_rectangle((8, 8, cap_w - 8, cap_h - 12), 16, outline=(255, 255, 255, 30), width=1)
    cd.rectangle((24, 0, 34, 12), fill=(210, 220, 200, 110))

    # 瓶身高光
    gloss = Image.new("RGBA", (body_w, body_h), (0, 0, 0, 0))
    gd = ImageDraw.Draw(gloss)
    gd.rounded_rectangle((34, 20, 56, body_h - 24), 10, fill=(255, 255, 255, 110))
    gd.rounded_rectangle((body_w - 42, 40, body_w - 34, body_h - 40), 4, fill=(255, 255, 255, 55))
    gloss = gloss.filter(ImageFilter.GaussianBlur(5))
    body = Image.alpha_composite(body, gloss)

    layer.alpha_composite(body, (body_x, body_top))
    layer.alpha_composite(cap, ((w - cap_w) // 2, 10))
    return layer


def serum_frame(t: float, bg: np.ndarray) -> Image.Image:
    canvas = to_image(bg).convert("RGBA")
    ease = ease_in_out(t)
    floor_y = 852

    halo = soft_ellipse_layer(900, 720, "#F4F8EA", 0.18, 2.0)
    halo_layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    halo_layer.alpha_composite(halo, (int(W / 2 - halo.width / 2), int(470 - halo.height / 2)))
    canvas = Image.alpha_composite(canvas, halo_layer)

    floor = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    fdraw = ImageDraw.Draw(floor)
    for y in range(760, H):
        alpha = int(24 * smoothstep((y - 760) / 320))
        fdraw.line((0, y, W, y), fill=(35, 48, 30, alpha))
    canvas = Image.alpha_composite(canvas, floor)

    caustic = soft_ellipse_layer(560, 90, "#C7D8B2", 0.3, 1.8)
    caustic_layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    caustic_layer.alpha_composite(caustic, (int(W / 2 - caustic.width / 2), int(860 - caustic.height / 2)))
    canvas = Image.alpha_composite(canvas, caustic_layer)

    shadow = soft_ellipse_layer(560, 76, "#30402A", 0.34, 2.1)
    shadow_layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    shadow_layer.alpha_composite(shadow, (int(W / 2 - shadow.width / 2), int(852 - shadow.height / 2)))
    canvas = Image.alpha_composite(canvas, shadow_layer)

    scale = 1.04 + 0.035 * ease
    bob = math.sin(t * math.tau * 1.15) * 2.5
    product = serum_product(t)
    product = product.resize((int(product.width * scale), int(product.height * scale)), Image.LANCZOS)
    sweep = diagonal_sweep(product.width, product.height, lerp(-0.2, 1.2, ease), 0.4)
    product = apply_product_light(product, sweep)

    bottom_in_layer = 590 * scale
    top = int(floor_y + bob - bottom_in_layer)
    left = int(W / 2 - product.width / 2)

    reflection = product.transpose(Image.FLIP_TOP_BOTTOM).copy()
    fade = Image.new("L", reflection.size, 0)
    fade_draw = ImageDraw.Draw(fade)
    for y in range(reflection.height):
        alpha = int(20 * (1 - y / reflection.height) ** 1.7)
        fade_draw.line((0, y, reflection.width, y), fill=alpha)
    reflection.putalpha(ImageChops.multiply(fade, product.getchannel("A")))
    refl_layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    refl_layer.alpha_composite(reflection, (left, int(floor_y + bob + 2)))
    canvas = Image.alpha_composite(canvas, refl_layer)

    product_layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    product_layer.alpha_composite(product, (left, top))
    canvas = Image.alpha_composite(canvas, product_layer)

    frame = canvas.convert("RGB")
    if t * DURATION > PRODUCT_SECONDS:
        card_t = (t * DURATION - PRODUCT_SECONDS) / (DURATION - PRODUCT_SECONDS)
        card = end_card("SERUM 01", "SKIN / ESSENCE", "#DDE4D3", "#BCC9B1", "#1A2118", "#D86A3A", card_t)
        frame = Image.blend(frame, card, smoothstep(card_t))
    return frame


# ---------------------------------------------------------------- ARC
ARC_W, ARC_H = 620, 540


def arc_product(t: float) -> Image.Image:
    w, h = ARC_W, ARC_H
    layer = Image.new("RGBA", (w, h), (0, 0, 0, 0))

    body_w, body_h = 470, 380
    body_x = (w - body_w) // 2
    body_top = 70
    lid_h = 168

    # 机身
    body_fill = gradient_fill(
        body_w,
        body_h,
        "#F2F3F2",
        "#B4BABE",
        side_shade=0.26,
        highlight_at=-0.48,
        highlight_width=0.18,
        highlight_strength=0.22,
    )
    body = rgba_from(body_fill, rounded_mask(body_w, body_h, 62))
    bd = ImageDraw.Draw(body)
    bd.text((body_w // 2, body_h - 56), "ARC", font=ImageFont.truetype(FONT_MONO, 14), fill=(90, 98, 104, 180), anchor="mm")
    bd.line((body_w // 2 - 22, body_h - 40, body_w // 2 + 22, body_h - 40), fill=(110, 120, 126, 80), width=1)

    # 内部暗槽
    cavity = Image.new("RGBA", (body_w - 28, 64), (32, 38, 42, 235))
    cavity.putalpha(rounded_mask(body_w - 28, 64, 24))
    body.alpha_composite(cavity, (14, 28))

    # 盖子
    lid_w, lid_h2 = body_w - 4, lid_h
    lid = Image.new("RGBA", (lid_w, lid_h2), (0, 0, 0, 0))
    lid_fill = gradient_fill(
        lid_w,
        lid_h2,
        "#F8F9F8",
        "#C4CACE",
        side_shade=0.2,
        highlight_at=-0.4,
        highlight_width=0.2,
        highlight_strength=0.28,
    )
    lid = rgba_from(lid_fill, rounded_mask(lid_w, lid_h2, 58))
    ld = ImageDraw.Draw(lid)
    ld.rounded_rectangle((10, 8, lid_w - 10, lid_h2 - 6), 50, outline=(255, 255, 255, 75), width=1)
    ld.rectangle((22, lid_h2 - 7, lid_w - 22, lid_h2 - 2), fill=(64, 72, 78, 95))
    ld.text((lid_w // 2, 54), "ARC", font=ImageFont.truetype(FONT_MONO, 12), fill=(104, 114, 120, 105), anchor="mm")

    # LED
    led = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    ldraw = ImageDraw.Draw(led)
    led_center = (w // 2, body_top + body_h - 26)
    pulse = 0.5 + 0.5 * math.sin(t * math.pi * 5)
    ldraw.ellipse((led_center[0] - 7, led_center[1] - 7, led_center[0] + 7, led_center[1] + 7), fill=(120, 245, 210, 245))
    glow = led.filter(ImageFilter.GaussianBlur(9))
    glow.putalpha(glow.getchannel("A").point(lambda v: int(v * (0.5 + 0.4 * pulse))))
    led = Image.alpha_composite(glow, led)

    # 开合
    open_amount = smoothstep(t) * 34
    rotation = -3.0 * smoothstep(t)
    lid_rot = lid.rotate(rotation, resample=Image.BICUBIC, expand=True, center=(lid_w / 2, lid_h2))
    layer.alpha_composite(body, (body_x, body_top))
    lid_x = (w - lid_rot.width) // 2
    lid_y = body_top - 14 - int(open_amount)
    layer.alpha_composite(lid_rot, (lid_x, lid_y))
    layer = Image.alpha_composite(layer, led)
    return layer


def arc_frame(t: float, bg: np.ndarray) -> Image.Image:
    canvas = to_image(bg).convert("RGBA")
    ease = ease_in_out(t)
    floor_y = 840

    halo = soft_ellipse_layer(1000, 700, "#F2F8F7", 0.16, 2.0)
    halo_layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    halo_layer.alpha_composite(halo, (int(W / 2 - halo.width / 2), int(460 - halo.height / 2)))
    canvas = Image.alpha_composite(canvas, halo_layer)

    floor = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    fdraw = ImageDraw.Draw(floor)
    for y in range(750, H):
        alpha = int(26 * smoothstep((y - 750) / 330))
        fdraw.line((0, y, W, y), fill=(32, 42, 46, alpha))
    canvas = Image.alpha_composite(canvas, floor)

    shadow = soft_ellipse_layer(720, 96, "#2E3A3E", 0.36, 2.1)
    shadow_layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    shadow_layer.alpha_composite(shadow, (int(W / 2 - shadow.width / 2), int(842 - shadow.height / 2)))
    canvas = Image.alpha_composite(canvas, shadow_layer)

    scale = 1.06 + 0.035 * ease
    bob = math.sin(t * math.tau * 1.1) * 2.5
    product = arc_product(t)
    product = product.resize((int(product.width * scale), int(product.height * scale)), Image.LANCZOS)
    sweep = diagonal_sweep(product.width, product.height, lerp(-0.2, 1.2, ease), 0.5)
    product = apply_product_light(product, sweep)

    bottom_in_layer = 450 * scale
    top = int(floor_y + bob - bottom_in_layer)
    left = int(W / 2 - product.width / 2)

    reflection = product.transpose(Image.FLIP_TOP_BOTTOM).copy()
    fade = Image.new("L", reflection.size, 0)
    fade_draw = ImageDraw.Draw(fade)
    for y in range(reflection.height):
        alpha = int(24 * (1 - y / reflection.height) ** 1.7)
        fade_draw.line((0, y, reflection.width, y), fill=alpha)
    reflection.putalpha(ImageChops.multiply(fade, product.getchannel("A")))
    refl_layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    refl_layer.alpha_composite(reflection, (left, int(floor_y + bob + 2)))
    canvas = Image.alpha_composite(canvas, refl_layer)

    product_layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    product_layer.alpha_composite(product, (left, top))
    canvas = Image.alpha_composite(canvas, product_layer)

    frame = canvas.convert("RGB")
    if t * DURATION > PRODUCT_SECONDS:
        card_t = (t * DURATION - PRODUCT_SECONDS) / (DURATION - PRODUCT_SECONDS)
        card = end_card("ARC", "AUDIO / CASE", "#DCE2E4", "#B6BFC3", "#14191B", "#3FD3B2", card_t)
        frame = Image.blend(frame, card, smoothstep(card_t))
    return frame


# ---------------------------------------------------------------- TYPE
FONT_BLACK = "C:/Windows/Fonts/ariblk.ttf"
TYPE_PAPER = "#F2EFE7"
TYPE_INK = "#10100F"
TYPE_ACCENT = "#FF4D12"


def type_panel_base(invert: bool) -> tuple[Image.Image, tuple[int, int, int]]:
    bg_color = TYPE_INK if invert else TYPE_PAPER
    fg_color = TYPE_PAPER if invert else TYPE_INK
    panel = Image.new("RGBA", (W, H), (*ImageColor.getrgb(bg_color), 255))
    draw = ImageDraw.Draw(panel)
    grid = (255, 255, 255, 8) if invert else (16, 16, 15, 8)
    for x in range(120, W, 240):
        draw.line((x, 0, x, H), fill=grid, width=1)
    return panel, fg_color


def type_frame(t: float, bg: np.ndarray) -> Image.Image:
    del bg  # TYPE 场景有自己的版式背景
    seconds = t * DURATION
    accent = TYPE_ACCENT
    font_mono = ImageFont.truetype(FONT_MONO, 20)
    font_mono_small = ImageFont.truetype(FONT_MONO, 15)

    if seconds < 1.9:
        # Beat 1: TYPE 从右侧进入
        panel, fg = type_panel_base(False)
        draw = ImageDraw.Draw(panel)
        p = smoothstep(seconds / 1.3)
        x = int(lerp(280, 120, p))
        font = ImageFont.truetype(FONT_BLACK, 430)
        draw.rectangle((x - 36, 292, x - 36 + 120, 300 + 430), fill=accent)
        draw.text((x, 260), "TYPE", font=font, fill=fg)
        draw.text((120, 120), "DYNAMIC TYPE STUDY / 2025", font=font_mono, fill=fg)
        draw.text((W - 120, 120), "01 — 04", font=font_mono, fill=fg, anchor="ra")
        draw.line((120, H - 150, W - 120, H - 150), fill=fg, width=1)
        draw.text((120, H - 126), "KINETIC TYPOGRAPHY / MOTION", font=font_mono_small, fill=fg)
        draw.text((W - 120, H - 126), "120 BPM", font=font_mono_small, fill=fg, anchor="ra")
        return panel.convert("RGB")

    if seconds < 3.6:
        # Beat 2: 反白，MOTION 向左滑动
        panel, fg = type_panel_base(True)
        draw = ImageDraw.Draw(panel)
        p = smoothstep((seconds - 1.9) / 1.3)
        x = int(lerp(200, -520, p))
        font = ImageFont.truetype(FONT_BLACK, 330)
        draw.text((x, 350), "MOTION", font=font, fill=fg)
        draw.ellipse((W - 300, 150, W - 180, 270), fill=accent)
        draw.text((120, 120), "02 / RHYTHM", font=font_mono, fill=fg)
        draw.text((W - 120, 120), "MOTION", font=font_mono, fill=fg, anchor="ra")
        draw.line((120, H - 150, W - 120, H - 150), fill=fg, width=1)
        draw.text((120, H - 126), "CUT ON THE BEAT", font=font_mono_small, fill=fg)
        return panel.convert("RGB")

    if seconds < 5.3:
        # Beat 3: 描边 26 + 橙色色块
        panel, fg = type_panel_base(False)
        draw = ImageDraw.Draw(panel)
        p = smoothstep((seconds - 3.6) / 1.1)
        size = int(lerp(620, 720, p))
        font = ImageFont.truetype(FONT_BLACK, size)
        draw.rectangle((W - 470, 250, W - 470 + 320, 250 + 320), fill=accent)
        draw.text((W / 2 - 40, 470), "26", font=font, fill=TYPE_PAPER, anchor="mm", stroke_width=2, stroke_fill=fg)
        draw.text((120, 120), "03 / SCALE", font=font_mono, fill=fg)
        draw.text((W - 120, 120), "OUTLINE", font=font_mono, fill=fg, anchor="ra")
        draw.line((120, H - 150, W - 120, H - 150), fill=fg, width=1)
        draw.text((120, H - 126), "NEGATIVE SPACE / TYPE AS OBJECT", font=font_mono_small, fill=fg)
        return panel.convert("RGB")

    # Beat 4: 黑底收束
    panel, fg = type_panel_base(True)
    draw = ImageDraw.Draw(panel)
    p = smoothstep((seconds - 5.3) / 1.0)
    draw.text((120, 330), "TYPE", font=ImageFont.truetype(FONT_BLACK, 300), fill=fg)
    draw.text((120, 690), "/ 26", font=ImageFont.truetype(FONT_DISPLAY, 120), fill=accent)
    draw.text((120, 120), "04 / LOCKUP", font=font_mono, fill=fg)
    draw.line((120, H - 150, W - 120, H - 150), fill=fg, width=1)
    draw.text((120, H - 126), "TYPE STUDY / 2025", font=font_mono_small, fill=fg)
    draw.text((W - 120, H - 126), "SAMPLE", font=font_mono_small, fill=accent, anchor="ra")
    return panel.convert("RGB")



SCENES = {
    "aura": {
        "bg": lambda: gradient_bg(
            "#EFE8DC",
            "#CFC3B0",
            light_center=(0.48, 0.16),
            light_color="#FFF7E8",
            light_strength=0.55,
            vignette=0.38,
            seed=11,
        ),
        "frame": aura_frame,
        "title": "AURA",
        "subtitle": "AIR / PURIFIER",
        "cover_t": 0.34,
    },
}


# ---------------------------------------------------------------- registry
SCENES = {
    "aura": {
        "bg": lambda: gradient_bg(
            "#EFE8DC",
            "#CFC3B0",
            light_center=(0.48, 0.16),
            light_color="#FFF7E8",
            light_strength=0.55,
            vignette=0.38,
            seed=11,
        ),
        "frame": aura_frame,
        "cover_t": 0.34,
    },
    "serum": {
        "bg": lambda: gradient_bg(
            "#E9EDE4",
            "#C6D0BE",
            light_center=(0.46, 0.15),
            light_color="#F7FBEF",
            light_strength=0.5,
            vignette=0.4,
            seed=19,
        ),
        "frame": serum_frame,
        "cover_t": 0.32,
    },
    "arc": {
        "bg": lambda: gradient_bg(
            "#E8EBEC",
            "#B9C2C5",
            light_center=(0.48, 0.16),
            light_color="#F5FBFC",
            light_strength=0.5,
            vignette=0.4,
            seed=23,
        ),
        "frame": arc_frame,
        "cover_t": 0.52,
    },
    "type-26": {
        "bg": lambda: gradient_bg(
            "#F2EFE7",
            "#E7E2D6",
            light_center=(0.5, 0.2),
            light_strength=0.2,
            seed=29,
        ),
        "frame": type_frame,
        "cover_t": 0.7,
    },
}


def make_process_images(name: str) -> None:
    """从封面派生 previz / lookdev 过程图，正式素材可替换。"""
    out_dir = MEDIA / "projects" / name
    source = Image.open(out_dir / "cover.jpg").convert("RGB")

    # 白模 / previz 板：把画面压成低调的构图参考，叠加画幅与相机标记
    ghost = source.filter(ImageFilter.GaussianBlur(9))
    ghost = Image.blend(Image.new("RGB", (W, H), "#EDE9DE"), ghost, 0.48)
    previz = ghost
    previz_draw = ImageDraw.Draw(previz)
    frame = (92, 72, W - 92, H - 72)
    previz_draw.rectangle(frame, outline=(86, 92, 82, 160), width=1)
    for x in (W // 3, W * 2 // 3):
        previz_draw.line((x, frame[1], x, frame[3]), fill=(86, 96, 84, 70), width=1)
    for y in (H // 3, H * 2 // 3):
        previz_draw.line((frame[0], y, frame[2], y), fill=(86, 96, 84, 70), width=1)
    cx, cy = W // 2, H // 2
    previz_draw.line((cx - 26, cy, cx + 26, cy), fill=(86, 92, 82, 180), width=1)
    previz_draw.line((cx, cy - 26, cx, cy + 26), fill=(86, 92, 82, 180), width=1)
    for x, y, dx, dy in (
        (frame[0], frame[1], 1, 1),
        (frame[2], frame[1], -1, 1),
        (frame[0], frame[3], 1, -1),
        (frame[2], frame[3], -1, -1),
    ):
        previz_draw.line((x, y, x + 34 * dx, y), fill=(70, 74, 66, 200), width=2)
        previz_draw.line((x, y, x, y + 34 * dy), fill=(70, 74, 66, 200), width=2)
    slate_font = ImageFont.truetype(FONT_MONO, 16)
    previz_draw.rectangle((92, 96, 366, 134), fill=(235, 231, 221, 235), outline=(70, 74, 66, 100), width=1)
    previz_draw.text((106, 108), "PREVIZ / CAM A", font=slate_font, fill=(60, 64, 56, 230))
    previz_draw.text((W - 300, 108), "16:9 / 35MM", font=slate_font, fill=(70, 74, 66, 210))
    previz_draw.text((106, H - 118), "FRAME 01", font=slate_font, fill=(70, 74, 66, 210))
    previz_draw.text((W - 230, H - 118), "SAMPLE", font=slate_font, fill=(190, 80, 40, 220))
    save_jpeg(previz, out_dir / "process-01.jpg")

    # Clay / 材质测试：去色 + 柔光
    gray = ImageOps.autocontrast(source.convert("L")).filter(ImageFilter.GaussianBlur(1.2))
    clay = ImageOps.colorize(gray, black="#3D3A32", white="#DAD4C6")
    clay = Image.blend(clay, source.convert("RGB"), 0.1)
    draw = ImageDraw.Draw(clay)
    draw.rectangle((70, 70, 292, 112), fill=(218, 212, 198, 235), outline=(70, 66, 56, 90), width=1)
    draw.text((84, 82), "CLAY / LOOKDEV", font=ImageFont.truetype(FONT_MONO, 16), fill=(70, 66, 56, 220))
    save_jpeg(clay, out_dir / "process-02.jpg")

    save_jpeg(source, out_dir / "process-03.jpg")
    print(f"  process images -> {out_dir}")


def make_showreel() -> None:
    """用四个项目各 6 秒合成 24 秒 showreel。"""
    clips = [MEDIA / "projects" / name / "film.mp4" for name in ("aura", "serum", "arc", "type-26")]
    for clip in clips:
        if not clip.exists():
            raise FileNotFoundError(f"缺少片段：{clip}")
    out = MEDIA / "showreel.mp4"
    filters = []
    for i in range(4):
        filters.append(f"[{i}:v]trim=start=0:end=6,setpts=PTS-STARTPTS[v{i}]")
    filters.append("[v0][v1][v2][v3]concat=n=4:v=1:a=0[cat]")
    filters.append("[cat]fade=t=in:st=0:d=0.4,fade=t=out:st=23.4:d=0.6[out]")
    cmd = ["ffmpeg", "-y", "-loglevel", "error"]
    for clip in clips:
        cmd += ["-i", str(clip)]
    cmd += [
        "-filter_complex", ";".join(filters),
        "-map", "[out]",
        "-t", "24",
        "-an",
        "-c:v", "libx264",
        "-preset", "medium",
        "-crf", "21",
        "-pix_fmt", "yuv420p",
        "-movflags", "+faststart",
        str(out),
    ]
    subprocess.run(cmd, check=True)
    subprocess.run(
        ["ffmpeg", "-y", "-loglevel", "error", "-ss", "2.5", "-i", str(out), "-frames:v", "1", "-q:v", "2", str(MEDIA / "showreel-poster.jpg")],
        check=True,
    )
    print(f"showreel -> {out}")


def make_og() -> None:
    """微信 / 社交分享缩略图 1200×630。"""
    source = Image.open(MEDIA / "showreel-poster.jpg").convert("RGB")
    ratio = 1200 / 630
    src_ratio = source.width / source.height
    if src_ratio > ratio:
        new_w = int(source.height * ratio)
        left = (source.width - new_w) // 2
        source = source.crop((left, 0, left + new_w, source.height))
    else:
        new_h = int(source.width / ratio)
        top = (source.height - new_h) // 2
        source = source.crop((0, top, source.width, top + new_h))
    source = source.resize((1200, 630), Image.LANCZOS).convert("RGBA")

    shade = Image.new("RGBA", (1200, 630), (0, 0, 0, 0))
    sd = ImageDraw.Draw(shade)
    for y in range(630):
        alpha = int(150 * max(0, (y - 250) / 380) ** 1.4)
        sd.line((0, y, 1200, y), fill=(10, 10, 9, alpha))
    card = Image.alpha_composite(source, shade)
    draw = ImageDraw.Draw(card)
    draw.text((56, 516), "MOTION", font=ImageFont.truetype(FONT_DISPLAY, 64), fill=(246, 245, 241, 245))
    draw.text(
        (58, 590),
        "PRODUCT MOTION / 产品动画作品集",
        font=ImageFont.truetype("C:/Windows/Fonts/NotoSansSC-VF.ttf", 22),
        fill=(246, 245, 241, 190),
    )
    draw.text((1146, 526), "2026", font=ImageFont.truetype(FONT_MONO, 18), fill=(255, 77, 18, 230), anchor="ra")
    save_jpeg(card.convert("RGB"), MEDIA / "og.jpg", quality=88)
    print(f"og -> {MEDIA / 'og.jpg'}")


def save_jpeg(image: Image.Image, path: Path, quality: int = 88) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    image.convert("RGB").save(path, "JPEG", quality=quality, optimize=True, progressive=True)


def render_preview(name: str) -> None:
    cfg = SCENES[name]
    bg = cfg["bg"]()
    frame = cfg["frame"](cfg["cover_t"], bg)
    out = ROOT / "screenshots" / f"asset-{name}.jpg"
    save_jpeg(frame, out)
    print(f"preview -> {out}")


def crop_zoom(frame: Image.Image, zoom: float, center: tuple[float, float]) -> Image.Image:
    if zoom <= 1:
        return frame
    cw, ch = int(W / zoom), int(H / zoom)
    cx, cy = int(W * center[0]), int(H * center[1])
    left = max(0, min(W - cw, cx - cw // 2))
    top = max(0, min(H - ch, cy - ch // 2))
    return frame.crop((left, top, left + cw, top + ch)).resize((W, H), Image.LANCZOS)


KEYFRAME_CROPS: dict[str, dict[int, tuple[float, tuple[float, float]]]] = {
    "aura": {1: (2.0, (0.5, 0.34)), 2: (1.6, (0.5, 0.66))},
    "serum": {1: (1.9, (0.5, 0.62)), 2: (1.6, (0.5, 0.36))},
    "arc": {1: (1.8, (0.5, 0.46)), 2: (1.5, (0.5, 0.68))},
}


def write_stills(name: str, cfg: dict, bg: np.ndarray) -> None:
    out_dir = MEDIA / "projects" / name
    out_dir.mkdir(parents=True, exist_ok=True)
    crops = KEYFRAME_CROPS.get(name, {})
    shots = [
        ("cover", cfg["cover_t"]),
        ("key-01", 0.08),
        ("key-02", 0.3),
        ("key-03", 0.55),
        ("key-04", 0.78),
    ]
    for i, (label, tt) in enumerate(shots):
        frame = cfg["frame"](tt, bg)
        if i in crops:
            frame = crop_zoom(frame, crops[i][0], crops[i][1])
        save_jpeg(frame, out_dir / f"{label}.jpg")
    make_process_images(name)


def render_stills(name: str) -> None:
    cfg = SCENES[name]
    write_stills(name, cfg, cfg["bg"]())
    print(f"stills -> {MEDIA / 'projects' / name}")


def render_video(name: str) -> None:
    cfg = SCENES[name]
    bg = cfg["bg"]()
    out_dir = MEDIA / "projects" / name
    out_dir.mkdir(parents=True, exist_ok=True)
    out_file = out_dir / "film.mp4"
    frames = int(DURATION * FPS)

    cmd = [
        "ffmpeg", "-y", "-loglevel", "error",
        "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS),
        "-i", "-", "-an", "-c:v", "libx264", "-preset", "medium", "-crf", "21",
        "-pix_fmt", "yuv420p", "-movflags", "+faststart", str(out_file),
    ]
    proc = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    assert proc.stdin is not None
    for i in range(frames):
        t = i / frames
        frame = cfg["frame"](t, bg)
        proc.stdin.write(frame.tobytes())
        if i % 30 == 0:
            print(f"  {name}: {i}/{frames}", flush=True)
    proc.stdin.close()
    proc.wait()
    if proc.returncode != 0:
        raise RuntimeError(f"ffmpeg failed: {proc.returncode}")

    write_stills(name, cfg, bg)
    print(f"video -> {out_file}")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--preview", choices=SCENES.keys())
    parser.add_argument("--project", choices=SCENES.keys())
    parser.add_argument("--all", action="store_true")
    parser.add_argument("--stills", action="store_true")
    parser.add_argument("--showreel", action="store_true")
    parser.add_argument("--og", action="store_true")
    args = parser.parse_args()

    if args.preview:
        render_preview(args.preview)
    elif args.project:
        render_video(args.project)
    elif args.stills:
        for name in SCENES:
            render_stills(name)
    elif args.showreel:
        make_showreel()
    elif args.og:
        make_og()
    elif args.all:
        for name in SCENES:
            render_video(name)
        make_showreel()
    else:
        parser.print_help()


if __name__ == "__main__":
    main()

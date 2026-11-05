#!/usr/bin/env python3
"""Build runtime assets for 不烧心小馆 from the art pack.

Usage:
  python3 tools/build_assets.py <art_pack_dir> <lovart_2k_dir> [out_dir]

- Removes baked checkerboard / flat backgrounds from sprite sheets (flood fill from borders).
- Downscales 2K atlases to 256px cells (WeChat package budget).
- Writes assets/runtime/** plus assets/runtime/manifest.json (id, path, cols, rows, cell, source, placeholder flag).

Only Pillow is required. Never edits the source art pack.
"""
import json
import os
import sys

from PIL import Image, ImageChops, ImageDraw

KEY = (255, 0, 255)


def flood_remove(img, thresh=96, step=48):
    """Flood-fill from border seeds over near-background colours, return RGBA."""
    rgb = img.convert("RGB")
    w, h = rgb.size
    seeds = [(x, 0) for x in range(0, w, step)] + [(x, h - 1) for x in range(0, w, step)]
    seeds += [(0, y) for y in range(0, h, step)] + [(w - 1, y) for y in range(0, h, step)]
    for s in seeds:
        p = rgb.getpixel(s)
        if p == KEY:
            continue
        r, g, b = p
        if max(r, g, b) - min(r, g, b) > 24 or min(r, g, b) < 150:
            continue  # seed is not background-ish; skip
        ImageDraw.floodfill(rgb, s, KEY, thresh=thresh)
    diff = ImageChops.difference(rgb, Image.new("RGB", rgb.size, KEY)).convert("L")
    alpha = diff.point(lambda v: 0 if v == 0 else 255)
    out = rgb.copy()
    out.putalpha(alpha)
    # de-fringe: pixels touching transparency that are very light grey become semi-transparent
    px = out.load()
    al = alpha.load()
    for y in range(h):
        for x in range(w):
            if al[x, y] == 0:
                continue
            r, g, b, a = px[x, y]
            if min(r, g, b) >= 200 and max(r, g, b) - min(r, g, b) <= 18:
                near = False
                for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    nx, ny = x + dx, y + dy
                    if 0 <= nx < w and 0 <= ny < h and al[nx, ny] == 0:
                        near = True
                        break
                if near:
                    px[x, y] = (r, g, b, 110)
    return out


def residue(rgba):
    """fraction of opaque pixels that still look like checkerboard (light, unsaturated)."""
    px = rgba.getdata()
    n = 0
    bad = 0
    for r, g, b, a in px:
        if a == 0:
            continue
        n += 1
        if min(r, g, b) >= 225 and max(r, g, b) - min(r, g, b) <= 12:
            bad += 1
    return round(bad / max(1, n), 3)


def save(img, path, quality=None):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    if path.endswith(".jpg"):
        img.convert("RGB").save(path, quality=quality or 86, optimize=True)
    else:
        img.save(path, optimize=True)
    return os.path.getsize(path)


def cover(img, size):
    w, h = img.size
    tw, th = size
    r = max(tw / w, th / h)
    im = img.resize((round(w * r), round(h * r)), Image.LANCZOS)
    x = (im.width - tw) // 2
    y = (im.height - th) // 2
    return im.crop((x, y, x + tw, y + th))


def main():
    pack, lovart, out = sys.argv[1], sys.argv[2], (sys.argv[3] if len(sys.argv) > 3 else "assets/runtime")
    prod = os.path.join(pack, "10_生产可用")
    manifest = {"version": 1, "cell": 256, "entries": []}

    def add(aid, path, **kw):
        e = {"id": aid, "path": path, "bytes": os.path.getsize(os.path.join(out, path))}
        e.update(kw)
        manifest["entries"].append(e)

    # --- backgrounds (opaque -> jpg) ---
    bg = [
        ("bg_room_main", os.path.join(lovart, "An4c3rAnYIJ5zGvX.png"), "Lovart 2K scene_main"),
        ("bg_room_rain", os.path.join(lovart, "jJBdX20nztFSCPpr.png"), "Lovart scene_rain"),
        ("bg_room_night", os.path.join(lovart, "QFjeDQgtda4392cc.png"), "Lovart scene_night"),
        ("bg_ext_morning", os.path.join(prod, "背景/orig_scene_exterior_morning_1280x720.png"), "原始视觉方案 c01"),
        ("bg_ext_rain", os.path.join(prod, "背景/orig_scene_exterior_rain_1280x720.png"), "原始视觉方案 c08"),
        ("bg_ext_dusk", os.path.join(prod, "背景/orig_scene_exterior_dusk_1280x720.png"), "原始视觉方案 c09"),
        ("bg_kitchen_closeup", os.path.join(prod, "背景/orig_scene_kitchen_closeup_1024.png"), "原始视觉方案 c07"),
        ("bg_ending_poster", os.path.join(prod, "过场/orig_ending_poster_vertical.png"), "原始视觉方案 c05"),
    ]
    for aid, src, origin in bg:
        im = Image.open(src)
        if aid.startswith("bg_room") or aid.startswith("bg_ext"):
            im = cover(im, (1280, 720))
        elif aid == "bg_kitchen_closeup":
            im = im.resize((768, 768), Image.LANCZOS)
        elif aid == "bg_ending_poster":
            im = im.resize((544, 960), Image.LANCZOS)
        p = f"bg/{aid}.jpg"
        save(im, os.path.join(out, p))
        add(aid, p, w=im.width, h=im.height, source=origin, alpha=False)

    # --- atlases with checkerboard (Lovart 2K) -> 256px cells ---
    atlases = [
        ("atlas_zhou", "2uJnVUoPPoJF7LKy.png", 4, 4, "Lovart zhou_actions 4x4"),
        ("atlas_regulars", "RnvBZFAypv1kg8Xt.png", 4, 2, "Lovart regulars_portraits 4x2"),
        ("atlas_food", "1SlAcwgufP4pfkwe.png", 5, 4, "Lovart food_atlas 5x4"),
        ("atlas_equipment", "cer81c395o9R6TZB.png", 3, 3, "Lovart equipment_atlas 3x3"),
        ("atlas_vfx", "KWOmaoXcW016CQ6b.png", 4, 4, "Lovart vfx_atlas 4x4"),
        ("atlas_ui", "0h4o5oM908DElvWo.png", 4, 4, "Lovart ui_atlas 4x4"),
    ]
    for aid, fn, cols, rows, origin in atlases:
        im = Image.open(os.path.join(lovart, fn)).convert("RGB")
        # the 4x2 regulars sheet is a 2048 square with two rows of portraits in the upper area;
        # detect content rows by cropping to cols*256 x rows*256 after scaling to 1024 wide
        im = im.resize((cols * 256, round(im.height * cols * 256 / im.width)), Image.LANCZOS)
        rgba = flood_remove(im, thresh=96 if aid != "atlas_ui" else 60)
        cell_h = 256
        if rgba.height != rows * 256:
            # sheet is not square-celled: crop to vertical content bounds and derive row height
            bbox = rgba.getbbox()
            top = max(0, bbox[1] - 8)
            bottom = min(rgba.height, bbox[3] + 8)
            rgba = rgba.crop((0, top, rgba.width, bottom))
            cell_h = rgba.height // rows
            rgba = rgba.crop((0, 0, rgba.width, cell_h * rows))
        p = f"atlas/{aid}.png"
        save(rgba, os.path.join(out, p))
        add(aid, p, w=rgba.width, h=rgba.height, cols=cols, rows=rows, cellW=256, cellH=cell_h, source=origin, alpha=True)
        print("  residue", aid, residue(rgba))

    # --- legacy single sprites (checkerboard) -> 512px alpha ---
    legacy = [
        ("spr_xiaosong", "角色/orig_c13_xiaosong_nurse_sprite.png"),
        ("spr_laoge", "角色/orig_c14_laoge_suit_sprite.png"),
        ("spr_ali", "角色/orig_c15_ali_rider_sprite.png"),
        ("spr_gong", "角色/orig_c16_gongshifu_driver_sprite.png"),
        ("spr_xiaoman", "角色/orig_c17_xiaoman_seamstress_sprite.png"),
        ("spr_xiaozheng", "角色/orig_c18_xiaozheng_student_sprite.png"),
        ("spr_laoqin", "角色/orig_c19_laoqin_vendor_sprite.png"),
        ("spr_grandpa", "角色/orig_grandpa_grandson.png"),
        ("spr_zhou_legacy", "角色/orig_zhou_sprite_sheet.png"),
        ("icons_resource", "UI/orig_resource_icons_3x3.png"),
    ]
    for aid, rel in legacy:
        im = Image.open(os.path.join(prod, rel)).convert("RGB").resize((512, 512), Image.LANCZOS)
        rgba = flood_remove(im, thresh=96, step=32)
        p = f"sprites/{aid}.png"
        save(rgba, os.path.join(out, p))
        extra = {"cols": 5, "rows": 4} if aid == "spr_zhou_legacy" else ({"cols": 3, "rows": 3} if aid == "icons_resource" else {})
        add(aid, p, w=512, h=512, source=f"原始视觉方案 {rel}", alpha=True, **extra)
        print("  residue", aid, residue(rgba))

    # --- already-RGBA sheets ---
    im = Image.open(os.path.join(prod, "角色/orig_zhou_portraits_5.png")).convert("RGBA")
    cw = im.width // 5
    sheet = Image.new("RGBA", (5 * 256, 256), (0, 0, 0, 0))
    for i in range(5):
        cell = im.crop((i * cw, 0, (i + 1) * cw, im.height))
        bb = cell.getbbox()
        if bb:
            cell = cell.crop(bb)
        side = max(cell.width, cell.height)
        sq = Image.new("RGBA", (side, side), (0, 0, 0, 0))
        sq.alpha_composite(cell, ((side - cell.width) // 2, (side - cell.height) // 2))
        sheet.alpha_composite(sq.resize((256, 256), Image.LANCZOS), (i * 256, 0))
    p = "sprites/zhou_portraits.png"
    save(sheet, os.path.join(out, p))
    add("zhou_portraits", p, w=sheet.width, h=sheet.height, cols=5, rows=1, cellW=256, cellH=256, source="原始视觉方案 c12 五表情", alpha=True)

    im = Image.open(os.path.join(prod, "食物/orig_food_icons_6.png")).convert("RGBA")
    im = im.resize((1086, round(im.height * 1086 / im.width)), Image.LANCZOS)
    p = "sprites/food_icons_6.png"
    save(im, os.path.join(out, p))
    add("food_icons_6", p, w=im.width, h=im.height, cols=6, rows=1, source="原始视觉方案 c22", alpha=True)

    total = sum(e["bytes"] for e in manifest["entries"])
    manifest["totalBytes"] = total
    with open(os.path.join(out, "manifest.json"), "w", encoding="utf-8") as f:
        json.dump(manifest, f, ensure_ascii=False, indent=1)
    print(f"wrote {len(manifest['entries'])} assets, {total/1024/1024:.2f} MB -> {out}")
    for e in manifest["entries"]:
        print(f"  {e['id']:<22} {e['bytes']/1024:7.0f} KB  {e['path']}")


if __name__ == "__main__":
    main()

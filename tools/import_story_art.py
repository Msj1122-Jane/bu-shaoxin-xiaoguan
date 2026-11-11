#!/usr/bin/env python3
"""把「游戏视觉/新增」的剧情美术导入 assets/runtime/story/，并把条目写进 manifest（group=story / ui2）。

用法: python3 tools/import_story_art.py <新增目录>
原图不改。立绘、账页、Q 版去白底/棋盘底；场景转 JPG；按钮缩小。
"""
import json, os, sys
from PIL import Image, ImageDraw, ImageChops

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'assets/runtime/story')
KEY = (255, 0, 255)
EXPR = ['calm', 'happy', 'worried', 'angry', 'sad', 'extra']
# 立绘单图的表情名 → 统一 key
EXPR_CN = {'平静': 'calm', '开心': 'happy', '为难': 'worried', '生气': 'angry', '难过': 'sad',
           '微笑': 'happy', '沉重': 'sad', '热络': 'happy', '不耐烦': 'angry', '阴沉': 'worried', '慌乱': 'sad'}


def unbg(img, thresh=None, sides=('t', 'l', 'r', 'b')):
    """从边缘做 BFS：低饱和、偏亮的像素（白底 / 假透明棋盘格）视为背景。"""
    import numpy as np
    from collections import deque
    a = np.asarray(img.convert('RGB')).astype(np.int16); h, w, _ = a.shape
    mx, mn = a.max(2), a.min(2)
    bgm = ((mx - mn) <= 24) & (mn >= 168)
    seen = np.zeros((h, w), bool); q = deque()
    def push(y, x):
        if bgm[y, x] and not seen[y, x]: seen[y, x] = True; q.append((y, x))
    if 't' in sides: [push(0, x) for x in range(w)]
    if 'b' in sides: [push(h - 1, x) for x in range(w)]
    if 'l' in sides: [push(y, 0) for y in range(h)]
    if 'r' in sides: [push(y, w - 1) for y in range(h)]
    while q:
        y, x = q.popleft()
        if y > 0: push(y - 1, x)
        if y < h - 1: push(y + 1, x)
        if x > 0: push(y, x - 1)
        if x < w - 1: push(y, x + 1)
    alpha = np.where(seen, 0, 255).astype(np.uint8)
    out = img.convert('RGB').copy(); out.putalpha(Image.fromarray(alpha))
    return out


def crop_alpha(im, pad=2):
    bb = im.getchannel('A').getbbox()
    if not bb: return im
    x0, y0, x1, y1 = bb
    return im.crop((max(0, x0 - pad), max(0, y0 - pad), min(im.width, x1 + pad), min(im.height, y1 + pad)))


entries = []


def add(aid, rel, im, group, use, fmt='png', q=82, colors=96):
    p = os.path.join(OUT, rel); os.makedirs(os.path.dirname(p), exist_ok=True)
    if fmt == 'jpg':
        im.convert('RGB').save(p, 'JPEG', quality=q, optimize=True, progressive=True)
    else:
        if im.mode == 'RGBA' and colors:
            im = im.quantize(colors=colors, method=Image.Quantize.FASTOCTREE, dither=Image.Dither.NONE)
        im.save(p, optimize=True)
        im = Image.open(p).convert('RGBA')
    e = {'id': aid, 'path': 'story/' + rel, 'bytes': os.path.getsize(p), 'w': im.width, 'h': im.height,
         'source': 'Lovart 新增（用户 2026-11-11）', 'alpha': fmt == 'png', 'group': group, 'use': use,
         'license': '待核对（H12/H14）：Lovart 生成，项目内测使用', 'placeholder': False}
    if fmt == 'png' and im.mode == 'RGBA':
        bb = im.getchannel('A').getbbox()
        if bb: e['trim'] = list(bb)
    entries.append(e)


def main(src):
    S = lambda f: Image.open(os.path.join(src, f))
    names = sorted(f for f in os.listdir(src) if not f.startswith('.') and '(1)' not in f)
    # 立绘：单张表情
    for f in names:
        if f[:1] == 'C' and f[1:3].isdigit() and '矩阵' not in f and 'Q版' not in f:
            cid, ex = f[:3], f[4:-4]
            im = crop_alpha(unbg(S(f)))
            im = im.resize((round(im.width * 0.6), round(im.height * 0.6)), Image.NEAREST)
            add('pt_%s_%s' % (cid.lower(), EXPR_CN.get(ex, ex)), 'portrait/%s_%s.png' % (cid.lower(), EXPR_CN.get(ex, ex)), im, 'story', '立绘 %s %s' % (cid, ex))
    # 立绘：表情矩阵 3×2
    for f in names:
        if '矩阵' in f:
            cid = f[:3].lower(); im = S(f); cw, ch = im.width // 3, im.height // 2
            for i in range(6):
                cell = im.crop(((i % 3) * cw, (i // 3) * ch, (i % 3 + 1) * cw, (i // 3 + 1) * ch))
                c = crop_alpha(unbg(cell)); c = c.resize((round(c.width * 0.6), round(c.height * 0.6)), Image.NEAREST)
                aid = 'pt_%s_%s' % (cid, EXPR[i])
                if any(e['id'] == aid for e in entries): continue
                add(aid, 'portrait/%s_%s.png' % (cid, EXPR[i]), c, 'story', '立绘 %s 矩阵#%d' % (cid, i))
    # Q 版全身
    for f in names:
        if 'Q版全身' in f:
            cid = f[:3].lower(); im = crop_alpha(unbg(S(f), sides=('t', 'l', 'r')))
            add('q_%s' % cid, 'chibi/%s.png' % cid, im, 'story', 'Q版全身 %s' % cid)
    # 账页
    for i in range(1, 8):
        f = [n for n in names if n.startswith('S02_账页%d' % i)][0]
        add('ledger_page_%d' % i, 'ledger/page_%d.png' % i, crop_alpha(unbg(S(f))), 'story', '账页 %d' % i)
    # 场景
    scenes = {'S01_序章_开门': 'card_0', 'S01_第一章_第一锅油': 'card_1', 'S01_第二章_对街': 'card_2', 'S01_第三章_风声': 'card_3',
              'S01_第四章_旧账': 'card_4', 'S01_终章_月底那天': 'card_5', 'S02_旧账本': 'ledger_book', 'S03_凌晨早市': 'scene_market',
              'S04_庙会早高峰': 'scene_fair', 'S05_干净版': 'scene_check_clean', 'S05_隐患版': 'scene_check_hazard', 'S06_对质': 'scene_face',
              'S07_赵爷爷家': 'scene_zhao_home'}
    for k, aid in scenes.items():
        add(aid, 'scene/%s.jpg' % aid, S(k + '.png'), 'story', k, 'jpg')
    for f in names:
        if f.startswith('M0'):
            aid = 'mem_' + f[1:3]
            add(aid, 'memory/%s.jpg' % aid, S(f), 'story', '回忆 ' + f[:-4], 'jpg', 80)
        if f.startswith('V') and f.endswith('_key.png'):
            aid = 'end_' + f[1:3]
            add(aid, 'ending/%s.jpg' % aid, S(f), 'story', '结局关键帧 ' + f[:3], 'jpg', 80)
    # 封面 / 加载
    add('cover_bg', 'ui/cover_bg.jpg', S('游戏封面页_纯背景底图.png'), 'boot', '封面底图', 'jpg', 84)
    add('loading_bg', 'ui/loading_bg.jpg', S('游戏加载页_纯背景底图.png'), 'pre', '加载页底图', 'jpg', 80)
    btn = {'Start Game Menu Button': 'btn_start', 'Continue Game Menu Button': 'btn_continue', 'Old Records Menu Button': 'btn_records',
           'Game Settings Menu Button': 'btn_settings'}
    for k, aid in btn.items():
        im = crop_alpha(S(k + '.png').convert('RGBA')); im = im.resize((360, round(im.height * 360 / im.width)), Image.LANCZOS)
        add(aid, 'ui/%s.png' % aid, im, 'boot', '首页按钮')
    ico = {'Calendar Corner Icon Button': 'ico_calendar', 'Gear Corner Icon Button': 'ico_gear', 'Info Corner Icon Button': 'ico_info',
           'Treasure Chest Corner Icon Button': 'ico_chest'}
    for k, aid in ico.items():
        im = crop_alpha(S(k + '.png').convert('RGBA')); im = im.resize((112, round(im.height * 112 / im.width)), Image.LANCZOS)
        add(aid, 'ui/%s.png' % aid, im, 'boot' if aid in ('ico_calendar', 'ico_chest') else 'unused', '角标按钮')
    im = crop_alpha(S('Title Logo Plaque.png').convert('RGBA')); im = im.resize((560, round(im.height * 560 / im.width)), Image.LANCZOS)
    add('title_plaque', 'ui/title_plaque.png', im, 'boot', '标题牌匾')
    # 加载页小贴士空白牌（UI 套图左下）
    kit = S('游戏加载页_UI组件套图.png')
    add('loading_kit', 'ui/loading_kit.png', crop_alpha(unbg(kit)), 'unused', '加载页组件套图（裁切用）')
    # 线索与证物图标集（3×3 / 3×4，后续副本用）
    for f, aid in (('传家物与核心线索图鉴图标集.png', 'atlas_clues'), ('对质证物与后厨自查道具图标集.png', 'atlas_evidence')):
        im = unbg(S(f)).resize((512, 512), Image.LANCZOS)
        add(aid, 'ui/%s.png' % aid, im, 'story', f[:-4])

    mp = os.path.join(ROOT, 'assets/runtime/manifest.json')
    m = json.load(open(mp))
    ids = {e['id'] for e in entries}
    m['entries'] = [e for e in m['entries'] if e['id'] not in ids] + entries
    m['totalBytes'] = sum(e.get('bytes', 0) for e in m['entries'] if e.get('group') != 'unused')
    json.dump(m, open(mp, 'w'), ensure_ascii=False)
    open(os.path.join(ROOT, 'assets/runtime/manifest.js'), 'w').write('module.exports = ' + json.dumps(m, ensure_ascii=False) + ';\n')
    tot = sum(e['bytes'] for e in entries)
    print('imported', len(entries), 'entries,', round(tot / 1e6, 2), 'MB')


if __name__ == '__main__':
    main(sys.argv[1])

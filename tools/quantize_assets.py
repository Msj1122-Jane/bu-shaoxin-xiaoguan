# 生成微信包用的调色板 PNG（256 色，无抖动，保留透明）：python3 tools/quantize_assets.py
# 输出 assets/runtime_wx/，tools/build_wechat.js 优先使用这里的文件。原图不改。
import os, json
from PIL import Image
root = os.path.join(os.path.dirname(__file__), '..')
src = os.path.join(root, 'assets/runtime'); dst = os.path.join(root, 'assets/runtime_wx')
m = json.load(open(os.path.join(src, 'manifest.json'), encoding='utf-8'))
for e in m['entries']:
    if e.get('group') == 'unused': continue
    p = os.path.join(src, e['path']); o = os.path.join(dst, e['path']); os.makedirs(os.path.dirname(o), exist_ok=True)
    if p.endswith('.png'):
        Image.open(p).convert('RGBA').quantize(colors=256, method=Image.FASTOCTREE, dither=Image.Dither.NONE).save(o, 'PNG', optimize=True)
    else:
        Image.open(p).convert('RGB').save(o, 'JPEG', quality=82, optimize=True, progressive=False)
    print(e['id'], os.path.getsize(p) // 1024, '->', os.path.getsize(o) // 1024, 'KB')

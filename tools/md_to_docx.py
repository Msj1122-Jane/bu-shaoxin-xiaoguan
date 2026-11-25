# 把 tools/export_text.js 生成的 Markdown 转成 Word：python3 tools/md_to_docx.py 输入.md 输出.docx
# 只认导出脚本用到的写法：# 标题、- 列表（两格缩进为二级）、> 引用（可多层）、**粗体**、*斜体*、`代码`。
import re, sys
from docx import Document
from docx.shared import Pt, RGBColor, Cm
from docx.oxml.ns import qn

FONT = 'Microsoft YaHei'
src, dst = sys.argv[1], sys.argv[2]
doc = Document()
sec = doc.sections[0]
sec.left_margin = sec.right_margin = Cm(2.2); sec.top_margin = sec.bottom_margin = Cm(2)

def set_font(style_or_run, size=None, color=None, bold=None):
    f = style_or_run.font
    f.name = FONT
    rpr = style_or_run.element.get_or_add_rPr() if hasattr(style_or_run.element, 'get_or_add_rPr') else style_or_run.element.rPr
    rpr.rFonts.set(qn('w:eastAsia'), FONT)
    if size: f.size = Pt(size)
    if color: f.color.rgb = RGBColor.from_string(color)
    if bold is not None: f.bold = bold

for name, size, color in [('Normal', 10.5, '33241A'), ('Heading 1', 20, '2F5850'), ('Heading 2', 16, 'B8432F'), ('Heading 3', 13, '3B2A1A'), ('Heading 4', 11.5, '2F6F66'), ('Heading 5', 11, '6E4224'), ('List Bullet', 10.5, '33241A'), ('List Bullet 2', 10.5, '33241A')]:
    st = doc.styles[name]
    st.font.name = FONT
    st.element.get_or_add_rPr().get_or_add_rFonts().set(qn('w:eastAsia'), FONT)
    st.font.size = Pt(size); st.font.color.rgb = RGBColor.from_string(color)
doc.styles['Normal'].paragraph_format.space_after = Pt(3)
doc.styles['Normal'].paragraph_format.line_spacing = 1.25

TOK = re.compile(r'(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)')
def add_runs(p, text, italic_all=False, color=None):
    for part in TOK.split(text):
        if not part: continue
        if part.startswith('**') and part.endswith('**'): r = p.add_run(part[2:-2]); r.bold = True
        elif part.startswith('`') and part.endswith('`'): r = p.add_run(part[1:-1]); r.font.size = Pt(8.5); r.font.color.rgb = RGBColor(0x9A, 0x8A, 0x70)
        elif part.startswith('*') and part.endswith('*') and len(part) > 2: r = p.add_run(part[1:-1]); r.italic = True; r.font.color.rgb = RGBColor(0x6E, 0x5A, 0x40)
        else: r = p.add_run(part)
        if italic_all: r.italic = True
        if color and not r.font.color.rgb: r.font.color.rgb = RGBColor.from_string(color)
        r.font.name = FONT; r._element.get_or_add_rPr().get_or_add_rFonts().set(qn('w:eastAsia'), FONT)

for raw in open(src, encoding='utf-8').read().split('\n'):
    line = raw.rstrip()
    if not line.strip(): continue
    depth = 0
    while line.startswith('> '): depth += 1; line = line[2:]
    m = re.match(r'^(#{1,5}) (.*)$', line)
    if m and depth == 0:
        doc.add_heading('', level=len(m.group(1)))
        add_runs(doc.paragraphs[-1], m.group(2)); continue
    lm = re.match(r'^(\s*)- (.*)$', line)
    if lm:
        p = doc.add_paragraph(style='List Bullet 2' if len(lm.group(1)) >= 2 else 'List Bullet')
        add_runs(p, lm.group(2))
    else:
        p = doc.add_paragraph(); add_runs(p, line)
    if depth:
        p.paragraph_format.left_indent = Cm(0.7 * depth)
doc.save(dst)
print(dst)

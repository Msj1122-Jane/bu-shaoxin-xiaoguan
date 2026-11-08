# 8-bit 芯片配乐（用户选定风格，D050）：两路方波 + 三角波低音 + 噪声鼓，红白机音色，循环无缝。
# 运行：python3 tools/compose_chip.py → assets/runtime/audio/bgm_{dawn,rush,night,tense}.mp3（同步 runtime_wx）
import sys, os, wave, subprocess, shutil
import numpy as np
sys.path.insert(0, os.path.dirname(__file__))
from compose_demos import square, tri, nes_noise, nf
from compose_music import Track, SR, env_adsr

def kick(amp=0.35):  # 三角波下滑当底鼓
    n = int(0.16 * SR); t = np.arange(n) / SR; f = 45 + 160 * np.exp(-t * 35)
    ph = np.cumsum(f) / SR % 1
    return (4 * np.abs(ph - 0.5) - 1) * np.exp(-t * 14) * amp

def snare(amp=0.12): return nes_noise(amp, 0.09)
def hat(amp=0.05): return nes_noise(amp, 0.025)

def seq(T, notes, start, inst, transpose=0, gate=0.85, **kw):
    """notes: [(midi, beats)]，0=休止"""
    b = start
    for m, d in notes:
        if m: T.addv(inst(nf(m + transpose), d * T.beat * gate, **kw), b)
        b += d
    return b

def echo(x, beat, fb=0.35, mix=0.3):
    d = int(beat * 0.75 * SR); y = x.copy()
    for k in range(1, 4): y[d * k:] += x[:-d * k] * (fb ** k) * mix * 3
    return y

def arp(T, bars, chords, step=0.5, amp=0.05, duty=0.125, octv=12):
    for bar in range(bars):
        ch = chords[bar % len(chords)]
        for k in range(int(4 / step)): T.addv(square(nf(ch[k % len(ch)] + octv), step * T.beat * 0.7, amp, duty), bar * 4 + k * step)

def bass(T, bars, roots, pattern=(0, 1, 2, 3), amp=0.22, octave_jump=False):
    for bar in range(bars):
        r = roots[bar % len(roots)]
        for i, b in enumerate(pattern): T.addv(tri(nf(r - 12 + (12 if octave_jump and i % 2 else 0)), T.beat * 0.45, amp), bar * 4 + b)

def drums(T, bars, kicks=(0, 2), snares=(1, 3), hats=True, fill_every=4):
    for bar in range(bars):
        for k in kicks: T.addv(kick(0.3), bar * 4 + k)
        for s in snares: T.addv(snare(0.11), bar * 4 + s)
        if hats:
            for h in range(8): T.addv(hat(0.035 if h % 2 else 0.05), bar * 4 + h * 0.5)
        if fill_every and bar % fill_every == fill_every - 1:
            for f in range(4): T.addv(snare(0.06 + f * 0.02), bar * 4 + 3 + f * 0.25)

# ── 清晨：C 大调 I–vi–IV–V
def dawn():
    T = Track(112, 16)
    C = [[60, 64, 67, 72], [57, 60, 64, 69], [53, 57, 60, 65], [55, 59, 62, 67]]
    arp(T, 16, C, 0.5, 0.045, 0.125)
    bass(T, 16, [48, 45, 41, 43], (0, 1, 2, 3), 0.2)
    drums(T, 16, (0, 2.5), (1, 3), True, 8)
    A = [(76, 1), (79, 0.5), (76, 0.5), (74, 1), (72, 1), (74, 1.5), (76, 0.5), (79, 2),
         (81, 1), (79, 0.5), (76, 0.5), (74, 1), (76, 1), (72, 3), (0, 1),
         (76, 1), (79, 0.5), (81, 0.5), (84, 1), (81, 1), (79, 1.5), (76, 0.5), (74, 2),
         (72, 1), (74, 0.5), (76, 0.5), (79, 1), (76, 1), (72, 4)]
    B = [(72, 0.5), (74, 0.5), (76, 1), (79, 1), (81, 1), (79, 2), (76, 2),
         (77, 1), (76, 0.5), (74, 0.5), (72, 1), (74, 1), (76, 4),
         (72, 0.5), (74, 0.5), (76, 1), (79, 1), (84, 1), (83, 1.5), (81, 0.5), (79, 2),
         (77, 1), (76, 1), (74, 1), (71, 1), (72, 4)]
    b = seq(T, A, 0, square, 0, 0.9, amp=0.09, duty=0.5)
    seq(T, B, b, square, 0, 0.9, amp=0.09, duty=0.25)
    return T.buf

# ── 早高峰：G 大调，八度跳低音 + 四拍底鼓，有冲劲
def rush():
    T = Track(144, 16)
    C = [[67, 71, 74], [64, 67, 71], [60, 64, 67], [62, 66, 69]]
    arp(T, 16, C, 0.25, 0.04, 0.125)
    bass(T, 16, [43, 40, 36, 38], (0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5), 0.18, True)
    drums(T, 16, (0, 1, 2, 3), (1, 3), True, 4)
    A = [(79, 0.5), (79, 0.5), (81, 0.5), (83, 0.5), (86, 1), (83, 1), (81, 0.5), (79, 0.5), (76, 1), (74, 2),
         (76, 0.5), (79, 0.5), (81, 1), (79, 0.5), (76, 0.5), (74, 1), (72, 0.5), (74, 0.5), (76, 1), (79, 2),
         (79, 0.5), (79, 0.5), (81, 0.5), (83, 0.5), (86, 1), (88, 1), (86, 0.5), (83, 0.5), (81, 1), (79, 2),
         (81, 0.5), (83, 0.5), (81, 0.5), (79, 0.5), (76, 1), (74, 1), (79, 4)]
    b = seq(T, A, 0, square, 0, 0.8, amp=0.085, duty=0.5)
    seq(T, A, b, square, -12, 0.8, amp=0.07, duty=0.25)
    seq(T, A, b, square, 0, 0.6, amp=0.05, duty=0.125)  # 二声部叠一层，副歌更饱满
    return T.buf

# ── 打烊：F 大调，慢分解和弦 + 回声旋律
def night():
    T = Track(88, 16)
    C = [[53, 57, 60, 64], [50, 53, 57, 60], [46, 50, 53, 57], [48, 52, 55, 58]]
    arp(T, 16, C, 0.5, 0.04, 0.25)
    bass(T, 16, [41, 38, 34, 36], (0, 2), 0.2)
    for bar in range(16): T.addv(hat(0.03), bar * 4 + 1); T.addv(hat(0.03), bar * 4 + 3)
    M = Track(88, 16)
    A = [(72, 1.5), (69, 0.5), (67, 1), (65, 1), (67, 2), (0, 2), (69, 1), (70, 1), (72, 1), (74, 1), (72, 4),
         (77, 1.5), (76, 0.5), (74, 1), (72, 1), (70, 2), (69, 2), (67, 1), (65, 1), (67, 1), (69, 1), (65, 4)]
    b = seq(M, A, 0, square, 0, 0.85, amp=0.08, duty=0.5)
    seq(M, A, b, tri, 12, 0.9, amp=0.12)
    return T.buf + echo(M.buf, M.beat)

# ── 心事：D 小调，低音固定音型 + 稀疏方波
def tense():
    T = Track(100, 8)
    for bar in range(8):
        root = [38, 38, 34, 36][bar % 4]
        for k, off in enumerate([0, 0, 7, 0, 8, 0, 7, 5]): T.addv(tri(nf(root + off), T.beat * 0.4, 0.22), bar * 4 + k * 0.5)
        T.addv(kick(0.28), bar * 4); T.addv(kick(0.2), bar * 4 + 2.5)
        if bar % 2: T.addv(snare(0.08), bar * 4 + 3.5)
    A = [(74, 2), (72, 1), (69, 1), (70, 3), (0, 1), (69, 1), (67, 1), (65, 1), (64, 1), (62, 4),
         (65, 1), (67, 1), (69, 2), (72, 1.5), (70, 0.5), (69, 2), (65, 2), (64, 2), (62, 4)]
    seq(T, A, 0, square, 0, 0.9, amp=0.07, duty=0.25)
    arp(T, 8, [[62, 65, 69], [62, 65, 69], [58, 62, 65], [60, 64, 67]], 1, 0.03, 0.125, 12)
    return T.buf

def write(name, x):
    x = x - np.mean(x); x = x / (np.sqrt(np.mean(x ** 2)) + 1e-9) * 0.16; x = np.tanh(x * 1.5) / 1.5
    k = int(0.003 * SR); x[:k] *= np.linspace(0, 1, k); x[-k:] *= np.linspace(1, 0, k)
    x = x / np.max(np.abs(x)) * 0.85
    os.makedirs('assets/runtime/audio', exist_ok=True); os.makedirs('assets/runtime_wx/audio', exist_ok=True)
    w = '/tmp/claude-0/' + name + '.wav'
    with wave.open(w, 'wb') as f: f.setnchannels(1); f.setsampwidth(2); f.setframerate(SR); f.writeframes((x * 32767).astype(np.int16).tobytes())
    out = 'assets/runtime/audio/' + name + '.mp3'
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', w, '-c:a', 'libmp3lame', '-b:a', '64k', out], check=True)
    shutil.copy(out, 'assets/runtime_wx/audio/' + name + '.mp3')
    seg = SR // 2; rms = [np.sqrt(np.mean(x[i:i + seg] ** 2)) for i in range(0, len(x) - seg, seg)]
    print(name, round(len(x) / SR, 1), 's', os.path.getsize(out) // 1024, 'KB', 'rms min/max %.2f/%.2f' % (min(rms), max(rms)), 'seam %.3f' % abs(x[-1] - x[0]))

if __name__ == '__main__':
    os.makedirs('/tmp/claude-0', exist_ok=True)
    for n, fn in [('bgm_dawn', dawn), ('bgm_rush', rush), ('bgm_night', night), ('bgm_tense', tense)]: write(n, fn())

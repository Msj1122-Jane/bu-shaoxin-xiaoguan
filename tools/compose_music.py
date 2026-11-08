# 代码作曲：江南早点铺风格配乐（五声音阶 · 古筝拨弦 · 笛子 · 笙垫底 · 木鱼梆子），离线渲染成可循环的 OGG。
# 运行：python3 tools/compose_music.py  → assets/runtime/audio/*.ogg（同步复制到 runtime_wx）
import numpy as np, subprocess, os, shutil, wave
SR = 32000
rng = np.random.default_rng(7)
ROOT = 293.66  # D4
PENTA = {1: 0, 2: 2, 3: 4, 5: 7, 6: 9}  # 宫商角徵羽

def hz(deg, octv=0):
    return ROOT * 2 ** ((PENTA[deg] + 12 * octv) / 12)

def env_adsr(n, a, d, s, r):
    e = np.ones(n) * s
    na, nd, nr = int(a * SR), int(d * SR), int(r * SR)
    na = max(1, min(na, n)); e[:na] = np.linspace(0, 1, na)
    if nd > 0 and na + nd < n: e[na:na + nd] = np.linspace(1, s, nd)
    if nr > 0: e[-nr:] *= np.linspace(1, 0, nr)
    return e

def pluck(f, dur, bright=0.5, bend=0.0, amp=0.5):
    """古筝/琵琶：Karplus-Strong + 可选滑音（下滑 bend 半音，先高后回落）。"""
    n = int(dur * SR)
    out = np.zeros(n)
    p = max(2, int(SR / f))
    buf = rng.uniform(-1, 1, p)
    # 拨片亮度：低通初始噪声
    for _ in range(int((1 - bright) * 3)): buf = 0.5 * (buf + np.roll(buf, 1))
    idx = 0
    damp = 0.996 if f < 400 else 0.993
    for i in range(n):
        out[i] = buf[idx]
        nxt = (idx + 1) % p
        buf[idx] = damp * 0.5 * (buf[idx] + buf[nxt])
        idx = nxt
    if bend:
        # 滑音：重采样实现音高从 +bend 半音滑到原音
        t = np.arange(n) / SR
        ratio = 2 ** (bend * np.exp(-t * 9) / 12)
        pos = np.cumsum(ratio); pos = pos[pos < n - 1]
        out = np.interp(pos, np.arange(n), out); out = np.pad(out, (0, n - len(out)))
    out *= env_adsr(n, 0.002, 0.05, 1, 0.08) * amp
    return out

def flute(f, dur, amp=0.25, vib=5.4):
    n = int(dur * SR); t = np.arange(n) / SR
    v = 1 + 0.006 * np.sin(2 * np.pi * vib * t) * np.clip(t / 0.35, 0, 1)
    ph = 2 * np.pi * np.cumsum(f * v) / SR
    tone = np.sin(ph) + 0.18 * np.sin(2 * ph) + 0.05 * np.sin(3 * ph)
    breath = rng.normal(0, 1, n); breath = np.convolve(breath, np.ones(6) / 6, 'same') * 0.06
    e = env_adsr(n, 0.07, 0.1, 0.85, min(0.15, dur * 0.4))
    return (tone + breath) * e * amp

def pad(freqs, dur, amp=0.08):
    n = int(dur * SR); t = np.arange(n) / SR; out = np.zeros(n)
    for f in freqs:
        for det in (-0.004, 0.004):
            out += np.sin(2 * np.pi * f * (1 + det) * t) + 0.3 * np.sin(2 * np.pi * 2 * f * (1 + det) * t)
    out = np.convolve(out, np.ones(20) / 20, 'same')
    return out * env_adsr(n, 0.6, 0.2, 0.9, 0.6) * amp / max(1, len(freqs))

def woodblock(amp=0.3, f=1150):
    n = int(0.12 * SR); t = np.arange(n) / SR
    return np.sin(2 * np.pi * f * t) * np.exp(-t * 55) * amp + rng.normal(0, 1, n) * np.exp(-t * 300) * amp * 0.3

def muyu(amp=0.35):
    return woodblock(amp, 620)

def drum(amp=0.4):
    n = int(0.25 * SR); t = np.arange(n) / SR
    f = 110 * np.exp(-t * 8) + 55
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 14) * amp

def reverb(x, secs=1.1, mix=0.22):
    n = int(secs * SR); t = np.arange(n) / SR
    ir = rng.normal(0, 1, n) * np.exp(-t * 4.5); ir[0] = 0
    ir /= np.sqrt(np.sum(ir ** 2))
    wet = np.fft.irfft(np.fft.rfft(x, len(x) + n) * np.fft.rfft(ir, len(x) + n))[:len(x) + n]
    # 循环曲目：把尾音折回开头，接缝无缝
    tail = wet[len(x):]; wet = wet[:len(x)]; wet[:len(tail)] += tail
    return x * (1 - mix) + wet * mix

class Track:
    def __init__(self, bpm, bars, beats=4):
        self.beat = 60 / bpm; self.n = int(bars * beats * self.beat * SR); self.buf = np.zeros(self.n)
    def add(self, sig, at_beat):
        i = int(at_beat * self.beat * SR)
        for k in range(0, len(sig)):
            j = (i + k) % self.n  # 环绕：保证循环
            self.buf[j] += sig[k]
    def addv(self, sig, at_beat):
        i = int(at_beat * self.beat * SR) % self.n
        end = i + len(sig)
        if end <= self.n: self.buf[i:end] += sig
        else:
            first = self.n - i; self.buf[i:] += sig[:first]; self.buf[:end - self.n] += sig[first:]

def mel(track, notes, start, inst='flute', octv=1, amp=None):
    """notes: [(deg, beats, [octave_offset])]，deg=0 为休止。"""
    b = start
    for nt in notes:
        deg, dur = nt[0], nt[1]; oo = nt[2] if len(nt) > 2 else 0
        if deg:
            f = hz(deg, octv + oo)
            if inst == 'flute': track.addv(flute(f, dur * track.beat * 0.98, amp or 0.22), b)
            else: track.addv(pluck(f, max(0.6, dur * track.beat * 1.6), bright=0.7, bend=(1 if dur >= 2 else 0), amp=amp or 0.45), b)
        b += dur
    return b

def master(x, cutoff=3800):
    # 温润：频域柔和低通（4 阶滚降），去掉拨弦噪声和梆子的刺耳高频
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR)
    X *= 1 / np.sqrt(1 + (f / cutoff) ** 8)
    X *= 1 + 0.25 * np.exp(-((f - 220) / 160) ** 2)  # 低中频略暖
    y = np.fft.irfft(X, len(x))
    # 响度统一到 RMS≈0.17，再用 tanh 软限幅，避免打击乐峰值压低整体音量
    y = y / (np.sqrt(np.mean(y ** 2)) + 1e-9) * 0.17
    y = np.tanh(y * 1.6) / 1.6
    k = int(0.003 * SR); y[:k] *= np.linspace(0, 1, k); y[-k:] *= np.linspace(1, 0, k)  # 循环接缝无爆音
    return y

def write(name, x):
    x = master(x)
    x = x / (np.max(np.abs(x)) + 1e-9) * 0.85
    os.makedirs('assets/runtime/audio', exist_ok=True)
    wav = '/tmp/claude-0/' + name + '.wav'
    with wave.open(wav, 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((x * 32767).astype(np.int16).tobytes())
    out = 'assets/runtime/audio/' + name + '.ogg'
    out = None
    # 微信也读 mp3 更稳：同时出 mp3
    out2 = 'assets/runtime/audio/' + name + '.mp3'
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', wav, '-c:a', 'libmp3lame', '-b:a', '56k', out2], check=True)
    print(name, round(len(x) / SR, 1), 's', os.path.getsize(out2) // 1024, 'KB mp3')

# ── 1. 清晨（标题/晨备）：72bpm，16 小节。古筝分解和弦 + 笛子主旋律，像天刚亮的老街。
def dawn():
    T = Track(72, 16)
    arps = [[(1, -1), (5, -1), (1, 0), (3, 0)], [(6, -2), (3, -1), (6, -1), (1, 0)], [(5, -2), (2, -1), (5, -1), (6, -1)], [(1, -1), (5, -1), (2, 0), (3, 0)]]
    for bar in range(16):
        a = arps[bar % 4]
        for i in range(8):
            d, o = a[i % 4]; T.addv(pluck(hz(d, o), 1.6, bright=0.5, amp=0.26 if i % 2 else 0.34), bar * 4 + i * 0.5)
        T.addv(pad([hz(a[0][0], a[0][1]), hz(5, -1)], 4 * T.beat), bar * 4)
    A = [(3, 1), (5, 1), (6, 1.5), (5, 0.5), (3, 2), (2, 1), (3, 1), (5, 2), (3, 1), (2, 1), (1, 3), (0, 1),
         (2, 1), (3, 1), (5, 1.5), (6, 0.5), (1, 2, 1), (6, 1), (5, 1), (3, 2), (5, 1), (3, 1), (2, 3), (0, 1)]
    B = [(6, 1), (1, 1, 1), (2, 1.5, 1), (1, 0.5, 1), (6, 2), (5, 1), (6, 1), (3, 2), (5, 1), (6, 1), (5, 3), (0, 1),
         (3, 1), (5, 1), (6, 1), (5, 0.5), (3, 0.5), (2, 2), (3, 1), (2, 1), (1, 4), (0, 4)]
    b = mel(T, A, 0, 'flute', 1); mel(T, B, b, 'flute', 1)
    for bar in range(0, 16, 2): T.addv(woodblock(0.08), bar * 4 + 3.5)
    return reverb(T.buf, 1.6, 0.3)

# ── 2. 早高峰（营业）：108bpm，16 小节。古筝八分音符跑动 + 梆子 + 木鱼 + 笛子，热闹但不吵。
def rush():
    T = Track(108, 16)
    pat = [(1, -1), (5, -1), (1, 0), (5, -1), (3, 0), (5, -1), (1, 0), (5, -1)]
    roots = [(1, -1), (6, -2), (5, -2), (1, -1)]
    for bar in range(16):
        r = roots[(bar // 2) % 4]
        for i, (d, o) in enumerate(pat):
            dd, oo = (r[0], r[1] + 1) if i == 0 else (d, o)
            T.addv(pluck(hz(dd, oo), 0.7, bright=0.75, amp=0.3 if i % 2 == 0 else 0.2), bar * 4 + i * 0.5)
        T.addv(pluck(hz(r[0], r[1] - 1), 1.4, bright=0.4, amp=0.42), bar * 4)  # 低音（琵琶）
        for k in range(4): T.addv(woodblock(0.14 if k % 2 else 0.2), bar * 4 + k)
        T.addv(muyu(0.16), bar * 4 + 1.5); T.addv(muyu(0.12), bar * 4 + 3.5)
        if bar % 4 == 3: T.addv(drum(0.3), bar * 4 + 3); T.addv(drum(0.25), bar * 4 + 3.5)
    A = [(5, 0.5), (6, 0.5), (1, 1, 1), (6, 0.5), (5, 0.5), (3, 1), (5, 0.5), (3, 0.5), (2, 1), (1, 1), (2, 0.5), (3, 0.5), (5, 2),
         (6, 0.5), (5, 0.5), (3, 1), (2, 0.5), (3, 0.5), (5, 1), (6, 0.5), (1, 0.5, 1), (6, 1), (5, 1), (3, 0.5), (2, 0.5), (1, 2)]
    B = [(0, 2), (3, 0.5), (5, 0.5), (6, 1), (1, 0.5, 1), (6, 0.5), (5, 1), (3, 1), (5, 2), (2, 1), (3, 1), (5, 0.5), (6, 0.5), (5, 0.5), (3, 0.5), (2, 2),
         (1, 1), (2, 1), (3, 0.5), (5, 0.5), (3, 1), (2, 1), (1, 3)]
    b = mel(T, A, 0, 'flute', 1, 0.2); b = mel(T, B, 32, 'pluck', 1, 0.36)
    return reverb(T.buf, 1.0, 0.18)

# ── 3. 打烊（晚账/夜里）：64bpm，12 小节。稀疏古筝 + 笙，收工后的安静。
def night():
    T = Track(64, 12)
    chords = [[(1, -1), (5, -1)], [(6, -2), (3, -1)], [(2, -1), (6, -1)], [(5, -2), (2, -1)]]
    for bar in range(12):
        c = chords[bar % 4]
        T.addv(pad([hz(d, o) for d, o in c], 4 * T.beat, 0.1), bar * 4)
        T.addv(pluck(hz(c[0][0], c[0][1]), 2.4, bright=0.35, amp=0.32), bar * 4)
        T.addv(pluck(hz(c[1][0], c[1][1] + 1), 2.0, bright=0.4, bend=1, amp=0.22), bar * 4 + 2)
    A = [(3, 2, 1), (2, 1, 1), (1, 1, 1), (6, 3), (0, 1), (5, 2), (6, 1), (1, 1, 1), (2, 4, 1),
         (3, 1.5, 1), (2, 0.5, 1), (1, 2, 1), (6, 2), (5, 1), (3, 1), (2, 2), (1, 4), (0, 8)]
    mel(T, A, 4, 'pluck', 0, 0.38)
    return reverb(T.buf, 2.2, 0.38)

# ── 4. 心事（剧情/危机）：60bpm，8 小节，低音区的羽调式，略带不安。
def tense():
    T = Track(60, 8)
    for bar in range(8):
        T.addv(pad([hz(6, -2), hz(3, -1)], 4 * T.beat, 0.12), bar * 4)
        for k in range(4): T.addv(pluck(hz([6, 3, 6, 5][k], -2 if k != 1 else -1), 1.2, bright=0.3, amp=0.22), bar * 4 + k)
        if bar % 2: T.addv(drum(0.22), bar * 4 + 3.5)
    A = [(6, 2), (5, 1), (3, 1), (2, 3), (0, 1), (3, 1), (2, 1), (1, 1), (6, 1, -1), (6, 4, -1), (0, 4),
         (1, 1), (2, 1), (3, 2), (5, 1.5), (3, 0.5), (2, 2), (6, 4, -1)]
    mel(T, A, 0, 'flute', 0, 0.18)
    return reverb(T.buf, 1.8, 0.32)

if __name__ == '__main__':
    os.makedirs('/tmp/claude-0', exist_ok=True)
    for name, fn in [('bgm_dawn', dawn), ('bgm_rush', rush), ('bgm_night', night), ('bgm_tense', tense)]:
        write(name, fn())
    os.makedirs('assets/runtime_wx/audio', exist_ok=True)
    for f in os.listdir('assets/runtime/audio'):
        if f.endswith('.mp3'): shutil.copy('assets/runtime/audio/' + f, 'assets/runtime_wx/audio/' + f)

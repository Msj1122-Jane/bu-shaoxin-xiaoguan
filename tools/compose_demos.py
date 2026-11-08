# 配乐风格小样（只用于挑风格，不进游戏）：A 生活感原声 / B 8-bit / C Lo-fi 城市早晨 / D 原声 + 民乐点缀
import sys, os, wave, subprocess
import numpy as np
sys.path.insert(0, os.path.dirname(__file__))
from compose_music import pluck, flute, pad, woodblock, drum, reverb, Track, SR, env_adsr, rng

def nf(midi): return 440 * 2 ** ((midi - 69) / 12)
# C 大调常用进行 I–V–vi–IV（C G Am F），轻快明亮
PROG = [[60, 64, 67], [55, 59, 62], [57, 60, 64], [53, 57, 60]]

def guitar(f, dur, amp=0.4):  # 木吉他：KS 拨弦 + 箱体共鸣（低中频）
    x = pluck(f, dur, bright=0.45, amp=amp)
    k = np.exp(-np.arange(int(0.004 * SR)) / (0.001 * SR)); x = np.convolve(x, k / k.sum(), 'same') * 0.6 + x * 0.4
    return x

def uke(f, dur, amp=0.3): return pluck(f, dur, bright=0.8, amp=amp)

def whistle(f, dur, amp=0.2):  # 口哨：纯正弦 + 揉音 + 起音滑上来
    n = int(dur * SR); t = np.arange(n) / SR
    fr = f * (1 + 0.012 * np.sin(2 * np.pi * 5.8 * t) * np.clip(t / 0.2, 0, 1)) * (1 - 0.03 * np.exp(-t * 25))
    return np.sin(2 * np.pi * np.cumsum(fr) / SR) * env_adsr(n, 0.03, 0.05, 0.9, min(0.12, dur * 0.3)) * amp

def shaker(amp=0.08):
    n = int(0.08 * SR); x = rng.normal(0, 1, n) * np.exp(-np.arange(n) / SR * 40)
    return np.diff(np.concatenate([[0], x])) * amp

def kick(amp=0.5):
    n = int(0.3 * SR); t = np.arange(n) / SR; f = 50 + 90 * np.exp(-t * 30)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 9) * amp

def snare(amp=0.25, soft=True):
    n = int(0.2 * SR); t = np.arange(n) / SR
    nz = rng.normal(0, 1, n); nz = np.convolve(nz, np.ones(3 if soft else 1) / (3 if soft else 1), 'same')
    return (nz * np.exp(-t * 22) + np.sin(2 * np.pi * 190 * t) * np.exp(-t * 30) * 0.5) * amp

def hat(amp=0.06):
    n = int(0.05 * SR); x = rng.normal(0, 1, n); x = np.diff(np.concatenate([[0], x]))
    return x * np.exp(-np.arange(n) / SR * 90) * amp

def epiano(f, dur, amp=0.18):  # 电钢：FM 铃音 + 颤音
    n = int(dur * SR); t = np.arange(n) / SR
    mod = np.sin(2 * np.pi * f * t) * 1.6 * np.exp(-t * 3)
    x = np.sin(2 * np.pi * f * t + mod) * (1 + 0.15 * np.sin(2 * np.pi * 4.5 * t))
    return x * env_adsr(n, 0.004, 0.4, 0.5, 0.3) * amp

def square(f, dur, amp=0.12, duty=0.5):
    n = int(dur * SR); t = np.arange(n) / SR; ph = (f * t) % 1
    return np.where(ph < duty, 1.0, -1.0) * env_adsr(n, 0.002, 0.05, 0.7, 0.03) * amp

def tri(f, dur, amp=0.2):
    n = int(dur * SR); t = np.arange(n) / SR; ph = (f * t) % 1
    return (4 * np.abs(ph - 0.5) - 1) * env_adsr(n, 0.002, 0.02, 0.9, 0.02) * amp

def nes_noise(amp=0.1, d=0.06):
    n = int(d * SR); step = 8; x = np.repeat(rng.choice([-1.0, 1.0], n // step + 1), step)[:n]
    return x * np.exp(-np.arange(n) / SR * 50) * amp

def erhu(f, dur, amp=0.12):  # 二胡点缀：锯齿 + 揉弦 + 滑音
    n = int(dur * SR); t = np.arange(n) / SR
    fr = f * (1 + 0.015 * np.sin(2 * np.pi * 6 * t) * np.clip(t / 0.3, 0, 1)) * (1 - 0.06 * np.exp(-t * 10))
    ph = np.cumsum(fr) / SR % 1; x = 2 * ph - 1
    x = np.convolve(x, np.ones(6) / 6, 'same')
    return x * env_adsr(n, 0.12, 0.1, 0.85, 0.2) * amp

MEL = [(76, 1), (79, 0.5), (76, 0.5), (74, 1), (72, 1), (74, 1.5), (76, 0.5), (79, 2),
       (81, 1), (79, 0.5), (76, 0.5), (74, 1), (76, 1), (72, 3), (0, 1),
       (76, 1), (79, 0.5), (81, 0.5), (84, 1), (81, 1), (79, 1.5), (76, 0.5), (74, 2),
       (72, 1), (74, 0.5), (76, 0.5), (79, 1), (76, 1), (72, 4)]

def melody(T, inst, start=0, transpose=0, amp=None):
    b = start
    for m, d in MEL:
        if m: T.addv(inst(nf(m + transpose), d * T.beat * 0.95, **({'amp': amp} if amp else {})), b)
        b += d

def lowpass(x, cut):
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR); X *= 1 / np.sqrt(1 + (f / cut) ** 6); return np.fft.irfft(X, len(x))

def demo_acoustic():
    T = Track(104, 16)
    for bar in range(16):
        ch = PROG[bar % 4]
        for i, beat in enumerate([0, 1, 1.5, 2.5, 3, 3.5]):  # 扫弦节奏型
            for j, m in enumerate(ch): T.addv(guitar(nf(m - 12), 1.2, amp=0.22 if i else 0.3), bar * 4 + beat + j * 0.012 * (1 if i % 2 == 0 else -1))
        T.addv(guitar(nf(ch[0] - 24), 1.6, amp=0.35), bar * 4)
        for k in range(8): T.addv(shaker(0.025 if k % 2 else 0.04), bar * 4 + k * 0.5)
        T.addv(drum(0.18), bar * 4 + 2)
    melody(T, whistle, 0, 0, 0.17); melody(T, uke, 32, 12, 0.2)
    for bar in range(0, 16, 2): T.addv(uke(nf(PROG[bar % 4][2] + 12), 0.8, 0.18), bar * 4 + 3.5)
    return reverb(lowpass(T.buf, 3800), 1.0, 0.2)

def demo_chip():
    T = Track(132, 16)
    for bar in range(16):
        ch = PROG[bar % 4]
        for k in range(8): T.addv(square(nf(ch[k % 3] + 12), 0.5 * T.beat * 0.8, 0.06, 0.25), bar * 4 + k * 0.5)
        for k in range(4): T.addv(tri(nf(ch[0] - 12 + (7 if k % 2 else 0)), T.beat * 0.9, 0.22), bar * 4 + k)
        for k in range(4): T.addv(nes_noise(0.12 if k % 2 else 0.07, 0.05 if k % 2 else 0.03), bar * 4 + k)
    melody(T, lambda f, d, amp=0.1: square(f, d, amp, 0.5), 0, 0, 0.1); melody(T, lambda f, d, amp=0.1: square(f, d, amp, 0.25), 32, 12, 0.08)
    return T.buf

def demo_lofi():
    T = Track(78, 12)
    sw = 0.08
    for bar in range(12):
        ch = PROG[bar % 4] + [PROG[bar % 4][0] + 11]  # 加大七度
        for j, m in enumerate(ch): T.addv(epiano(nf(m), 4 * T.beat * 0.95, 0.12), bar * 4 + j * 0.02)
        T.addv(epiano(nf(ch[0] - 24), 2 * T.beat, 0.16), bar * 4)
        T.addv(kick(0.42), bar * 4); T.addv(kick(0.3), bar * 4 + 2.5 + sw)
        T.addv(snare(0.16), bar * 4 + 1); T.addv(snare(0.16), bar * 4 + 3)
        for k in range(8): T.addv(hat(0.045 if k % 2 else 0.06), bar * 4 + k * 0.5 + (sw if k % 2 else 0))
    melody(T, lambda f, d, amp=0.1: epiano(f, d, amp), 0, 0, 0.1)
    x = lowpass(T.buf, 2600)
    crackle = np.zeros(len(x)); idx = rng.integers(0, len(x), len(x) // 900); crackle[idx] = rng.normal(0, 0.25, len(idx))
    return reverb(x + crackle * 0.4 + rng.normal(0, 0.004, len(x)), 1.2, 0.22)

def demo_folk():
    x = demo_acoustic()
    T = Track(104, 16)
    phrase = [(81, 1.5), (79, 0.5), (76, 2), (74, 1), (76, 1), (79, 2)]
    b = 16
    for m, d in phrase: T.addv(erhu(nf(m), d * T.beat), b); b += d
    b = 48
    for m, d in phrase: T.addv(erhu(nf(m), d * T.beat), b); b += d
    T.addv(woodblock(0.1), 15.5); T.addv(woodblock(0.1), 31.5)
    return x + reverb(T.buf, 1.4, 0.3)[:len(x)]

def out(name, x):
    x = x - np.mean(x); x = x / (np.sqrt(np.mean(x ** 2)) + 1e-9) * 0.17; x = np.tanh(x * 1.6) / 1.6; x = x / np.max(np.abs(x)) * 0.85
    d = 'output/music_demos'; os.makedirs(d, exist_ok=True)
    w = '/tmp/claude-0/' + name + '.wav'
    with wave.open(w, 'wb') as f: f.setnchannels(1); f.setsampwidth(2); f.setframerate(SR); f.writeframes((x * 32767).astype(np.int16).tobytes())
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', w, '-c:a', 'libmp3lame', '-b:a', '96k', d + '/' + name + '.mp3'], check=True)
    sp = np.abs(np.fft.rfft(x)); fr = np.fft.rfftfreq(len(x), 1 / SR)
    print(name, round(len(x) / SR, 1), 's', 'centroid', int(np.sum(fr * sp) / np.sum(sp)), 'Hz')

if __name__ == '__main__':
    os.makedirs('/tmp/claude-0', exist_ok=True)
    out('A_生活感原声', demo_acoustic())
    out('B_8bit芯片', demo_chip())
    out('C_Lofi城市早晨', demo_lofi())
    out('D_原声加民乐点缀', demo_folk())

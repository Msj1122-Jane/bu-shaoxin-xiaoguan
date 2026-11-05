(function () {
  const DefaultGameplay = typeof module !== 'undefined' ? require('./gameplay.js') : globalThis.BSX_GAMEPLAY;

  function start(canvas, platform, Gameplay = DefaultGameplay) {
    const ctx = canvas.getContext('2d');
    const W = 960;
    const H = 540;
    const stationBoxes = {
      porridge: { x: 115, y: 308, w: 245, h: 212 },
      fryer: { x: 358, y: 308, w: 245, h: 212 },
      soymilk: { x: 602, y: 308, w: 245, h: 212 },
    };
    const paths = {
      background: 'assets/lovart/selected/scene_background.jpg',
      counter: 'assets/lovart/selected/counter_foreground.jpg',
      porridge: 'assets/lovart/selected/station_porridge.jpg',
      fryer: 'assets/lovart/selected/station_fryer.jpg',
      soymilk: 'assets/lovart/selected/station_soymilk.jpg',
      icons: 'assets/lovart/selected/ui_icons.jpg',
      characters: 'assets/lovart/selected/characters.jpg',
      fx: 'assets/lovart/selected/fx.jpg',
    };

    let raw = {};
    let art = {};
    let loaded = 0;
    let state = Gameplay.initial();
    let mode = 'loading';
    let paused = false;
    let patience = 1;
    let lastNow = platform.now();
    let sceneTime = 0;
    let wrongPulse = 0;
    let result = null;
    let resultTime = 0;
    let cook = null;
    let buttons = [];

    const clamp = Gameplay.clamp;
    const assetEntries = Object.entries(paths);
    for (const [key, path] of assetEntries) {
      raw[key] = platform.image(path, () => {
        loaded += 1;
        if (loaded === assetEntries.length) {
          prepareArt();
          mode = 'service';
        }
        draw();
      });
    }

    function surface(width, height) {
      const out = platform.surface(width, height);
      out.width = width;
      out.height = height;
      return out;
    }

    function cutout(image, crop, tolerance = 48) {
      const sx = Math.max(0, Math.floor(crop.x));
      const sy = Math.max(0, Math.floor(crop.y));
      const sw = Math.max(1, Math.floor(crop.w));
      const sh = Math.max(1, Math.floor(crop.h));
      const out = surface(sw, sh);
      const c = out.getContext('2d');
      c.drawImage(image, sx, sy, sw, sh, 0, 0, sw, sh);
      try {
        const frame = c.getImageData(0, 0, sw, sh);
        const data = frame.data;
        const corners = [0, (sw - 1) * 4, (sh - 1) * sw * 4, (sw * sh - 1) * 4];
        const bg = corners.reduce((acc, i) => {
          acc[0] += data[i]; acc[1] += data[i + 1]; acc[2] += data[i + 2];
          return acc;
        }, [0, 0, 0]).map((value) => value / 4);
        const near = (pixel) => {
          const dr = data[pixel] - bg[0];
          const dg = data[pixel + 1] - bg[1];
          const db = data[pixel + 2] - bg[2];
          return Math.sqrt(dr * dr + dg * dg + db * db) <= tolerance;
        };
        const seen = new Uint8Array(sw * sh);
        const queue = new Int32Array(sw * sh);
        let head = 0;
        let tail = 0;
        const push = (index) => {
          if (index < 0 || index >= sw * sh || seen[index] || !near(index * 4)) return;
          seen[index] = 1;
          queue[tail++] = index;
        };
        for (let x = 0; x < sw; x += 1) { push(x); push((sh - 1) * sw + x); }
        for (let y = 1; y < sh - 1; y += 1) { push(y * sw); push(y * sw + sw - 1); }
        while (head < tail) {
          const index = queue[head++];
          data[index * 4 + 3] = 0;
          const x = index % sw;
          if (x > 0) push(index - 1);
          if (x < sw - 1) push(index + 1);
          if (index >= sw) push(index - sw);
          if (index < sw * (sh - 1)) push(index + sw);
        }
        c.putImageData(frame, 0, 0);
      } catch (_) {
        out._needsBlend = true;
      }
      return out;
    }

    function sheetCell(image, col, row, cols, rows, tolerance = 46) {
      const width = image.width / cols;
      const height = image.height / rows;
      return cutout(image, { x: col * width, y: row * height, w: width, h: height }, tolerance);
    }

    function prepareArt() {
      art.background = raw.background;
      art.counter = cutout(raw.counter, { x: 0, y: 62, w: raw.counter.width, h: 188 }, 42);
      art.stations = {
        porridge: cutout(raw.porridge, { x: 0, y: 0, w: raw.porridge.width, h: raw.porridge.height }, 54),
        fryer: cutout(raw.fryer, { x: 0, y: 0, w: raw.fryer.width, h: raw.fryer.height }, 54),
        soymilk: cutout(raw.soymilk, { x: 0, y: 0, w: raw.soymilk.width, h: raw.soymilk.height }, 54),
      };
      art.icons = {
        porridge: sheetCell(raw.icons, 0, 0, 3, 2, 44),
        fryer: sheetCell(raw.icons, 1, 0, 3, 2, 44),
        soymilk: sheetCell(raw.icons, 2, 0, 3, 2, 44),
        coin: sheetCell(raw.icons, 0, 1, 3, 2, 44),
        day: sheetCell(raw.icons, 1, 1, 3, 2, 44),
        pause: sheetCell(raw.icons, 2, 1, 3, 2, 44),
      };
      art.characters = {
        zhouIdle: sheetCell(raw.characters, 0, 0, 4, 2, 46),
        zhouCook: sheetCell(raw.characters, 1, 0, 4, 2, 46),
        zhouServe: sheetCell(raw.characters, 2, 0, 4, 2, 46),
        zhouSmile: sheetCell(raw.characters, 3, 0, 4, 2, 46),
        grandIdle: sheetCell(raw.characters, 0, 1, 4, 2, 46),
        grandLook: sheetCell(raw.characters, 1, 1, 4, 2, 46),
        grandWait: sheetCell(raw.characters, 2, 1, 4, 2, 46),
        grandHappy: sheetCell(raw.characters, 3, 1, 4, 2, 46),
      };
      art.fx = {
        steam: sheetCell(raw.fx, 0, 0, 3, 2, 42),
        bubbles: sheetCell(raw.fx, 1, 0, 3, 2, 42),
        pour: sheetCell(raw.fx, 2, 0, 3, 2, 42),
        glint: sheetCell(raw.fx, 0, 1, 3, 2, 42),
        attention: sheetCell(raw.fx, 1, 1, 3, 2, 42),
        coin: sheetCell(raw.fx, 2, 1, 3, 2, 42),
      };
    }

    function rounded(x, y, w, h, r, fill, stroke) {
      const radius = Math.min(r, w / 2, h / 2);
      ctx.beginPath();
      ctx.moveTo(x + radius, y);
      ctx.arcTo(x + w, y, x + w, y + h, radius);
      ctx.arcTo(x + w, y + h, x, y + h, radius);
      ctx.arcTo(x, y + h, x, y, radius);
      ctx.arcTo(x, y, x + w, y, radius);
      ctx.closePath();
      if (fill) { ctx.fillStyle = fill; ctx.fill(); }
      if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 3; ctx.stroke(); }
    }

    function imageFit(image, x, y, w, h, alpha = 1) {
      if (!image || !image.width) return;
      const ratio = Math.min(w / image.width, h / image.height);
      const dw = image.width * ratio;
      const dh = image.height * ratio;
      ctx.save();
      ctx.globalAlpha = alpha;
      if (image._needsBlend) ctx.globalCompositeOperation = 'multiply';
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(image, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
      ctx.restore();
    }

    function drawBackground() {
      if (!art.background || !art.background.width) {
        ctx.fillStyle = '#eadbb9';
        ctx.fillRect(0, 0, W, H);
        return;
      }
      const ratio = Math.max(W / art.background.width, H / art.background.height);
      const dw = art.background.width * ratio;
      const dh = art.background.height * ratio;
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(art.background, (W - dw) / 2, (H - dh) / 2, dw, dh);
    }

    function drawNumber(value, x, y, size = 24) {
      ctx.font = `700 ${size}px ui-rounded, system-ui, sans-serif`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.lineWidth = 5;
      ctx.strokeStyle = 'rgba(53,47,34,.75)';
      ctx.strokeText(String(value), x, y);
      ctx.fillStyle = '#fff4d4';
      ctx.fillText(String(value), x, y);
    }

    function ring(x, y, radius, value, color, width = 7) {
      ctx.save();
      ctx.lineWidth = width;
      ctx.lineCap = 'round';
      ctx.strokeStyle = 'rgba(71,56,35,.25)';
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, radius, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * clamp(value));
      ctx.stroke();
      ctx.restore();
    }

    function currentCustomer() {
      if (result) return art.characters.grandHappy;
      if (patience < 0.35) return art.characters.grandWait;
      if (patience < 0.7) return art.characters.grandLook;
      return art.characters.grandIdle;
    }

    function drawHud() {
      rounded(23, 19, 86, 58, 18, 'rgba(48,63,50,.82)', 'rgba(255,239,190,.4)');
      imageFit(art.icons.day, 28, 24, 46, 46);
      drawNumber(1, 72, 49, 24);
      rounded(118, 19, 116, 58, 18, 'rgba(48,63,50,.82)', 'rgba(255,239,190,.4)');
      imageFit(art.icons.coin, 122, 24, 46, 46);
      drawNumber(state.coins, 168, 49, 24);
      rounded(875, 19, 62, 58, 18, 'rgba(48,63,50,.82)', 'rgba(255,239,190,.4)');
      imageFit(art.icons.pause, 883, 26, 46, 42);
      buttons.push({ id: 'pause', x: 875, y: 19, w: 62, h: 58 });
    }

    function drawService() {
      drawBackground();
      imageFit(result ? art.characters.zhouServe : art.characters.zhouIdle, 135, 135, 180, 200);
      imageFit(currentCustomer(), 409, 88, 158, 182);
      const order = Gameplay.currentOrder(state);
      if (order) {
        rounded(444, 39, 88, 82, 25, 'rgba(255,247,217,.96)', '#9a6737');
        imageFit(art.icons[order], 456, 48, 64, 62);
        ring(488, 80, 50, patience, patience < 0.35 ? '#d36c43' : '#2f7467', 7);
      }
      imageFit(art.counter, 56, 276, 848, 260);
      for (const kind of Gameplay.ORDER_SEQUENCE) {
        const box = stationBoxes[kind];
        const correct = kind === order;
        if (correct && !result) {
          const pulse = 0.68 + Math.sin(sceneTime / 210) * 0.18;
          rounded(box.x + 10, box.y + 8, box.w - 20, box.h - 14, 30, `rgba(255,210,103,${pulse * .24})`, `rgba(255,231,143,${pulse})`);
        }
        const lift = correct && !result ? Math.sin(sceneTime / 230) * 3 - 3 : 0;
        imageFit(art.stations[kind], box.x + 8, box.y + 8 + lift, box.w - 16, box.h - 12, correct ? 1 : 0.84);
        if (correct && !result) {
          const bob = Math.sin(sceneTime / 180) * 5;
          imageFit(art.fx.attention, box.x + box.w / 2 - 27, box.y - 19 + bob, 54, 54, 0.92);
        }
        buttons.push({ id: kind, ...box });
      }
      if (wrongPulse > 0 && order) {
        const box = stationBoxes[order];
        imageFit(art.fx.attention, box.x + box.w - 58, box.y + 10, 60, 60, Math.min(1, wrongPulse / 250));
      }
      if (result) {
        imageFit(result.grade === 'perfect' ? art.fx.glint : art.fx.coin, 548, 145, 84, 84, Math.min(1, resultTime / 160));
        imageFit(art.fx.coin, 618, 89, 58, 58, Math.min(1, resultTime / 160));
      }
      drawHud();
      if (paused) {
        ctx.fillStyle = 'rgba(24,37,31,.65)';
        ctx.fillRect(0, 0, W, H);
        rounded(408, 194, 144, 144, 34, '#f4e8c9', '#79532f');
        imageFit(art.icons.pause, 438, 224, 84, 84);
        buttons.push({ id: 'resume', x: 0, y: 0, w: W, h: H });
      }
    }

    function drawCookPanel() {
      drawBackground();
      ctx.fillStyle = 'rgba(31,45,38,.67)';
      ctx.fillRect(0, 0, W, H);
      rounded(140, 30, 680, 480, 32, '#f2e2bd', '#744b2b');
      rounded(167, 54, 58, 52, 16, '#31584f', '#e8c884');
      ctx.strokeStyle = '#fff1c8';
      ctx.lineWidth = 7;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(205, 68); ctx.lineTo(184, 80); ctx.lineTo(205, 94); ctx.stroke();
      buttons.push({ id: 'back', x: 155, y: 42, w: 84, h: 76 });
      if (cook.kind === 'porridge') drawPorridgeCook();
      if (cook.kind === 'soymilk') drawSoymilkCook();
      if (cook.kind === 'fryer') drawFryerCook();
    }

    function drawPorridgeCook() {
      imageFit(art.stations.porridge, 280, 82, 400, 390);
      imageFit(art.fx.steam, 590, 77, 82, 95, 0.75);
      const progress = clamp(cook.turns / 1.25);
      ring(481, 254, 116, progress, '#e6a23c', 11);
      const angle = (sceneTime / 800) % (Math.PI * 2);
      if (!cook.dragging && progress < 1) {
        ctx.fillStyle = 'rgba(255,245,210,.82)';
        ctx.beginPath();
        ctx.arc(481 + Math.cos(angle) * 116, 254 + Math.sin(angle) * 116, 14, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    function drawSoymilkCook() {
      imageFit(art.stations.soymilk, 288, 76, 370, 398);
      if (cook.holding) imageFit(art.fx.pour, 558, 188, 100, 155, 0.9);
      rounded(690, 116, 46, 270, 18, '#d9caa7', '#6c5138');
      const fillHeight = 244 * clamp(cook.fill);
      ctx.fillStyle = '#f8edcf';
      ctx.fillRect(699, 376 - fillHeight, 28, fillHeight);
      ctx.fillStyle = 'rgba(51,105,91,.34)';
      ctx.fillRect(692, 376 - 244 * .86, 42, 244 * .2);
      ctx.strokeStyle = '#31584f';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(688, 376 - 244 * .66); ctx.lineTo(739, 376 - 244 * .66);
      ctx.moveTo(688, 376 - 244 * .86); ctx.lineTo(739, 376 - 244 * .86);
      ctx.stroke();
      if (!cook.holding) {
        const pulse = 16 + Math.sin(sceneTime / 180) * 3;
        ctx.strokeStyle = 'rgba(255,244,203,.85)';
        ctx.lineWidth = 6;
        ctx.beginPath(); ctx.arc(466, 268, pulse, 0, Math.PI * 2); ctx.stroke();
      }
    }

    function drawFryerCook() {
      imageFit(art.stations.fryer, 276, 63, 410, 365);
      imageFit(art.fx.bubbles, 438, 132, 96, 96, 0.82);
      if (cook.stage === 'stretch') {
        const left = 280;
        const width = 175 + cook.stretch * 285;
        rounded(left, 405, width, 38, 18, '#e9b86a', '#8b5830');
        ctx.fillStyle = '#fff0be';
        ctx.beginPath(); ctx.arc(left, 424, 15, 0, Math.PI * 2); ctx.arc(left + width, 424, 15, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(47,88,79,.26)';
        ctx.fillRect(280 + 285 * .67, 394, 285 * .33, 60);
      } else {
        rounded(270, 405, 420, 38, 19, '#d6c7a5', '#6d5036');
        ctx.fillStyle = 'rgba(47,88,79,.42)';
        ctx.fillRect(270 + 420 * .43, 405, 420 * .28, 38);
        ctx.fillStyle = '#f1a73c';
        ctx.beginPath();
        ctx.arc(270 + 420 * cook.timing, 424, 16, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    function drawEnd() {
      drawBackground();
      ctx.fillStyle = 'rgba(31,45,38,.52)';
      ctx.fillRect(0, 0, W, H);
      rounded(184, 65, 592, 415, 34, '#f3e5c2', '#744b2b');
      imageFit(art.characters.zhouSmile, 220, 105, 220, 235);
      imageFit(art.characters.grandHappy, 516, 105, 220, 235);
      state.completed.forEach((item, index) => {
        imageFit(art.icons[item.kind], 330 + index * 105, 345, 72, 72);
        if (item.grade === 'perfect') imageFit(art.fx.glint, 365 + index * 105, 326, 42, 42);
      });
      imageFit(art.icons.coin, 397, 418, 56, 48);
      drawNumber(state.coins, 453, 443, 28);
      buttons.push({ id: 'replay', x: 184, y: 65, w: 592, h: 415 });
    }

    function drawLoading() {
      ctx.fillStyle = '#2f554c';
      ctx.fillRect(0, 0, W, H);
      const progress = loaded / assetEntries.length;
      rounded(280, 248, 400, 24, 12, 'rgba(255,245,210,.2)');
      rounded(280, 248, 400 * progress, 24, 12, '#e4ae58');
    }

    function draw() {
      ctx.setTransform(canvas.width / W, 0, 0, canvas.height / H, 0, 0);
      ctx.clearRect(0, 0, W, H);
      buttons = [];
      if (mode === 'loading') drawLoading();
      else if (mode === 'service') drawService();
      else if (mode === 'cook') drawCookPanel();
      else drawEnd();
    }

    function startCook(kind) {
      if (Gameplay.currentOrder(state) !== kind) {
        state = Gameplay.wrongSelection(state);
        wrongPulse = 600;
        platform.feedback('wrong');
        return;
      }
      mode = 'cook';
      result = null;
      if (kind === 'porridge') cook = { kind, dragging: false, lastAngle: 0, turns: 0, samples: 0, jitter: 0 };
      if (kind === 'soymilk') cook = { kind, holding: false, fill: 0 };
      if (kind === 'fryer') cook = { kind, stage: 'stretch', dragging: false, startX: 0, stretch: 0, timing: 0 };
      platform.feedback('open');
    }

    function finishCook(score) {
      const kind = cook.kind;
      const grade = Gameplay.grade(score);
      state = Gameplay.complete(state, kind, score);
      result = { kind, score, grade };
      resultTime = 0;
      mode = 'service';
      cook = null;
      patience = 1;
      sceneTime = 0;
      platform.feedback(grade);
    }

    function angleAt(x, y) { return Math.atan2(y - 254, x - 481); }
    function hit(button, x, y) { return x >= button.x && x <= button.x + button.w && y >= button.y && y <= button.y + button.h; }

    function input(type, x, y) {
      if (mode === 'loading') return;
      if (mode === 'end') { if (type === 'down') reset(); return; }
      if (paused) { if (type === 'down') paused = false; draw(); return; }
      if (mode === 'service') {
        if (type !== 'down') return;
        const target = buttons.find((button) => hit(button, x, y));
        if (!target) return;
        if (target.id === 'pause') paused = true;
        else if (Gameplay.ORDER_SEQUENCE.includes(target.id) && !result) startCook(target.id);
        draw();
        return;
      }
      if (mode === 'cook') {
        if (type === 'down' && x < 240 && y < 125) { mode = 'service'; cook = null; draw(); return; }
        if (cook.kind === 'porridge') {
          if (type === 'down') { cook.dragging = true; cook.lastAngle = angleAt(x, y); }
          if (type === 'move' && cook.dragging) {
            const angle = angleAt(x, y);
            let delta = angle - cook.lastAngle;
            while (delta > Math.PI) delta -= Math.PI * 2;
            while (delta < -Math.PI) delta += Math.PI * 2;
            if (Math.abs(delta) < 0.65) {
              cook.turns += Math.abs(delta) / (Math.PI * 2);
              cook.jitter += Math.max(0, Math.abs(delta) - 0.22);
              cook.samples += 1;
            }
            cook.lastAngle = angle;
            if (cook.turns >= 1.25) {
              const steadiness = clamp(1 - cook.jitter / Math.max(1, cook.samples));
              finishCook(Gameplay.porridgeScore(cook.turns, steadiness));
            }
          }
          if (type === 'up' || type === 'cancel') cook.dragging = false;
        } else if (cook.kind === 'soymilk') {
          if (type === 'down') cook.holding = true;
          if ((type === 'up' || type === 'cancel') && cook.holding) {
            cook.holding = false;
            finishCook(Gameplay.soymilkScore(cook.fill));
          }
        } else if (cook.kind === 'fryer') {
          if (cook.stage === 'stretch') {
            if (type === 'down') { cook.dragging = true; cook.startX = x; }
            if (type === 'move' && cook.dragging) cook.stretch = clamp((x - cook.startX) / 285);
            if ((type === 'up' || type === 'cancel') && cook.dragging) {
              cook.dragging = false;
              if (cook.stretch >= 0.45) { cook.stage = 'fry'; cook.timing = 0; cook.fryTime = 0; platform.feedback('open'); }
            }
          } else if (type === 'down') finishCook(Gameplay.fryerScore(cook.stretch, cook.timing));
        }
        draw();
      }
    }

    function advance(ms) {
      const dt = Math.max(0, Math.min(ms, 100));
      if (mode !== 'loading' && !paused) {
        sceneTime += dt;
        wrongPulse = Math.max(0, wrongPulse - dt);
        if (mode === 'service' && !result && !state.finished) patience = Math.max(0.08, patience - dt / 30000);
        if (mode === 'service' && result) {
          resultTime += dt;
          if (resultTime >= 900) { result = null; if (state.finished) mode = 'end'; }
        }
        if (mode === 'cook' && cook.kind === 'soymilk' && cook.holding) {
          cook.fill = Math.min(1.08, cook.fill + dt / 2300);
          if (cook.fill >= 1.08) finishCook(Gameplay.soymilkScore(cook.fill));
        }
        if (mode === 'cook' && cook.kind === 'fryer' && cook.stage === 'fry') {
          cook.fryTime += dt;
          cook.timing = (Math.sin(cook.fryTime / 690 - Math.PI / 2) + 1) / 2;
        }
      }
      draw();
    }

    function reset() {
      state = Gameplay.initial();
      mode = loaded === assetEntries.length ? 'service' : 'loading';
      paused = false;
      patience = 1;
      sceneTime = 0;
      wrongPulse = 0;
      result = null;
      cook = null;
      draw();
    }

    function tick(now) {
      const dt = Math.min(50, Math.max(0, now - lastNow));
      lastNow = now;
      advance(dt);
      platform.frame(tick);
    }

    function snapshot() { return JSON.parse(JSON.stringify({ mode, paused, patience, state, cook, result, assetsLoaded: loaded })); }
    function renderText() {
      return JSON.stringify({
        coordinateSystem: 'origin top-left; x right; y down; logical canvas 960x540',
        mode,
        paused,
        order: Gameplay.currentOrder(state),
        patience: Number(patience.toFixed(3)),
        coins: state.coins,
        completed: state.completed,
        cooking: cook ? {
          kind: cook.kind,
          turns: cook.turns == null ? undefined : Number(cook.turns.toFixed(3)),
          fill: cook.fill == null ? undefined : Number(cook.fill.toFixed(3)),
          stage: cook.stage,
          stretch: cook.stretch == null ? undefined : Number(cook.stretch.toFixed(3)),
          timing: cook.timing == null ? undefined : Number(cook.timing.toFixed(3)),
        } : null,
        interactiveStations: mode === 'service' ? stationBoxes : null,
      });
    }

    platform.input(input);
    platform.pause(() => { paused = true; draw(); });
    draw();
    platform.frame(tick);
    return { snapshot, ui: () => ({ mode, buttons: buttons.slice() }), redraw: draw, advance, text: renderText, reset };
  }

  if (typeof module !== 'undefined') module.exports = start;
  else globalThis.BSX_START = start;
})();

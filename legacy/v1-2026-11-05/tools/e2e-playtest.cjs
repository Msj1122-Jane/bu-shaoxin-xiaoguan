const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('/Users/msj/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');

const URL = process.env.BSX_URL || 'http://127.0.0.1:4173';
const outputDir = path.resolve(__dirname, '../output/e2e');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function main() {
  fs.mkdirSync(outputDir, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('pageerror', (error) => errors.push(String(error)));
  await page.goto(URL, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.__bsx?.snapshot().mode === 'service');

  const canvas = page.locator('canvas');
  const box = await canvas.boundingBox();
  const point = (x, y) => ({ x: box.x + x * box.width / 960, y: box.y + y * box.height / 540 });
  const click = async (x, y) => {
    const p = point(x, y);
    await page.mouse.click(p.x, p.y);
  };
  const advance = async (milliseconds) => {
    await page.evaluate((value) => {
      for (let elapsed = 0; elapsed < value; elapsed += 100) window.advanceTime(Math.min(100, value - elapsed));
    }, milliseconds);
  };
  const state = () => page.evaluate(() => JSON.parse(window.render_game_to_text()));
  const shot = async (name) => canvas.screenshot({ path: path.join(outputDir, `${name}.png`) });

  await shot('01-service');

  await click(235, 410);
  assert((await state()).cooking?.kind === 'porridge', 'Porridge station did not open');
  const center = point(481, 254);
  const radiusX = 116 * box.width / 960;
  const radiusY = 116 * box.height / 540;
  await page.mouse.move(center.x + radiusX, center.y);
  await page.mouse.down();
  for (let index = 1; index <= 48; index += 1) {
    const angle = Math.PI * 2 * 1.5 * index / 48;
    await page.mouse.move(center.x + Math.cos(angle) * radiusX, center.y + Math.sin(angle) * radiusY, { steps: 1 });
  }
  await page.mouse.up();
  let current = await state();
  assert(current.completed.length === 1 && current.completed[0].kind === 'porridge', 'Porridge gesture did not complete');
  await shot('02-porridge-result');
  await advance(1000);

  await click(724, 410);
  assert((await state()).cooking?.kind === 'soymilk', 'Soy milk station did not open');
  const hold = point(466, 268);
  await page.mouse.move(hold.x, hold.y);
  await page.mouse.down();
  await advance(1800);
  await page.mouse.up();
  current = await state();
  assert(current.completed.length === 2 && current.completed[1].kind === 'soymilk', 'Soy milk hold did not complete');
  await shot('03-soymilk-result');
  await advance(1000);

  await click(480, 410);
  assert((await state()).cooking?.kind === 'fryer', 'Fryer station did not open');
  const stretchStart = point(280, 424);
  const stretchEnd = point(560, 424);
  await page.mouse.move(stretchStart.x, stretchStart.y);
  await page.mouse.down();
  await page.mouse.move(stretchEnd.x, stretchEnd.y, { steps: 12 });
  await page.mouse.up();
  current = await state();
  assert(current.cooking?.stage === 'fry', 'Fryer stretch did not enter timing stage');
  await advance(1200);
  await click(480, 424);
  current = await state();
  assert(current.completed.length === 3 && current.completed[2].kind === 'fryer', 'Fryer timing did not complete');
  await shot('04-fryer-result');
  await advance(1000);
  current = await state();
  assert(current.mode === 'end', 'End screen did not appear');
  await shot('05-end');

  fs.writeFileSync(path.join(outputDir, 'final-state.json'), JSON.stringify(current, null, 2));
  fs.writeFileSync(path.join(outputDir, 'errors.json'), JSON.stringify(errors, null, 2));
  assert(errors.length === 0, `Browser errors: ${errors.join('; ')}`);
  console.log(JSON.stringify(current));
  await browser.close();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

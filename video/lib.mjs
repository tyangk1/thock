// Deterministic frame capture of the THOCK page (fake clock, served from disk).
// Page time moves only through step(): GSAP, Lenis, ScrollTrigger scrub, Matter.js (rAF), timers.
// CSS animations are pinned to the clock; CSS transitions are paused and advanced by hand.
import { chromium } from 'playwright-core';
import { readFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SITE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ORIGIN = 'http://thock.local';
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.png': 'image/png', '.ico': 'image/x-icon' };

export async function open({ width, height, scale = 1 }) {
  const browser = await chromium.launch({ channel: 'chrome', args: ['--hide-scrollbars', '--force-color-profile=srgb', '--autoplay-policy=no-user-gesture-required'] });
  const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: scale, hasTouch: false });
  await ctx.route(`${ORIGIN}/**`, async (route) => {
    let p = decodeURIComponent(new URL(route.request().url()).pathname);
    if (p.endsWith('/')) p += 'index.html';
    try { await route.fulfill({ status: 200, body: await readFile(path.join(SITE, p)), contentType: TYPES[path.extname(p)] || 'application/octet-stream' }); }
    catch { await route.fulfill({ status: 404, body: 'nf' }); }
  });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  const T0 = Date.parse('2026-11-10T09:00:00Z');
  await page.clock.install({ time: T0 });
  await page.clock.pauseAt(T0 + 1000);
  await page.goto(`${ORIGIN}/?capture=1`, { waitUntil: 'load' });
  await page.addStyleTag({ content: '.cursor{display:none!important} html{scrollbar-width:none}' });
  let t = 0;
  const DT = 1000 / 30;
  const api = {
    page, errors,
    get time() { return t; },
    /** advance page time by ms (default one 30 fps frame); speed < 1 = slow motion */
    async step(ms = DT) {
      t += ms;
      await page.clock.runFor(ms);
      await page.evaluate(([now, ms]) => {
        for (const a of document.getAnimations()) {
          if (a instanceof CSSAnimation) a.currentTime = now;
          else { if (a.playState === 'running') a.pause(); a.currentTime = (a.currentTime || 0) + ms; if (a.currentTime >= a.effect.getComputedTiming().endTime) a.finish(); }
        }
      }, [t, ms]);
    },
    async shot(file) { await page.screenshot({ path: file, type: 'jpeg', quality: 92, animations: 'allow', caret: 'hide' }); },
    async close() { await browser.close(); },
  };
  return api;
}

export async function ensureDir(d) { await mkdir(d, { recursive: true }); }
export const ease = {
  linear: (x) => x,
  inOut: (x) => (x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2),
  out: (x) => 1 - Math.pow(1 - x, 3),
};

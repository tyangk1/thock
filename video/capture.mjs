// THOCK promo: capture one JPEG sequence per scene, on the music grid, plus events.json
// (every keystroke / slam / tick with its global video frame) for the SFX track.
// usage: node capture.mjs reels|youtube [scene]
import { open, ensureDir, ease } from './lib.mjs';
import { readFileSync, writeFileSync } from 'node:fs';

const V = process.argv[2] || 'reels';
const ONLY = process.argv[3];
const TL = JSON.parse(readFileSync(new URL(`./timeline-${V}.json`, import.meta.url)));
const BAR = TL.frames_per_bar, E8 = BAR / 8, E16 = BAR / 16;
const R = V === 'reels';
const CFG = R ? { width: 540, height: 960, scale: 2 } : { width: 1920, height: 1080, scale: 1 };
const sc = TL.scenes.reduce((m, [n, a, b]) => ({ ...m, [n]: { start: Math.round(a * BAR), n: Math.round(b * BAR) - Math.round(a * BAR) } }), {});
const events = [];
const ev = (scene, f, type) => events.push({ f: sc[scene].start + Math.round(f), type });

// ---------- overlay ----------
const CSS = `
#cap{position:fixed;inset:0;z-index:999;pointer-events:none}
#cap .stk{position:absolute;left:50%;transform:translateX(-50%) rotate(-3deg);background:#FFD23F;color:#111;border:4px solid #111;border-radius:14px;box-shadow:7px 7px 0 #111;
  font:400 var(--fs) 'Archivo Black',Impact,sans-serif;padding:.32em .6em .26em;white-space:nowrap;text-transform:uppercase}
#cap .stk.o{background:#FF5A1F}#cap .stk.b{background:#3A5BFF;color:#fff}#cap .stk.m{background:#3DDC97}
#cap .caret{display:inline-block;width:.12em;height:.8em;background:#111;margin-left:.08em;vertical-align:-.06em}
#cap .end{position:absolute;inset:0;background:#FFD23F;display:grid;place-items:center;align-content:center;gap:var(--gap)}
#cap .end img{width:var(--lw)}
#cap .pill{background:#fff;border:4px solid #111;border-radius:12px;box-shadow:6px 6px 0 #111;font:700 var(--ps) 'JetBrains Mono',monospace;padding:.4em .8em;color:#111}
#cap .small{font:700 var(--ss) 'JetBrains Mono',monospace;color:#111;opacity:.8}
`;
const FS = R ? 30 : 46;
const CAPTOP = R ? 16 : 10;
const LOW = R ? 58 : 80; // reels: the empty lower half of the hero, inside the safe zone
async function overlay(v, html) {
  await v.page.evaluate(([html, css]) => {
    let el = document.getElementById('cap');
    if (!el) { const s = document.createElement('style'); s.textContent = css; document.head.appendChild(s); el = document.createElement('div'); el.id = 'cap'; document.body.appendChild(el); }
    el.innerHTML = html;
  }, [html, CSS]);
}
// typewriter sticker: one character per 16th note from frame a; logs a tick per character
function typed(scene, f, text, a, cls = '', top = CAPTOP, logged, left = 50) {
  if (f < a) return '';
  const n = Math.min(text.length, Math.floor((f - a) / E16) + 1);
  if (logged && !logged.has(n)) { logged.add(n); if (text[n - 1] !== ' ') ev(scene, f, 'tick'); }
  return `<div class="stk ${cls}" style="--fs:${FS}px;top:${top}%;left:${left}%">${text.slice(0, n)}<i class="caret"></i></div>`;
}

const scroll = (v, y) => v.page.evaluate((y) => window.__thock.y(y), y);
const scrollEl = (v, sel, off = 0) => v.page.evaluate(([s, o]) => window.__thock.y(document.querySelector(s).getBoundingClientRect().top + scrollY + o), [sel, off]);
const stInfo = (v, sel) => v.page.evaluate(async (sel) => {
  const { ScrollTrigger } = await import('/vendor/gsap/ScrollTrigger.js');
  const all = ScrollTrigger.getAll().filter((s) => s.trigger && s.trigger.matches(sel));
  const s = all.find((x) => x.pin) || all[0];
  return { start: s.start, end: s.end };
}, sel);
const hit = (v, code, key) => v.page.evaluate(([c, k]) => window.__thock.kb.hit(c, k), [code, key]);
const release = (v, code) => v.page.evaluate((c) => window.__thock.kb.press(c, false), code);

async function scene(v, name, fn, speed = () => 1) {
  if (!sc[name] || (ONLY && ONLY !== name)) return false;
  const dir = `frames/${V}/${name}`;
  await ensureDir(dir);
  await overlay(v, ''); // captions never leak into the next scene
  for (let f = 0; f < sc[name].n; f++) {
    const r = await fn(f, sc[name].n);
    if (r !== 'hold') await v.step(1000 / 30 * speed(f));
    await v.shot(`${dir}/${String(f).padStart(4, '0')}.jpg`);
  }
  console.log(name, sc[name].n, 'frames');
  return true;
}

// ---------- go ----------
const v = await open(CFG);
// video framing: the footer fills the screen so no half-cut section peeks in above it
await v.page.addStyleTag({ content: '.ftr{min-height:100vh;align-content:center} #race{min-height:100vh} .riso .sec-head{visibility:hidden} .riso .ph:nth-child(5){display:none}' });
await v.page.waitForFunction(() => document.fonts.status === 'loaded' && [...document.querySelectorAll('.hero img, .xray img')].every((i) => i.complete), null, { timeout: 30000, polling: 100 });

// S1 hook: the loader types T-H-O-C-K on eighth notes (page clock slowed so .16 s steps land on the grid),
// then a typewriter sticker: "the keyboard page you can type on"
{
  const k = 0.16 / (E8 / 30);   // page seconds per video second during the loader
  const log = new Set();
  const capAt = R ? BAR * 1.0 : BAR * 1.5;
  await scene(v, 's1', async (f) => {
    for (let i = 0; i < 5; i++) if (Math.abs(f - (1 + i * E8)) < .5) ev('s1', f, 'key');
    await overlay(v, typed('s1', f, R ? 'type to play' : 'the keyboard page you can type on', capAt, '', LOW, log));
  }, (f) => (f < BAR ? k : 1));
}
// make sure the loader is gone
for (let i = 0; i < 90 && await v.page.evaluate(() => !!document.getElementById('loader')); i++) await v.step();
await overlay(v, '');

// S2 hero: type words on eighth notes; caps drop and pile up (stop-motion is added in the edit)
{
  const script = R
    ? [['H', 0], ['E', 1], ['L', 2], ['L', 3], ['O', 4], [' ', 5], ['T', 6], ['H', 7], ['O', 8], ['C', 9], ['K', 10], ['Enter', 12], ['Enter', 14], ['!', 16], ['!', 17], ['!', 18]]
    : [['H', 1], ['E', 2], ['L', 3], ['L', 4], ['O', 5], [' ', 6], ['T', 7], ['H', 8], ['O', 9], ['C', 10], ['K', 11], ['Enter', 14], ['!', 16], ['!', 17], ['!', 18], ['Enter', 20], ['Enter', 22], [' ', 24], ['B', 25], ['O', 26], ['O', 27], ['M', 28]];
  const at = new Map(script.map(([k, i]) => [Math.round(2 + i * E8), k]));
  const down = new Map();
  const log = new Set();
  await scene(v, 's2', async (f) => {
    const key = at.get(f);
    if (key) {
      const code = key === ' ' ? 'Space' : key === 'Enter' ? 'Enter' : key === '!' ? 'Digit1' : `Key${key}`;
      await hit(v, code, key === 'Enter' ? 'Enter' : key);
      down.set(code, f + 3);
      ev('s2', f, key === ' ' ? 'space' : 'key');
    }
    for (const [c, fu] of down) if (f >= fu) { await release(v, c); down.delete(c); }
    await overlay(v, typed('s2', f, 'every key drops', R ? BAR * 2 : BAR * 3.2, 'o', LOW, log));
  });
}

// S3 x-ray: scan top to bottom
{
  const s = await stInfo(v, '.xray');
  const log = new Set();
  await scene(v, 's3', async (f, n) => {
    await scroll(v, s.start + (s.end - s.start) * ease.inOut(Math.min(1, f / (n - 6))));
    await overlay(v, typed('s3', f, 'x-ray mode', 4, 'm', R ? 42 : CAPTOP, log));
  });
}

// S6 switches: the three cards play on the beat
{
  const log = new Set();
  await scene(v, 's6', async (f, n) => {
    if (f === 0) await scrollEl(v, R ? '.sw-grid' : '#switches', R ? -195 : -20);
    if (R && f > 4) await scrollEl(v, '.sw-grid', -195 + (f - 4) / (n - 4) * 1250);
    for (const [i, t] of ['linear', 'tactile', 'clicky'].entries()) {
      if (Math.abs(f - (6 + i * BAR / (R ? 3 : 4))) < .5) {
        await v.page.evaluate((t) => document.querySelector(`.sw[data-sw="${t}"]`).classList.add('is-played'), t);
        ev('s6', f, `sw-${t}`);
      }
    }
    await overlay(v, typed('s6', f, 'pick a sound', 3, 'b', R ? 34 : 9, log, R ? 50 : 74)); // never over the heading
  });
}

// S4 colorways: two slams that hit on the beat
{
  const hits = R ? [Math.round(BAR * .35), Math.round(BAR * 1.25)] : [Math.round(BAR * .5), Math.round(BAR * 1.5)]; // >= 40 frames apart (the slam takes ~1.3 s)
  const order = ['ink', 'pop'];
  await scene(v, 's4', async (f) => {
    if (f === 0) await scrollEl(v, '#colors');
    for (const [i, h] of hits.entries()) {
      if (f === h - 8) await v.page.evaluate((c) => document.querySelector(`.cw[data-cw="${c}"]`).click(), order[i]);
      if (f === h) ev('s4', f, 'slam');
    }
  });
}

// R1 (youtube): riso prints develop one after another
{
  const figs = 4;
  const log = new Set();
  await scene(v, 'r1', async (f) => {
    await overlay(v, typed('r1', f, 'printed in ink', 6, 'b', 76, log, 83)); // the empty grid cell, bottom right
    if (f === 0) await scrollEl(v, '.riso__grid', -80); // the whole grid, captions included
    for (let i = 0; i < figs; i++) {
      if (Math.abs(f - (4 + i * E8 * 2)) < .5) {
        await v.page.evaluate((i) => { const el = document.querySelectorAll('.ph')[i]; el.style.setProperty('--mx', '50%'); el.style.setProperty('--my', '50%'); el.classList.add('is-dev'); }, i);
        ev('r1', f, 'tick');
      }
    }
  });
}

// S5 race: start, then type on sixteenth notes; the gauge needle climbs
{
  let text = '', pos = 0;
  await scene(v, 's5', async (f) => {
    if (f === 0) {
      await scrollEl(v, '#race', R ? -40 : 60);
      await v.page.evaluate(() => window.__thock.race.start());
      text = await v.page.evaluate(() => document.getElementById('raceText').textContent);
      await scrollEl(v, '#race', R ? 40 : 0); // start() scrolls the box to centre; put the heading back under the header
    }
    if (f >= 6 && (f - 6) % Math.round(E16) === 0 && pos < text.length) {
      const ch = text[pos++];
      await v.page.evaluate((ch) => window.__thock.race.handleKey({ key: ch, preventDefault() {} }), ch);
      if (ch !== ' ') ev('s5', f, 'key-soft');
    }
  });
}

// S7 build: pick options on beats, drop it in the box
{
  const picks = [['case', 'pop'], ['sw', 'tactile'], ['artisan', null], ['submit', null]];
  await scene(v, 's7', async (f) => {
    if (f === 0) await scrollEl(v, '#build', R ? 40 : 0);
    for (const [i, [k, val]] of picks.entries()) {
      if (Math.abs(f - (6 + i * BAR / 4)) < .5) {
        await v.page.evaluate(([k, val]) => {
          if (k === 'submit') document.querySelector('#buildForm button[type=submit]').click();
          else document.querySelector(val ? `input[name="${k}"][value="${val}"]` : `input[name="${k}"]`).closest('label').click();
        }, [k, val]);
        ev('s7', f, k === 'submit' ? 'slam' : 'key');
      }
    }
  });
}

// S8 footer: T-H-O-C-K pressed on eighths, then the end card slams in
{
  const endAt = Math.round(BAR * (R ? 1 : 2));
  await scene(v, 's8', async (f) => {
    if (f === 0) {
      await v.page.evaluate(() => { document.getElementById('toast').classList.remove('is-on'); });
      await scrollEl(v, '.ftr', R ? -120 : -60);
    }
    for (let i = 0; i < 5; i++) {
      const fi = Math.round(3 + i * E8);
      if (f === fi) { await v.page.evaluate((i) => document.querySelectorAll('#ftrBig .kc')[i].classList.add('is-down'), i); ev('s8', f, 'key'); }
      if (f === fi + 4) await v.page.evaluate((i) => document.querySelectorAll('#ftrBig .kc')[i].classList.remove('is-down'), i);
    }
    let html = '';
    if (f >= endAt) {
      if (f === endAt) ev('s8', f, 'slam');
      const a = ease.out(Math.min(1, (f - endAt) / 6));
      html = `<div class="end" style="--gap:${R ? 22 : 30}px;--lw:${R ? 340 : 760}px;transform:translateY(${(1 - a) * -100}%)">
        <img src="/assets/brand/wordmark.png" alt="">
        <div class="pill" style="--ps:${R ? 20 : 34}px">thock.yan.io.vn</div>
        <div class="small" style="--ss:${R ? 13 : 20}px">TYPE ANYTHING · pre-orders opening soon</div></div>`;
    }
    await overlay(v, html);
  });
}

await ensureDir(`frames/${V}`);
if (!ONLY) writeFileSync(`frames/${V}/events.json`, JSON.stringify(events.sort((a, b) => a.f - b.f), null, 0));
writeFileSync(`frames/${V}/errors.json`, JSON.stringify(v.errors));
console.log('events', events.length, 'errors', v.errors.length);
await v.close();

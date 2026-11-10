import * as sound from './sound.js';
import { MOBILE, FINE, RM, PALETTE } from './util.js';

// [label, code, width(u), flags]  flags: a=accent, b=accent2, k=knob, g=gap-after
const DESK = [
  [['Esc', 'Escape', 1, 'a'], ['', '', .25, 'g'], ['F1', 'F1'], ['F2', 'F2'], ['F3', 'F3'], ['F4', 'F4'], ['', '', .25, 'g'], ['F5', 'F5'], ['F6', 'F6'], ['F7', 'F7'], ['F8', 'F8'], ['', '', .25, 'g'], ['F9', 'F9'], ['F10', 'F10'], ['F11', 'F11'], ['F12', 'F12'], ['', '', .25, 'g'], ['Del', 'Delete'], ['', 'knob', 1, 'k']],
  [['~', 'Backquote'], ['1', 'Digit1'], ['2', 'Digit2'], ['3', 'Digit3'], ['4', 'Digit4'], ['5', 'Digit5'], ['6', 'Digit6'], ['7', 'Digit7'], ['8', 'Digit8'], ['9', 'Digit9'], ['0', 'Digit0'], ['-', 'Minus'], ['=', 'Equal'], ['⌫', 'Backspace', 2], ['Home', 'Home']],
  [['Tab', 'Tab', 1.5], ['Q', 'KeyQ'], ['W', 'KeyW'], ['E', 'KeyE'], ['R', 'KeyR'], ['T', 'KeyT'], ['Y', 'KeyY'], ['U', 'KeyU'], ['I', 'KeyI'], ['O', 'KeyO'], ['P', 'KeyP'], ['[', 'BracketLeft'], [']', 'BracketRight'], ['\\', 'Backslash', 1.5], ['PgUp', 'PageUp']],
  [['Caps', 'CapsLock', 1.75], ['A', 'KeyA'], ['S', 'KeyS'], ['D', 'KeyD'], ['F', 'KeyF'], ['G', 'KeyG'], ['H', 'KeyH'], ['J', 'KeyJ'], ['K', 'KeyK'], ['L', 'KeyL'], [';', 'Semicolon'], ["'", 'Quote'], ['Enter', 'Enter', 2.25, 'a'], ['PgDn', 'PageDown']],
  [['Shift', 'ShiftLeft', 2.25], ['Z', 'KeyZ'], ['X', 'KeyX'], ['C', 'KeyC'], ['V', 'KeyV'], ['B', 'KeyB'], ['N', 'KeyN'], ['M', 'KeyM'], [',', 'Comma'], ['.', 'Period'], ['/', 'Slash'], ['Shift', 'ShiftRight', 1.75], ['↑', 'ArrowUp', 1, 'b'], ['End', 'End']],
  [['Ctrl', 'ControlLeft', 1.25], ['Win', 'MetaLeft', 1.25], ['Alt', 'AltLeft', 1.25], ['', 'Space', 6.25], ['Alt', 'AltRight'], ['Fn', 'Fn'], ['Ctrl', 'ControlRight'], ['←', 'ArrowLeft', 1, 'b'], ['↓', 'ArrowDown', 1, 'b'], ['→', 'ArrowRight', 1, 'b']],
];
const PHONE = [
  [['Q', 'KeyQ'], ['W', 'KeyW'], ['E', 'KeyE'], ['R', 'KeyR'], ['T', 'KeyT'], ['Y', 'KeyY'], ['U', 'KeyU'], ['I', 'KeyI'], ['O', 'KeyO'], ['P', 'KeyP']],
  [['', '', .5, 'g'], ['A', 'KeyA'], ['S', 'KeyS'], ['D', 'KeyD'], ['F', 'KeyF'], ['G', 'KeyG'], ['H', 'KeyH'], ['J', 'KeyJ'], ['K', 'KeyK'], ['L', 'KeyL']],
  [['⇧', 'ShiftLeft', 1.5], ['Z', 'KeyZ'], ['X', 'KeyX'], ['C', 'KeyC'], ['V', 'KeyV'], ['B', 'KeyB'], ['N', 'KeyN'], ['M', 'KeyM'], ['⌫', 'Backspace', 1.5, 'a']],
  [['Esc', 'Escape', 1.5, 'a'], ['', 'Space', 6], ['Enter', 'Enter', 2.5, 'a']],
];
const PLACEHOLDER = 'TYPE ANYTHING.';

export function initKeyboard({ getSwitch }) {
  const kb = document.getElementById('kb');
  const typedEl = document.getElementById('typed');
  const hero = document.getElementById('type');
  const keys = new Map();
  const layout = MOBILE ? PHONE : DESK;

  for (const row of layout) {
    const r = document.createElement('div');
    r.className = 'kb__row';
    for (const [label, code, w = 1, flags = ''] of row) {
      if (flags.includes('g')) { const g = document.createElement('span'); g.className = 'kb__gap'; g.style.width = `calc(var(--u) * ${w})`; r.appendChild(g); continue; }
      const k = document.createElement('button');
      k.type = 'button';
      k.className = 'key' + (flags.includes('a') ? ' key--acc' : '') + (flags.includes('b') ? ' key--acc2' : '') + (flags.includes('k') ? ' key--knob' : '');
      k.style.setProperty('--w', w);
      k.textContent = label;
      k.dataset.code = code;
      k.tabIndex = -1;
      k.setAttribute('aria-label', label || code);
      r.appendChild(k);
      if (code) keys.set(code, k);
    }
    kb.appendChild(r);
  }

  // ---------- typed headline ----------
  let text = '', fresh = true;
  const render = () => { typedEl.textContent = fresh ? PLACEHOLDER : (text || ' '); };
  function typeChar(ch) {
    if (fresh) { fresh = false; text = ''; }
    // keep whole words visible: long lines wrap (CSS) instead of chopping the first letters off
    text = (text + ch).slice(-24);
    render();
  }
  function backspace() { if (fresh) { fresh = false; text = ''; } text = text.slice(0, -1); render(); }

  // ---------- visual press + wave ----------
  function press(code, down = true) {
    const k = keys.get(code);
    if (!k) return null;
    k.classList.toggle('is-down', down);
    if (down && !RM) wave(k);
    return k;
  }
  function wave(origin) {
    const o = origin.getBoundingClientRect();
    const ox = o.left + o.width / 2, oy = o.top + o.height / 2;
    keys.forEach((k) => {
      if (k === origin) return;
      const r = k.getBoundingClientRect();
      const d = Math.hypot(r.left + r.width / 2 - ox, r.top + r.height / 2 - oy);
      if (d > 420) return;
      setTimeout(() => { k.classList.add('is-wave'); setTimeout(() => k.classList.remove('is-wave'), 110); }, d * .9);
    });
  }

  // ---------- physics: keycaps that drop on the page ----------
  const phys = initPhysics(hero, kb);

  function hit(code, key) {
    const k = press(code, true);
    const sw = code === 'Space' ? 'space' : getSwitch();
    sound.play(sw);
    if (key === 'Backspace' || code === 'Backspace') { backspace(); return; }
    if (key === 'Enter' || code === 'Enter') { phys.drop('⏎', k); return; }
    if (key === ' ' || code === 'Space') { typeChar(' '); return; }
    const ch = key && key.length === 1 ? key.toUpperCase() : (k && k.textContent.length === 1 ? k.textContent : '');
    if (!ch) return;
    typeChar(ch);
    phys.drop(ch, k);
  }

  // pointer / touch on the on-screen keys
  kb.addEventListener('pointerdown', (e) => {
    const k = e.target.closest('.key');
    if (!k || !k.dataset.code) return;
    e.preventDefault();
    const code = k.dataset.code;
    hit(code, code === 'Space' ? ' ' : code === 'Backspace' ? 'Backspace' : code === 'Enter' ? 'Enter' : k.textContent);
    const up = () => { press(code, false); removeEventListener('pointerup', up); };
    addEventListener('pointerup', up);
  });

  // physical keyboard: only while the hero is on screen
  let heroVisible = true;
  new IntersectionObserver(([en]) => { heroVisible = en.intersectionRatio > .35; phys.setActive(en.isIntersecting); }, { threshold: [0, .35, .6] }).observe(hero);

  document.getElementById('clearCaps').addEventListener('click', () => phys.clear());
  render();

  return {
    keys, press, hit, phys,
    /** returns true if the hero consumed the key */
    handleKey(e, down) {
      if (!heroVisible) return false;
      if (/^Digit[1-6]$/.test(e.code) && !e.shiftKey) return false; // digits 1-6 = navigation
      if (e.ctrlKey || e.metaKey || e.altKey) return false;
      if (e.key === 'Tab') return false; // keep focus navigation working
      if (!keys.has(e.code) && e.key.length !== 1) return false;
      if (!down) { press(e.code, false); return true; }
      if (e.repeat) return true;
      hit(e.code, e.key);
      return true;
    },
    typeWord(word) { for (const ch of word) typeChar(ch); },
  };
}

function initPhysics(hero, kb) {
  const cv = document.getElementById('physics');
  const ctx = cv.getContext('2d');
  const M = window.Matter;
  if (!M) return { drop() {}, clear() {}, setActive() {} };
  const { Engine, Bodies, Composite, Body, Mouse, MouseConstraint } = M;
  const engine = Engine.create({ gravity: { y: 1.1 } });
  const world = engine.world;
  const caps = [];
  let walls = [], w = 0, h = 0, dpr = 1, active = true;
  const SIZE = MOBILE ? 40 : 62;

  function layout() {
    dpr = Math.min(devicePixelRatio || 1, 2);
    w = hero.clientWidth; h = hero.clientHeight;
    cv.width = w * dpr; cv.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    Composite.remove(world, walls);
    const hr = hero.getBoundingClientRect(), kr = kb.getBoundingClientRect();
    const kx = kr.left - hr.left + kr.width / 2, ky = kr.top - hr.top + kr.height / 2;
    walls = [
      Bodies.rectangle(w / 2, h + 40, w * 2, 80, { isStatic: true }),
      Bodies.rectangle(-40, h / 2, 80, h * 3, { isStatic: true }),
      Bodies.rectangle(w + 40, h / 2, 80, h * 3, { isStatic: true }),
      // the keyboard itself is a shelf: caps land on it
      Bodies.rectangle(kx, ky, kr.width, kr.height, { isStatic: true, chamfer: { radius: 18 } }),
    ];
    Composite.add(world, walls);
  }
  layout();
  // the hero changes height as fonts and images arrive: keep the floor and shelf where they really are
  new ResizeObserver(() => { clearTimeout(layout.t); layout.t = setTimeout(layout, 120); }).observe(hero);

  if (FINE) {
    const mouse = Mouse.create(cv);
    mouse.pixelRatio = 1;
    // Matter grabs the wheel; give scrolling back to the page
    cv.removeEventListener('mousewheel', mouse.mousewheel);
    cv.removeEventListener('DOMMouseScroll', mouse.mousewheel);
    cv.removeEventListener('wheel', mouse.mousewheel);
    const mc = MouseConstraint.create(engine, { mouse, constraint: { stiffness: .2, render: { visible: false } } });
    Composite.add(world, mc);
    // only catch pointer events when over a cap, so the page under it stays clickable
    cv.style.pointerEvents = 'none';
    hero.addEventListener('pointermove', (e) => {
      const r = cv.getBoundingClientRect();
      const p = { x: e.clientX - r.left, y: e.clientY - r.top };
      const over = M.Query.point(caps.map((c) => c.body), p).length > 0;
      cv.style.pointerEvents = over || mc.body ? 'auto' : 'none';
      cv.classList.toggle('is-grab', over);
    });
  } else {
    cv.style.pointerEvents = 'none';
  }

  function drop(ch, keyEl) {
    const hr = hero.getBoundingClientRect();
    let x = w / 2 + (Math.random() - .5) * w * .5;
    if (keyEl) { const r = keyEl.getBoundingClientRect(); x = r.left - hr.left + r.width / 2; }
    const b = Bodies.rectangle(x, -SIZE, SIZE, SIZE, { chamfer: { radius: SIZE * .2 }, restitution: .35, friction: .4, density: .002 });
    Body.setVelocity(b, { x: (Math.random() - .5) * 6, y: 4 });
    Body.setAngularVelocity(b, (Math.random() - .5) * .3);
    Composite.add(world, b);
    caps.push({ body: b, ch, color: PALETTE[Math.floor(Math.random() * PALETTE.length)] });
    if (caps.length > (MOBILE ? 40 : 80)) Composite.remove(world, caps.shift().body);
  }
  function clear() { caps.splice(0).forEach((c) => Composite.remove(world, c.body)); }

  function rr(x, y, s, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.arcTo(x + s, y, x + s, y + s, r); ctx.arcTo(x + s, y + s, x, y + s, r);
    ctx.arcTo(x, y + s, x, y, r); ctx.arcTo(x, y, x + s, y, r); ctx.closePath();
  }
  function draw() {
    ctx.clearRect(0, 0, w, h);
    const s = SIZE, hs = s / 2;
    ctx.font = `400 ${s * .5}px "Archivo Black", Impact, sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (const c of caps) {
      const { x, y } = c.body.position;
      ctx.save(); ctx.translate(x, y); ctx.rotate(c.body.angle);
      ctx.fillStyle = '#111'; rr(-hs + 4, -hs + 6, s, s * .2); ctx.fill();           // hard shadow
      ctx.fillStyle = c.color; rr(-hs, -hs, s, s * .2); ctx.fill();
      ctx.lineWidth = 3; ctx.strokeStyle = '#111'; ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,.35)'; rr(-hs + s * .14, -hs + s * .1, s * .72, s * .62, s * .14); ctx.fill(); // dished top
      ctx.fillStyle = c.color === '#3A5BFF' ? '#fff' : '#111';
      ctx.fillText(c.ch, 0, -s * .04);
      ctx.restore();
    }
  }
  // fixed 1/120 s steps: same fall speed on a 30 fps phone and a 144 Hz monitor
  let last = performance.now(), acc = 0;
  const STEP = 1000 / 120;
  function loop(now) {
    requestAnimationFrame(loop);
    if (!active) return;
    acc += Math.min(100, now - last); last = now;
    while (acc >= STEP) { Engine.update(engine, STEP); acc -= STEP; }
    draw();
  }
  requestAnimationFrame(loop);
  return { drop, clear, setActive(on) { active = on; last = performance.now(); }, layout, count: () => caps.length,
    debug: () => ({ active, w, h, caps: caps.map((c) => [Math.round(c.body.position.x), Math.round(c.body.position.y)]) }) };
}

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import * as sound from './sound.js';
import { RM, MOBILE, FINE, imgUrl, toast } from './util.js';

export function initSections(api) {
  initXray();
  initSwitches(api);
  initColors(api);
  initRiso();
  return { race: initRace(api) };
}

/* ---------- X-RAY: a scan line develops the photo, layer tags pop as it passes ---------- */
function initXray() {
  const color = document.getElementById('xrayColor');
  const line = document.getElementById('xrayLine');
  const pct = document.getElementById('xrayPct');
  const tags = [...document.querySelectorAll('#xrayTags li')];
  tags.forEach((t) => { t.style.top = `calc(${parseFloat(t.dataset.y) * 100}% - 18px)`; });
  let lastOn = -1;
  const set = (p) => {
    const y = p * 100;
    color.style.clipPath = `inset(0 0 ${100 - y}% 0)`;
    line.style.top = `${y}%`;
    pct.textContent = `${Math.round(y)}%`;
    let on = -1;
    tags.forEach((t, i) => { const v = p >= parseFloat(t.dataset.y); t.classList.toggle('is-on', v); if (v) on = i; });
    if (on > lastOn) sound.play('clicky', { pitch: 1.4 });
    lastOn = on;
  };
  if (RM) { set(1); return; }
  set(0);
  ScrollTrigger.create({
    trigger: '.xray', pin: '.xray__pin', start: 'top top', end: () => `+=${innerHeight * 1.4}`,
    scrub: .5, onUpdate: (s) => set(gsap.utils.clamp(0, 1, s.progress * 1.12 - .04)),
  });
}

/* ---------- SWITCHES + blind test ---------- */
function initSwitches(api) {
  document.querySelectorAll('[data-play]').forEach((b) => b.addEventListener('click', () => {
    const t = b.dataset.play;
    if (!sound.isOn()) sound.setOn(true);
    sound.play(t); setTimeout(() => sound.play(t), 160); setTimeout(() => sound.play(t), 300);
    const card = b.closest('.sw');
    card.classList.remove('is-played'); void card.offsetWidth; card.classList.add('is-played');
  }));

  const TYPES = ['linear', 'tactile', 'clicky'];
  const q = document.getElementById('blindQ'), msg = document.getElementById('blindMsg'), score = document.getElementById('blindScore');
  const opts = [...document.querySelectorAll('[data-guess]')];
  let round = 0, right = 0, answer = null, done = false, hits = { linear: 0, tactile: 0, clicky: 0 };
  const playMystery = () => {
    if (!answer) answer = TYPES[Math.floor(Math.random() * 3)];
    [0, 170, 330, 470].forEach((d) => setTimeout(() => sound.play(answer, { force: true }), d));
  };
  document.getElementById('blindPlay').addEventListener('click', () => {
    if (done) { round = 0; right = 0; done = false; hits = { linear: 0, tactile: 0, clicky: 0 }; q.textContent = 'Can you hear the difference?'; }
    opts.forEach((o) => o.classList.remove('is-right', 'is-wrong'));
    playMystery();
    msg.textContent = 'Listen… which one was it?';
  });
  opts.forEach((o) => o.addEventListener('click', () => {
    if (!answer || done) { msg.textContent = 'Hit play first.'; return; }
    const g = o.dataset.guess, ok = g === answer;
    o.classList.add(ok ? 'is-right' : 'is-wrong');
    if (!ok) opts.find((x) => x.dataset.guess === answer).classList.add('is-right');
    if (ok) { right++; hits[g]++; }
    round++;
    msg.textContent = ok ? `Yes! That was ${answer}.` : `Nope — it was ${answer}.`;
    answer = null;
    score.textContent = round < 3 ? `Round ${round + 1}/3 · ${right} right` : `${right}/3 right`;
    if (round >= 3) {
      done = true;
      const fav = Object.entries(hits).sort((a, b) => b[1] - a[1])[0];
      const pick = fav[1] > 0 ? fav[0] : 'tactile';
      q.textContent = right === 3 ? 'Golden ears. 3/3.' : `${right}/3 — not bad.`;
      msg.innerHTML = `Your ears like <b>${pick}</b>. <a href="#build" data-pick="${pick}">Put it in my build →</a>`;
      msg.querySelector('a').addEventListener('click', () => api.setSwitch(pick));
    }
  }));
}

/* ---------- COLORWAYS: a color block slams down, the screen shakes, the board changes ---------- */
const CW = {
  bone: { name: 'Bone.', line: 'Warm cream, orange accents. The one that started it.', bg: '#3DDC97', slam: '#FF5A1F' },
  ink: { name: 'Ink.', line: 'Matte black, electric-blue Esc. Built for 2 a.m. commits.', bg: '#FF5A1F', slam: '#111111' },
  pop: { name: 'Pop.', line: 'Yellow case, candy mods. Loud on purpose.', bg: '#3A5BFF', slam: '#FFD23F' },
};
function initColors(api) {
  const stage = document.getElementById('colorStage');
  const slam = document.getElementById('slam'), word = document.getElementById('slamWord');
  const img = document.getElementById('cwImg');
  const btns = [...document.querySelectorAll('.cw')];
  let cur = 'bone', busy = false;
  Object.keys(CW).forEach((k) => { const i = new Image(); i.src = imgUrl(`kb-${k}-top`); });
  stage.style.setProperty('--bg', CW.bone.bg);

  const apply = (k) => {
    const c = CW[k];
    stage.style.setProperty('--bg', c.bg);
    img.src = imgUrl(`kb-${k}-top`); img.alt = `THOCK 75 in ${k}`;
    document.getElementById('cwName').textContent = c.name;
    document.getElementById('cwLine').textContent = c.line;
    document.body.dataset.theme = k;
    btns.forEach((b) => { const on = b.dataset.cw === k; b.classList.toggle('is-on', on); b.setAttribute('aria-checked', on); });
  };
  const go = (k) => {
    if (k === cur || busy) return;
    cur = k;
    if (RM) { apply(k); return; }
    busy = true;
    word.textContent = k.toUpperCase();
    slam.style.background = CW[k].slam;
    word.style.color = k === 'ink' ? '#F4EFE6' : '#111';
    gsap.timeline({ onComplete: () => { busy = false; } })
      .set(slam, { yPercent: -101 })
      .to(slam, { yPercent: 0, duration: .26, ease: 'power4.in' })
      .add(() => { sound.play('space'); apply(k); stage.classList.remove('shake'); void stage.offsetWidth; stage.classList.add('shake'); })
      .from(word, { scale: 1.3, duration: .3, ease: 'back.out(3)' }, '<')
      .to(slam, { yPercent: 101, duration: .5, ease: 'power3.inOut' }, '+=.25')
      .fromTo(img, { y: -30, rotate: -2 }, { y: 0, rotate: 0, duration: .6, ease: 'elastic.out(1, .5)' }, '<+.15');
  };
  btns.forEach((b) => b.addEventListener('click', () => go(b.dataset.cw)));
  api.onColor = go;
}

/* ---------- RISO: halftone print, a lens develops the color photo ---------- */
function initRiso() {
  document.querySelectorAll('.ph').forEach((f) => {
    f.addEventListener('pointermove', (e) => {
      const r = f.getBoundingClientRect();
      f.style.setProperty('--mx', `${((e.clientX - r.left) / r.width) * 100}%`);
      f.style.setProperty('--my', `${((e.clientY - r.top) / r.height) * 100}%`);
    });
    if (!FINE) f.addEventListener('click', () => f.classList.toggle('is-dev'));
  });
}

/* ---------- RACE: type against a 60 WPM ghost, get a poster ---------- */
const LINES = [
  'the quick brown fox jumps over the lazy dog while my keyboard goes thock',
  'gasket mount and hot swap switches make every keystroke sound like rain',
  'type fast break nothing ship it before lunch and enjoy the sound',
];
function initRace(api) {
  const box = document.getElementById('raceText');
  const you = document.getElementById('raceYou'), ghost = document.getElementById('raceGhost');
  const wpmEl = document.getElementById('wpm'), accEl = document.getElementById('acc');
  const needle = document.getElementById('needle'), arc = document.getElementById('gaugeArc');
  const startBtn = document.getElementById('raceStart'), posterBtn = document.getElementById('posterBtn');
  let text = LINES[0], pos = 0, errors = 0, t0 = 0, active = false, timer = 0, last = { wpm: 0, acc: 100 };

  const paint = () => {
    box.innerHTML = [...text].map((c, i) => `<span class="${i < pos ? 'ok' : i === pos ? 'cur' : ''}">${c}</span>`).join('');
  };
  const stats = () => {
    const min = Math.max(1 / 60, (performance.now() - t0) / 60000);
    const wpm = Math.round(pos / 5 / min);
    const acc = Math.max(0, Math.round(100 * pos / Math.max(1, pos + errors)));
    wpmEl.textContent = wpm; accEl.textContent = `${acc}%`;
    const k = Math.min(1, wpm / 120);
    needle.style.transform = `rotate(${-90 + 180 * k}deg)`;
    arc.style.strokeDashoffset = String(252 * (1 - k));
    you.style.width = `${(pos / text.length) * 100}%`;
    ghost.style.width = `${Math.min(100, (((performance.now() - t0) / 60000) * 60 * 5 / text.length) * 100)}%`;
    last = { wpm, acc };
  };
  const finish = (won) => {
    active = false; cancelAnimationFrame(timer);
    stats();
    startBtn.textContent = 'Race again (Enter)';
    posterBtn.hidden = false;
    toast(won ? `You beat the ghost — ${last.wpm} WPM!` : `${last.wpm} WPM. The ghost wins this time.`);
  };
  const start = () => {
    text = LINES[Math.floor(Math.random() * LINES.length)];
    pos = 0; errors = 0; t0 = performance.now(); active = true; posterBtn.hidden = true;
    startBtn.textContent = 'Racing… (Esc to stop)';
    paint();
    const tick = () => { if (!active) return; stats(); if (performance.now() - t0 > 60000) return finish(false); timer = requestAnimationFrame(tick); };
    tick();
    document.getElementById('race').scrollIntoView({ block: 'center', behavior: RM ? 'auto' : 'smooth' });
  };
  startBtn.addEventListener('click', () => (active ? finish(false) : start()));
  posterBtn.addEventListener('click', () => poster(last, document.body.dataset.theme || 'bone'));
  paint();

  return {
    get active() { return active; },
    start,
    handleKey(e) {
      if (!active) return false;
      if (e.key === 'Escape') { finish(false); return true; }
      if (e.key.length !== 1) return e.key === 'Backspace';
      e.preventDefault();
      sound.play(api.getSwitch());
      if (e.key === text[pos]) {
        pos++; paint();
        if (pos >= text.length) {
          const ghostDone = ((performance.now() - t0) / 60000) * 60 * 5 >= text.length;
          finish(!ghostDone);
        }
      } else { errors++; box.classList.remove('shake'); void box.offsetWidth; box.classList.add('shake'); }
      return true;
    },
  };
}

/* poster: a brutalist share card drawn on canvas, downloaded as PNG */
async function poster({ wpm, acc }, theme) {
  const c = document.createElement('canvas');
  c.width = 1080; c.height = 1350;
  const x = c.getContext('2d');
  await document.fonts.load('400 100px "Archivo Black"').catch(() => {});
  const bg = { bone: '#FFD23F', ink: '#FF5A1F', pop: '#3A5BFF' }[theme] || '#FFD23F';
  x.fillStyle = bg; x.fillRect(0, 0, 1080, 1350);
  // halftone dots
  x.fillStyle = 'rgba(17,17,17,.12)';
  for (let i = 0; i < 1080; i += 24) for (let j = 0; j < 1350; j += 24) { x.beginPath(); x.arc(i, j, 3, 0, 7); x.fill(); }
  const card = (l, t, w, h, fill) => { x.fillStyle = '#111'; x.fillRect(l + 14, t + 14, w, h); x.fillStyle = fill; x.fillRect(l, t, w, h); x.lineWidth = 8; x.strokeStyle = '#111'; x.strokeRect(l, t, w, h); };
  card(70, 90, 940, 520, '#F4EFE6');
  x.fillStyle = '#111'; x.font = '400 300px "Archivo Black", Impact'; x.textAlign = 'center'; x.textBaseline = 'alphabetic';
  x.fillText(String(wpm), 540, 420);
  x.font = '400 70px "Archivo Black", Impact'; x.fillText('WPM', 540, 520);
  x.save(); x.translate(820, 640); x.rotate(.08); card(-170, -60, 340, 120, '#3DDC97');
  x.fillStyle = '#111'; x.font = '400 54px "Archivo Black", Impact'; x.fillText(`${acc}% ACC`, 0, 20); x.restore();
  try {
    const img = new Image(); img.src = imgUrl(`kb-${theme}-top`, true);
    await img.decode();
    const w = 900, h = w * img.height / img.width;
    x.drawImage(img, 90, 760, w, h);
  } catch { /* poster still works without the photo */ }
  x.fillStyle = '#111'; x.font = '400 64px "Archivo Black", Impact'; x.textAlign = 'left';
  x.fillText('I RACED THE GHOST', 70, 1180);
  x.font = '700 34px "JetBrains Mono", monospace'; x.fillText('on a THOCK 75 · thock.yan.io.vn', 70, 1250);
  const a = document.createElement('a');
  a.download = `thock-${wpm}wpm.png`;
  a.href = c.toDataURL('image/png');
  a.click();
  toast('Poster saved — post it!');
}

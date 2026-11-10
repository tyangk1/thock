import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import * as sound from './sound.js';
import { RM, FINE, imgUrl, inField, toast } from './util.js';
import { initKeyboard } from './keyboard.js';
import { initSections } from './sections.js';
import { initShop } from './shop.js';

gsap.registerPlugin(ScrollTrigger);

// ---------- images ----------
document.querySelectorAll('img[data-src]').forEach((img) => {
  const eager = img.closest('.hero, .xray');
  img.loading = eager ? 'eager' : 'lazy';
  img.decoding = 'async';
  img.src = imgUrl(img.dataset.src);
  img.removeAttribute('data-src');
});

// ---------- smooth scroll ----------
let lenis = null;
if (!RM) {
  lenis = new Lenis({ lerp: .12, smoothWheel: true, prevent: () => false });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  lenis.stop();
}
const scrollToEl = (el) => { if (!el) return; if (lenis) lenis.scrollTo(el, { duration: 1.1 }); else el.scrollIntoView({ behavior: RM ? 'auto' : 'smooth' }); };
document.addEventListener('thock:lock', () => lenis?.stop());
document.addEventListener('thock:unlock', () => lenis?.start());
document.addEventListener('click', (e) => {
  const a = e.target.closest('a[href^="#"]');
  if (!a || a.getAttribute('href').length < 2) return;
  e.preventDefault();
  scrollToEl(document.querySelector(a.getAttribute('href')));
});

// ---------- modules ----------
const api = { getSwitch: () => 'linear', setSwitch: () => {}, closeDrawer: () => false };
initShop(api);
const kb = initKeyboard({ getSwitch: () => api.getSwitch() });
const { race } = initSections(api);

// ---------- sound toggle ----------
const soundBtn = document.getElementById('soundBtn');
const paintSound = (on) => { soundBtn.setAttribute('aria-pressed', on); soundBtn.textContent = on ? '🔊 Sound on' : '🔇 Sound off'; };
soundBtn.addEventListener('click', () => { sound.setOn(!sound.isOn()); if (sound.isOn()) sound.play('linear'); });
sound.onChange(paintSound);

// ---------- keyboard-first navigation ----------
const SECTIONS = ['#type', '#xray', '#switches', '#colors', '#race', '#build'];
const navLinks = [...document.querySelectorAll('.nav a')];
function nextSection(dir = 1) {
  const y = scrollY + innerHeight * .4;
  const tops = [...document.querySelectorAll('main > section')].map((s) => s.getBoundingClientRect().top + scrollY);
  const target = dir > 0 ? tops.find((t) => t > y + 10) : [...tops].reverse().find((t) => t < y - innerHeight * .5);
  if (target !== undefined) { if (lenis) lenis.scrollTo(target, { duration: 1 }); else scrollTo({ top: target, behavior: 'smooth' }); }
}
addEventListener('keydown', (e) => {
  if (inField()) return;
  if (race.handleKey(e)) return;
  if (e.key === 'Escape' && api.closeDrawer()) return;
  if (kb.handleKey(e, true)) { if (e.key === ' ' || e.key === 'Tab' || e.key.startsWith('Arrow') || e.key === 'Backspace' || e.key === "'" || e.key === '/') e.preventDefault(); return; }
  if (/^Digit[1-6]$/.test(e.code)) { e.preventDefault(); const i = +e.code.slice(5) - 1; scrollToEl(document.querySelector(SECTIONS[i])); pressNav(i); return; }
  if (e.key === 'Enter' && document.getElementById('race').getBoundingClientRect().top < innerHeight * .6 && document.getElementById('race').getBoundingClientRect().bottom > 0 && !race.active) { e.preventDefault(); race.start(); return; }
  if (e.key === ' ' || e.key === 'PageDown') { if (document.activeElement?.tagName === 'BUTTON') return; e.preventDefault(); nextSection(1); }
});
addEventListener('keyup', (e) => { kb.handleKey(e, false); });
function pressNav(i) {
  const k = navLinks[i]?.querySelector('kbd');
  if (!k) return;
  k.style.transform = 'translate(2px,2px)'; k.style.boxShadow = 'none';
  setTimeout(() => { k.style.transform = ''; k.style.boxShadow = ''; }, 140);
  sound.play('linear');
}
SECTIONS.forEach((sel, i) => ScrollTrigger.create({ trigger: sel, start: 'top 50%', end: 'bottom 50%', onToggle: (s) => navLinks[i]?.classList.toggle('is-on', s.isActive) }));

// ---------- keycap cursor ----------
if (FINE && !RM) {
  const cur = document.getElementById('cursor');
  addEventListener('pointermove', (e) => { cur.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`; }, { passive: true });
  addEventListener('pointerdown', () => cur.classList.add('is-down'));
  addEventListener('pointerup', () => cur.classList.remove('is-down'));
}

// ---------- footer keys ----------
document.querySelectorAll('#ftrBig .kc').forEach((k) => k.addEventListener('pointerdown', () => {
  k.classList.add('is-down'); sound.play('space', { pitch: .9 + Math.random() * .3 });
  setTimeout(() => k.classList.remove('is-down'), 120);
}));

// ---------- loader: T-H-O-C-K types itself ----------
(function loader() {
  const el = document.getElementById('loader');
  const keys = [...el.querySelectorAll('.kc')];
  const pct = document.getElementById('loadPct');
  const imgs = [...document.querySelectorAll('.hero img, .xray img')];
  let done = 0;
  const all = Promise.all([document.fonts.ready, ...imgs.map((i) => new Promise((r) => { if (i.complete) r(); else { i.onload = i.onerror = r; } }))].map((p) => p.then(() => { done++; pct.textContent = String(Math.round(done / (imgs.length + 1) * 100)); })));
  const finish = () => {
    el.remove();
    document.body.classList.remove('is-loading');
    lenis?.start();
    ScrollTrigger.refresh();
    kb.phys.layout?.();
  };
  if (RM) { all.then(finish); return; }
  const tl = gsap.timeline({ paused: true, onComplete: finish });
  keys.forEach((k, i) => {
    tl.add(() => { k.classList.add('is-down'); sound.play('linear'); }, i * .16)
      .add(() => k.classList.remove('is-down'), i * .16 + .1);
  });
  tl.to(el, { yPercent: -100, duration: .55, ease: 'power3.inOut' }, '+=.25');
  tl.from('.hero__type', { yPercent: 40, opacity: 0, duration: .6, ease: 'back.out(2)' }, '-=.25');
  tl.from('.kb', { y: 80, opacity: 0, duration: .6, ease: 'back.out(1.6)' }, '<+.1');
  all.then(() => tl.play());
  gsap.delayedCall(8, () => tl.progress() === 0 && tl.play());
})();

// test hook (screenshots / video capture)
window.__thock = {
  y(y) { if (lenis) lenis.scrollTo(y, { immediate: true, force: true }); else scrollTo(0, y); ScrollTrigger.update(); },
  el(sel, frac = 0) {
    const all = ScrollTrigger.getAll().filter((s) => s.trigger && s.trigger.matches(sel));
    const st = all.find((s) => s.pin) || all[0];
    const y = st ? st.start + (st.end - st.start) * frac : document.querySelector(sel).getBoundingClientRect().top + scrollY;
    this.y(y);
  },
  kb, race, api,
};

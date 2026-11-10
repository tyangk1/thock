import gsap from 'gsap';
import * as sound from './sound.js';
import { RM, imgUrl, toast } from './util.js';

const BASE = 149;
const KEY = 'thock.box.v1';
const NAMES = { bone: 'Bone', ink: 'Ink', pop: 'Pop' };

export function initShop(api) {
  const form = document.getElementById('buildForm');
  const img = document.getElementById('buildImg');
  const priceEl = document.getElementById('buildPrice');
  const boxBtn = document.getElementById('boxBtn'), countEl = document.getElementById('boxCount');
  const drawer = document.getElementById('drawer'), list = document.getElementById('boxList');
  let box = load();

  function load() { try { const v = JSON.parse(localStorage.getItem(KEY) || '[]'); return Array.isArray(v) ? v.filter((i) => i && i.price > 0) : []; } catch { return []; } }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(box)); } catch { /* private mode */ } }

  const read = () => {
    const f = new FormData(form);
    const o = { case: f.get('case'), sw: f.get('sw'), knob: !!f.get('knob'), artisan: !!f.get('artisan'), cable: !!f.get('cable') };
    o.price = BASE + (o.sw !== 'linear' ? 5 : 0) + (o.artisan ? 15 : 0) + (o.cable ? 19 : 0);
    return o;
  };
  let lastCase = 'bone';
  const update = () => {
    const o = read();
    priceEl.textContent = `$${o.price}`;
    if (o.case !== lastCase) {
      lastCase = o.case;
      img.src = imgUrl(`kb-${o.case}-top`);
      if (!RM) gsap.fromTo(img, { scale: .92, rotate: -2 }, { scale: 1, rotate: 0, duration: .5, ease: 'elastic.out(1, .5)' });
    }
    if (!RM) gsap.fromTo(priceEl, { scale: 1.25 }, { scale: 1, duration: .35, ease: 'back.out(3)' });
  };
  form.addEventListener('change', () => { sound.play(read().sw); update(); });
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const o = read();
    box.push({ ...o, id: Date.now() });
    save();
    sound.play('space');
    fly(() => { renderCount(true); });
    toast(`THOCK 75 ${NAMES[o.case]} · ${o.sw} — in the box!`);
    render();
  });
  api.setSwitch = (sw) => { form.querySelector(`input[name="sw"][value="${sw}"]`).checked = true; update(); };
  api.getSwitch = () => read().sw;

  // a keycap flies from the preview into the box button
  function fly(done) {
    if (RM) { done(); return; }
    const a = img.getBoundingClientRect(), b = boxBtn.getBoundingClientRect();
    const cap = document.createElement('div');
    cap.className = 'kc'; cap.textContent = 'T';
    Object.assign(cap.style, { position: 'fixed', left: '0', top: '0', zIndex: 150, width: '64px', height: '64px', fontSize: '30px', background: '#FF5A1F' });
    document.body.appendChild(cap);
    const sx = a.left + a.width / 2 - 32, sy = a.top + a.height / 2 - 32, tx = b.left + b.width / 2 - 32, ty = b.top + b.height / 2 - 32;
    gsap.timeline({ onComplete: () => { cap.remove(); done(); } })
      .set(cap, { x: sx, y: sy, rotate: -20 })
      .to(cap, { x: tx, duration: .8, ease: 'power1.inOut' }, 0)
      .to(cap, { y: Math.min(sy, ty) - 160, duration: .36, ease: 'power2.out' }, 0)
      .to(cap, { y: ty, duration: .44, ease: 'power2.in' }, .36)
      .to(cap, { rotate: 380, scale: .4, duration: .8 }, 0);
  }
  function renderCount(bump) {
    countEl.textContent = String(box.length);
    if (bump && !RM) gsap.fromTo(boxBtn, { rotate: -8, scale: 1.2 }, { rotate: 0, scale: 1, duration: .5, ease: 'elastic.out(1, .4)' });
  }
  function render() {
    list.innerHTML = box.map((o, i) => `<li><b>THOCK 75 · ${NAMES[o.case] || o.case}</b><span>$${o.price}</span>
      <small>${o.sw}${o.knob ? ' · knob' : ''}${o.artisan ? ' · artisan Esc' : ''}${o.cable ? ' · coiled cable' : ''}</small><button data-rm="${i}">remove</button></li>`).join('');
    document.getElementById('boxEmpty').hidden = box.length > 0;
    document.getElementById('boxTotal').textContent = `$${box.reduce((s, o) => s + o.price, 0)}`;
  }
  list.addEventListener('click', (e) => { const b = e.target.closest('[data-rm]'); if (!b) return; box.splice(+b.dataset.rm, 1); save(); render(); renderCount(); });
  const open = () => { drawer.hidden = false; document.dispatchEvent(new Event('thock:lock')); if (!RM) gsap.from('.drawer__panel', { x: 60, opacity: 0, duration: .35, ease: 'back.out(2)' }); };
  const close = () => { drawer.hidden = true; document.dispatchEvent(new Event('thock:unlock')); boxBtn.focus({ preventScroll: true }); };
  boxBtn.addEventListener('click', open);
  drawer.addEventListener('click', (e) => { if (e.target.closest('[data-close]')) close(); });
  document.getElementById('checkout').addEventListener('click', () => toast(box.length ? 'Pre-orders open soon — nothing was charged. Your box is saved on this device.' : 'Your box is empty.'));
  api.closeDrawer = () => { if (!drawer.hidden) { close(); return true; } return false; };
  render(); renderCount(); update();
}

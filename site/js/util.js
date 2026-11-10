export const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
export const MOBILE = matchMedia('(max-width: 640px)').matches;
export const FINE = matchMedia('(hover: hover) and (pointer: fine)').matches;
export const imgUrl = (name, forceDesktop = false) => `assets/img/${name}${MOBILE && !forceDesktop ? '-m' : ''}.webp`;
export const PALETTE = ['#FF5A1F', '#FFD23F', '#3A5BFF', '#3DDC97', '#FF8FB1', '#F4EFE6'];

let tt;
export function toast(msg, ms = 2200) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('is-on');
  clearTimeout(tt);
  tt = setTimeout(() => el.classList.remove('is-on'), ms);
}

/** true while the user is typing into a real form field */
export const inField = () => {
  const a = document.activeElement;
  return a && (a.tagName === 'INPUT' && !['radio', 'checkbox'].includes(a.type) || a.tagName === 'TEXTAREA' || a.isContentEditable);
};

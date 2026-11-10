// Keyboard sounds, synthesised with Web Audio (no samples needed).
// "thock" = a short low body + a damped housing knock + a soft top-out tick.
// Off until the visitor turns it on (browsers block autoplay anyway).
let ctx = null, master = null, enabled = false;
const listeners = new Set();

function ensure() {
  if (ctx) return ctx;
  ctx = new (window.AudioContext || window.webkitAudioContext)();
  master = ctx.createGain();
  master.gain.value = 0.55;
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -14;
  master.connect(comp).connect(ctx.destination);
  return ctx;
}

function noiseBuffer(dur) {
  const n = Math.floor(ctx.sampleRate * dur);
  const b = ctx.createBuffer(1, n, ctx.sampleRate);
  const d = b.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
  return b;
}
let NB = null;

function burst(t, { freq, q = 1, dur = 0.04, gain = 0.5, type = 'bandpass' }) {
  const src = ctx.createBufferSource();
  src.buffer = NB;
  const f = ctx.createBiquadFilter();
  f.type = type; f.frequency.value = freq; f.Q.value = q;
  const g = ctx.createGain();
  g.gain.setValueAtTime(gain, t);
  g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
  src.connect(f).connect(g).connect(master);
  src.start(t, Math.random() * 0.5, dur + 0.02);
}

function body(t, { f0, f1, dur, gain }) {
  const o = ctx.createOscillator();
  o.type = 'sine';
  o.frequency.setValueAtTime(f0, t);
  o.frequency.exponentialRampToValueAtTime(f1, t + dur);
  const g = ctx.createGain();
  g.gain.setValueAtTime(gain, t);
  g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
  o.connect(g).connect(master);
  o.start(t); o.stop(t + dur + 0.02);
}

/** type: 'linear' | 'tactile' | 'clicky' | 'space' ; force: plays even when muted (blind test) */
export function play(type = 'linear', { force = false, pitch = 1 } = {}) {
  if (!enabled && !force) return;
  ensure();
  if (ctx.state === 'suspended') ctx.resume();
  if (!NB) NB = noiseBuffer(1);
  const t = ctx.currentTime + 0.005;
  const v = 0.85 + Math.random() * 0.3; // every keystroke a little different
  const p = pitch * (0.92 + Math.random() * 0.16);
  const deep = type === 'space' ? 0.7 : 1;
  // bottom-out: the "thock"
  body(t, { f0: 210 * p * deep, f1: 90 * p * deep, dur: 0.07, gain: 0.55 * v });
  burst(t, { freq: 650 * p * deep, q: 1.2, dur: 0.05, gain: 0.55 * v });
  burst(t + 0.002, { freq: 1900 * p, q: 2.5, dur: 0.018, gain: 0.18 * v });
  if (type === 'tactile') {
    burst(t - 0.012 + 0.012, { freq: 1200 * p, q: 3, dur: 0.012, gain: 0.22 * v }); // the bump
  }
  if (type === 'clicky') {
    burst(t, { freq: 4800 * p, q: 6, dur: 0.012, gain: 0.5 * v });
    burst(t + 0.045, { freq: 4200 * p, q: 6, dur: 0.01, gain: 0.35 * v }); // click jacket reset
  }
  // top-out on release
  burst(t + 0.09 + Math.random() * 0.03, { freq: 1400 * p, q: 2, dur: 0.02, gain: 0.12 * v });
}

export const isOn = () => enabled;
export function setOn(on) {
  enabled = on;
  if (on) { ensure(); if (ctx.state === 'suspended') ctx.resume(); }
  listeners.forEach((fn) => fn(on));
}
export const onChange = (fn) => listeners.add(fn);

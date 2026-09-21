'use strict';
/* Drive the real page and confirm every number quoted in an exercise answer. */
const fs = require('fs'), path = require('path'), { JSDOM } = require('jsdom');
const ROOT = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(ROOT, 'modules/avo-limits.html'), 'utf8');
const seismic = fs.readFileSync(path.join(ROOT, 'assets/seismic.js'), 'utf8');
const stub = () => new Proxy({ measureText: (t) => ({ width: String(t).length * 6 }),
  createLinearGradient: () => ({ addColorStop() {} }),
  getImageData: (x, y, w, h) => ({ data: new Uint8ClampedArray(w * h * 4), width: w, height: h }),
  canvas: { width: 800, height: 400 } },
  { get: (t, k) => (k in t ? t[k] : (typeof k === 'string' ? () => {} : undefined)),
    set: () => true });

const dom = new JSDOM(
  html.replace('<script src="../assets/count.js"></script>', '')
      .replace('<script src="../assets/seismic.js"></script>', '<script>\n' + seismic + '\n</script>'),
  { runScripts: 'dangerously', url: 'https://example.org/modules/avo-limits.html',
    pretendToBeVisual: true,
    beforeParse(w) {
      w.HTMLCanvasElement.prototype.getContext = () => stub();
      Object.defineProperty(w.HTMLElement.prototype, 'clientWidth',
        { configurable: true, get() { return 640; } });
    } });
const { window } = dom, doc = window.document;
const $ = (id) => doc.getElementById(id);
const hit = (sel) => doc.querySelector(sel).dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
const phi = (v) => { const e = $('phi'); e.value = String(v); e.dispatchEvent(new window.Event('input', { bubbles: true })); };
hit('#tabs button[data-tab="p1"]');

const num = (id) => parseFloat($(id).textContent.replace('\u2212', '-').replace(/[^0-9.\-]/g, ''));
const fail = [];
const say = (label, got, want) => {
  const ok = String(got) === String(want);
  if (!ok) fail.push(label + ': answer says ' + want + ', page says ' + got);
  console.log((ok ? '  ok   ' : '  FAIL ') + label.padEnd(42) + String(got));
};

console.log('\nExercise 1 — 20% porosity, oil, three overburdens');
hit('[data-fluid="oil"]'); phi(20);
[['soft', 'class 1', '+0.109'], ['hard', 'class 2', '-0.029'], ['tight', 'class 4', '-0.223']]
  .forEach(([o, cls, a]) => {
    hit('[data-over="' + o + '"]');
    say(o + ' class', $('mClass').textContent, cls);
    say(o + ' intercept', $('s1a').textContent.replace('\u2212', '-'), a);
  });

console.log('\nExercise 2 — soft shale, where the intercept crosses zero');
hit('[data-over="soft"]');
['brine', 'gas'].forEach((f) => {
  hit('[data-fluid="' + f + '"]');
  let cross = null;
  for (let p = 8; p <= 36; p++) { phi(p); if (num('s1a') < 0) { cross = p; break; } }
  console.log('       ' + f.padEnd(6) + 'first negative intercept at ' + cross + '%');
  if (f === 'brine' && (cross < 31 || cross > 34)) fail.push('brine crossing is ' + cross + '%, answer says about 32%');
  if (f === 'gas' && (cross < 24 || cross > 27)) fail.push('gas crossing is ' + cross + '%, answer says about 25%');
});

console.log('\nExercise 3 — soft shale, 25% porosity, three fluids');
hit('[data-over="soft"]'); phi(25);
const rows = ['brine', 'oil', 'gas'].map((f) => {
  hit('[data-fluid="' + f + '"]');
  return { f, vp: num('mVp'), vs: num('mVs'), rho: num('mRho'), cls: $('mClass').textContent };
});
rows.forEach((r) => console.log('       ' + r.f.padEnd(6) +
  'Vp ' + r.vp + '  Vs ' + r.vs + '  rho ' + r.rho + '  ' + r.cls));
const [b, , g] = rows;
if (!(Math.abs(b.vp - 3300) < 40 && Math.abs(g.vp - 3130) < 40))
  fail.push('Vp pair is ' + b.vp + '/' + g.vp + ', answer says about 3300 and 3130');
if (!(g.vs > b.vs)) fail.push('Vs does not rise from brine to gas');
if (!(Math.abs(b.vs - 1720) < 30 && Math.abs(g.vs - 1800) < 30))
  fail.push('Vs pair is ' + b.vs + '/' + g.vs + ', answer says about 1720 and 1800');
if (!(Math.abs(b.rho - 2.24) < 0.02 && Math.abs(g.rho - 2.04) < 0.02))
  fail.push('density pair is ' + b.rho + '/' + g.rho + ', answer says 2.24 and 2.04');
say('brine class', b.cls, 'class 1');
say('gas class', g.cls, 'class 2p');

console.log('\nExercise on the background trend — brine track versus B = -A');
hit('[data-over="soft"]'); hit('[data-fluid="brine"]');
phi(12); const a1 = num('s1a'), b1 = num('s1b');
phi(34); const a2 = num('s1a'), b2 = num('s1b');
const slope = (b2 - b1) / (a2 - a1);
console.log('       brine track slope under soft shale: ' + slope.toFixed(2) + '  (B = -A would be -1.00)');
if (!(slope < -1.3)) fail.push('brine track slope is ' + slope.toFixed(2) + ', answer says steeper than B = -A');

console.log('\n=======================================');
if (fail.length) { fail.forEach((f) => console.log('  -', f)); process.exit(1); }
console.log('every quoted number checks out');

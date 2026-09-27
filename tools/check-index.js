'use strict';
/* The landing page. Loads index.html in jsdom with the hero script, then
   checks the module list, every internal link, and every number the hero
   figure and its caption claim, recomputed here without the page's code.
   Usage: node tools/check-index.js */
const fs = require('fs'), path = require('path'), { JSDOM } = require('jsdom');
const R = path.resolve(__dirname, '..');
const html = fs.readFileSync(R + '/index.html', 'utf8');
const seis = fs.readFileSync(R + '/assets/seismic.js', 'utf8');
const hero = fs.readFileSync(R + '/assets/index-hero.js', 'utf8');

const stub = () => new Proxy({ measureText: () => ({ width: 6 }),
  createLinearGradient: () => ({ addColorStop() {} }), canvas: {} },
  { get: (t, k) => (k in t ? t[k] : () => {}), set: () => true });
const errors = [];
const d = new JSDOM(html
  .replace('<script src="assets/count.js"></script>', '')
  .replace('<script src="assets/seismic.js"></script>', '<script>' + seis + '</script>')
  .replace('<script src="assets/index-hero.js"></script>', '<script>' + hero + '</script>'),
  { runScripts: 'dangerously', url: 'https://e.org/index.html', pretendToBeVisual: true,
    beforeParse(w) {
      w.HTMLCanvasElement.prototype.getContext = () => stub();
      Object.defineProperty(w.HTMLElement.prototype, 'clientWidth', { configurable: true, get() { return 560; } });
      w.addEventListener('error', (e) => errors.push(e.message));
    } });
const { window } = d, doc = window.document, $ = (i) => doc.getElementById(i);
const fail = [], notes = [];

console.log('--- script errors ---');
errors.forEach((e) => fail.push('script error: ' + e));
console.log('   ' + (errors.length || 'none'));

console.log('\n--- the module list ---');
const parts = [...doc.querySelectorAll('.part')];
const counts = parts.map((p) => p.querySelectorAll('.mod').length);
const nos = [...doc.querySelectorAll('.mod-no')].map((e) => e.textContent.trim());
console.log('   parts', counts.join(' + '), '=', nos.length, '  numbers', nos.join(' '));
nos.forEach((n, k) => { if (n !== String(k).padStart(2, '0')) fail.push('module ' + k + ' is numbered ' + n); });
const words = ['Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
  'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen'];
const head = doc.querySelector('#modules .sec-head p').textContent;
if (!head.includes(words[nos.length] + ' modules in ' + ['', 'one', 'two', 'three', 'four', 'five'][parts.length] + ' parts'))
  fail.push('the section head does not say ' + words[nos.length] + ' modules in ' + parts.length + ' parts: "' + head + '"');
[...doc.querySelectorAll('.part-no')].forEach((e, k) => {
  if (e.textContent.trim() !== 'Part ' + (k + 1)) fail.push('part ' + (k + 1) + ' is labeled ' + e.textContent);
});

console.log('\n--- internal links ---');
let dead = 0;
[...doc.querySelectorAll('a[href]')].forEach((a) => {
  const h = a.getAttribute('href');
  if (/^(https?:|mailto:)/.test(h)) return;
  if (h.startsWith('#')) { if (h.length > 1 && !$(h.slice(1))) { dead++; fail.push('dead anchor ' + h); } return; }
  if (!fs.existsSync(path.join(R, h.split('#')[0]))) { dead++; fail.push('dead link ' + h); }
});
console.log('   dead:', dead);

console.log('\n--- hero readouts are filled and follow the slider ---');
const f = $('heroFreq');
for (const v of [20, 40, 60]) {
  f.value = String(v); f.dispatchEvent(new window.Event('input', { bubbles: true }));
  const r = ['heroFreqV', 'heroCycle', 'heroExt', 'heroValued'].map((i) => $(i).textContent);
  console.log('  ', r.join('  |  '));
  if (r.some((t) => t.includes('\u2014'))) fail.push('an unfilled readout at ' + v + ' Hz');
  const cyc = 1000 / v;                                   // samples per cycle at 1 ms
  if (parseInt(r[1]) !== Math.round(cyc)) fail.push('cycle readout ' + r[1] + ' at ' + v + ' Hz, expected ' + Math.round(cyc));
}

console.log('\n--- the DQ on the figure, checked without the page code ---');
const H = window.DQHERO;
for (let fq = 20; fq <= 60; fq += 5) {
  const r = H.compute(fq);
  const ext = r.ext.map((e) => e.i).sort((a, b) => a - b);
  const first = ext[0], last = ext[ext.length - 1];
  // caption: colored at every sample between the first and last pick
  let gaps = 0, outside = 0;
  for (let i = 0; i < H.NT; i++) {
    const inside = i >= first && i <= last;
    if (inside && !r.q[i]) gaps++;
    if (!inside && r.q[i]) outside++;
  }
  if (gaps || outside) fail.push(fq + ' Hz: ' + gaps + ' unvalued samples inside the picks, ' + outside + ' valued outside');
  if (r.valued !== last - first + 1) fail.push(fq + ' Hz: valued count ' + r.valued + ' is not last - first + 1');
  // at a peak or trough no filter is applied, so the DQ is the two-layer
  // distance from the raw stacks: sqrt(N^2 + (F - N)^2), and it is positive
  let worst = 0;
  ext.forEach((i) => {
    const want = Math.hypot(r.near[i], r.far[i] - r.near[i]);
    worst = Math.max(worst, Math.abs(r.dq[i] - want));
    if (r.q[i] !== 1 && r.q[i] !== 9) fail.push(fq + ' Hz: pick at sample ' + i + ' numbered Q' + r.q[i]);
  });
  if (worst > 1e-9) fail.push(fq + ' Hz: DQ at the picks differs from the two-layer distance by ' + worst);
  // Picks should alternate peak, trough. They do not when a zero crossing
  // falls where both bracketing samples are under the 1% floor: the picker
  // (module 00's, ported unchanged) skips that crossing and keeps only the
  // larger of the two lobes either side of it. Reported, not failed, until
  // module 00's picker is settled; the page quotes only the count.
  for (let k = 1; k < ext.length; k++) {
    if (Math.sign(r.near[ext[k]]) === Math.sign(r.near[ext[k - 1]]))
      notes.push(fq + ' Hz: two picks of the same sign in a row at samples ' + ext[k - 1] + ' and ' + ext[k]);
  }
  console.log('   ' + fq + ' Hz  cycle ' + r.cycle.toFixed(1) + '  picks ' + ext.length +
    '  valued ' + r.valued + ' (samples ' + first + '-' + last + ')  max |DQ| ' +
    Math.max(...Array.from(r.dq, Math.abs)).toFixed(3));
}

console.log('\n--- the gas sand is class 3, as the caption and figure imply ---');
const top = H.shuey(H.ROCK.shale, H.ROCK.gas);
console.log('   A', top.A.toFixed(3), ' B', top.B.toFixed(3));
if (!(top.A < -0.03 && top.B < 0)) fail.push('the gas sand top is not class 3: A ' + top.A + ', B ' + top.B);

console.log('\n--- the rock column: depth from interval velocities ---');
{
  const iv = H.column();
  if (Math.abs(iv[0].t0) > 1e-12 || Math.abs(iv[0].z0) > 1e-12) fail.push('the column does not start at 0 ms and 0 m');
  if (Math.abs(iv[iv.length - 1].t1 - (H.NT - 1) * H.DT) > 1e-12) fail.push('the column does not reach the bottom of the window');
  let z = 0;
  iv.forEach((I, k) => {
    if (k && Math.abs(I.t0 - iv[k - 1].t1) > 1e-12) fail.push('gap in the column at ' + I.t0);
    const dz = H.ROCK[I.r].vp * (I.t1 - I.t0) / 2;           // one-way time times velocity
    if (Math.abs(I.z1 - I.z0 - dz) > 1e-9 || Math.abs(I.z0 - z) > 1e-9) fail.push('interval ' + k + ' depth is wrong');
    z += dz;
    // the depth labels are placed by timeAt; it must invert the column
    const zm = (I.z0 + I.z1) / 2, tm = (I.t0 + I.t1) / 2;
    if (Math.abs(H.timeAt(iv, zm) - tm) > 1e-9) fail.push('timeAt does not invert interval ' + k);
  });
  // the beds in the column are the beds that made the traces
  const beds = iv.filter((I) => I.r !== 'shale');
  H.LAYERS.forEach((L, k) => {
    if (beds[k].r !== L.r || Math.abs(beds[k].t0 - L.t[0]) > 1e-12 || Math.abs(beds[k].t1 - L.t[1]) > 1e-12)
      fail.push('column bed ' + k + ' does not match the reflectivity model');
  });
  beds.forEach((B) => console.log('   ' + B.r.padEnd(6) + (1000 * (B.t1 - B.t0)).toFixed(0).padStart(3) +
    ' ms  = ' + (B.z1 - B.z0).toFixed(1).padStart(5) + ' m   (top ' + B.z0.toFixed(1) + ' m at ' + (1000 * B.t0).toFixed(0) + ' ms)'));
  console.log('   column total ' + z.toFixed(1) + ' m over ' + (1000 * (H.NT - 1) * H.DT).toFixed(0) + ' ms');
  const g = beds.find((B) => B.r === 'gas'), h = beds.find((B) => B.r === 'hard');
  const mPerMsGas = (g.z1 - g.z0) / (1000 * (g.t1 - g.t0)), mPerMsHard = (h.z1 - h.z0) / (1000 * (h.t1 - h.t0));
  if (!(mPerMsHard > mPerMsGas)) fail.push('depth and time are drawn as if proportional');
}

console.log('\n--- the citation copy button ---');
if (!$('copyCite') || !$('citeText')) fail.push('the citation or its copy button is missing');
else console.log('   "' + $('citeText').textContent.replace(/\s+/g, ' ').trim() + '"');

if (notes.length) console.log('\nnoted (not failed):\n  ' + notes.join('\n  '));
console.log(fail.length ? '\nFAILED\n  ' + fail.join('\n  ') : '\nevery quoted number checks out');
process.exit(fail.length ? 1 : 0);

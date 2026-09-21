'use strict';
/* Checks every number that modules/two-stacks.html (module 01) quotes in its
   prose, exercises and key points against what the page computes. */
const fs = require('fs'), path = require('path'), { JSDOM } = require('jsdom');
const ROOT = path.resolve(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const html = read('modules/two-stacks.html');
const stub = () => new Proxy({ measureText: () => ({ width: 6 }), createLinearGradient: () => ({ addColorStop() {} }),
  getImageData: (x, y, w, h) => ({ data: new Uint8ClampedArray(w * h * 4), width: w, height: h }), canvas: {} },
  { get: (t, k) => (k in t ? t[k] : () => {}), set: () => true });
const inl = (tag, file) => [tag, '<script>' + read('assets/' + file) + '</script>'];
let src = html.replace('<script src="../assets/count.js"></script>', '');
[inl('<script src="../assets/seismic.js"></script>', 'seismic.js'),
 inl('<script src="../assets/glossary.js"></script>', 'glossary.js'),
 inl('<script src="../assets/dq-ui.js"></script>', 'dq-ui.js')].forEach(([a, b]) => { src = src.replace(a, b); });
const dom = new JSDOM(src, { runScripts: 'dangerously', url: 'https://e.org/m.html', pretendToBeVisual: true,
  beforeParse(w) { w.HTMLCanvasElement.prototype.getContext = () => stub();
    Object.defineProperty(w.HTMLElement.prototype, 'clientWidth', { configurable: true, get() { return 640; } }); } });
const { window } = dom, doc = window.document, $ = (i) => doc.getElementById(i);
const hit = (q) => doc.querySelector(q).dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
const set = (i, v) => { const e = $(i); e.value = String(v); e.dispatchEvent(new window.Event('input', { bubbles: true })); };
const fail = [];
const expect = (what, got, want) => {
  console.log('  ' + what.padEnd(46) + String(got));
  if (String(got) !== String(want)) fail.push(what + ' is ' + got + ', the page says ' + want);
};
const P = window.__DQ01;

console.log('--- step 2: window coefficients ---');
hit('#tabs button[data-tab="p2"]');
const m = P.model();
expect('mean sin2, 0-10', m.s2n.toFixed(4), '0.0101');
expect('mean sin2, 20-30', m.s2f.toFixed(4), '0.1802');
expect('gain, 20-30', $('s2d').textContent, '0.1701');

console.log('--- exercise 2: far window at 12-22 ---');
set('far', 12); expect('gain, 12-22', $('s2d').textContent, '0.0775');
set('far', 20);

console.log('--- exercise 1: default gas sand, sand top ---');
hit('#tabs button[data-tab="p1"]');
expect('F-N at the sand top', $('s1d').textContent, '\u22120.042');
expect('B at the sand top', $('x1b').textContent, '\u22120.247');
const ratio = parseFloat($('s1d').textContent.replace('\u2212', '-')) / P.model().top.B;
expect('F-N over B, to 2 dp', ratio.toFixed(2), '0.17');
// the placeholder text in the HTML should match what the page writes in
expect('exercise 1 placeholder, F-N', /id="x1a">([^<]*)</.exec(html)[1].replace('&minus;', '\u2212'), '\u22120.042');
expect('exercise 1 placeholder, B', /id="x1b">([^<]*)</.exec(html)[1].replace('&minus;', '\u2212'), '\u22120.247');

console.log('--- exercise 3: gas 28% against brine 36%, soft shale ---');
hit('#tabs button[data-tab="p1"]');
hit('[data-over="soft"]'); hit('[data-fluid="gas"]'); set('phi', 28);
expect('gas 28%: N at top', $('s1c').textContent, '\u22120.041');
expect('gas 28%: F-N at top', $('s1d').textContent, '\u22120.042');
expect('gas 28% is class 3', $('mClass').textContent, 'class 3');
hit('[data-fluid="brine"]'); set('phi', 36);
expect('brine 36%: N at top', $('s1c').textContent, '\u22120.042');
expect('brine 36%: F-N at top', $('s1d').textContent, '\u22120.013');

console.log('--- exercise 4 (crossplot): brine 36% soft against gas 20% hard ---');
const pt = () => { const q = P.model(); return [(q.top.A + q.top.B * q.s2n).toFixed(3), (q.top.B * q.gain).toFixed(3)]; };
let a = pt();
expect('brine 36% soft, crossplot point', a.join(','), '-0.042,-0.013');
hit('[data-over="hard"]'); hit('[data-fluid="gas"]'); set('phi', 20);
a = pt();
expect('gas 20% hard, crossplot point', a.join(','), '-0.056,-0.018');
hit('[data-over="soft"]'); hit('[data-fluid="gas"]'); set('phi', 28);

console.log('--- exercise 5: trough against two-layer answer ---');
const pct = (t) => {
  set('thick', t);
  const q = P.step3Numbers();
  const it = q.ext.reduce((b, i) => (q.g.near.tr[i] < q.g.near.tr[b] ? i : b), q.ext[0]);
  set('tpick', it);
  return $('s3c').textContent;
};
hit('#tabs button[data-tab="p3"]');
const p30 = pct(30), p10 = pct(10);
expect('trough distance at 30 ms', p30, $('x4a').textContent);
expect('trough distance at 10 ms', p10, $('x4b').textContent);
expect('placeholder at 30 ms', /id="x4a">([^<]*)</.exec(html)[1], p30);
expect('placeholder at 10 ms', /id="x4b">([^<]*)</.exec(html)[1], p10);
expect('thin bed is clearly off the answer', parseInt(p10, 10) > 20, true);
set('thick', 30);

console.log('--- step 3: samples per cycle at 40 Hz ---');
expect('samples per cycle', $('s3e').textContent, '25 samples');

console.log('--- exercise 5: zero crossing sits near the origin ---');
{
  const q = P.step3Numbers();
  const tr = q.g.near.tr;
  let zc = -1;
  for (let i = 46; i < 80; i++) if (tr[i - 1] * tr[i] <= 0) { zc = i; break; }
  const r = Math.hypot(tr[zc], q.g.diff[zc]);
  const big = Math.hypot(q.ans[0].x, q.ans[0].y);
  expect('zero-crossing point within 15% of top answer size', r / big < 0.15, true);
}

console.log('--- step 3: the loop passes through the origin ---');
{
  const g = P.gather();
  expect('first sample sits at the origin', Math.abs(g.near.tr[0]) < 1e-3 && Math.abs(g.diff[0]) < 1e-3, true);
}

console.log(fail.length ? '\n' + fail.length + ' MISMATCH(ES):\n  - ' + fail.join('\n  - ') : '\nevery quoted number checks out');
process.exit(fail.length ? 1 : 0);

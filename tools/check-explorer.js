'use strict';
/* The DQ Explorer. Loads dq-explorer.html in jsdom and checks that it computes
   what the modules teach, not something of its own:
   - module 00's workflow (as ported to the landing page, which check-index
     tests against the Hilbert envelope) rerun on the Explorer's own traces
     gives the same quadrant numbers, enhanced traces and DQ, sample by sample
   - the rotation leaves every distance unchanged (module 06)
   - Theta PX recomputed from QN and QF - QN with module 07's rule
   - polarity decided once for the line, from the middle trace's sand top
   - depths in the rock column from interval velocities
   - fixed display ranges, the crossplot selection count, and the outside-frame count
   Usage: node tools/check-explorer.js */
const fs = require('fs'), path = require('path'), { JSDOM } = require('jsdom');
const R = path.resolve(__dirname, '..');
const rd = (f) => fs.readFileSync(path.join(R, f), 'utf8');
let html = rd('dq-explorer.html').replace('<script src="assets/count.js"></script>', '');
['seismic.js', 'glossary.js', 'dq-explorer-engine.js', 'dq-explorer.js', 'dq-ui.js'].forEach((f) => {
  html = html.replace('<script src="assets/' + f + '"></script>', '<script>' + rd('assets/' + f) + '</script>');
});
const stub = () => new Proxy({ measureText: () => ({ width: 6 }), createLinearGradient: () => ({ addColorStop() {} }), canvas: {} },
  { get: (t, k) => (k in t ? t[k] : () => {}), set: () => true });
const errors = [];
const dom = new JSDOM(html, { runScripts: 'dangerously', url: 'https://e.org/dq-explorer.html', pretendToBeVisual: true,
  beforeParse(w) {
    w.HTMLCanvasElement.prototype.getContext = () => stub();
    Object.defineProperty(w.HTMLElement.prototype, 'clientWidth', { configurable: true, get() { return 700; } });
    w.addEventListener('error', (e) => errors.push(e.message));
  } });
const { window } = dom, doc = window.document, $ = (i) => doc.getElementById(i);
const UI = window.DQXUI, X = window.DQX, SE = window.eval('SEIS');
const fail = [];
const click = (q) => { const e = doc.querySelector(q); if (!e) { fail.push('missing control ' + q); return; } e.dispatchEvent(new window.MouseEvent('click', { bubbles: true })); };

console.log('--- the page loads ---');
errors.forEach((e) => fail.push('script error: ' + e));
if (!UI || !X) { console.log('page did not start'); process.exit(1); }
const dashes = [...doc.querySelectorAll('#xRead dd, #xLine dd')].filter((d) => d.textContent === '\u2014').length;
console.log('   script errors ' + errors.length + '   readouts ' + doc.querySelectorAll('#xRead dd').length);

/* module 00's workflow, taken from the landing page's source unchanged */
const src = rd('assets/index-hero.js');
const grab = (name) => { const a = src.indexOf('function ' + name + '('); let d = 0;
  for (let j = src.indexOf('{', a); ; j++) { if (src[j] === '{') d++; if (src[j] === '}' && !--d) return src.slice(a, j + 1); } };
window.eval('(function(){const SE=SEIS;const PHASE_OF={1:0,2:22.5,3:45,4:67.5,5:-90,6:-67.5,7:-45,8:-22.5,9:0};'
  + ['pick', 'quadrants', 'rotate', 'enhance', 'limbSigns'].map(grab).join('\n')
  + ';window.M00={pick,quadrants,enhance,limbSigns};})()');
const M = window.M00;

const CASES = [];
for (const line of ['layered', 'faulted']) for (const over of ['soft', 'hard', 'tight']) CASES.push({ line, over, fluid: 'gas', thick: 26, freq: 40, noise: 0, dt: 1 });
CASES.push({ line: 'layered', over: 'soft', fluid: 'brine', thick: 12, freq: 25, noise: 0, dt: 2 });
CASES.push({ line: 'faulted', over: 'tight', fluid: 'oil', thick: 26, freq: 55, noise: 20, dt: 1 });

console.log('\n--- against module 00, sample by sample ---');
CASES.forEach((S) => {
  const D = X.build(S);
  let worstQN = 0, worstDQ = 0, qMismatch = 0, rotWorst = 0, pxWorst = 0, n = 0;
  D.traces.forEach((t) => {
    const pk = M.pick(t.near), q = M.quadrants(t.near, pk);
    const sign = M.limbSigns(t.near, pk);
    const QN = M.enhance(t.near, q, sign), QF = M.enhance(t.far, q, sign);
    for (let i = 0; i < D.nt; i++) {
      if (q[i] !== t.q[i]) { qMismatch++; continue; }
      if (!q[i]) continue;
      n++;
      worstQN = Math.max(worstQN, Math.abs(QN[i] - t.QN[i]), Math.abs(QF[i] - t.QF[i]));
      let s = 1;
      if (q[i] !== 1 && q[i] !== 9) s = t.near[Math.min(D.nt - 1, i + 1)] > t.near[Math.max(0, i - 1)] ? 1 : -1;
      const dq = s * Math.hypot(QN[i], QF[i] - QN[i]);
      worstDQ = Math.max(worstDQ, Math.abs(dq - t.dq[i]));
      // a rotation about the origin keeps the distance
      rotWorst = Math.max(rotWorst, Math.abs(Math.hypot(t.rx[i], t.ry[i]) - Math.abs(t.dq[i])));
      // Theta PX from scratch: rotate 16 degrees, reflect Q3-Q7, bearing, fold, sign of the DQ
      const a = 16 * Math.PI / 180, A = QN[i], B = QF[i] - QN[i];
      let x = A * Math.cos(a) - B * Math.sin(a), y = A * Math.sin(a) + B * Math.cos(a);
      if (q[i] >= 3 && q[i] <= 7) y = -y;
      const br = (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
      const fd = br < 90 ? br : br < 180 ? 180 - br : br < 270 ? br - 180 : 360 - br;
      pxWorst = Math.max(pxWorst, Math.abs(s * fd - t.px[i]));
    }
  });
  const tag = (S.line + ' ' + S.over + ' ' + S.fluid + ' ' + S.freq + 'Hz ' + S.noise + '% ' + S.dt + 'ms').padEnd(36);
  console.log('   ' + tag + n + ' samples   Q mismatches ' + qMismatch + '   |dQN| ' + worstQN.toExponential(1)
    + '   |dDQ| ' + worstDQ.toExponential(1) + '   rotation ' + rotWorst.toExponential(1) + '   px ' + pxWorst.toExponential(1) + '\u00b0');
  if (qMismatch) fail.push(tag + ': quadrant numbers differ from module 00 at ' + qMismatch + ' samples');
  if (worstQN > 1e-9 || worstDQ > 1e-9) fail.push(tag + ': enhanced traces or DQ differ from module 00');
  if (rotWorst > 1e-9) fail.push(tag + ': the rotation changes a distance by ' + rotWorst);
  if (pxWorst > 1e-6) fail.push(tag + ': Theta PX differs from module 07 rule by ' + pxWorst);

  // polarity, once for the line: the middle trace's sand top must read as a trough
  const mid = D.traces[(D.NTR - 1) / 2], q0 = X.shuey(mid.col.seal, mid.col.sand);
  const raw = q0.A + q0.B * X.S2N;
  if ((raw > 0) !== D.flip) fail.push(tag + ': flip decision does not follow the middle sand top');
  // depth from interval velocities
  D.traces.forEach((t, k) => t.col.iv.forEach((I) => {
    if (Math.abs((I.z1 - I.z0) - I.rock.vp * (I.t1 - I.t0) / 2) > 1e-9) fail.push(tag + ': depth of an interval on trace ' + (k + 1));
  }));
});

console.log('\n--- the enhancement against the envelope, limb by limb ---');
for (const S of [CASES[0], CASES[4]]) {
  const D = X.build(S);
  const e = { 1: [0, 0], '-1': [0, 0] };
  D.traces.forEach((t) => {
    const h = SE.hilbert(t.near), env = Array.from(t.near, (v, i) => Math.hypot(v, h[i]));
    const pk = Math.max(...env), ext = t.pk.ext.map((x) => x.i).sort((a, b) => a - b);
    for (let k = 0; k + 1 < ext.length; k++) {
      const dir = t.near[ext[k + 1]] > t.near[ext[k]] ? 1 : -1;
      for (let i = ext[k] + 1; i < ext[k + 1]; i++) { e[dir][0] += Math.abs(Math.abs(t.QN[i]) - env[i]) / pk; e[dir][1]++; }
    }
  });
  const up = 100 * e[1][0] / e[1][1], dn = 100 * e[-1][0] / e[-1][1];
  console.log('   ' + S.line + ' ' + S.over + ': rising ' + up.toFixed(1) + '%   falling ' + dn.toFixed(1) + '%');
  if (dn > 2 * up + 1 || up > 2 * dn + 1 || Math.max(up, dn) > 6) fail.push(S.line + ' ' + S.over + ': limbs disagree with the envelope');
}

console.log('\n--- the page: controls, fixed ranges, selection and counts ---');
const lim0 = JSON.stringify(UI.LIM);
click('[data-key=line] [data-val=faulted]'); click('[data-key=over] [data-val=hard]'); click('[data-stage=rdq]');
const st = UI.state();
if (st.line !== 'faulted' || st.over !== 'hard' || st.stage !== 'rdq' || st.view !== 'dq') fail.push('controls did not set the state: ' + JSON.stringify(st));
if (JSON.stringify(UI.LIM) !== lim0) fail.push('a display range changed with the model');
const D = UI.data();
let out = 0;
D.traces.forEach((t) => { for (let i = 0; i < D.nt; i++) if (t.q[i] && (Math.abs(t.rx[i]) > UI.LIM.xpX || Math.abs(t.ry[i]) > UI.LIM.xpY)) out++; });
if (UI.last().xp.outside !== out) fail.push('crossplot outside-frame count ' + UI.last().xp.outside + ', recomputed ' + out);
const box = { x0: 0.2, x1: 0.6, y0: 0.0, y1: 0.15 };
UI.select(box);
let inBox = 0, inSand = 0;
D.traces.forEach((t) => { for (let i = 0; i < D.nt; i++) {
  if (!t.q[i] || t.rx[i] < box.x0 || t.rx[i] > box.x1 || t.ry[i] < box.y0 || t.ry[i] > box.y1) continue;
  inBox++; const tm = i * D.dt; if (tm >= t.col.m.top - 1e-9 && tm < t.col.base - 1e-9) inSand++;
} });
console.log('   selection box ' + JSON.stringify(box) + ': ' + UI.last().selN + ' selected (recomputed ' + inBox + '), ' + inSand + ' in the sand');
if (UI.last().selN !== inBox || UI.last().selSand !== inSand) fail.push('selection count is wrong');
UI.setCursor(22, Math.round((D.traces[22].col.m.top + 0.004) / D.dt));
const s = UI.last().s;
const shown = $('xRead').textContent;
console.log('   cursor trace 23: DQ ' + s.dq.toFixed(3) + '  px ' + s.px.toFixed(1) + '  q ' + s.q + '  ' + s.rockName);
if (!shown.includes(Math.abs(s.dq).toFixed(3))) fail.push('the DQ readout does not show the cursor sample');
if ([...doc.querySelectorAll('#xRead dd')].length < 12) fail.push('readouts missing');
click('[data-key=line] [data-val=layered]');
if (!$('xThick').disabled === false) { /* enabled on the layered line */ }
if ($('xThick').disabled) fail.push('thickness control disabled on the layered line');
click('[data-key=line] [data-val=faulted]');
if (!$('xThick').disabled) fail.push('thickness control live on the faulted line, where the line sets thickness');

console.log('\n--- links ---');
[...doc.querySelectorAll('a[href]')].forEach((a) => {
  const h = a.getAttribute('href');
  if (/^(https?:|#)/.test(h)) return;
  if (!fs.existsSync(path.join(R, h.split('#')[0]))) fail.push('dead link ' + h);
});
if (!fs.readFileSync(path.join(R, 'index.html'), 'utf8').includes('dq-explorer.html')) fail.push('the landing page does not link the Explorer');

console.log(fail.length ? '\nFAILED\n  ' + fail.join('\n  ') : '\nevery quoted number checks out');
process.exit(fail.length ? 1 : 0);

/* ===========================================================================
   DQ EXPLORER: THE INTERFACE
   Four linked plots, one cursor and one crossplot selection. Every axis and
   every color range below is a fixed constant, never fitted to the data, and
   anything that falls outside one is counted in a readout.
   =========================================================================== */
(function () {
  'use strict';
  const SE = (typeof SEIS !== 'undefined') ? SEIS : window.SEIS;
  const X = window.DQX;
  if (!SE || !X) return;
  const $ = (id) => document.getElementById(id);

  const DEF = { line: 'layered', over: 'tight', fluid: 'gas', thick: 26, freq: 40, noise: 0, dt: 1, view: 'dq', stage: 'dq' };
  let S = Object.assign({}, DEF);
  try { if (location.protocol !== 'file:' && SE.readState) S = Object.assign(S, SE.readState(DEF)); } catch (e) { /* defaults */ }
  const save = () => { try { if (location.protocol !== 'file:' && SE.writeState) SE.writeState(S, DEF); } catch (e) { /* nothing */ } };

  // fixed display ranges
  const LIM = { stack: 0.30, iso: 30, xpX: 0.60, xpY: 0.15, histMax: 10000 };
  const GAIN = { wig: 0.30, dq: 0.56, px: 90 };
  const FLCOL = { brine: '#1D6FA3', oil: '#4E7D2E', gas: '#C2306B' };
  const INK = '#16191C', CRIM = '#841617', SOFT = 'rgba(22,25,28,.45)', PAPER = '#F6F4EE';
  const STAGE_TRACKS = {
    stacks: ['near', 'far'], picks: ['near'], quadrants: ['q'], enhanced: ['qn', 'fn'],
    dq: ['dq'], px: ['px'], rdq: ['dq', 'px'],
  };
  const STAGE_VIEW = { stacks: 'near', picks: 'near', quadrants: 'near', enhanced: 'near', dq: 'dq', px: 'px', rdq: 'dq' };

  let D = null;                               // the built line
  let cur = { k: 15, i: 0 };                  // cursor
  let sel = null;                             // crossplot box, in rotated coordinates
  let drag = null;

  /* ---- colors ------------------------------------------------------------ */
  function seisCol(v, lim) {
    const u = Math.max(-1, Math.min(1, v / lim));
    if (u >= 0) return 'rgb(' + Math.round(255 - 40 * u) + ',' + Math.round(255 - 175 * u) + ',' + Math.round(255 - 175 * u) + ')';
    const t = -u;
    return 'rgb(' + Math.round(255 - 190 * t) + ',' + Math.round(255 - 130 * t) + ',' + Math.round(255 - 30 * t) + ')';
  }
  function pxCol(v) {
    const b = Math.max(-9, Math.min(8, Math.floor(v / 10)));
    const pos = ['#F4E8B0', '#F2D072', '#F0AE4E', '#EC8244', '#E25444', '#D23359', '#C2306B', '#AA2A66', '#8E2358'];
    const neg = ['#DCE4EC', '#C2D2E2', '#A6C0D8', '#8AAECE', '#6E9CC4', '#5286B6', '#3C6E9E', '#2A5883', '#1D6FA3'];
    return b >= 0 ? pos[Math.min(8, b)] : neg[Math.min(8, -b - 1)];
  }
  function isoCol(v, lim) {
    const u = Math.max(-1, Math.min(1, v / lim));
    if (u >= 0) return 'rgb(' + Math.round(250 - 60 * u) + ',' + Math.round(240 - 190 * u) + ',' + Math.round(200 - 90 * u) + ')';
    const t = -u;
    return 'rgb(' + Math.round(230 - 190 * t) + ',' + Math.round(238 - 90 * t) + ',' + Math.round(248 - 30 * t) + ')';
  }
  const dqCol = (v) => SE.dqBandColor(v, SE.DQ_BAND);
  const QCOL = ['', '#2A5883', '#6E9CC4', '#A6C0D8', '#DCE4EC', '#C9CDD2', '#F4D3CF', '#E8A39B', '#D2655A', '#841617'];
  const lithFill = (rk, kind) => {
    if (kind === 'sand') return FLCOL[S.fluid] + '55';
    if (rk === X.LITHS.tight) return '#D6C9A2';
    if (rk === X.LITHS.hard) return '#7E8790';
    return '#A3ABB3';
  };

  function widthOf(el) {
    const p = el.parentElement, cs = getComputedStyle(p);
    return Math.max(260, Math.floor(p.clientWidth - (parseFloat(cs.paddingLeft) || 0) - (parseFloat(cs.paddingRight) || 0)));
  }
  const inSand = (t, i) => { const tm = i * D.dt; return tm >= t.col.m.top - 1e-9 && tm < t.col.base - 1e-9; };
  const isSel = (t, i) => sel && t.q[i] && t.rx[i] >= sel.x0 && t.rx[i] <= sel.x1 && t.ry[i] >= sel.y0 && t.ry[i] <= sel.y1;

  /* ---- section ------------------------------------------------------------ */
  let secRect = null;
  function drawSection() {
    const c = $('xSection'), W = widthOf(c), H = 300;
    const ctx = SE.fitCanvas(c, W, H);
    ctx.clearRect(0, 0, W, H);
    const r = { x: 44, y: 8, w: W - 54, h: H - 34 };
    secRect = r;
    const nt = D.nt, tw = r.w / D.NTR, sh = r.h / (nt - 1);
    let outside = 0;
    D.traces.forEach((t, k) => {
      for (let i = 0; i < nt; i++) {
        let col = PAPER, v;
        if (S.view === 'near' || S.view === 'far') {
          v = S.view === 'near' ? t.near[i] : t.far[i];
          if (Math.abs(v) > LIM.stack) outside++;
          col = seisCol(v, LIM.stack);
        } else if (t.q[i]) {
          if (S.view === 'dq') { v = t.dq[i]; if (Math.abs(v) > 7 * SE.DQ_BAND) outside++; col = dqCol(v); }
          else if (S.view === 'px') col = pxCol(t.px[i]);
          else { v = t.iso[i]; if (Math.abs(v) > LIM.iso) outside++; col = isoCol(v, LIM.iso); }
        }
        ctx.fillStyle = col;
        ctx.fillRect(r.x + k * tw, r.y + (i - 0.5) * sh, tw + 0.5, sh + 0.5);
      }
    });
    // the modeled sand, outlined
    ctx.save(); ctx.setLineDash([4, 3]); ctx.strokeStyle = INK; ctx.lineWidth = 1.2;
    ['top', 'base'].forEach((which) => {
      ctx.beginPath();
      D.traces.forEach((t, k) => {
        const tm = which === 'top' ? t.col.m.top : t.col.base;
        const y = r.y + tm / D.dt * sh;
        if (k && t.col.m.faulted !== D.traces[k - 1].col.m.faulted) ctx.moveTo(r.x + k * tw, y);
        else if (!k) ctx.moveTo(r.x, y);
        ctx.lineTo(r.x + (k + 1) * tw, y);
      });
      ctx.stroke();
    });
    ctx.restore();
    // selected samples
    if (sel) {
      ctx.strokeStyle = CRIM; ctx.lineWidth = 1;
      D.traces.forEach((t, k) => { for (let i = 0; i < nt; i++) if (isSel(t, i)) ctx.strokeRect(r.x + k * tw + 1, r.y + (i - 0.5) * sh, tw - 2, Math.max(1, sh)); });
    }
    // cursor
    const cx = r.x + (cur.k + 0.5) * tw, cy = r.y + cur.i * sh;
    ctx.strokeStyle = INK; ctx.lineWidth = 1; ctx.setLineDash([2, 3]);
    ctx.beginPath(); ctx.moveTo(cx, r.y); ctx.lineTo(cx, r.y + r.h); ctx.stroke(); ctx.setLineDash([]);
    ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cx, cy, 5, 0, 2 * Math.PI); ctx.stroke();
    // frame and axes
    ctx.strokeStyle = SOFT; ctx.lineWidth = 1; ctx.strokeRect(r.x, r.y, r.w, r.h);
    ctx.font = '10px "IBM Plex Mono", monospace'; ctx.fillStyle = 'rgba(22,25,28,.65)';
    ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    for (let t = 0; t <= 160; t += 20) ctx.fillText(String(t), r.x - 5, r.y + (t / 1000) / D.dt * sh);
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    for (let k = 0; k < D.NTR; k += 5) ctx.fillText(String(k + 1), r.x + (k + 0.5) * tw, r.y + r.h + 4);
    ctx.save(); ctx.translate(10, r.y + r.h / 2); ctx.rotate(-Math.PI / 2); ctx.textAlign = 'center';
    ctx.fillText('two-way time (ms)', 0, 0); ctx.restore();
    ctx.textAlign = 'right'; ctx.fillText('trace', r.x - 5, r.y + r.h + 4);
    const notes = {
      near: 'Near stack, red positive and blue negative, fixed at \u00b10.30.',
      far: 'Far stack on the same fixed scale as the near stack, \u00b10.30.',
      dq: 'DQ on the published color bar, seven bands of 0.08 each side of zero. Blank samples carry no quadrant number.',
      px: 'Theta PX in ten-degree bands, warm for positive and blue for negative, \u221290 to +90.',
      iso: 'Half isochron, fixed at \u00b130 ms, warm where the half loop runs trough to peak.',
    };
    $('xSecNote').textContent = notes[S.view] + ' Dashed outline: the modeled sand. '
      + (outside ? outside + ' samples lie beyond the color range.' : 'No samples lie beyond the color range.');
  }

  /* ---- traces at the cursor ---------------------------------------------- */
  function drawTraces() {
    const c = $('xTraces'), W = widthOf(c), H = 470;
    const ctx = SE.fitCanvas(c, W, H);
    ctx.clearRect(0, 0, W, H);
    const t = D.traces[cur.k], col = t.col, nt = D.nt;
    const L = 40, R = 34, TOP = 30, BOT = 8, ph = H - TOP - BOT;
    const yT = (tm) => TOP + tm / D.TWIN * ph, yI = (i) => yT(i * D.dt);
    const names = [['rock', 'rocks'], ['near', 'near'], ['far', 'far'], ['q', 'Q'], ['qn', 'QN'], ['fn', 'QF\u2212QN'], ['dq', 'DQ'], ['px', '\u03b8px']];
    const rockW = Math.max(46, (W - L - R) * 0.14), tw = (W - L - R - rockW - 6) / (names.length - 1);
    const xOf = (n) => n === 0 ? L : L + rockW + 6 + (n - 1) * tw;
    const on = STAGE_TRACKS[S.stage] || [];
    // rock column at its two-way times, depth down the left
    col.iv.forEach((I) => { ctx.fillStyle = lithFill(I.rock, I.kind); ctx.fillRect(L, yT(I.t0), rockW, yT(I.t1) - yT(I.t0)); });
    ctx.strokeStyle = SOFT; ctx.strokeRect(L, TOP, rockW, ph);
    const sandI = col.iv.find((I) => I.kind === 'sand');
    if (sandI) {
      ctx.font = '600 10px "IBM Plex Sans", sans-serif'; ctx.fillStyle = INK; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(S.fluid + ' sand', L + rockW / 2, (yT(sandI.t0) + yT(sandI.t1)) / 2);
      ctx.font = '10px "IBM Plex Mono", monospace';
      ctx.fillText('\u03c6 ' + col.m.phi.toFixed(0) + '%', L + rockW / 2, yT(sandI.t1) + 8);
    }
    ctx.font = '10px "IBM Plex Mono", monospace'; ctx.fillStyle = 'rgba(22,25,28,.6)'; ctx.textAlign = 'right';
    const zMax = col.iv[col.iv.length - 1].z1;
    const tAt = (z) => { for (const I of col.iv) if (z <= I.z1 + 1e-9) return I.t0 + (z - I.z0) * 2 / I.rock.vp; return D.TWIN; };
    for (let z = 0; z <= zMax; z += 50) { const y = yT(tAt(z)); ctx.fillRect(L - 4, y, 4, 1); ctx.fillText(String(z), L - 6, y); }
    ctx.save(); ctx.translate(9, TOP + ph / 2); ctx.rotate(-Math.PI / 2); ctx.textAlign = 'center'; ctx.fillText('depth (m)', 0, 0); ctx.restore();
    // two-way time down the right, grid across the tracks
    ctx.textAlign = 'left';
    for (let tm = 0; tm <= 160; tm += 20) {
      const y = yT(tm / 1000);
      ctx.fillStyle = 'rgba(22,25,28,.08)'; ctx.fillRect(xOf(1), y, W - R - xOf(1), 1);
      ctx.fillStyle = 'rgba(22,25,28,.6)'; ctx.fillText(String(tm), W - R + 4, y);
    }
    ctx.save(); ctx.translate(W - 6, TOP + ph / 2); ctx.rotate(Math.PI / 2); ctx.textAlign = 'center'; ctx.fillText('two-way time (ms)', 0, 0); ctx.restore();
    // guide lines at every boundary, from the rock across the tracks
    ctx.save(); ctx.setLineDash([3, 3]); ctx.strokeStyle = 'rgba(132,22,23,.5)';
    for (let j = 1; j < col.iv.length; j++) { const y = yT(col.iv[j].t0); ctx.beginPath(); ctx.moveTo(L + rockW, y); ctx.lineTo(W - R, y); ctx.stroke(); }
    ctx.restore();

    const center = (n) => xOf(n) + tw / 2, half = tw * 0.44;
    const wig = (n, arr, gain, color, fill) => {
      const x0 = center(n);
      ctx.strokeStyle = 'rgba(22,25,28,.25)'; ctx.beginPath(); ctx.moveTo(x0, TOP); ctx.lineTo(x0, TOP + ph); ctx.stroke();
      const X0 = (v) => x0 + Math.max(-1, Math.min(1, v / gain)) * half;
      if (fill) {
        ctx.beginPath(); ctx.moveTo(x0, TOP);
        for (let i = 0; i < nt; i++) ctx.lineTo(Math.max(x0, X0(arr[i])), yI(i));
        ctx.lineTo(x0, TOP + ph); ctx.closePath(); ctx.fillStyle = fill; ctx.fill();
      }
      ctx.beginPath();
      for (let i = 0; i < nt; i++) i ? ctx.lineTo(X0(arr[i]), yI(i)) : ctx.moveTo(X0(arr[i]), yI(i));
      ctx.strokeStyle = color; ctx.lineWidth = 1.4; ctx.stroke();
      return X0;
    };
    const cells = (n, colorOf) => {
      const x0 = xOf(n) + 2, w = tw - 4;
      for (let i = 0; i < nt; i++) { if (!t.q[i]) continue; ctx.fillStyle = colorOf(i); ctx.fillRect(x0, yI(i - 0.5), w, ph / (nt - 1) + 0.5); }
    };
    names.forEach(([id], n) => {
      if (n === 0) return;
      ctx.globalAlpha = on.includes(id) ? 1 : 0.32;
      if (id === 'near') {
        const X0 = wig(n, t.near, GAIN.wig, '#1D6FA3', 'rgba(29,111,163,.22)');
        if (S.stage === 'picks') {
          ctx.fillStyle = INK;
          t.pk.ext.forEach((e) => { ctx.beginPath(); ctx.arc(X0(t.near[e.i]), yI(e.i), 2.8, 0, 2 * Math.PI); ctx.fill(); });
          ctx.fillStyle = CRIM; t.pk.cross.forEach((c2) => ctx.fillRect(center(n) - 5, yI(c2.i) - 1, 10, 2));
        }
      } else if (id === 'far') wig(n, t.far, GAIN.wig, CRIM, 'rgba(132,22,23,.18)');
      else if (id === 'q') {
        cells(n, (i) => QCOL[t.q[i]]);
        if (S.stage === 'quadrants') {
          ctx.font = '9px "IBM Plex Mono", monospace'; ctx.fillStyle = INK; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          let last = -99;
          for (let i = 0; i < nt; i++) if (t.q[i] && (t.q[i] === 1 || t.q[i] === 9 || t.q[i] === 5) && yI(i) - last > 9) { ctx.fillText(String(t.q[i]), center(n), yI(i)); last = yI(i); }
        }
      } else if (id === 'qn') wig(n, t.QN, GAIN.wig, INK, null);
      else if (id === 'fn') wig(n, Array.from(t.QF, (v, i) => v - t.QN[i]), GAIN.wig, INK, null);
      else if (id === 'dq') { cells(n, (i) => dqCol(t.dq[i])); wig(n, t.dq, GAIN.dq, INK, null); }
      else if (id === 'px') { cells(n, (i) => pxCol(t.px[i])); wig(n, t.px, GAIN.px, INK, null); }
      ctx.globalAlpha = 1;
    });
    ctx.font = '600 11px "IBM Plex Sans", sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
    names.forEach(([id, lab], n) => {
      ctx.fillStyle = (n === 0 || on.includes(id)) ? INK : 'rgba(22,25,28,.4)';
      ctx.fillText(lab, n === 0 ? L + rockW / 2 : center(n), TOP - 8);
    });
    // the cursor sample
    ctx.strokeStyle = INK; ctx.lineWidth = 1; ctx.setLineDash([2, 2]);
    ctx.beginPath(); ctx.moveTo(L, yI(cur.i)); ctx.lineTo(W - R, yI(cur.i)); ctx.stroke(); ctx.setLineDash([]);
    $('xTrHead').textContent = 'trace ' + (cur.k + 1) + (col.m.faulted ? ', downthrown side' : '');
  }

  /* ---- rotated crossplot --------------------------------------------------- */
  let xpMap = null;
  function drawCross() {
    const c = $('xCross'), W = widthOf(c), H = Math.round(Math.min(340, W * 0.72));
    const ctx = SE.fitCanvas(c, W, H);
    ctx.clearRect(0, 0, W, H);
    const r = { x: 44, y: 8, w: W - 58, h: H - 34 };
    const px = (x) => r.x + (x + LIM.xpX) / (2 * LIM.xpX) * r.w;
    const py = (y) => r.y + (LIM.xpY - y) / (2 * LIM.xpY) * r.h;
    xpMap = { r, px, py, ix: (X0) => (X0 - r.x) / r.w * 2 * LIM.xpX - LIM.xpX, iy: (Y0) => LIM.xpY - (Y0 - r.y) / r.h * 2 * LIM.xpY };
    ctx.fillStyle = '#fff'; ctx.fillRect(r.x, r.y, r.w, r.h);
    ctx.strokeStyle = 'rgba(22,25,28,.25)'; ctx.setLineDash([3, 3]);
    ctx.beginPath(); ctx.moveTo(px(0), r.y); ctx.lineTo(px(0), r.y + r.h); ctx.stroke(); ctx.setLineDash([]);
    ctx.strokeStyle = 'rgba(132,22,23,.6)'; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(r.x, py(0)); ctx.lineTo(r.x + r.w, py(0)); ctx.stroke();
    let outside = 0, nSel = 0;
    const draw = (pass) => D.traces.forEach((t) => {
      for (let i = 0; i < D.nt; i++) {
        if (!t.q[i]) continue;
        const x = t.rx[i], y = t.ry[i];
        if (Math.abs(x) > LIM.xpX || Math.abs(y) > LIM.xpY) { if (pass === 0) outside++; continue; }
        const sand = inSand(t, i), s = isSel(t, i);
        if (pass === 0 && !sand && !s) { ctx.fillStyle = 'rgba(92,102,112,.35)'; ctx.fillRect(px(x) - 1, py(y) - 1, 2, 2); }
        if (pass === 1 && sand && !s) { ctx.fillStyle = FLCOL[S.fluid]; ctx.fillRect(px(x) - 1.3, py(y) - 1.3, 2.6, 2.6); }
        if (pass === 2 && s) { nSel++; ctx.fillStyle = CRIM; ctx.fillRect(px(x) - 1.5, py(y) - 1.5, 3, 3); }
      }
    });
    draw(0); draw(1); draw(2);
    const ct = D.traces[cur.k];
    if (ct.q[cur.i]) { ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(px(ct.rx[cur.i]), py(ct.ry[cur.i]), 6, 0, 2 * Math.PI); ctx.stroke(); }
    if (sel || drag) {
      const b = drag || sel;
      ctx.strokeStyle = CRIM; ctx.lineWidth = 1; ctx.setLineDash([4, 2]);
      ctx.strokeRect(px(b.x0), py(b.y1), px(b.x1) - px(b.x0), py(b.y0) - py(b.y1)); ctx.setLineDash([]);
    }
    ctx.strokeStyle = SOFT; ctx.lineWidth = 1; ctx.strokeRect(r.x, r.y, r.w, r.h);
    ctx.font = '10px "IBM Plex Mono", monospace'; ctx.fillStyle = 'rgba(22,25,28,.65)';
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    [-0.6, -0.3, 0, 0.3, 0.6].forEach((v) => ctx.fillText(v.toFixed(1), px(v), r.y + r.h + 3));
    ctx.fillText('rotated QN', r.x + r.w / 2, r.y + r.h + 14);
    ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    [-0.15, -0.075, 0, 0.075, 0.15].forEach((v) => ctx.fillText(v.toFixed(2), r.x - 4, py(v)));
    ctx.textAlign = 'left'; ctx.fillStyle = CRIM; ctx.fillText('background', r.x + 4, py(0) - 7);
    $('xXpHead').textContent = (outside ? outside + ' outside the frame \u00b7 ' : '') + 'colored: the sand';
    return { outside, nSel };
  }

  /* ---- DQ histogram, log count -------------------------------------------- */
  function drawHist() {
    const c = $('xHist'), W = widthOf(c), H = 150;
    const ctx = SE.fitCanvas(c, W, H);
    ctx.clearRect(0, 0, W, H);
    const r = { x: 40, y: 6, w: W - 62, h: H - 30 }, B = SE.DQ_BAND, nb = 14;
    const counts = new Array(nb).fill(0);
    let outside = 0;
    D.traces.forEach((t) => { for (let i = 0; i < D.nt; i++) {
      if (!t.q[i]) continue;
      const b = Math.floor(t.dq[i] / B) + 7;
      if (b < 0 || b >= nb) outside++; else counts[b]++;
    } });
    const ly = (n) => r.y + r.h - Math.log10(Math.max(1, n)) / Math.log10(LIM.histMax) * r.h;
    ctx.fillStyle = '#fff'; ctx.fillRect(r.x, r.y, r.w, r.h);
    counts.forEach((n, b) => {
      if (!n) return;
      ctx.fillStyle = dqCol((b - 7 + 0.5) * B);
      const x = r.x + b * r.w / nb; ctx.fillRect(x + 1, ly(n), r.w / nb - 2, r.y + r.h - ly(n));
    });
    const ct = D.traces[cur.k];
    if (ct.q[cur.i]) {
      const x = r.x + (Math.max(-7 * B, Math.min(7 * B, ct.dq[cur.i])) + 7 * B) / (14 * B) * r.w;
      ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, r.y); ctx.lineTo(x, r.y + r.h); ctx.stroke();
    }
    ctx.strokeStyle = SOFT; ctx.lineWidth = 1; ctx.strokeRect(r.x, r.y, r.w, r.h);
    ctx.font = '10px "IBM Plex Mono", monospace'; ctx.fillStyle = 'rgba(22,25,28,.65)';
    ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    [1, 10, 100, 1000, 10000].forEach((n) => ctx.fillText(String(n), r.x - 4, ly(n)));
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    [-0.56, -0.28, 0, 0.28, 0.56].forEach((v) => ctx.fillText(v.toFixed(2), r.x + (v + 0.56) / 1.12 * r.w, r.y + r.h + 3));
    return { outside, counts };
  }

  /* ---- readouts ---------------------------------------------------------- */
  const f3 = (v) => (v < 0 ? '\u2212' : '') + Math.abs(v).toFixed(3);
  function readouts(xp) {
    const s = X.sampleInfo(D, cur.k, cur.i);
    const rows = [
      ['trace', String(cur.k + 1)], ['two-way time', (s.time * 1000).toFixed(0) + ' ms'],
      ['rock', s.rockName], ['porosity', s.inSand ? s.phi.toFixed(1) + '%' : '\u2014'],
      ['quadrant', s.valued ? 'Q' + s.q : 'none'], ['near', f3(s.near)], ['far', f3(s.far)],
      ['QN', s.valued ? f3(s.QN) : '\u2014'], ['QF \u2212 QN', s.valued ? f3(s.FN) : '\u2014'],
      ['DQ', s.valued ? f3(s.dq) : '\u2014', 1], ['\u03b8px', s.valued ? (s.px < 0 ? '\u2212' : '+') + Math.abs(s.px).toFixed(1) + '\u00b0' : '\u2014', 1],
      ['half isochron', s.valued && s.iso ? (s.iso > 0 ? '+' : '\u2212') + Math.abs(s.iso).toFixed(0) + ' ms' : '\u2014'],
      ['nearest boundary', s.iface ? s.iface.cls : '\u2014'],
    ];
    $('xRead').innerHTML = rows.map(([a, b, k]) => '<dt>' + a + '</dt><dd' + (k ? ' class="key"' : '') + '>' + b + '</dd>').join('');
    let valued = 0, selSand = 0, selN = 0;
    D.traces.forEach((t) => { for (let i = 0; i < D.nt; i++) { if (!t.q[i]) continue; valued++; if (isSel(t, i)) { selN++; if (inSand(t, i)) selSand++; } } });
    const lines = [
      ['polarity', D.flip ? 'flipped, once for the line' : 'as recorded'],
      ['samples with a DQ', String(valued)],
      ['selected', sel ? String(selN) : 'none'],
      ['selected in the sand', sel && selN ? Math.round(100 * selSand / selN) + '%' : '\u2014'],
      ['outside crossplot', String(xp.outside)],
      ['wavelet period', (1000 / S.freq).toFixed(1) + ' ms'],
    ];
    $('xLine').innerHTML = lines.map(([a, b]) => '<dt>' + a + '</dt><dd>' + b + '</dd>').join('');
    return { s, valued, selN, selSand };
  }

  /* ---- controls ------------------------------------------------------------ */
  function syncControls() {
    document.querySelectorAll('.seg[data-key]').forEach((g) => {
      const key = g.dataset.key;
      g.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(String(S[key]) === b.dataset.val)));
    });
    document.querySelectorAll('#xpStrip button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.stage === S.stage)));
    document.querySelectorAll('#xpNotes > div').forEach((d) => d.classList.toggle('on', d.dataset.stage === S.stage));
    $('xThick').value = S.thick; $('xThickV').textContent = S.line === 'layered' ? S.thick + ' ms' : 'set by the line';
    $('xThick').disabled = S.line !== 'layered'; $('thickCtl').classList.toggle('off', S.line !== 'layered');
    $('xFreq').value = S.freq; $('xFreqV').textContent = S.freq + ' Hz';
    $('xNoise').value = S.noise; $('xNoiseV').textContent = S.noise + '%';
  }
  function sandTop(k) { return Math.round(D.traces[k].col.m.top / D.dt); }
  function rebuild(keepCursor) {
    const prevDt = D ? D.dt : null;
    D = X.build({ line: S.line, over: S.over, fluid: S.fluid, thick: +S.thick, freq: +S.freq, noise: +S.noise, dt: +S.dt });
    if (!keepCursor) cur.i = sandTop(cur.k);
    else if (prevDt && prevDt !== D.dt) cur.i = Math.round(cur.i * prevDt / D.dt);
    cur.i = Math.max(0, Math.min(D.nt - 1, cur.i));
    drawAll();
  }
  let last = null;
  function drawAll() {
    syncControls();
    drawSection(); drawTraces();
    const xp = drawCross(); const h = drawHist();
    last = Object.assign(readouts(xp), { hist: h, xp });
  }
  document.querySelectorAll('.seg[data-key] button').forEach((b) => b.addEventListener('click', () => {
    const key = b.parentElement.dataset.key;
    S[key] = key === 'dt' ? +b.dataset.val : b.dataset.val;
    save();
    if (key === 'view') drawAll(); else rebuild(true);
  }));
  document.querySelectorAll('#xpStrip button').forEach((b) => b.addEventListener('click', () => {
    S.stage = b.dataset.stage; S.view = STAGE_VIEW[S.stage]; save(); drawAll();
  }));
  [['xThick', 'thick'], ['xFreq', 'freq'], ['xNoise', 'noise']].forEach(([id, key]) =>
    $(id).addEventListener('input', () => { S[key] = +$(id).value; save(); rebuild(true); }));
  $('xReset').addEventListener('click', () => { S = Object.assign({}, DEF); sel = null; cur.k = 15; save(); rebuild(false); });

  $('xSection').addEventListener('click', (e) => {
    const b = e.currentTarget.getBoundingClientRect(), r = secRect;
    const x = e.clientX - b.left, y = e.clientY - b.top;
    if (x < r.x || x > r.x + r.w || y < r.y || y > r.y + r.h) return;
    cur.k = Math.max(0, Math.min(D.NTR - 1, Math.floor((x - r.x) / r.w * D.NTR)));
    cur.i = Math.max(0, Math.min(D.nt - 1, Math.round((y - r.y) / r.h * (D.nt - 1))));
    drawAll();
  });
  const xc = $('xCross');
  const toData = (e) => { const b = xc.getBoundingClientRect(); return [xpMap.ix(e.clientX - b.left), xpMap.iy(e.clientY - b.top)]; };
  xc.addEventListener('pointerdown', (e) => { const [x, y] = toData(e); drag = { sx: x, sy: y, x0: x, x1: x, y0: y, y1: y }; xc.setPointerCapture(e.pointerId); });
  xc.addEventListener('pointermove', (e) => {
    if (!drag) return; const [x, y] = toData(e);
    drag.x0 = Math.min(drag.sx, x); drag.x1 = Math.max(drag.sx, x); drag.y0 = Math.min(drag.sy, y); drag.y1 = Math.max(drag.sy, y);
    drawCross();
  });
  xc.addEventListener('pointerup', () => {
    if (!drag) return;
    const tiny = (drag.x1 - drag.x0) < 0.01 && (drag.y1 - drag.y0) < 0.005;
    sel = tiny ? null : { x0: drag.x0, x1: drag.x1, y0: drag.y0, y1: drag.y1 };
    drag = null; drawAll();
  });
  let rt; window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(drawAll, 150); });

  // a hook for tools/check-explorer.js
  window.DQXUI = {
    state: () => Object.assign({}, S), cursor: () => Object.assign({}, cur), data: () => D, last: () => last,
    setCursor(k, i) { cur.k = k; cur.i = i; drawAll(); },
    select(b) { sel = b; drawAll(); }, LIM, GAIN,
  };
  rebuild(false);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(drawAll);
})();

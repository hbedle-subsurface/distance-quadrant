/* ===========================================================================
   Landing-page figure: one near and far trace pair and the DQ trace built
   from them, with a frequency slider.

   The workflow is the one module 00 runs (picks, quadrant numbers, phase
   filters, distance, sign from the near-stack slope), ported line for line
   so the cover picture is the method and not a stand-in for it.
   tools/check-index.js recomputes the readouts and the DQ independently.
   =========================================================================== */
(function (root) {
  'use strict';
  // seismic.js declares SEIS with const: global, but not a property of window
  const SE = (typeof SEIS !== 'undefined') ? SEIS : root.SEIS;

  const DT = 0.001, NT = 161, T0 = 0;              // 0-160 ms at 1 ms
  const NEAR_DEG = [0, 10], FAR_DEG = [20, 30];

  // three beds in a soft shale: a brine sand, a gas sand (class 3) and a
  // hard shale
  const ROCK = {
    shale: { vp: 2700, vs: 1175, rho: 2.33 },
    brine: { vp: 2950, vs: 1500, rho: 2.22 },
    gas:   { vp: 2450, vs: 1480, rho: 2.05 },
    hard:  { vp: 3350, vs: 1675, rho: 2.48 },
  };
  const LAYERS = [                                  // [top, base] in seconds
    { r: 'brine', t: [0.020, 0.034] },
    { r: 'gas',   t: [0.062, 0.092] },
    { r: 'hard',  t: [0.120, 0.134] },
  ];

  function shuey(l1, l2) {
    const vp = (l1.vp + l2.vp) / 2, dvp = l2.vp - l1.vp;
    const vs = (l1.vs + l2.vs) / 2, dvs = l2.vs - l1.vs;
    const rho = (l1.rho + l2.rho) / 2, drho = l2.rho - l1.rho;
    const k = (vs / vp) * (vs / vp);
    return {
      A: 0.5 * (dvp / vp + drho / rho),
      B: 0.5 * dvp / vp - 2 * k * (drho / rho + 2 * dvs / vs),
    };
  }
  function meanSin2(a, b) {
    const n = 256, lo = a * Math.PI / 180, hi = b * Math.PI / 180;
    let s = 0;
    for (let i = 0; i < n; i++) { const th = lo + (hi - lo) * (i + 0.5) / n; s += Math.sin(th) ** 2; }
    return s / n;
  }
  const S2N = meanSin2(NEAR_DEG[0], NEAR_DEG[1]);
  const S2F = meanSin2(FAR_DEG[0], FAR_DEG[1]);

  function spikes(s2) {
    const out = [];
    LAYERS.forEach((L) => {
      const top = shuey(ROCK.shale, ROCK[L.r]), base = shuey(ROCK[L.r], ROCK.shale);
      out.push({ t: L.t[0], r: top.A + top.B * s2 });
      out.push({ t: L.t[1], r: base.A + base.B * s2 });
    });
    return out;
  }

  /* ---- picks: zero crossings, then the largest extremum between each pair */
  function isExtremum(tr, i, floor) {
    if (i < 1 || i > tr.length - 2) return false;
    if (Math.abs(tr[i]) <= floor) return false;
    const a = tr[i] - tr[i - 1], b = tr[i + 1] - tr[i];
    return (a > 0 && b <= 0) || (a < 0 && b >= 0);
  }
  function pick(tr) {
    const nt = tr.length;
    let peak = 1e-12;
    for (let i = 0; i < nt; i++) peak = Math.max(peak, Math.abs(tr[i]));
    const floor = 0.01 * peak;
    const cross = [];
    for (let i = 1; i < nt; i++) {
      const a = tr[i - 1], b = tr[i];
      if (a === 0 || b === 0 || (a > 0) === (b > 0)) continue;
      if (Math.abs(a) < floor && Math.abs(b) < floor) continue;
      cross.push({ i: Math.abs(a) <= Math.abs(b) ? i - 1 : i });
    }
    const ext = [];
    for (let k = 0; k + 1 < cross.length; k++) {
      let best = -1, bv = 0;
      for (let i = cross[k].i + 1; i < cross[k + 1].i; i++) {
        if (Math.abs(tr[i]) > bv) { bv = Math.abs(tr[i]); best = i; }
      }
      if (best < 0 || bv <= floor) continue;
      ext.push({ i: best });
    }
    return { cross, ext };
  }

  /* ---- quadrant numbers: Q1 trough, Q9 peak, Q5 crossing, 2-4 and 6-8 between */
  function quadrants(tr, pk) {
    const q = new Int8Array(tr.length);
    const ext = pk.ext.slice().sort((a, b) => a.i - b.i);
    const fill = (i0, i1, trip) => {
      const n = i1 - i0 - 1;
      for (let m = 0; m < n; m++) q[i0 + 1 + m] = trip[Math.min(2, Math.floor((m + 0.5) * 3 / n))];
    };
    for (let k = 0; k + 1 < ext.length; k++) {
      const a = ext[k].i, b = ext[k + 1].i;
      const x = pk.cross.find((c) => c.i > a && c.i < b);
      if (!x) continue;
      q[a] = tr[a] < 0 ? 1 : 9; q[x.i] = 5; q[b] = tr[b] < 0 ? 1 : 9;
      fill(a, x.i, [2, 3, 4]);
      fill(x.i, b, [6, 7, 8]);
    }
    return q;
  }

  /* ---- phase filters, one per quadrant number, negated on a falling limb */
  const PHASE_OF = { 1: 0, 2: 22.5, 3: 45, 4: 67.5, 5: -90, 6: -67.5, 7: -45, 8: -22.5, 9: 0 };
  function rotate(x, deg) {
    if (Math.abs(deg) < 1e-9) return Float64Array.from(x);
    const h = SE.hilbert(x), c = Math.cos(deg * Math.PI / 180), s = Math.sin(deg * Math.PI / 180);
    const o = new Float64Array(x.length);
    for (let i = 0; i < x.length; i++) o[i] = x[i] * c + h[i] * s;
    return o;
  }
  function limbSigns(tr, pk) {
    const sign = new Int8Array(tr.length);
    const ext = pk.ext.slice().sort((a, b) => a.i - b.i);
    for (let k = 0; k + 1 < ext.length; k++) {
      const a = ext[k].i, b = ext[k + 1].i, s = tr[b] > tr[a] ? 1 : -1;
      for (let i = a; i <= b; i++) sign[i] = s;
    }
    return sign;
  }
  function enhance(tr, q, sign) {
    const cache = {}, out = new Float64Array(tr.length);
    for (let i = 0; i < tr.length; i++) {
      if (!q[i]) continue;
      let deg = PHASE_OF[q[i]];
      if (sign[i] < 0) deg = -deg;
      if (!(deg in cache)) cache[deg] = rotate(tr, deg);
      out[i] = cache[deg][i];
    }
    return out;
  }

  function compute(freq) {
    const wav = SE.makeWavelet({ type: 'ricker', f: freq });
    const near = SE.traceFromSpikes(spikes(S2N), T0, DT, NT, wav);
    const far = SE.traceFromSpikes(spikes(S2F), T0, DT, NT, wav);
    const pk = pick(near);
    const q = quadrants(near, pk);
    const sign = limbSigns(near, pk);
    const QN = enhance(near, q, sign), QF = enhance(far, q, sign);
    const dq = new Float64Array(NT);
    let valued = 0;
    for (let i = 0; i < NT; i++) {
      if (!q[i]) continue;
      valued++;
      const A = QN[i], B = QF[i] - QN[i];
      let s = 1;
      if (q[i] !== 1 && q[i] !== 9) {
        const a = near[Math.max(0, i - 1)], b = near[Math.min(NT - 1, i + 1)];
        s = b > a ? 1 : -1;
      }
      dq[i] = s * Math.hypot(A, B);
    }
    return { near, far, q, dq, ext: pk.ext, valued, cycle: 1 / (freq * DT) };
  }

  /* ---- drawing ---------------------------------------------------------- */
  const GAIN = 0.25;           // fixed amplitude scale: never rescaled to the data
  function draw(canvas, freq) {
    const box = canvas.parentElement, cs = root.getComputedStyle ? root.getComputedStyle(box) : null;
    const padX = cs ? (parseFloat(cs.paddingLeft) || 0) + (parseFloat(cs.paddingRight) || 0) : 0;
    const W = Math.max(260, Math.floor(box.clientWidth - padX));
    const H = Math.round(Math.min(460, Math.max(360, W * 0.9)));
    const ctx = SE.fitCanvas(canvas, W, H);
    ctx.clearRect(0, 0, W, H);
    const r = compute(freq);

    const L = 44, R = 12, TOP = 26, BOT = 14;
    const ph = H - TOP - BOT;
    const colW = (W - L - R) / 3;
    const yOf = (i) => TOP + (i / (NT - 1)) * ph;
    const half = colW * 0.5;

    // time axis, two-way time down the side
    ctx.font = '10px "IBM Plex Mono", monospace';
    ctx.fillStyle = 'rgba(22,25,28,.6)';
    ctx.strokeStyle = 'rgba(22,25,28,.12)'; ctx.lineWidth = 1;
    ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    for (let t = 0; t <= 160; t += 20) {
      const y = yOf(t);
      ctx.beginPath(); ctx.moveTo(L - 4, y); ctx.lineTo(W - R, y); ctx.stroke();
      ctx.fillText(String(t), L - 7, y);
    }
    ctx.save();
    ctx.translate(11, TOP + ph / 2); ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center'; ctx.fillText('two-way time (ms)', 0, 0);
    ctx.restore();

    const x0 = (k) => L + colW * k + half;
    const X = (k, v) => x0(k) + Math.max(-1, Math.min(1, v / GAIN)) * half * 0.88;

    // the DQ column: every valued sample painted in the published bands
    const band = SE.DQ_BAND;
    for (let i = 0; i < NT; i++) {
      if (!r.q[i]) continue;
      ctx.fillStyle = SE.dqBandColor(r.dq[i], band);
      ctx.fillRect(x0(2) - half * 0.92, yOf(i - 0.5), half * 1.84, ph / (NT - 1) + 0.6);
    }

    const wiggle = (k, data, color, fill) => {
      ctx.strokeStyle = 'rgba(22,25,28,.28)';
      ctx.beginPath(); ctx.moveTo(x0(k), TOP); ctx.lineTo(x0(k), TOP + ph); ctx.stroke();
      if (fill) {
        ctx.beginPath(); ctx.moveTo(x0(k), TOP);
        for (let i = 0; i < NT; i++) ctx.lineTo(Math.max(x0(k), X(k, data[i])), yOf(i));
        ctx.lineTo(x0(k), TOP + ph); ctx.closePath();
        ctx.fillStyle = fill; ctx.fill();
      }
      ctx.beginPath();
      for (let i = 0; i < NT; i++) i ? ctx.lineTo(X(k, data[i]), yOf(i)) : ctx.moveTo(X(k, data[i]), yOf(i));
      ctx.strokeStyle = color; ctx.lineWidth = 1.6; ctx.stroke();
    };
    wiggle(0, r.near, '#1D6FA3', 'rgba(29,111,163,.22)');
    wiggle(1, r.far, '#841617', 'rgba(132,22,23,.18)');
    wiggle(2, r.dq, '#16191C', null);

    // the samples a two-layer reading uses: the peaks and troughs
    ctx.fillStyle = '#16191C';
    r.ext.forEach((e) => {
      ctx.beginPath(); ctx.arc(X(0, r.near[e.i]), yOf(e.i), 3.4, 0, 2 * Math.PI); ctx.fill();
    });

    ctx.font = '600 11px "IBM Plex Sans", sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
    [['near stack', '#1D6FA3'], ['far stack', '#841617'], ['DQ', '#16191C']].forEach(([t, c], k) => {
      ctx.fillStyle = c; ctx.fillText(t, x0(k), TOP - 8);
    });
    return r;
  }

  root.DQHERO = { compute, draw, DT, NT, LAYERS, ROCK, S2N, S2F, shuey };

  // wire the page, if this is the page
  const doc = root.document;
  const canvas = doc && doc.getElementById('heroCanvas');
  if (!canvas || !SE) return;
  const slider = doc.getElementById('heroFreq');
  const out = (id, v) => { const el = doc.getElementById(id); if (el) el.textContent = v; };
  function update() {
    const f = +slider.value;
    const r = draw(canvas, f);
    out('heroFreqV', f + ' Hz');
    out('heroCycle', Math.round(r.cycle) + ' samples');
    out('heroExt', String(r.ext.length));
    out('heroValued', String(r.valued));
  }
  slider.addEventListener('input', update);
  let rt;
  root.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(update, 140); });
  if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(update);
  update();
})(typeof window !== 'undefined' ? window : globalThis);

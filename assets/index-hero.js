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

  /* ---- the rock column in depth -----------------------------------------
     Each interval's thickness in meters is its velocity times its one-way
     time. Depth is measured from the top of the window, so the column shows
     how the two scales differ: 30 ms of gas sand is less rock than 30 ms of
     shale, and 14 ms of hard shale is more than 14 ms of brine sand. */
  const NAMES = { shale: 'soft shale', brine: 'brine sand', gas: 'gas sand', hard: 'hard shale' };
  const FILL = { shale: '#C9CDC4', brine: '#E8DBA6', gas: '#F2C14E', hard: '#8E968C' };
  function column() {
    const bounds = [0];
    LAYERS.forEach((L) => { bounds.push(L.t[0], L.t[1]); });
    bounds.push((NT - 1) * DT);
    const iv = [];
    let z = 0;
    for (let k = 0; k + 1 < bounds.length; k++) {
      const r = (k % 2 === 1) ? LAYERS[(k - 1) / 2].r : 'shale';
      const t0 = bounds[k], t1 = bounds[k + 1];
      const dz = ROCK[r].vp * (t1 - t0) / 2;
      iv.push({ r, t0, t1, z0: z, z1: z + dz });
      z += dz;
    }
    return iv;
  }
  // time (s) at a depth (m), through the interval velocities
  function timeAt(iv, z) {
    for (const I of iv) if (z <= I.z1 + 1e-9) return I.t0 + (z - I.z0) * 2 / ROCK[I.r].vp;
    return iv[iv.length - 1].t1;
  }

  /* ---- drawing ---------------------------------------------------------- */
  const GAIN = 0.25;           // fixed amplitude scale: never rescaled to the data
  function draw(canvas, freq) {
    const box = canvas.parentElement, cs = root.getComputedStyle ? root.getComputedStyle(box) : null;
    const padX = cs ? (parseFloat(cs.paddingLeft) || 0) + (parseFloat(cs.paddingRight) || 0) : 0;
    const W = Math.max(280, Math.floor(box.clientWidth - padX));
    const H = Math.round(Math.min(480, Math.max(380, W * 0.82)));
    const ctx = SE.fitCanvas(canvas, W, H);
    ctx.clearRect(0, 0, W, H);
    const r = compute(freq);
    const iv = column();

    const L = 46, R = 42, TOP = 30, BOT = 10, GAP = 8;
    const ph = H - TOP - BOT;
    const rockW = Math.max(58, Math.min(96, (W - L - R) * 0.22));
    const colW = (W - L - R - rockW - GAP) / 3;
    const xs = L + rockW + GAP;                         // first trace track
    const yOfT = (t) => TOP + (t / ((NT - 1) * DT)) * ph;
    const yOf = (i) => yOfT(i * DT);
    const half = colW * 0.5;
    const x0 = (k) => xs + colW * k + half;
    const X = (k, v) => x0(k) + Math.max(-1, Math.min(1, v / GAIN)) * half * 0.88;
    const mono = '10px "IBM Plex Mono", monospace';

    // two-way time grid across the trace tracks, labeled down the right
    ctx.font = mono; ctx.lineWidth = 1;
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    for (let t = 0; t <= 160; t += 20) {
      const y = yOfT(t / 1000);
      ctx.strokeStyle = 'rgba(22,25,28,.10)';
      ctx.beginPath(); ctx.moveTo(xs, y); ctx.lineTo(W - R + 3, y); ctx.stroke();
      ctx.fillStyle = 'rgba(22,25,28,.6)'; ctx.fillText(String(t), W - R + 6, y);
    }
    ctx.save();
    ctx.translate(W - 7, TOP + ph / 2); ctx.rotate(Math.PI / 2);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(22,25,28,.6)'; ctx.fillText('two-way time (ms)', 0, 0);
    ctx.restore();

    // the rock column, each interval drawn at its two-way time
    iv.forEach((I) => {
      const y0 = yOfT(I.t0), y1 = yOfT(I.t1);
      ctx.fillStyle = FILL[I.r]; ctx.fillRect(L, y0, rockW, y1 - y0);
      if (I.r === 'gas' || I.r === 'brine') {           // sand stipple
        ctx.fillStyle = 'rgba(22,25,28,.28)';
        for (let yy = y0 + 3; yy < y1 - 1; yy += 5)
          for (let xx = L + 3 + ((yy | 0) % 2) * 2; xx < L + rockW - 1; xx += 6) ctx.fillRect(xx, yy, 1.2, 1.2);
      }
      if (I.r !== 'shale') {
        ctx.font = '600 10px "IBM Plex Sans", sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        const lab = NAMES[I.r];
        const pad = ctx.measureText(lab).width + 8;
        ctx.fillStyle = 'rgba(255,255,255,.82)';
        ctx.fillRect(L + rockW / 2 - pad / 2, (y0 + y1) / 2 - 7, pad, 14);
        ctx.fillStyle = '#16191C'; ctx.fillText(lab, L + rockW / 2, (y0 + y1) / 2);
      }
    });
    ctx.strokeStyle = 'rgba(22,25,28,.45)'; ctx.strokeRect(L, TOP, rockW, ph);

    // depth down the left side of the column, placed at the time it reaches
    ctx.font = mono; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    const zMax = iv[iv.length - 1].z1;
    for (let z = 0; z <= zMax + 1e-9; z += 25) {
      const y = yOfT(timeAt(iv, z));
      ctx.strokeStyle = 'rgba(22,25,28,.5)';
      ctx.beginPath(); ctx.moveTo(L - 4, y); ctx.lineTo(L, y); ctx.stroke();
      ctx.fillStyle = 'rgba(22,25,28,.6)'; ctx.fillText(String(z), L - 6, y);
    }
    ctx.save();
    ctx.translate(8, TOP + ph / 2); ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center'; ctx.fillStyle = 'rgba(22,25,28,.6)'; ctx.fillText('depth (m)', 0, 0);
    ctx.restore();

    // the DQ column: every valued sample painted in the published bands
    for (let i = 0; i < NT; i++) {
      if (!r.q[i]) continue;
      ctx.fillStyle = SE.dqBandColor(r.dq[i], SE.DQ_BAND);
      ctx.fillRect(x0(2) - half * 0.92, yOf(i - 0.5), half * 1.84, ph / (NT - 1) + 0.6);
    }

    // guide lines: each bed boundary carried from the rock across every track
    ctx.save();
    ctx.setLineDash([3, 3]); ctx.strokeStyle = 'rgba(132,22,23,.55)'; ctx.lineWidth = 1;
    LAYERS.forEach((Ly) => Ly.t.forEach((t) => {
      const y = yOfT(t);
      ctx.beginPath(); ctx.moveTo(L + rockW, y); ctx.lineTo(W - R, y); ctx.stroke();
    }));
    ctx.restore();

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
      ctx.beginPath(); ctx.arc(X(0, r.near[e.i]), yOf(e.i), 3.2, 0, 2 * Math.PI); ctx.fill();
    });

    ctx.font = '600 11px "IBM Plex Sans", sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
    ctx.fillStyle = '#16191C'; ctx.fillText('rocks', L + rockW / 2, TOP - 8);
    [['near stack', '#1D6FA3'], ['far stack', '#841617'], ['DQ', '#16191C']].forEach(([t, c], k) => {
      ctx.fillStyle = c; ctx.fillText(t, x0(k), TOP - 8);
    });
    return r;
  }

  root.DQHERO = { compute, draw, column, timeAt, DT, NT, LAYERS, ROCK, S2N, S2F, shuey };

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

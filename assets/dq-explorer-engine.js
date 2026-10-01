/* ===========================================================================
   DQ EXPLORER: THE ENGINE

   One synthetic line through the whole DQ workflow, every trace, every
   sample. Nothing here is new method. The rocks are the course's (module 01:
   quartz sand, Gassmann fluid substitution, Shuey's two terms); the line
   geometries are module 00's layered line and module 14's dipping, faulted
   one; the picks, quadrant numbers and phase filters are module 00's as
   ported to the landing page, with the published table applied as printed on
   both limbs; the baseline rotation and the Q3-Q7 split are module 06's; the
   Theta PX fold and sign are module 07's; the half isochron is module 08's.
   tools/check-explorer.js reruns module 00's workflow on these traces and
   compares sample by sample.
   =========================================================================== */
(function (root) {
  'use strict';
  const SE = (typeof SEIS !== 'undefined') ? SEIS : root.SEIS;

  /* ---- rocks (module 01) ------------------------------------------------ */
  const MATRIX = { vp: 5486, rho: 2.65, K: 37.0 };
  const FLUIDS = {
    brine: { K: 2.60, rho: 1.03, v: 1500 },
    oil:   { K: 0.80, rho: 0.78, v: 1300 },
    gas:   { K: 0.055, rho: 0.20, v: 550 },
  };
  const LITHS = {
    soft:  { vp: 2700, vs: 1175, rho: 2.33, name: 'soft shale' },
    hard:  { vp: 3350, vs: 1675, rho: 2.48, name: 'hard shale' },
    tight: { vp: 4800, vs: 2800, rho: 2.56, name: 'tight sandstone' },
  };
  function brineSand(phi) {
    const vp = 1 / (phi / FLUIDS.brine.v + (1 - phi) / MATRIX.vp);
    const rho = (1 - phi) * MATRIX.rho + phi * FLUIDS.brine.rho;
    const vpvs = -0.75 * phi * phi + 1.35 * phi + 1.63;
    return { vp, vs: vp / vpvs, rho };
  }
  function ksatFromDry(kdry, phi, kfl) {
    const num = Math.pow(1 - kdry / MATRIX.K, 2);
    const den = phi / kfl + (1 - phi) / MATRIX.K - kdry / (MATRIX.K * MATRIX.K);
    return kdry + num / den;
  }
  function kdryFromSat(ksat, phi, kfl) {
    const a = phi * MATRIX.K / kfl;
    return (ksat * (a + 1 - phi) - MATRIX.K) / (a + ksat / MATRIX.K - 1 - phi);
  }
  function sandRock(phi, fluid) {
    const b = brineSand(phi);
    if (fluid === 'brine') return b;
    const mu = b.rho * b.vs * b.vs * 1e-6;
    const ksat = b.rho * b.vp * b.vp * 1e-6 - (4 / 3) * mu;
    const kdry = kdryFromSat(ksat, phi, FLUIDS.brine.K);
    const k2 = ksatFromDry(kdry, phi, FLUIDS[fluid].K);
    const rho = (1 - phi) * MATRIX.rho + phi * FLUIDS[fluid].rho;
    return { vp: Math.sqrt((k2 + (4 / 3) * mu) * 1e6 / rho), vs: Math.sqrt(mu * 1e6 / rho), rho };
  }
  function shuey(l1, l2) {
    const vp = (l1.vp + l2.vp) / 2, dvp = l2.vp - l1.vp;
    const vs = (l1.vs + l2.vs) / 2, dvs = l2.vs - l1.vs;
    const rho = (l1.rho + l2.rho) / 2, drho = l2.rho - l1.rho;
    const k = (vs / vp) * (vs / vp);
    return { A: 0.5 * (dvp / vp + drho / rho), B: 0.5 * dvp / vp - 2 * k * (drho / rho + 2 * dvs / vs) };
  }
  function meanSin2(a, b) {
    const n = 256, lo = a * Math.PI / 180, hi = b * Math.PI / 180;
    let s = 0;
    for (let i = 0; i < n; i++) { const th = lo + (hi - lo) * (i + 0.5) / n; s += Math.sin(th) ** 2; }
    return s / n;
  }
  const S2N = meanSin2(0, 10), S2F = meanSin2(20, 30);

  /* ---- the AVO class of an interface (one rule, module 12) -------------- */
  function avoClass(t) {
    const far = t.A + t.B * S2F;
    if (t.A > 0.03) return 'class 1';
    if (t.A > -0.03) return (t.A * far < 0) ? 'class 2p' : 'class 2';
    return t.B < 0 ? 'class 3' : 'class 4';
  }

  /* ---- the two lines ------------------------------------------------------
     layered: module 00. The sand top at 50 ms on every trace, a thin
       contrasting bed above it and a tight bed below, the thickness from the
       panel, porosity rising from 12% at the left to 33% at the right.
     faulted: module 14. The whole column dips 26 ms across the line and is
       thrown down 14 ms at trace 17; the sand thickens from 10 to 36 ms and
       back, and its porosity rises with the thickness. */
  const NTR = 31, TWIN = 0.160;
  const LINES = {
    layered: (k, S) => ({
      shift: 0, top: 0.050, thick: S.thick,
      phi: 12 + 21 * k / (NTR - 1),
      bedA: [0.014, 0.026], bedC: [0.118, 0.130], cKind: 'tight', faulted: false,
    }),
    faulted: (k) => {
      const u = k / (NTR - 1);
      const shift = (26 * u + (k >= 17 ? 14 : 0)) / 1000;
      return {
        shift, top: 0.055 + shift, thick: 10 + 26 * Math.sin(Math.PI * u),
        phi: 14 + 18 * Math.pow(Math.sin(Math.PI * u), 0.7),
        bedA: [0.022 + shift, 0.028 + shift], bedC: [0.125 + shift, 0.132 + shift],
        cKind: 'other', faulted: k >= 17,
      };
    },
  };
  // the intervals of one trace, top to bottom, each with its rock
  function column(k, S) {
    const m = LINES[S.line](k, S);
    const seal = LITHS[S.over];
    const other = S.over === 'soft' ? LITHS.hard : LITHS.soft;
    const cRock = m.cKind === 'tight' ? LITHS.tight : other;
    const sand = sandRock(m.phi / 100, S.fluid);
    const base = m.top + m.thick / 1000;
    const iv = [
      { t0: 0, t1: m.bedA[0], rock: seal, kind: 'seal' },
      { t0: m.bedA[0], t1: m.bedA[1], rock: other, kind: 'bedA' },
      { t0: m.bedA[1], t1: m.top, rock: seal, kind: 'seal' },
      { t0: m.top, t1: base, rock: sand, kind: 'sand' },
      { t0: base, t1: m.bedC[0], rock: seal, kind: 'seal' },
      { t0: m.bedC[0], t1: m.bedC[1], rock: cRock, kind: 'bedC' },
      { t0: m.bedC[1], t1: TWIN, rock: seal, kind: 'seal' },
    ].filter((I) => I.t1 > I.t0 + 1e-9);
    let z = 0;
    iv.forEach((I) => { I.z0 = z; z += I.rock.vp * (I.t1 - I.t0) / 2; I.z1 = z; });
    return { m, iv, sand, seal, other, cRock, base };
  }
  function spikes(col, s2) {
    const out = [];
    for (let j = 1; j < col.iv.length; j++) {
      const a = col.iv[j - 1].rock, b = col.iv[j].rock;
      if (a === b) continue;
      const q = shuey(a, b);
      out.push({ t: col.iv[j].t0, r: q.A + q.B * s2, q, top: col.iv[j].kind });
    }
    return out;
  }

  /* ---- picks, quadrant numbers, phase filters (module 00) --------------- */
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
      for (let i = cross[k].i + 1; i < cross[k + 1].i; i++) if (Math.abs(tr[i]) > bv) { bv = Math.abs(tr[i]); best = i; }
      if (best < 0 || bv <= floor) continue;
      ext.push({ i: best });
    }
    return { cross, ext };
  }
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
  const PHASE_OF = { 1: 0, 2: 22.5, 3: 45, 4: 67.5, 5: -90, 6: -67.5, 7: -45, 8: -22.5, 9: 0 };
  function rotate(x, deg) {
    if (Math.abs(deg) < 1e-9) return Float64Array.from(x);
    const h = SE.hilbert(x), c = Math.cos(deg * Math.PI / 180), s = Math.sin(deg * Math.PI / 180);
    const o = new Float64Array(x.length);
    for (let i = 0; i < x.length; i++) o[i] = x[i] * c + h[i] * s;
    return o;
  }
  function enhance(tr, q) {
    const cache = {}, out = new Float64Array(tr.length);
    for (let i = 0; i < tr.length; i++) {
      if (!q[i]) continue;
      const deg = PHASE_OF[q[i]];          // as printed, on rising and falling limbs alike
      if (!(deg in cache)) cache[deg] = rotate(tr, deg);
      out[i] = cache[deg][i];
    }
    return out;
  }

  /* ---- rotation, split and angle (modules 06 and 07) -------------------- */
  const BASE_BEARING = 344, TURN = 360 - BASE_BEARING;
  const isSplit = (q) => q >= 3 && q <= 7;
  function rotXY(x, y, deg) {
    const t = deg * Math.PI / 180, c = Math.cos(t), s = Math.sin(t);
    return [x * c - y * s, x * s + y * c];
  }
  const bearing = (x, y) => (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
  function fold(d) { return d < 90 ? d : d < 180 ? 180 - d : d < 270 ? d - 180 : 360 - d; }

  /* ---- the whole line ---------------------------------------------------- */
  const DTS = { 1: 0.001, 2: 0.002, 4: 0.004 };
  let cache = null;
  function build(S) {
    const key = JSON.stringify(S);
    if (cache && cache.key === key) return cache.data;
    const dt = DTS[S.dt] || 0.001, nt = Math.floor(TWIN / dt) + 1;
    const wav = SE.makeWavelet({ type: 'ricker', f: S.freq });
    const cols = [], nears = [], fars = [];
    for (let k = 0; k < NTR; k++) {
      const col = column(k, S);
      cols.push(col);
      nears.push(SE.traceFromSpikes(spikes(col, S2N), 0, dt, nt, wav));
      fars.push(SE.traceFromSpikes(spikes(col, S2F), 0, dt, nt, wav));
    }
    // noise: independent band-limited fields for the near and far stacks,
    // scaled to the sand-top reflection of the middle trace
    let refAmp = 1e-4;
    {
      const c = cols[(NTR - 1) / 2], q = shuey(c.seal, c.sand);
      refAmp = Math.max(1e-4, Math.abs(q.A + q.B * S2N));
    }
    if (S.noise > 0) {
      const nn = SE.bandLimitedNoise(NTR, nt, dt, wav, 20261001, 0);
      const nf = SE.bandLimitedNoise(NTR, nt, dt, wav, 20261002, 0);
      const a = (S.noise / 100) * refAmp;
      for (let k = 0; k < NTR; k++) for (let i = 0; i < nt; i++) {
        nears[k][i] += a * nn[k * nt + i]; fars[k][i] += a * nf[k * nt + i];
      }
    }
    /* Polarity is decided once for the whole line, from the sand top of the
       middle trace: if it is a peak, both stacks are flipped so the reservoir
       contrast reads as a trough (module 03). Never trace by trace. */
    const mid = cols[(NTR - 1) / 2], tq = shuey(mid.seal, mid.sand);
    const flip = (tq.A + tq.B * S2N) > 0;
    if (flip) for (let k = 0; k < NTR; k++) for (let i = 0; i < nt; i++) { nears[k][i] = -nears[k][i]; fars[k][i] = -fars[k][i]; }

    const traces = [];
    for (let k = 0; k < NTR; k++) {
      const near = nears[k], far = fars[k];
      const pk = pick(near), q = quadrants(near, pk);
      const QN = enhance(near, q), QF = enhance(far, q);
      const dq = new Float64Array(nt), px = new Float64Array(nt), iso = new Float64Array(nt);
      const rx = new Float64Array(nt), ry = new Float64Array(nt);
      for (let i = 0; i < nt; i++) {
        if (!q[i]) continue;
        const A = QN[i], B = QF[i] - QN[i];
        // sign (module 05): peaks, troughs and rising limbs positive
        let s = 1;
        if (q[i] !== 1 && q[i] !== 9) s = near[Math.min(nt - 1, i + 1)] > near[Math.max(0, i - 1)] ? 1 : -1;
        dq[i] = s * Math.hypot(A, B);
        let [x, y] = rotXY(A, B, TURN);
        if (isSplit(q[i])) y = -y;
        rx[i] = x; ry[i] = y;
        px[i] = s * fold(bearing(x, y));
      }
      // half isochron (module 08): time across the half loop, positive trough to peak
      const anch = pk.cross.map((c) => ({ i: c.i, kind: 'x' }))
        .concat(pk.ext.map((e) => ({ i: e.i, kind: near[e.i] > 0 ? 'p' : 't' })))
        .sort((u, v) => u.i - v.i);
      for (let z = 0; z + 1 < anch.length; z++) {
        const a = anch[z], b = anch[z + 1];
        if (a.kind === b.kind) continue;
        const ms = (b.i - a.i) * dt * 1000;
        const rising = (a.kind === 't' && b.kind === 'x') || (a.kind === 'x' && b.kind === 'p');
        for (let i = a.i; i <= b.i; i++) iso[i] = rising ? ms : -ms;
      }
      traces.push({ near, far, pk, q, QN, QF, dq, px, iso, rx, ry, col: cols[k] });
    }
    const data = { traces, nt, dt, flip, refAmp, NTR, TWIN };
    cache = { key, data };
    return data;
  }

  // everything known about one sample, for the readouts
  function sampleInfo(d, k, i) {
    const t = d.traces[k], col = t.col;
    const time = i * d.dt;
    const iv = col.iv.find((I) => time >= I.t0 && time < I.t1) || col.iv[col.iv.length - 1];
    // the interface nearest the sample, and its class
    let best = null, bd = 1e9;
    for (let j = 1; j < col.iv.length; j++) {
      const dd = Math.abs(col.iv[j].t0 - time);
      if (dd < bd && col.iv[j - 1].rock !== col.iv[j].rock) { bd = dd; best = j; }
    }
    const qi = best ? shuey(col.iv[best - 1].rock, col.iv[best].rock) : null;
    return {
      k, i, time, q: t.q[i], near: t.near[i], far: t.far[i], QN: t.QN[i], FN: t.QF[i] - t.QN[i],
      dq: t.dq[i], px: t.px[i], iso: t.iso[i], valued: !!t.q[i],
      inSand: iv.kind === 'sand', phi: col.m.phi, rockName: iv.kind === 'sand' ? 'sand' : iv.rock.name,
      iface: best ? { name: col.iv[best - 1].kind + '/' + col.iv[best].kind, cls: avoClass(qi), A: qi.A, B: qi.B } : null,
    };
  }

  root.DQX = { build, sampleInfo, column, LITHS, FLUIDS, sandRock, shuey, avoClass, meanSin2,
               pick, quadrants, enhance, rotXY, fold, bearing, TURN, NTR, TWIN, S2N, S2F, PHASE_OF };
})(typeof window !== 'undefined' ? window : globalThis);

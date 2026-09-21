'use strict';
/* Load a module headlessly with a stub canvas, then exercise every control.
   Usage: node harness.js <module-file> */
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const ROOT = path.resolve(__dirname, '..');
const FILE = process.argv[2];
const html = fs.readFileSync(path.join(ROOT, 'modules', FILE), 'utf8');
const seismic = fs.readFileSync(path.join(ROOT, 'assets/seismic.js'), 'utf8');
const inlineAsset = (name) => {
  const f = path.join(ROOT, 'assets', name);
  return fs.existsSync(f) ? fs.readFileSync(f, 'utf8') : '';
};

const errors = [];
const nanHits = [];
const outside = [];
const clipped = [];
let where = 'load';
let frameRect = null;
let canvasH = 1e9, canvasW = 1e9;

function stubCtx(el) {
  const c = {
    canvas: el || { width: 800, height: 400 },
    __clipped: false, __stack: [],
    save() { c.__stack.push(c.__clipped); },
    restore() { c.__clipped = c.__stack.length ? c.__stack.pop() : false; },
    clip() { c.__clipped = true; },
    beginPath() {}, closePath() {}, rect() {}, fill() {}, stroke() {},
    clearRect() {}, setLineDash() {}, scale() {}, translate() {}, rotate() {},
    drawImage() {}, setTransform() {}, quadraticCurveTo() {}, bezierCurveTo() {},
    createLinearGradient() { return { addColorStop() {} }; },
    createImageData(w, h) { return { data: new Uint8ClampedArray(w * h * 4), width: w, height: h }; },
    putImageData() {},
    getImageData(x, y, w, h) {
      return { data: new Uint8ClampedArray(w * h * 4), width: w, height: h };
    },
    measureText(t) { return { width: String(t).length * 6 }; },
    strokeRect(x, y, w, h) { frameRect = { x, y, w, h }; },
  };
  const guard = (name) => function (...a) {
    for (const v of a) {
      if (typeof v === 'number' && !Number.isFinite(v)) {
        nanHits.push(where + ': ' + name + '(' + a.join(', ') + ')');
        return;
      }
    }
  };
  c.moveTo = guard('moveTo');
  c.lineTo = guard('lineTo');
  c.fillRect = guard('fillRect');
  c.fillText = function (t, x, y, ...rest) {
    guard('fillText')(t, x, y, ...rest);
    // 11px text drawn with textBaseline 'top' needs about 13px below y
    if (Number.isFinite(y) && y + 13 > canvasH + 0.5) {
      clipped.push(where + ': "' + String(t).slice(0, 28) + '" at y=' + y.toFixed(0) +
        ' on a canvas ' + canvasH.toFixed(0) + ' tall');
    }
    if (Number.isFinite(x) && (x < -40 || x > canvasW + 40)) {
      clipped.push(where + ': "' + String(t).slice(0, 28) + '" at x=' + x.toFixed(0) +
        ' on a canvas ' + canvasW.toFixed(0) + ' wide');
    }
  };
  c.strokeText = function () {};
  c.arc = function (x, y, r, ...rest) {
    guard('arc')(x, y, r, ...rest);
    if (!c.__clipped && frameRect && Number.isFinite(x) && Number.isFinite(y)) {
      const pad = 3;
      if (x < frameRect.x - pad || x > frameRect.x + frameRect.w + pad ||
          y < frameRect.y - pad || y > frameRect.y + frameRect.h + pad) {
        outside.push(where + ': point at (' + x.toFixed(1) + ', ' + y.toFixed(1) + ')');
      }
    }
  };
  return c;
}

const dom = new JSDOM(
  html.replace('<script src="../assets/count.js"></script>', '')
      .replace('<script src="../assets/seismic.js"></script>', '<script>\n' + seismic + '\n</script>')
      .replace('<script src="../assets/glossary.js"></script>', '<script>\n' + inlineAsset('glossary.js') + '\n</script>')
      .replace('<script src="../assets/dq-ui.js"></script>', '<script>\n' + inlineAsset('dq-ui.js') + '\n</script>'),
  {
    runScripts: 'dangerously',
    url: 'https://example.org/modules/' + FILE,
    pretendToBeVisual: true,
    beforeParse(window) {
      window.HTMLCanvasElement.prototype.getContext = function () {
        const el = this;
        const ctx = stubCtx(el);
        // fitCanvas sets width/height in device pixels then calls setTransform
        // with the ratio; the logical size is what the module drew against
        ctx.setTransform = function (a) {
          const r = a || 1;
          canvasH = (el.height || 0) / r;
          canvasW = (el.width || 0) / r;
        };
        return ctx;
      };
      window.HTMLCanvasElement.prototype.toDataURL = () => 'data:,';
      Object.defineProperty(window.HTMLElement.prototype, 'clientWidth',
        { configurable: true, get() { return 640; } });
      // a syntax error in the module shows up here rather than as a page full
      // of empty readouts, which is a much slower thing to debug
      window.addEventListener('error', (e) => {
        const err = e.error;
        errors.push('script error: ' + (err && err.message ? err.message : e.message) +
          (err && err.stack ? ' | ' + String(err.stack).split('\n')[1] : ''));
      });
      const warn = window.console.error;
      window.console.error = (...a) => { errors.push('console.error: ' + a.join(' ')); warn(...a); };
    },
  });
const { window } = dom;
const doc = window.document;
const $ = (id) => doc.getElementById(id);

if ([...doc.querySelectorAll('div')].some((d) =>
      d.textContent.indexOf('could not load assets/seismic.js') === 0)) {
  errors.push('module reported a missing seismic.js');
}

const click = (el, why) => {
  if (!el) { errors.push('missing element for ' + why); return; }
  try { el.dispatchEvent(new window.MouseEvent('click', { bubbles: true })); }
  catch (e) { errors.push(why + ': ' + e.message); }
};
const setRange = (id, v, why) => {
  const el = $(id); if (!el) { errors.push('missing slider #' + id); return; }
  el.value = String(v);
  try { el.dispatchEvent(new window.Event('input', { bubbles: true })); }
  catch (e) { errors.push(why + ': ' + e.message); }
};
const setCheck = (id, v, why) => {
  const el = $(id); if (!el) return;
  el.checked = v;
  try { el.dispatchEvent(new window.Event('change', { bubbles: true })); }
  catch (e) { errors.push(why + ': ' + e.message); }
};

const TABS = [...doc.querySelectorAll('#tabs button')].map((b) => b.dataset.tab);
const STEPS = TABS.filter((t) => /^p[0-9]$/.test(t));
const SEGS = {};
[...doc.querySelectorAll('.seg button')].forEach((b) => {
  const key = Object.keys(b.dataset)[0];
  (SEGS[key] = SEGS[key] || []).push(b.dataset[key]);
});
const SLIDERS = [...doc.querySelectorAll('input[type=range]')].map((el) => ({
  id: el.id, min: +el.min, max: +el.max, step: +(el.step || 1),
}));
const CHECKS = [...doc.querySelectorAll('input[type=checkbox]')].map((el) => el.id);

console.log('module   :', FILE);
console.log('tabs     :', TABS.join(' '));
console.log('segments :', Object.entries(SEGS).map(([k, v]) => k + '[' + v.join(',') + ']').join(' '));
console.log('sliders  :', SLIDERS.map((s) => s.id + ' ' + s.min + '-' + s.max).join(', '));
console.log('checks   :', CHECKS.join(', ') || '(none)');

// 1. every tab
TABS.forEach((t) => { where = 'tab ' + t; click(doc.querySelector('#tabs button[data-tab="' + t + '"]'), 'tab ' + t); });

// 2. every segment value, on every step tab
let combos = 0;
STEPS.forEach((tab) => {
  click(doc.querySelector('#tabs button[data-tab="' + tab + '"]'), 'tab ' + tab);
  const keys = Object.keys(SEGS);
  const walk = (i, label) => {
    if (i === keys.length) {
      combos++;
      where = tab + ' ' + label;
      return;
    }
    const k = keys[i];
    [...new Set(SEGS[k])].forEach((v) => {
      const b = doc.querySelector('[data-' + k.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase()) + '="' + v + '"]');
      where = tab + ' ' + k + '=' + v;
      click(b, k + '=' + v);
      walk(i + 1, label + ' ' + k + '=' + v);
    });
  };
  walk(0, '');
});

// 3. every value of every slider, on every step tab
let slides = 0;
STEPS.forEach((tab) => {
  click(doc.querySelector('#tabs button[data-tab="' + tab + '"]'), 'tab ' + tab);
  SLIDERS.forEach((s) => {
    for (let v = s.min; v <= s.max; v += s.step) {
      where = tab + ' ' + s.id + '=' + v;
      setRange(s.id, v, s.id + ' ' + v);
      slides++;
    }
    setRange(s.id, (s.min + s.max) / 2 | 0, s.id + ' mid');
  });
  CHECKS.forEach((id) => {
    where = tab + ' ' + id;
    setCheck(id, false, id + ' off');
    setCheck(id, true, id + ' on');
  });
});

// 4. every slider value crossed with every segment value, on the step tabs
STEPS.forEach((tab) => {
  click(doc.querySelector('#tabs button[data-tab="' + tab + '"]'), 'tab ' + tab);
  Object.keys(SEGS).forEach((k) => {
    [...new Set(SEGS[k])].forEach((v) => {
      click(doc.querySelector('[data-' + k + '="' + v + '"]'), k + '=' + v);
      SLIDERS.forEach((s) => {
        [s.min, (s.min + s.max) / 2 | 0, s.max].forEach((val) => {
          where = tab + ' ' + k + '=' + v + ' ' + s.id + '=' + val;
          setRange(s.id, val, s.id);
        });
      });
    });
  });
});

console.log('segment combinations:', combos, ' slider settings:', slides);

// 5. reset, step navigation, masthead links, reveals
if ($('resetBtn')) { where = 'reset'; click($('resetBtn'), 'reset'); }
doc.querySelectorAll('.stepnav button').forEach((b, i) => { where = 'stepnav ' + i; click(b, 'stepnav'); });
doc.querySelectorAll('.masthead a[data-tab]').forEach((a, i) => { where = 'masthead ' + i; click(a, 'masthead'); });
const reveals = doc.querySelectorAll('details.reveal');
reveals.forEach((d) => { d.open = true; });
console.log('exercise reveals:', reveals.length);
// pages with an exercise set must have a usable number of them; an orientation
// page that carries no .tryit section is exempt rather than failing
const hasExercises = !!doc.querySelector('.tryit');
if (hasExercises && reveals.length < 4) {
  errors.push('only ' + reveals.length + ' exercise reveals');
}

// 6. no readout left at its placeholder
STEPS.forEach((tab) => {
  click(doc.querySelector('#tabs button[data-tab="' + tab + '"]'), 'tab ' + tab);
  doc.querySelectorAll('#' + tab + ' .stat b, .labhead .stat b').forEach((el) => {
    if (!el.id) return;
    const t = el.textContent.trim();
    if (t === '\u2014' || t === '') errors.push('readout #' + el.id + ' never filled in (' + tab + ')');
  });
});

// 7. internal links resolve to files that exist
doc.querySelectorAll('a[href]').forEach((a) => {
  const h = a.getAttribute('href');
  if (!h || /^(https?:|#|mailto:)/.test(h)) return;
  const p = path.join(ROOT, 'modules', h);
  if (!fs.existsSync(p) && !fs.existsSync(path.join(ROOT, h))) {
    errors.push('dead link: ' + h);
  }
});

// 8. every glossary term on the page has a definition, and opens
const G = window.DQ_GLOSSARY;
doc.querySelectorAll('.g[data-g]').forEach((el) => {
  if (!G || !G[el.dataset.g]) errors.push('glossary term with no definition: ' + el.dataset.g);
  else { where = 'glossary ' + el.dataset.g; click(el, 'glossary ' + el.dataset.g); }
});
if (doc.querySelector('.flow[data-at]') && !doc.querySelector('.flow-steps li.on')) {
  errors.push('workflow strip present but nothing lit');
}

if (clipped.length) {
  errors.push(new Set(clipped).size + ' label(s) drawn off the canvas, first: ' +
    [...new Set(clipped)][0]);
}
if (outside.length) errors.push(outside.length + ' point(s) outside a frame, first: ' + outside[0]);
if (nanHits.length) errors.push(nanHits.length + ' non-finite coordinate(s), first: ' + nanHits[0]);
if (process.env.VERBOSE) [...new Set(clipped)].slice(0, 12).forEach((c) => console.log('  clipped:', c));
console.log('points outside a frame:', outside.length,
  ' non-finite coordinates:', nanHits.length,
  ' clipped labels:', new Set(clipped).size);

console.log('=======================================');
if (errors.length) {
  console.log(errors.length + ' PROBLEM(S):');
  [...new Set(errors)].slice(0, 20).forEach((e) => console.log('  -', e));
  process.exit(1);
}
console.log('no errors');

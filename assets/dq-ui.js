/* ===========================================================================
   dq-ui.js — shared page furniture for every module

   Three pieces, all optional, all driven by markup so a module only has to
   include this file:

   1. The workflow strip.  <div class="flow" data-at="stacks"></div>
      Draws the DQ workflow from gather to crossplot with the operation the
      module covers lit, earlier operations marked done, later ones faint.

   2. Pop-out windows.  A button with data-popout="panel" or
      data-popout="exercises" opens the same page in a second window showing
      only the pinned panel or only the exercises. Every slider, checkbox and
      segmented button is kept in step between the two windows, so a student
      can drag a slider in either one and both redraw.

   3. Glossary popups.  <span class="g" data-g="intercept">intercept</span>
      Clicking the term opens a short definition from assets/glossary.js.

   Nothing here stores anything. Pop-out state travels in the URL and over a
   BroadcastChannel that exists only while both windows are open.
   =========================================================================== */
(function () {
  'use strict';

  const doc = document;
  const params = new URLSearchParams(location.search);
  const VIEW = params.get('view');           // 'panel', 'exercises' or null

  /* ------------------------------------------------------------------ */
  /* 1. the workflow strip                                               */
  /* ------------------------------------------------------------------ */

  const FLOW = [
    ['gather',  'Angle gather'],
    ['stacks',  'Near and far stacks'],
    ['picks',   'Peaks, troughs, zero crossings'],
    ['quads',   'Quadrant numbers'],
    ['rotate',  'Phase rotations'],
    ['dist',    'DQ distance'],
    ['xplot',   'RDQ crossplot'],
  ];

  function drawFlow(el) {
    const at = (el.dataset.at || '').split(/\s+/).filter(Boolean);
    const last = Math.max(-1, ...at.map((k) => FLOW.findIndex((f) => f[0] === k)));
    const ol = doc.createElement('ol');
    ol.className = 'flow-steps';
    FLOW.forEach((f, i) => {
      const li = doc.createElement('li');
      const on = at.indexOf(f[0]) >= 0;
      li.className = on ? 'on' : (i < last ? 'done' : 'todo');
      if (on) li.setAttribute('aria-current', 'step');
      li.textContent = f[1];
      ol.appendChild(li);
    });
    const cap = doc.createElement('p');
    cap.className = 'flow-cap';
    cap.textContent = 'The DQ workflow';
    el.appendChild(cap);
    el.appendChild(ol);
  }

  /* ------------------------------------------------------------------ */
  /* 2. pop-out windows                                                  */
  /* ------------------------------------------------------------------ */

  const CHANNEL_NAME = 'dq-sync:' + location.pathname;
  const ME = Math.random().toString(36).slice(2);
  let channel = null;
  try {
    if (typeof BroadcastChannel !== 'undefined') channel = new BroadcastChannel(CHANNEL_NAME);
  } catch (e) { channel = null; }

  let applying = false;

  // a snapshot of every control on the page, keyed so the other window can
  // find the same element
  function snapshot() {
    const out = { ranges: {}, checks: {}, segs: [] };
    doc.querySelectorAll('input[type=range][id]').forEach((el) => { out.ranges[el.id] = el.value; });
    doc.querySelectorAll('input[type=checkbox][id]').forEach((el) => { out.checks[el.id] = el.checked; });
    doc.querySelectorAll('.seg button[aria-pressed="true"]').forEach((b) => {
      const k = Object.keys(b.dataset)[0];
      if (k) out.segs.push([k, b.dataset[k]]);
    });
    return out;
  }

  function apply(snap) {
    applying = true;
    try {
      Object.keys(snap.ranges || {}).forEach((id) => {
        const el = doc.getElementById(id);
        if (!el || el.value === snap.ranges[id]) return;
        el.value = snap.ranges[id];
        el.dispatchEvent(new Event('input', { bubbles: true }));
      });
      Object.keys(snap.checks || {}).forEach((id) => {
        const el = doc.getElementById(id);
        if (!el || el.checked === snap.checks[id]) return;
        el.checked = snap.checks[id];
        el.dispatchEvent(new Event('change', { bubbles: true }));
      });
      (snap.segs || []).forEach((pair) => {
        const attr = 'data-' + pair[0].replace(/[A-Z]/g, (m) => '-' + m.toLowerCase());
        const b = doc.querySelector('.seg button[' + attr + '="' + pair[1] + '"]');
        if (b && b.getAttribute('aria-pressed') !== 'true') b.click();
      });
    } finally {
      applying = false;
    }
  }

  let sendTimer = null;
  function announce() {
    if (!channel || applying) return;
    clearTimeout(sendTimer);
    sendTimer = setTimeout(() => {
      try { channel.postMessage({ from: ME, snap: snapshot() }); } catch (e) { /* closed */ }
    }, 30);
  }

  if (channel) {
    channel.onmessage = (ev) => {
      const d = ev.data || {};
      if (d.from === ME) return;
      if (d.hello) { announce(); return; }       // a new window asking for the current state
      if (d.snap) apply(d.snap);
    };
    doc.addEventListener('input', announce, true);
    doc.addEventListener('change', announce, true);
    doc.addEventListener('click', (ev) => {
      if (ev.target && ev.target.closest && ev.target.closest('.seg button')) {
        setTimeout(announce, 0);
      }
    }, true);
  }

  function openPopout(kind) {
    const p = new URLSearchParams(location.search);
    p.set('view', kind);
    const url = location.pathname + '?' + p.toString();
    const feat = kind === 'panel' ? 'width=1100,height=520' : 'width=620,height=820';
    const w = window.open(url, 'dq-' + kind + '-' + location.pathname, feat);
    if (w && w.focus) w.focus();
  }

  function wirePopouts() {
    doc.querySelectorAll('[data-popout]').forEach((b) => {
      b.addEventListener('click', () => openPopout(b.dataset.popout));
    });
  }

  function enterView() {
    if (VIEW !== 'panel' && VIEW !== 'exercises') return;
    doc.body.classList.add('view-' + VIEW);
    const title = doc.title.split('|')[0].trim();
    doc.title = (VIEW === 'panel' ? 'Panel: ' : 'Exercises: ') + title;
    if (channel) {
      try { channel.postMessage({ from: ME, hello: true }); } catch (e) { /* closed */ }
    }
  }

  /* ------------------------------------------------------------------ */
  /* 3. glossary popups                                                  */
  /* ------------------------------------------------------------------ */

  let pop = null, popFor = null;

  function closePop() {
    if (pop) pop.hidden = true;
    if (popFor) popFor.setAttribute('aria-expanded', 'false');
    popFor = null;
  }

  function openPop(el) {
    const G = window.DQ_GLOSSARY || {};
    const entry = G[el.dataset.g];
    if (!entry) return;
    if (popFor === el) { closePop(); return; }
    closePop();
    if (!pop) {
      pop = doc.createElement('div');
      pop.className = 'gpop';
      pop.setAttribute('role', 'dialog');
      pop.hidden = true;
      doc.body.appendChild(pop);
    }
    pop.innerHTML = '';
    const h = doc.createElement('p');
    h.className = 'gpop-term';
    h.textContent = entry.term;
    const d = doc.createElement('p');
    d.className = 'gpop-def';
    d.innerHTML = entry.def;
    pop.appendChild(h);
    pop.appendChild(d);
    if (entry.more) {
      const m = doc.createElement('p');
      m.className = 'gpop-more';
      m.innerHTML = entry.more;
      pop.appendChild(m);
    }
    pop.hidden = false;
    const r = el.getBoundingClientRect();
    const pw = Math.min(340, (window.innerWidth || 800) - 24);
    pop.style.width = pw + 'px';
    let left = r.left + window.scrollX;
    left = Math.max(12 + window.scrollX, Math.min(left, window.scrollX + (window.innerWidth || 800) - pw - 12));
    pop.style.left = left + 'px';
    pop.style.top = (r.bottom + window.scrollY + 6) + 'px';
    el.setAttribute('aria-expanded', 'true');
    popFor = el;
  }

  function wireGlossary() {
    doc.querySelectorAll('.g[data-g]').forEach((el) => {
      if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '0');
      el.setAttribute('role', 'button');
      el.setAttribute('aria-expanded', 'false');
      el.addEventListener('click', (ev) => { ev.stopPropagation(); openPop(el); });
      el.addEventListener('keydown', (ev) => {
        if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); openPop(el); }
      });
    });
    doc.addEventListener('click', (ev) => {
      if (pop && !pop.hidden && !pop.contains(ev.target)) closePop();
    });
    doc.addEventListener('keydown', (ev) => { if (ev.key === 'Escape') closePop(); });
    window.addEventListener('resize', closePop);
  }

  /* ------------------------------------------------------------------ */

  function init() {
    doc.querySelectorAll('.flow[data-at]').forEach(drawFlow);
    wirePopouts();
    wireGlossary();
    enterView();
  }

  window.DQUI = { view: VIEW, snapshot, apply };

  // the script is loaded at the end of the body, so the markup it needs is
  // already there; waiting for DOMContentLoaded would only delay the strip
  if (doc.body) init();
  else doc.addEventListener('DOMContentLoaded', init);
})();

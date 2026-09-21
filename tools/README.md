# Test tooling

Nothing here is served by GitHub Pages. It exists so that a module can be
checked before it is published, and it has caught real bugs in every module
built so far.

## Setup

Node, and one dependency:

```
npm install jsdom
```

## The harness

```
node tools/harness.js near-far.html
```

Loads the named module from `modules/` into jsdom with a stub canvas, then
exercises it: every tab, every segmented button, every value of every slider
and checkbox on every step tab, and sliders crossed against segments. It
reports:

- **script errors** — a syntax error otherwise shows up only as a page of
  blank readouts, which is slow to diagnose
- **non-finite canvas coordinates** — a NaN reaching `moveTo` or `fillRect`
- **points drawn outside a frame** without an active clip
- **labels drawn past the edge of the canvas** — usually a bottom axis title
  with too little margin. A labelled `axisBottom` needs about 36px of canvas
  below the frame.
- **readouts never filled in** — a `.stat b` still showing its em-dash
- **dead internal links**

A clean run ends with `no errors`.

## The answer checks

```
node tools/check-04.js
```

One per module, numbered to match the module number on the site. Each drives
the module headlessly and
asserts that every number quoted in an exercise answer, a legend or a prose
paragraph is what the running page actually produces. They are how several
drafted claims were found to be false and rewritten — the pick count under
noise in module 03, the bias-versus-variance argument in module 02, the
wavelet constant in module 05.

Run them after any change to a module's physics, its defaults, or its prose
numbers. A clean run ends with `every quoted number checks out`.

## Adding a module

Copy the nearest existing checker, point it at the new file, and assert the
numbers the new prose quotes. If a number is hard to assert, that is usually
a sign the prose should quote something more definite.

## House rules the tools do not check

- Two-way time is always the vertical axis. Grep for it:
  `grep -rn "axisBottom" modules/ | grep -i time` should return nothing.
- No `localStorage` or `sessionStorage`; state goes in the URL through
  `SEIS.readState` / `SEIS.writeState`.
- Every page loads `assets/count.js`.

## Rebuilt modules

Modules rebuilt in the September 2026 reorganization get a checker named after
their file rather than their old number, for example `check-two-stacks.js` for
`modules/two-stacks.html`, because the module numbers change. The numbered
checkers stay until the module they test is replaced.

The harness also inlines `assets/glossary.js` and `assets/dq-ui.js`, fails on
any `.g` term with no glossary entry, clicks every term, and fails if a page has
a workflow strip with nothing lit. `VERBOSE=1` lists the first clipped labels.

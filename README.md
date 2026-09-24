# How the DQ Trace Actually Works

An interactive teaching site on the distance and quadrant (DQ) trace and the
attributes derived from it. Each page computes its own seismic model in the
browser, with no build step and nothing to install.

Published at [hbedle-subsurface.github.io/distance-quadrant](https://hbedle-subsurface.github.io/distance-quadrant/).

The DQ workflow was developed by Dennis B. Neff and Warren Neff at Phillips
Petroleum and published with the AASPI consortium at the University of Oklahoma.
The site follows Bedle et al. (2025a, 2025b, 2025c) in *Interpretation* and
Choudhry et al. (2026); full references are on the landing page.

## Who it is for

Undergraduate geology and geophysics students meeting these methods for the
first time. The modules assume a working idea of a seismic trace, a reflection
and what AVO sets out to measure. Intercept, gradient and crossplots are
introduced in module 01; the companion
[How AVO Actually Works](https://hbedle-subsurface.github.io/avo-basics/) site
covers them from the beginning.

Technical terms are explained where they first appear, and each links to a
short glossary entry.

## The pages

The site is being reorganized into fifteen pages, grouped into four parts. Each
module covers one idea in at most three steps. Pages marked *old* are the
September 2026 versions and are replaced one at a time.

| # | Module | Built from | Status |
|---|---|---|---|
| **Part 1** | **Why a new trace** | | |
| 00 | The rocks, and two pictures of them | `orientation.html` | **rebuilt** |
| 01 | Two stacks, and what AVO reads from them | `two-stacks.html` | **rebuilt** |
| **Part 2** | **Building the DQ trace** | | |
| 02 | Marking the waveform | `stickogram.html` | old |
| 03 | Quadrant numbers | `quadrants.html` | old |
| 04 | Turning every sample into a peak | `phase-filters.html` | old |
| 05 | The distance | `dq-distance.html` | old |
| **Part 3** | **The crossplot view** | | |
| 06 | Rotating and splitting the crossplot | `baseline.html` + `sectors.html` | old |
| 07 | Theta PX, the angle of the same point | `theta-px.html` | old |
| 08 | Time thickness | `isochron.html` | old |
| 09 | The RDQ crossplot in three axes | `rdq-crossplot.html` | old |
| **Part 4** | **What the attributes say about rocks** | | |
| 10 | Porosity | `porosity.html` | old |
| 11 | Thickness and tuning | `wedge.html` | old |
| 12 | The four AVO classes | `avo-classes.html` | old |
| 13 | Reading a DQ section | `reading-sections.html` | old |
| 14 | A synthetic line with every attribute | `attributes-line.html` | old |

`avo-limits.html` and `near-far.html` are superseded by `two-stacks.html` and
nothing links to them.

## Viewing it

Open `index.html` in a browser. No server, no build, no package manager. The
pages are plain HTML with inline JavaScript and two shared files.

## Layout

```
index.html              landing page
modules/*.html          one file per page, self-contained
assets/seismic.js       shared numerical and drawing helpers
assets/dq-ui.js         workflow strip, pop-out windows, glossary popups
assets/glossary.js      the definitions behind every clickable term
assets/style.css        shared styling, including the card thumbnails
assets/count.js         page-view counting
tools/                  headless test harness and per-module checkers
ADD-COUNTING.md         how the view counter is wired into each repo
```

`assets/seismic.js` holds everything shared: wavelets, convolution, the Hilbert
transform, the FFT, canvas fitting, axes, frames, dashed lines, tags and the
lithology column. Each module carries its own copy of the rock model and its own
drawing code, so a module can be read and edited on its own.

## Conventions

Follow these when adding or changing a module.

- **Two-way time runs down the vertical axis.** Never on a horizontal axis.
  Where a lithology column appears, depth is labeled down one side and two-way
  time down the other.
- **One idea per module, at most three steps, a control on every step.** Step
  text stays around 150 to 250 words; anything longer goes to the method tab or
  the glossary.
- **Neutral, descriptive prose.** No second person, no imperatives in the
  teaching text, no commercial metaphors, American spelling. Exercise prompts are
  written as questions. A sequence of processing steps is a workflow.
- **Terms link to the glossary.** Mark a term with
  `<span class="g" data-g="key">term</span>`; the key must exist in
  `assets/glossary.js`, and the harness fails if it does not.
- **Every module shows the workflow strip** (`<div class="flow" data-at="...">`)
  and offers the panel and the exercises as pop-out windows
  (`data-popout="panel"`, `data-popout="exercises"`).
- **Crossplot and amplitude axes are fixed**, never autoscaled.
- **No `localStorage`.** State lives in the URL so a view can be linked.
- **Every module has a method tab** stating its modeling choices and what it
  does not claim.
- **Every quoted number is checked.** If the prose says a figure, a checker
  asserts it against what the page computes.
- **The rock model is identical in every module**: quartz matrix, soft shale,
  hard shale, tight sandstone, and brine, oil and gas. Change it in one place
  and it must then be changed everywhere and every checker re-run.
- **Color conventions**: near stack blue `#1D6FA3`, far stack pink `#C2306B`,
  crimson `#841617` for the attribute under discussion.
- **A module built by copying another must be checked for controls it dropped.**
  The harness catches leftover wiring as a script error.

## Testing

Requires Node and one dependency:

```
npm install jsdom
```

Then, from the repository root:

```
node tools/harness.js two-stacks.html       # structural check on one module
node tools/check-two-stacks.js              # verify the numbers module 01 quotes
```

The harness loads a module into jsdom with a stub canvas and exercises every
tab, button and slider, looking for script errors, unfilled readouts, points
drawn outside their frame, clipped labels and dead links. The checkers drive
each module headlessly and assert the figures its prose quotes. `tools/README.md`
has the detail.

Run all of them before publishing. Both tools have caught real errors in every
module built so far.

## Credit and license

Built for teaching by Heather Bedle, School of Geosciences, University of
Oklahoma, with the AASPI consortium. Licensed under
[CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/): free to use,
share and adapt for any purpose, including training in industry, provided the
source is credited and adapted versions carry the same license.

To cite: H. Bedle, *How the DQ Trace Actually Works*, University of Oklahoma,
`hbedle-subsurface.github.io/distance-quadrant`.

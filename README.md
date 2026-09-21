# How the DQ Trace Actually Works

An interactive teaching site on the distance and quadrant (DQ) trace and the
attributes derived from it. Each page computes its own seismic model in the browser, with no build step and nothing to install.

Published at `hbedle-subsurface.github.io/distance-quadrant`.

## Who it is for

Undergraduate geology and geophysics students meeting these methods for the
first time. The site assumes you know what a seismic trace is, what a reflector
is, and roughly what AVO is trying to do. It does not assume you are comfortable
with intercept, gradient or crossplots — those are explained in module 01, and
readers who want more can work through the companion AVO basics site first.

Technical terms are explained where they first appear rather than avoided.

## The pages

The site is being reorganized from seventeen pages into twelve, grouped into four
parts. Each module covers one idea in at most three steps. Pages marked *old* are
the September 2026 versions and are replaced one at a time.

| # | Module | Built from | Status |
|---|---|---|---|
| **Part 1** | **Why a new trace** | | |
| 00 | Same rocks, two pictures | `orientation.html` | old |
| 01 | Two stacks, and what AVO reads from them | `two-stacks.html` | **rebuilt** |
| **Part 2** | **Building the DQ trace** | | |
| 02 | Marking the waveform | `stickogram.html` + `quadrants.html` | old |
| 03 | Turning every sample into a peak | `phase-filters.html` | old |
| 04 | The distance | `dq-distance.html` | old |
| **Part 3** | **The crossplot view** | | |
| 05 | Rotating and splitting the crossplot | `baseline.html` + `sectors.html` | old |
| 06 | Theta PX, the angle of the same point | `theta-px.html` | old |
| 07 | Time thickness | `isochron.html` + third axis of `rdq-crossplot.html` | old |
| **Part 4** | **What the attributes say about rocks** | | |
| 08 | Porosity | `porosity.html` | old |
| 09 | Thickness and tuning | `wedge.html` | old |
| 10 | The four AVO classes | `avo-classes.html` + statistics of `rdq-crossplot.html` | old |
| 11 | A synthetic line with every attribute | `attributes-line.html` + `reading-sections.html` | old |

`avo-limits.html` and `near-far.html` are superseded by `two-stacks.html` and are
removed once the index points at the new module.

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
- **Every module has a method tab** stating its modelling choices and what it
  does not claim.
- **Every quoted number is checked.** If the prose says a figure, a checker
  asserts it against what the page computes.
- **The rock model is identical in every module**: quartz matrix, soft shale,
  hard shale, tight sandstone, and brine, oil and gas. Change it in one place
  and you must change it everywhere, then re-run every checker.
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

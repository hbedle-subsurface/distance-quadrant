# How the DQ Trace Actually Works

A teaching site on the distance and quadrant (DQ) attributes: what they measure,
what they say about rocks, and where they stop being reliable. Every page builds
a rock model in the browser and runs the workflow on it, so a change to the
rocks shows up immediately in the seismic and in the attributes.

Open it at
[hbedle-subsurface.github.io/distance-quadrant](https://hbedle-subsurface.github.io/distance-quadrant/).

## Who this is for

**Geology and geophysics undergraduates** meeting quantitative interpretation
for the first time. The only background assumed is a seismic trace, a
reflection, and a rough idea of what AVO sets out to measure. Intercept,
gradient and crossplots are introduced in module 01.

**Geologists working with seismic data**, who read the sections other people
produce and want to know what a DQ display is showing before trusting it.

**Interpreters who already use AVO.** Module 05 puts the DQ distance beside the
intercept, [A+B]/2 and the fluid factor on the same model, so the new attribute
can be placed against familiar ones. Modules 06 to 09 do the same for the
crossplot.

## What a student should be able to do afterward

- Say what the DQ distance and Theta PX measure, and what in the rock changes
  them.
- Explain why the workflow picks, numbers and phase-rotates the near stack
  before combining it with the far stack.
- Look at a DQ section and separate what comes from the rocks from what comes
  from bed thickness or from the wavelet.
- Name the conditions under which the attributes become unreliable: thin beds,
  mixed lithology inside one loop, and input that is not zero phase, not flat
  after NMO, or not in relative amplitude.
- Recognize that one attribute value usually has more than one geological
  explanation, and say what extra information would separate the cases.

## How it teaches

- **The rocks are shown alongside the seismic.** Module 00 draws the earth model
  beside the stack section and the DQ section computed from it. Modules 08, 12,
  13 and 14 do the same, so a student can compare the attribute with the layers
  that produced it.
- **Every step carries a control.** Nothing is a static figure. Porosity, pore
  fluid, bed thickness, wavelet frequency, sample rate, noise and the enclosing
  rock are adjustable, and every panel redraws.
- **Axes are fixed.** When a slider moves, the curves and bars move and the
  axis stays where it is, so the change on screen is the effect being taught.
- **Short text.** A step runs a few hundred words. Longer arguments sit in the
  method tab, definitions in the glossary.
- **Terms are clickable.** Each technical term links to a short definition,
  covering both the background the set assumes and the attributes it teaches.
- **Exercises have more than one defensible answer** where the science does. A
  bright DQ body can come from high porosity, from hydrocarbon, or from a bed at
  tuning thickness, and the exercises ask which of those the display can rule
  out.
- **A self-test in module 13** hides the rocks behind a display, asks which of
  three models produced it, and then says whether the display could have
  separated them at all.
- **The exercises and the interactive panel pop out** into their own windows, so
  a question can be read while the controls are worked.

## The modules

Fifteen pages in four parts. Part 1 sets up the problem and the input, part 2
builds the DQ trace one operation at a time, part 3 builds the crossplot and the
attributes read from it, and part 4 puts them to work on rocks.

| # | Module | What it adds |
|---|---|---|
| **Part 1** | **Why a new trace** | |
| 00 | The rocks, and two pictures of them | The earth model beside a stack section and a DQ section |
| 01 | Two stacks, and what AVO reads from them | Near and far stacks, intercept and gradient, and what the input has to be |
| **Part 2** | **Building the DQ trace** | |
| 02 | Marking the waveform | Peaks, troughs and zero crossings picked on the near stack |
| 03 | Quadrant numbers | Q1 to Q9 across each half cycle |
| 04 | Turning every sample into a peak | Seven phase rotations, one per quadrant number |
| 05 | The distance | The signed DQ distance, and how it compares with familiar AVO attributes |
| **Part 3** | **The crossplot view** | |
| 06 | Rotating and splitting the crossplot | Shale trend onto the x-axis, then four sectors |
| 07 | Theta PX, the angle of the same point | The angle, and the fluids and lithologies it separates |
| 08 | Time thickness | Signed isochron and half isochron, on traces and on a section |
| 09 | The RDQ crossplot in three axes | Amplitude, gradient and half isochron together |
| **Part 4** | **What the attributes say about rocks** | |
| 10 | Porosity | Why a DQ trace follows a porosity log, and when it stops |
| 11 | Thickness and tuning | Which attribute carries thickness and which does not |
| 12 | The four AVO classes | The same workflow on four rock models |
| 13 | Reading a DQ section | Display conventions, and a self-test |
| 14 | A synthetic line with every attribute | Structure, faulting and the layer attributes |

## Using it in a course

The four parts are sized for separate sittings. Part 1 works as an introduction
or as preparatory reading. Parts 2 and 3 suit a laboratory session each, with
the exercises popped out beside the panel. Part 4 works as assigned individual
study, since its exercises are the ones with more than one defensible answer.

Every page writes its control positions into its address, so a link opens one
particular model. Sending students a link to a class 2 sand at tuning thickness
puts all of them in front of the same picture.

## What it does not do

The models are synthetic, noise-free by default, purely siliciclastic and built
on a single-mineral sand. Carbonates, converted waves and anisotropy are absent.
The set shows the arithmetic of the method and how it behaves on models. It does
not validate the method, and it shows no field data. A correlation computed here
is an upper limit for a clean model rather than a prediction about a survey.
Where the published description leaves a rule incompletely specified, the module
states the choice it made.

## Reading further

The method is published in *Interpretation*: Bedle et al. (2025a) on the DQ
trace, Bedle et al. (2025b) on the RDQ crossplot workflow and Theta PX, and
Bedle et al. (2025c) on the inversion workflow. The isochron attributes are
extended to field data by Choudhry et al. (2026). Each module's method tab lists
the sources behind it.

Companion sites in the same series cover
[AVO](https://hbedle-subsurface.github.io/avo-basics/),
[seismic resolution](https://hbedle-subsurface.github.io/seismic_resolution/)
and [single-trace attributes](https://hbedle-subsurface.github.io/single-trace/).

---

## For anyone editing the site

### Rebuild status

Modules 00 and 01 are in the current form. The rest are the September 2026
pages. Their science is current. Their text runs longer than the conventions
in this section allow and speaks to the reader in the second person, and it is
rewritten as each module is rebuilt. `avo-limits.html` and `near-far.html` are superseded by
`two-stacks.html`, and nothing links to them. Module 06 is served by
`baseline.html`, with `sectors.html` reached from it until the two are merged.

### Running it

Open `index.html` in a browser. No server, no build step, no package manager.

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

`assets/seismic.js` holds the shared code: wavelets, convolution, the Hilbert
transform, the FFT, canvas fitting, axes, frames, dashed lines, tags and the
lithology column. Each module carries its own copy of the rock model and its own
drawing code, so a module can be read and edited on its own.

### Conventions

- **Two-way time runs down the vertical axis.** Where a lithology column
  appears, depth is labeled down one side and two-way time down the other.
- **One idea per module, three or four short steps, a control on every step.**
  Step text stays around 150 to 250 words; anything longer goes to the method
  tab or the glossary.
- **Neutral, descriptive prose.** No second person, no imperatives in the
  teaching text, no commercial metaphors, American spelling. Exercise prompts
  are written as questions. A sequence of processing steps is a workflow.
- **Plain sentences.** One idea per sentence, few clauses, no aphorisms and no
  closing flourishes. A sentence built around a dash in the middle is usually
  two sentences.
- **Terms link to the glossary.** Mark a term with
  `<span class="g" data-g="key">term</span>`; the key must exist in
  `assets/glossary.js`, and the harness fails if it does not. Terms not marked
  by hand are marked automatically at load, first occurrence only.
- **Every module shows the workflow strip** (`<div class="flow" data-at="...">`)
  and offers the panel and the exercises as pop-out windows
  (`data-popout="panel"`, `data-popout="exercises"`).
- **Crossplot and amplitude axes are fixed**, never autoscaled. Samples outside
  the frame are counted in a readout rather than made to fit.
- **No `localStorage`.** State lives in the URL so a view can be linked.
- **Every module has a method tab** stating its modeling choices and what it
  does not claim.
- **Every quoted number is checked.** If the prose states a figure, a checker
  asserts it against what the page computes.
- **The rock model is identical in every module**: quartz matrix, soft shale,
  hard shale, tight sandstone, and brine, oil and gas. Change it in one place
  and it must then be changed everywhere and every checker re-run.
- **Color conventions**: near stack blue `#1D6FA3`, far stack pink `#C2306B`,
  crimson `#841617` for the attribute under discussion.
- **A module built by copying another must be checked for controls it dropped.**
  The harness catches leftover wiring as a script error.

### Testing

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
drawn outside their frame, clipped labels, dead links and glossary terms with no
definition. The checkers drive each module headlessly and assert the figures its
prose quotes. `tools/README.md` has the detail.

Run all of them before publishing.

## Credit and license

Built for teaching by Heather Bedle, School of Geosciences, University of
Oklahoma, with the AASPI consortium. The method itself was developed by
Dennis B. Neff and Warren Neff. Licensed under
[CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/): free to use,
share and adapt for any purpose, including training in industry, provided the
source is credited and adapted versions carry the same license.

To cite: H. Bedle, *How the DQ Trace Actually Works*, University of Oklahoma,
`hbedle-subsurface.github.io/distance-quadrant`.

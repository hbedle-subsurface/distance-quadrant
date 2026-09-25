/* ===========================================================================
   glossary.js — definitions behind every clickable term on the site

   Each entry: term (as displayed), def (one to three sentences, plain HTML),
   and optionally more (where the idea is developed on the site). Definitions
   say what a thing is and does physically. Keep them short; a definition that
   needs a figure belongs in a module step instead.
   =========================================================================== */
window.DQ_GLOSSARY = {


  /* --- the DQ attributes themselves --------------------------------------- */
  'dq-trace': {
    match: ['DQ trace'],
    term: 'DQ trace',
    def: 'The trace of distance and quadrant values, one per sample, built from a quadrant-enhanced ' +
      'near stack and far stack. It appears blocked rather than sinusoidal, with boundaries at the ' +
      'picks (Bedle et al., 2025a).',
    more: 'Built in modules 02 to 05.',
  },
  'dq-distance': {
    match: ['DQ distance', 'distance value'],
    term: 'DQ distance',
    def: 'The length of the vector whose components are the quadrant-enhanced near stack and the ' +
      'quadrant-enhanced gradient: \u221a(2QN\u00b2 + QF\u00b2 \u2212 2QN\u00b7QF). It is a length, ' +
      'so the sign of the local waveform slope is attached afterwards.',
    more: 'Module 05.',
  },
  'quadrant-number': {
    match: ['quadrant number', 'quadrant numbers'],
    term: 'Quadrant number',
    def: 'A number from Q1 to Q9 giving a sample\u2019s position within a half cycle of the near stack: ' +
      'Q1 at a trough, Q5 at a zero crossing, Q9 at a peak, with the interior numbers spread between ' +
      'them. Each number names the phase rotation that sample is read from.',
    more: 'Module 03.',
  },
  'quadrant-enhancement': {
    match: ['quadrant enhancement', 'quadrant-enhanced', 'quadrant enhanced'],
    term: 'Quadrant enhancement',
    def: 'Reading every sample from the phase-rotated copy of its trace named by its quadrant number, ' +
      'which leaves each sample at the equivalent of a peak or a trough. The traces that result are ' +
      'written QN and QF.',
    more: 'Module 04.',
  },
  'phase-rotation': {
    match: ['phase rotation', 'phase rotations', 'phase shift filter', 'phase-shift filter'],
    term: 'Phase rotation',
    def: 'Mixing a trace with its Hilbert transform, x cos \u03b8 + H(x) sin \u03b8, which moves the ' +
      'waveform through phase without changing its amplitude spectrum. The DQ workflow uses seven of ' +
      'them, at \u00b122.5, \u00b145, \u00b167.5 and \u221290 degrees.',
  },
  'rdq': {
    match: ['RDQ crossplot', 'RDQ'],
    term: 'RDQ crossplot',
    def: 'The rotated distance and quadrant crossplot: quadrant-enhanced amplitude against ' +
      'quadrant-enhanced gradient, rotated so the background shale trend lies along the x-axis and ' +
      'split into four sectors by quadrant number (Bedle et al., 2025b).',
    more: 'Modules 06 and 09.',
  },
  'shale-baseline': {
    match: ['shale baseline', 'background shale trend', 'shale trend'],
    term: 'Shale baseline',
    def: 'The line along which shale samples fall on an AVO crossplot. The RDQ workflow rotates the ' +
      'data so that line lies on the x-axis, which is found by testing rotations rather than assumed ' +
      'from a mudrock line.',
    more: 'Module 06.',
  },
  'sector': {
    match: ['sector expansion', 'sector split', 'sector splitting'],
    term: 'Sector expansion',
    def: 'Reflecting the samples whose quadrant numbers run Q3 to Q7 in the rotated x-axis, so the ' +
      'crossplot fills four sectors instead of two. Each sector then holds samples from one part of a ' +
      'layer, which lets thickness and porosity be read separately.',
    more: 'Module 06.',
  },
  'theta-px': {
    match: ['Theta PX', 'polar angle'],
    term: 'Theta PX (\u03b8px)',
    def: 'The angle of a sample on the rotated crossplot, folded into 0 to 90 degrees by a ' +
      'sector-specific rule and given the sign of the DQ distance. It responds mainly to the change in ' +
      'V<sub>P</sub>/V<sub>S</sub> across a boundary, so it separates fluids and lithologies.',
    more: 'Module 07.',
  },
  'signed-isochron': {
    match: ['signed isochron'],
    term: 'Signed isochron',
    def: 'The time between a trough and the next peak, or a peak and the next trough, with the sign ' +
      'taken from the direction of the waveform: positive on a rising limb, negative on a falling one.',
    more: 'Module 08.',
  },
  'half-isochron': {
    match: ['half isochron', 'signed half isochron'],
    term: 'Signed half isochron',
    def: 'The time from an extremum to the neighboring zero crossing, signed the same way. It is more ' +
      'sensitive to thin beds and to variability within a layer than the full isochron, and it is the ' +
      'third axis of the three-dimensional crossplot.',
    more: 'Modules 08 and 09.',
  },
  'stickogram': {
    match: ['StickOgram'],
    term: 'StickOgram',
    def: 'A display of the picks alone: the centers of peaks, the centers of troughs and the zero ' +
      'crossings of the near stack, with everything between them removed.',
    more: 'Module 02.',
  },
  'blocked': {
    match: ['blocked', 'blocked format'],
    term: 'Blocked trace',
    def: 'A trace that holds one value across a layer and steps at its boundaries, rather than rising ' +
      'and falling as a wavelet does. The DQ trace is blocked because every sample in a half cycle is ' +
      'raised to the equivalent of a peak.',
  },
  'relative-porosity': {
    match: ['relative porosity'],
    term: 'Relative porosity',
    def: 'A curve whose shape follows porosity but whose scale is not calibrated. The DQ papers ' +
      'describe the DQ trace as a relative porosity curve before inversion, and as a quantitative ' +
      'prediction after one.',
    more: 'Module 10.',
  },
  'hpv': {
    match: ['hydrocarbon pore volume', 'HPV'],
    term: 'Hydrocarbon pore volume',
    def: 'Porosity multiplied by hydrocarbon saturation and by the thickness of the interval: how much ' +
      'hydrocarbon a column of rock holds. The layer attributes become average and total HPV once the ' +
      'DQ trace has been tied to a well.',
  },
  'layer-attribute': {
    match: ['DQ Average', 'DQ Sum', 'layer attribute', 'layer attributes'],
    term: 'Layer attributes',
    def: 'Attributes with one value per layer rather than per sample: the average and the sum of the ' +
      'DQ values between two picks, and the median of Theta PX over the same interval.',
    more: 'Module 14.',
  },

  /* --- acquisition and processing ---------------------------------------- */
  'cdp': {
    match: ['CDP'],
    term: 'CDP (common depth point)',
    def: 'The set of source and receiver pairs whose reflections come from the same subsurface ' +
      'location. Sorting traces by CDP gathers every angle that illuminated one spot into one place.',
  },
  'gather': {
    match: ['gather', 'gathers'],
    term: 'Gather',
    def: 'A collection of traces from one CDP, arranged side by side by offset or by incidence ' +
      'angle. Each trace records the same boundaries at a different angle.',
  },
  'angle-gather': {
    match: ['angle gather'],
    term: 'Angle gather',
    def: 'A gather in which each trace corresponds to one incidence angle rather than one ' +
      'source-receiver offset. Reflection strength can be read directly against angle.',
  },
  'nmo': {
    match: ['NMO correction', 'normal moveout'],
    term: 'NMO correction (normal moveout)',
    def: 'A time shift applied to each trace in a gather so that a reflection arrives at the same ' +
      'two-way time at every offset. After it, a flat event across the gather is one boundary.',
  },
  'relative-amplitude': {
    match: ['relative amplitude'],
    term: 'Relative amplitude',
    def: 'Processing that keeps the ratio between amplitudes meaningful, so a reflection that is ' +
      'twice as strong in the earth is twice as strong on the trace. AVO depends on it.',
  },
  'incidence-angle': {
    match: ['incidence angle'],
    term: 'Incidence angle',
    def: 'The angle between a ray and the vertical where the ray meets a boundary. Near traces have ' +
      'small angles and far traces large ones.',
  },
  'partial-stack': {
    match: ['partial stack', 'partial stacks'],
    term: 'Partial stack',
    def: 'The average of only some of the traces in a gather, usually those within a chosen range ' +
      'of incidence angles. A full stack averages all of them.',
  },
  'near-stack': {
    match: ['near stack', 'near-stack'],
    term: 'Near stack (N)',
    def: 'The partial stack of the small incidence angles. In the DQ workflow it is the average of ' +
      'the 0&ndash;10&deg; traces.',
    more: 'Built in module 01.',
  },
  'far-stack': {
    match: ['far stack', 'far-stack'],
    term: 'Far stack (F)',
    def: 'The partial stack of the larger incidence angles. In the DQ workflow it is the average of ' +
      'the 20&ndash;30&deg; traces, although the range depends on the data.',
    more: 'Built in module 01.',
  },
  'two-way-time': {
    match: ['two-way time'],
    term: 'Two-way time (TWT)',
    def: 'The time a seismic wave takes to travel down to a reflector and back up. Seismic sections ' +
      'are displayed with two-way time increasing downward.',
  },

  /* --- rock physics and reflection --------------------------------------- */
  'impedance': {
    match: ['acoustic impedance', 'impedance'],
    term: 'Acoustic impedance',
    def: 'P-wave velocity multiplied by density. A reflection occurs where impedance changes across ' +
      'a boundary; the larger the change, the stronger the reflection.',
  },
  'rc': {
    match: ['reflection coefficient', 'reflection coefficients'],
    term: 'Reflection coefficient',
    def: 'The fraction of the incoming wave amplitude that reflects at a boundary, between &minus;1 and ' +
      '+1. Its sign records whether the rock below has higher or lower impedance than the rock above.',
  },
  'vpvs': {
    match: ['Vp/Vs', 'VP/VS'],
    term: 'V<sub>P</sub>/V<sub>S</sub>',
    def: 'The ratio of P-wave velocity to S-wave velocity. Gas in the pores lowers it strongly in a ' +
      'sand, which is why gas changes how reflections vary with angle.',
  },
  'porosity': {
    match: ['porosity'],
    term: 'Porosity',
    def: 'The fraction of a rock&rsquo;s volume that is pore space. It is quoted as a percentage or in ' +
      'porosity units (p.u.), where 1 p.u. is 1%.',
  },
  'gassmann': {
    match: ['Gassmann'],
    term: 'Gassmann fluid substitution',
    def: 'A rock physics relation that predicts how a rock&rsquo;s velocities and density change when ' +
      'the fluid in its pores is replaced, for example brine by gas.',
  },

  /* --- AVO ---------------------------------------------------------------- */
  'avo': {
    match: ['AVO'],
    term: 'AVO (amplitude variation with offset)',
    def: 'The change in reflection strength with incidence angle. The pattern depends on the ' +
      'velocities and densities on either side of the boundary, so it carries information about ' +
      'lithology and pore fluid.',
  },
  'shuey': {
    match: ['Shuey'],
    term: 'Shuey approximation',
    def: 'A simplification of the Zoeppritz equations that writes the reflection coefficient as a ' +
      'straight line in sin&sup2;&theta;: R(&theta;) = A + B sin&sup2;&theta;. It is generally accurate ' +
      'to incidence angles of about 30&deg; (Shuey, 1985).',
  },
  'intercept': {
    match: ['intercept'],
    term: 'Intercept (A)',
    def: 'The reflection coefficient at zero incidence angle. It is controlled mostly by the change ' +
      'in acoustic impedance across the boundary.',
  },
  'gradient': {
    match: ['gradient'],
    term: 'Gradient (B)',
    def: 'How fast the reflection coefficient changes as sin&sup2;&theta; increases. It is sensitive ' +
      'to the change in V<sub>P</sub>/V<sub>S</sub> across the boundary.',
  },
  'avo-class': {
    match: ['AVO class', 'AVO classes'],
    term: 'AVO class',
    def: 'A grouping of sand-top responses by their intercept and gradient (Rutherford and Williams, ' +
      '1989; Castagna and Swan, 1997). Class 1 sands are harder than the shale above; class 3 and 4 ' +
      'sands are softer, class 4 with a gradient of opposite sign to class 3; class 2 sands have little ' +
      'impedance contrast, and class 2p sands change polarity with angle (Ross and Kinman, 1995). The ' +
      'numerical boundaries between classes used on this site are its own convention.',
  },
  'crossplot': {
    match: ['crossplot'],
    term: 'Crossplot',
    def: 'A graph of one quantity against another for many samples at once. An AVO crossplot puts ' +
      'intercept, or the near stack, on the x-axis and gradient, or far minus near, on the y-axis.',
  },
  'two-layer': {
    match: ['two-layer model', 'two-layer'],
    term: 'Two-layer model',
    def: 'The assumption behind most AVO equations: one boundary between two thick layers, with no ' +
      'other boundaries nearby and no wavelet. Real seismic has many layers, each reflection ' +
      'spread out by the wavelet.',
  },

  /* --- the waveform ------------------------------------------------------- */
  'wavelet': {
    match: ['wavelet'],
    term: 'Wavelet',
    def: 'The short seismic signal that travels through the earth. Every reflection on a trace is a ' +
      'copy of the wavelet, scaled by the reflection coefficient and placed at the boundary&rsquo;s ' +
      'two-way time.',
  },
  'ricker': {
    match: ['Ricker'],
    term: 'Ricker wavelet',
    def: 'A symmetric, zero-phase wavelet defined by a single peak frequency. The DQ papers use a ' +
      '40 Hz Ricker for their synthetic models.',
  },
  'zero-phase': {
    match: ['zero phase', 'zero-phase'],
    term: 'Zero phase',
    def: 'A wavelet that is symmetric about its center, so its largest value sits exactly at the ' +
      'time of the reflection it represents.',
  },
  'convolution': {
    match: ['convolution', 'convolved'],
    term: 'Convolution',
    def: 'The operation that places a copy of the wavelet at every reflection coefficient and adds ' +
      'the overlapping copies together. A synthetic seismic trace is the reflectivity convolved ' +
      'with the wavelet.',
  },
  'peak': {
    match: ['peak'],
    term: 'Peak',
    def: 'A local maximum on a trace. This site draws a positive reflection coefficient as a peak, so ' +
      'with a zero-phase wavelet and a thick bed a peak sits at a boundary where impedance increases ' +
      'downward. Other polarity conventions reverse this.',
  },
  'trough': {
    match: ['trough'],
    term: 'Trough',
    def: 'A local minimum on a trace. Under the polarity convention used on this site, with a ' +
      'zero-phase wavelet and a thick bed, a trough sits at a boundary where impedance decreases ' +
      'downward, such as the top of a soft sand.',
  },
  'zero-crossing': {
    match: ['zero crossing', 'zero crossings'],
    term: 'Zero crossing',
    def: 'The point where a trace changes sign between a peak and a trough.',
  },
  'extremum': {
    match: ['extremum', 'extrema'],
    term: 'Extremum',
    def: 'A peak maximum or a trough minimum. At an extremum the trace is dominated by a single ' +
      'boundary, which is where a two-layer AVO reading is cleanest.',
  },
  'sidelobe': {
    match: ['sidelobe', 'side lobe'],
    term: 'Sidelobe',
    def: 'The smaller lobes of opposite sign on either side of a wavelet&rsquo;s main lobe. They ' +
      'appear on the trace above and below every reflection.',
  },
  'tuning': {
    match: ['tuning'],
    term: 'Tuning',
    def: 'Interference between the reflections from the top and base of a bed thinner than about ' +
      'half a wavelength. Amplitudes grow and then fade as the bed thins (Widess, 1973).',
  },
  'sample-rate': {
    match: ['sample rate'],
    term: 'Sample rate',
    def: 'The time between successive values on a digital trace. The DQ papers resample the near ' +
      'and far stacks to 1 ms.',
  },
};

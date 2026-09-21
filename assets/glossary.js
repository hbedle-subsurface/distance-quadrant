/* ===========================================================================
   glossary.js — definitions behind every clickable term on the site

   Each entry: term (as displayed), def (one to three sentences, plain HTML),
   and optionally more (where the idea is developed on the site). Definitions
   say what a thing is and does physically. Keep them short; a definition that
   needs a figure belongs in a module step instead.
   =========================================================================== */
window.DQ_GLOSSARY = {

  /* --- acquisition and processing ---------------------------------------- */
  'cdp': {
    term: 'CDP (common depth point)',
    def: 'The set of source and receiver pairs whose reflections come from the same subsurface ' +
      'location. Sorting traces by CDP gathers every angle that illuminated one spot into one place.',
  },
  'gather': {
    term: 'Gather',
    def: 'A collection of traces from one CDP, arranged side by side by offset or by incidence ' +
      'angle. Each trace records the same boundaries at a different angle.',
  },
  'angle-gather': {
    term: 'Angle gather',
    def: 'A gather in which each trace corresponds to one incidence angle rather than one ' +
      'source-receiver offset. Reflection strength can be read directly against angle.',
  },
  'nmo': {
    term: 'NMO correction (normal moveout)',
    def: 'A time shift applied to each trace in a gather so that a reflection arrives at the same ' +
      'two-way time at every offset. After it, a flat event across the gather is one boundary.',
  },
  'relative-amplitude': {
    term: 'Relative amplitude',
    def: 'Processing that keeps the ratio between amplitudes meaningful, so a reflection that is ' +
      'twice as strong in the earth is twice as strong on the trace. AVO depends on it.',
  },
  'incidence-angle': {
    term: 'Incidence angle',
    def: 'The angle between a ray and the vertical where the ray meets a boundary. Near traces have ' +
      'small angles and far traces large ones.',
  },
  'partial-stack': {
    term: 'Partial stack',
    def: 'The average of only some of the traces in a gather, usually those within a chosen range ' +
      'of incidence angles. A full stack averages all of them.',
  },
  'near-stack': {
    term: 'Near stack (N)',
    def: 'The partial stack of the small incidence angles. In the DQ workflow it is the average of ' +
      'the 0&ndash;10&deg; traces.',
    more: 'Built in module 01.',
  },
  'far-stack': {
    term: 'Far stack (F)',
    def: 'The partial stack of the larger incidence angles. In the DQ workflow it is the average of ' +
      'the 20&ndash;30&deg; traces, although the range depends on the data.',
    more: 'Built in module 01.',
  },
  'two-way-time': {
    term: 'Two-way time (TWT)',
    def: 'The time a seismic wave takes to travel down to a reflector and back up. Seismic sections ' +
      'are displayed with two-way time increasing downward.',
  },

  /* --- rock physics and reflection --------------------------------------- */
  'impedance': {
    term: 'Acoustic impedance',
    def: 'P-wave velocity multiplied by density. A reflection occurs where impedance changes across ' +
      'a boundary; the larger the change, the stronger the reflection.',
  },
  'rc': {
    term: 'Reflection coefficient',
    def: 'The fraction of the incoming wave amplitude that reflects at a boundary, between &minus;1 and ' +
      '+1. Its sign records whether the rock below has higher or lower impedance than the rock above.',
  },
  'vpvs': {
    term: 'V<sub>P</sub>/V<sub>S</sub>',
    def: 'The ratio of P-wave velocity to S-wave velocity. Gas in the pores lowers it strongly in a ' +
      'sand, which is why gas changes how reflections vary with angle.',
  },
  'porosity': {
    term: 'Porosity',
    def: 'The fraction of a rock&rsquo;s volume that is pore space. It is quoted as a percentage or in ' +
      'porosity units (p.u.), where 1 p.u. is 1%.',
  },
  'gassmann': {
    term: 'Gassmann fluid substitution',
    def: 'A rock physics relation that predicts how a rock&rsquo;s velocities and density change when ' +
      'the fluid in its pores is replaced, for example brine by gas.',
  },

  /* --- AVO ---------------------------------------------------------------- */
  'avo': {
    term: 'AVO (amplitude variation with offset)',
    def: 'The change in reflection strength with incidence angle. The pattern depends on the ' +
      'velocities and densities on either side of the boundary, so it carries information about ' +
      'lithology and pore fluid.',
  },
  'shuey': {
    term: 'Shuey approximation',
    def: 'A simplification of the Zoeppritz equations that writes the reflection coefficient as a ' +
      'straight line in sin&sup2;&theta;: R(&theta;) = A + B sin&sup2;&theta;. It is generally accurate ' +
      'to incidence angles of about 30&deg; (Shuey, 1985).',
  },
  'intercept': {
    term: 'Intercept (A)',
    def: 'The reflection coefficient at zero incidence angle. It is controlled mostly by the change ' +
      'in acoustic impedance across the boundary.',
  },
  'gradient': {
    term: 'Gradient (B)',
    def: 'How fast the reflection coefficient changes as sin&sup2;&theta; increases. It is sensitive ' +
      'to the change in V<sub>P</sub>/V<sub>S</sub> across the boundary.',
  },
  'avo-class': {
    term: 'AVO class',
    def: 'A grouping of sand-top responses by their intercept and gradient (Rutherford and Williams, ' +
      '1989; Castagna and Swan, 1997). Class 1 sands are harder than the shale above; class 3 and 4 ' +
      'sands are softer, class 4 with a gradient of opposite sign to class 3; class 2 sands have little ' +
      'impedance contrast, and class 2p sands change polarity with angle (Ross and Kinman, 1995). The ' +
      'numerical boundaries between classes used on this site are its own convention.',
  },
  'crossplot': {
    term: 'Crossplot',
    def: 'A graph of one quantity against another for many samples at once. An AVO crossplot puts ' +
      'intercept, or the near stack, on the x-axis and gradient, or far minus near, on the y-axis.',
  },
  'two-layer': {
    term: 'Two-layer model',
    def: 'The assumption behind most AVO equations: one boundary between two thick layers, with no ' +
      'other boundaries nearby and no wavelet. Real seismic has many layers, each reflection ' +
      'spread out by the wavelet.',
  },

  /* --- the waveform ------------------------------------------------------- */
  'wavelet': {
    term: 'Wavelet',
    def: 'The short seismic signal that travels through the earth. Every reflection on a trace is a ' +
      'copy of the wavelet, scaled by the reflection coefficient and placed at the boundary&rsquo;s ' +
      'two-way time.',
  },
  'ricker': {
    term: 'Ricker wavelet',
    def: 'A symmetric, zero-phase wavelet defined by a single peak frequency. The DQ papers use a ' +
      '40 Hz Ricker for their synthetic models.',
  },
  'zero-phase': {
    term: 'Zero phase',
    def: 'A wavelet that is symmetric about its center, so its largest value sits exactly at the ' +
      'time of the reflection it represents.',
  },
  'convolution': {
    term: 'Convolution',
    def: 'The operation that places a copy of the wavelet at every reflection coefficient and adds ' +
      'the overlapping copies together. A synthetic seismic trace is the reflectivity convolved ' +
      'with the wavelet.',
  },
  'peak': {
    term: 'Peak',
    def: 'A local maximum on a trace. This site draws a positive reflection coefficient as a peak, so ' +
      'with a zero-phase wavelet and a thick bed a peak sits at a boundary where impedance increases ' +
      'downward. Other polarity conventions reverse this.',
  },
  'trough': {
    term: 'Trough',
    def: 'A local minimum on a trace. Under the polarity convention used on this site, with a ' +
      'zero-phase wavelet and a thick bed, a trough sits at a boundary where impedance decreases ' +
      'downward, such as the top of a soft sand.',
  },
  'zero-crossing': {
    term: 'Zero crossing',
    def: 'The point where a trace changes sign between a peak and a trough.',
  },
  'extremum': {
    term: 'Extremum',
    def: 'A peak maximum or a trough minimum. At an extremum the trace is dominated by a single ' +
      'boundary, which is where a two-layer AVO reading is cleanest.',
  },
  'sidelobe': {
    term: 'Sidelobe',
    def: 'The smaller lobes of opposite sign on either side of a wavelet&rsquo;s main lobe. They ' +
      'appear on the trace above and below every reflection.',
  },
  'tuning': {
    term: 'Tuning',
    def: 'Interference between the reflections from the top and base of a bed thinner than about ' +
      'half a wavelength. Amplitudes grow and then fade as the bed thins (Widess, 1973).',
  },
  'sample-rate': {
    term: 'Sample rate',
    def: 'The time between successive values on a digital trace. The DQ papers resample the near ' +
      'and far stacks to 1 ms.',
  },
};

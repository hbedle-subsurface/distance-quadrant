'use strict';
/* Physics statements that reviewers have caught wrong, held so they cannot
   return through an edit or a copy from an older page. Each pattern is the
   wrong form; the comment gives the right one.
   Usage: node tools/check-claims.js */
const fs = require('fs'), path = require('path');
const R = path.resolve(__dirname, '..');
const files = ['index.html'].concat(fs.readdirSync(R + '/modules').filter((f) => f.endsWith('.html')).map((f) => 'modules/' + f));
const WRONG = [
  // class 1: the sand is harder and faster than its seal, positive intercept, top is a peak
  [/class 1[^.]{0,80}\b(slower|softer)\s+than/i, 'a class 1 sand called slower or softer than its seal'],
  // porosity weakens the frame against shear more than against compression, so Vp/Vs rises
  [/weakens the rock against a P-wave more than against an S-wave/i, 'porosity said to weaken P more than S'],
  // a quarter-wavelength bed is half the wavelet period in two-way time (12.5 ms at 40 Hz)
  [/quarter of (the|a) (wavelet )?period[^.]{0,60}tun|tun[^.]{0,80}quarter of (the|a) (wavelet )?period|6\.3 ms at 40 Hz/i,
    'tuning given as a quarter of the period'],
  // a rotation about the origin keeps every distance from the origin; it changes direction only
  [/rotat[^.]{0,80}(converts|turns) (a )?distance|lets the distance measure|distance becomes interpretable/i,
    'a rotation said to change the distance'],
];
const fail = [];
files.forEach((f) => {
  const txt = fs.readFileSync(path.join(R, f), 'utf8').replace(/<[^>]+>/g, ' ').replace(/&[a-z]+;/g, ' ').replace(/\s+/g, ' ');
  WRONG.forEach(([re, what]) => { const m = txt.match(re); if (m) fail.push(f + ': ' + what + ' ("' + m[0].slice(0, 70) + '")'); });
});
console.log('   ' + files.length + ' pages, ' + WRONG.length + ' known errors checked');
console.log(fail.length ? '\nFAILED\n  ' + fail.join('\n  ') : '\nevery quoted number checks out');
process.exit(fail.length ? 1 : 0);

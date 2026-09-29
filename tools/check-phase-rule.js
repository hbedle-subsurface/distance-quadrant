'use strict';
/* The published phase-filter table is applied as printed on rising and
   falling limbs alike (module 04). An earlier draft negated it on falling
   limbs, which halves the enhanced amplitude there and zeroes Q3 and Q7.
   The code was copied into every module, so this scans all of them.
   check-index.js tests the behavior on the landing-page figure.
   Usage: node tools/check-phase-rule.js */
const fs = require('fs'), path = require('path');
const R = path.resolve(__dirname, '..');
const files = fs.readdirSync(R + '/modules').filter((f) => f.endsWith('.html')).map((f) => 'modules/' + f)
  .concat(['assets/index-hero.js']);
const fail = [];
const bad = [/if\s*\(\s*sign\[i\]\s*<\s*0\s*\)\s*deg\s*=\s*-\s*deg/, /deg\s*=\s*-\s*deg/];
let n = 0;
files.forEach((f) => {
  const s = fs.readFileSync(path.join(R, f), 'utf8');
  if (!/PHASE_OF\s*=/.test(s)) return;
  n++;
  const table = s.match(/PHASE_OF\s*=\s*\{([^}]*)\}/)[1].replace(/\s+/g, '');
  if (table !== "1:0,2:22.5,3:45,4:67.5,5:-90,6:-67.5,7:-45,8:-22.5,9:0") fail.push(f + ': filter table differs: ' + table);
  bad.forEach((re) => { if (re.test(s)) fail.push(f + ': negates the filter angle (' + re.source + ')'); });
  if (/on a falling limb\s+the phase that centers a sample runs the other way/.test(s)) fail.push(f + ': old falling-limb comment');
});
console.log('   files with the filter table: ' + n);
console.log(fail.length ? '\nFAILED\n  ' + fail.join('\n  ') : '\nevery quoted number checks out');
process.exit(fail.length ? 1 : 0);

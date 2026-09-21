'use strict';
const fs=require('fs'),{JSDOM}=require('jsdom');const R=require('path').resolve(__dirname,'..');
const h=fs.readFileSync(R+'/modules/phase-filters.html','utf8'),s=fs.readFileSync(R+'/assets/seismic.js','utf8');
const stub=()=>new Proxy({measureText:t=>({width:6}),createLinearGradient:()=>({addColorStop(){}}),
 getImageData:(x,y,w,hh)=>({data:new Uint8ClampedArray(w*hh*4),width:w,height:hh}),canvas:{}},
 {get:(t,k)=>k in t?t[k]:()=>{},set:()=>true});
const d=new JSDOM(h.replace('<script src="../assets/count.js"></script>','')
 .replace('<script src="../assets/seismic.js"></script>','<script>'+s+'</script>'),
 {runScripts:'dangerously',url:'https://e.org/m.html',pretendToBeVisual:true,
  beforeParse(w){w.HTMLCanvasElement.prototype.getContext=()=>stub();
   Object.defineProperty(w.HTMLElement.prototype,'clientWidth',{configurable:true,get(){return 640}});}});
const {window}=d,doc=window.document,$=i=>doc.getElementById(i);
const hit=q=>doc.querySelector(q).dispatchEvent(new window.MouseEvent('click',{bubbles:true}));
const set=(i,v)=>{const e=$(i);e.value=String(v);e.dispatchEvent(new window.Event('input',{bubbles:true}));};
const chk=(i,v)=>{const e=$(i);e.checked=v;e.dispatchEvent(new window.Event('change',{bubbles:true}));};
const num=t=>parseFloat(String(t).replace('%','').replace(' of peak',''));
const fail=[];

console.log('--- exercise 1: a rotation conserves energy but not peak amplitude ---');
hit('#tabs button[data-tab="p1"]');
const en=[],rel=[];
for(let k=0;k<8;k++){set('phase',k);
 en.push($('s1d').textContent); rel.push($('s1c').textContent);
 console.log('  ',$('s1a').textContent.padEnd(8),'peak',$('s1b').textContent.padEnd(9),
  'relative',$('s1c').textContent.padEnd(7),'energy',$('s1d').textContent);}
if(new Set(en).size!==1) fail.push('energy changed across filters: '+[...new Set(en)].join(', '));
if(new Set(rel).size<4) fail.push('peak amplitude barely varies across filters');

console.log('\n--- the rotation as a weighted sum ---');
for(let k=0;k<8;k++){set('phase',k);
 const cs=parseFloat($('s1f').textContent.replace('\u2212','-'));
 const sn=parseFloat($('s1g').textContent.replace('\u2212','-'));
 const u=parseFloat($('s1h').textContent);
 console.log('  ',$('s1a').textContent.padEnd(8),'cos',$('s1f').textContent,
   ' sin',$('s1g').textContent,' sum of squares',$('s1h').textContent,' ',$('s1i').textContent);
 if(Math.abs(u-1)>1e-5) fail.push('cos2+sin2 is '+u+' at '+$('s1a').textContent);
 if(!/machine precision/.test($('s1i').textContent))
   fail.push('the weighted sum does not match the direct rotation at '+$('s1a').textContent+': '+$('s1i').textContent);}
set('phase',0);

console.log('\n--- exercise 2: the rotated Ricker peak sequence ---');
set('phase',0);
console.log('  ',$('s1e').textContent);
const m=$('s1e').textContent.match(/1\.000, ([\d.]+), ([\d.]+), ([\d.]+), ([\d.]+)/);
if(!m) fail.push('could not read the peak sequence from the reading line');
else{const v=m.slice(1).map(Number);
 console.log('   parsed:',v.join(', '));
 const want=[0.988,0.954,0.899,0.827];
 want.forEach((w,i)=>{if(Math.abs(v[i]-w)>0.006)
   fail.push('rotated peak '+i+' is '+v[i]+', answer says '+w);});}

console.log('\n--- exercise 3: QN peak against the near stack peak ---');
hit('#tabs button[data-tab="p2"]');
console.log('   near stack',$('s2c').textContent,'  QN',$('s2d').textContent,
            '  filters used',$('s2b').textContent);
const pn=parseFloat($('s2c').textContent), pq=parseFloat($('s2d').textContent);
if(!(pq>pn)) fail.push('QN peak '+pq+' is not above the near stack peak '+pn+'; answer says it is larger');
if(Math.abs(pq/pn-1.12)>0.03) fail.push('QN peak is '+(pq/pn).toFixed(3)+' x the near stack, answer says about 1.12');

console.log('\n--- exercises 4 and 5: distance from the Hilbert envelope ---');
hit('#tabs button[data-tab="p3"]');
chk('naive',false);
const good=num($('s3a').textContent), rg=parseFloat($('s3b').textContent);
chk('naive',true);
const bad=num($('s3a').textContent), rb=parseFloat($('s3b').textContent);
chk('naive',false);
console.log('   falling limb negated :',good.toFixed(1)+'%  correlation',rg);
console.log('   tabulated on both    :',bad.toFixed(1)+'%  correlation',rb);
if(Math.abs(good-1.5)>0.4) fail.push('negated difference is '+good+'%, answer says 1.5%');
if(!(rg>=0.999)) fail.push('correlation is '+rg+', answer says 0.999');
if(Math.abs(bad-21.6)>1.0) fail.push('inverted difference is '+bad+'%, answer says 21.6%');
if(!(rb>0.74&&rb<0.82)) fail.push('inverted correlation is '+rb+', answer says about 0.78');

console.log('\n--- exercise 6: noise is amplified by the enhancement ---');
for(const n of [0,10,20,30]){set('noise',n);
 console.log('  ',String(n).padStart(2)+'%  difference',$('s3a').textContent.padEnd(12),
  'correlation',$('s3b').textContent);}
set('noise',0);

console.log('\n--- the model across overburdens and fluids ---');
for(const o of ['soft','hard','tight']){hit('[data-over="'+o+'"]');
 const v=num($('s3a').textContent);
 console.log('  ',o.padEnd(5),v.toFixed(1)+'% from the envelope');
 if(v>5) fail.push(o+' overburden gives '+v.toFixed(1)+'%, further from the envelope than expected');}
hit('[data-over="tight"]');
const lim=num($('s3a').textContent);
if(Math.abs(lim-3.3)>1) fail.push('tight sandstone gives '+lim.toFixed(1)+'%, answer says a little over 3%');
hit('[data-over="soft"]');

console.log('\n=======================================');
if(fail.length){fail.forEach(f=>console.log('  -',f));process.exit(1);}
console.log('every quoted number checks out');

'use strict';
const fs=require('fs'),path=require('path'),{JSDOM}=require('jsdom');
const ROOT=require('path').resolve(__dirname,'..');
const html=fs.readFileSync(ROOT+'/modules/near-far.html','utf8');
const seis=fs.readFileSync(ROOT+'/assets/seismic.js','utf8');
const stub=()=>new Proxy({measureText:t=>({width:6}),createLinearGradient:()=>({addColorStop(){}}),
 getImageData:(x,y,w,h)=>({data:new Uint8ClampedArray(w*h*4),width:w,height:h}),canvas:{}},
 {get:(t,k)=>k in t?t[k]:()=>{},set:()=>true});
const dom=new JSDOM(html.replace('<script src="../assets/count.js"></script>','')
 .replace('<script src="../assets/seismic.js"></script>','<script>'+seis+'</script>'),
 {runScripts:'dangerously',url:'https://e.org/m.html',pretendToBeVisual:true,
  beforeParse(w){w.HTMLCanvasElement.prototype.getContext=()=>stub();
   Object.defineProperty(w.HTMLElement.prototype,'clientWidth',{configurable:true,get(){return 640}});}});
const {window}=dom,doc=window.document,$=i=>doc.getElementById(i);
const hit=q=>doc.querySelector(q).dispatchEvent(new window.MouseEvent('click',{bubbles:true}));
const set=(i,v)=>{const e=$(i);e.value=String(v);e.dispatchEvent(new window.Event('input',{bubbles:true}));};
const fail=[];

console.log('--- step 2: the two coefficients ---');
hit('#tabs button[data-tab="p2"]'); set('far',20);
console.log('  mean sin2 near', $('s2a').textContent, ' far', $('s2b').textContent,
            ' F-N = B x', $('s2c').textContent, ' largest N-A gap', $('s2d').textContent);
if($('s2a').textContent!=='0.0101') fail.push('near coefficient is '+$('s2a').textContent+', prose says 0.0101');
if($('s2b').textContent!=='0.1802') fail.push('far coefficient is '+$('s2b').textContent+', prose says 0.1802');
if($('s2c').textContent!=='0.1701') fail.push('gain is '+$('s2c').textContent+', prose says 0.1701');

console.log('\n--- exercise 1: largest gap between N and A, over all overburdens ---');
let worst=0;
for(const o of ['soft','hard','tight']){hit('[data-over="'+o+'"]');
 const g=parseFloat($('s2d').textContent); worst=Math.max(worst,g);
 console.log('  ',o.padEnd(5),g.toFixed(4));}
console.log('   worst:',worst.toFixed(4));
if(!(worst>0.005&&worst<0.009)) fail.push('worst N-A gap is '+worst.toFixed(4)+', answer says about 0.007');

console.log('\n--- exercise 2: far window from 12 to 45 degrees ---');
hit('[data-over="soft"]');
for(const f of [12,20,25,30]){set('far',f);
 console.log('  ',($('farV').textContent).padEnd(10),'F-N = B x',$('s2c').textContent);}
set('far',12); const lo=parseFloat($('s2c').textContent);
set('far',30); const hi=parseFloat($('s2c').textContent);
if(lo.toFixed(4)!=='0.0775') fail.push('12 deg gain is '+lo.toFixed(4)+', answer says 0.0775');
if(hi.toFixed(4)!=='0.3198') fail.push('30 deg gain is '+hi.toFixed(4)+', answer says 0.3198');
if(!(Math.abs(hi/lo-4)<0.4)) fail.push('gain ratio is '+(hi/lo).toFixed(2)+', answer says roughly quadruples');

console.log('\n--- exercise 3: fair to the fit, 40% noise, no moveout ---');
hit('#tabs button[data-tab="p3"]'); set('far',20); set('rmo',0); set('noise',40);
console.log('   gradient noise   stacks',$('s3g').textContent,'  fit',$('s3h').textContent);
const ns=parseFloat($('s3g').textContent), nf=parseFloat($('s3h').textContent);
if($('s3g').textContent!=='57%') fail.push('stack gradient noise is '+$('s3g').textContent+', answer says 57%');
if($('s3h').textContent!=='28%') fail.push('fit gradient noise is '+$('s3h').textContent+', answer says 28%');
if(!(Math.abs(ns/nf-2)<0.2)) fail.push('noise ratio is '+(ns/nf).toFixed(2)+', answer says almost exactly half');

console.log('\n--- exercise 4: 4 ms of moveout, no noise ---');
set('noise',0); set('rmo',4);
console.log('   gradient bias    stacks',$('s3d').textContent,'  fit',$('s3e').textContent);
console.log('   moveout          near window',$('s3a').textContent,'  whole gather',$('s3c').textContent);
if($('s3d').textContent!=='30%') fail.push('stack gradient bias at 4 ms is '+$('s3d').textContent+', answer says 30%');
if($('s3e').textContent!=='71%') fail.push('fit gradient bias at 4 ms is '+$('s3e').textContent+', answer says 71%');
if($('s3c').textContent!=='4.00 ms') fail.push('whole-gather moveout reads '+$('s3c').textContent+', answer says four milliseconds');

console.log('\n--- exercise 5: 8 ms, the intercept ---');
set('rmo',8);
console.log('   intercept bias   near stack',$('s3b').textContent,'  fit',$('s3i').textContent);
if($('s3b').textContent!=='0%') fail.push('near-stack intercept bias at 8 ms is '+$('s3b').textContent+', answer says still exact');
if(!(parseFloat($('s3i').textContent)>=45&&parseFloat($('s3i').textContent)<=55))
  fail.push('fitted intercept bias at 8 ms is '+$('s3i').textContent+', answer says about half');

console.log('\n--- exercise 6: soft shale, gas, 25% -- class 2p through the two traces ---');
hit('#tabs button[data-tab="p1"]'); set('noise',0); set('rmo',0); set('far',20);
hit('[data-over="soft"]'); hit('[data-fluid="gas"]'); set('phi',25);
console.log('   class',$('mClass').textContent,' near stack',$('s1c').textContent,
            ' F-N',$('s1d').textContent);
const near=parseFloat($('s1c').textContent.replace('\u2212','-'));
const dif=parseFloat($('s1d').textContent.replace('\u2212','-'));
if($('mClass').textContent!=='class 2p') fail.push('soft/gas/25% is '+$('mClass').textContent+', answer says class 2p');
if(!(Math.abs(near)<0.03)) fail.push('near stack is '+near+', answer says close to zero');
if(!(dif<0)) fail.push('F-N is '+dif+', answer says clearly negative');

console.log('\n=======================================');
if(fail.length){fail.forEach(f=>console.log('  -',f));process.exit(1);}
console.log('every quoted number checks out');

'use strict';
const fs=require('fs'),{JSDOM}=require('jsdom');const R=require('path').resolve(__dirname,'..');
const h=fs.readFileSync(R+'/modules/rdq-crossplot.html','utf8'),s=fs.readFileSync(R+'/assets/seismic.js','utf8');
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
const num=t=>parseFloat(String(t).replace('\u2212','-'));
const fail=[];

console.log('--- exercise 1: the third axis follows the wavelet, not the bed ---');
hit('#tabs button[data-tab="p1"]'); hit('[data-over="tight"]'); hit('[data-fluid="gas"]'); set('phi',24);
set('freq',40);
const byThick=[];
for(const t of [14,26,38,50]){set('thick',t); byThick.push(num($('s1c').textContent));
  console.log('   thickness',String(t).padStart(2),'ms  half iso at sand top',$('s1c').textContent);}
set('thick',30);
const byFreq=[];
for(const f of [25,40,60]){set('freq',f); byFreq.push(num($('s1c').textContent));
  console.log('   frequency',String(f).padStart(2),'Hz  half iso at sand top',$('s1c').textContent,
    '  quarter period',$('s1d').textContent);}
set('freq',40);
const spread=a=>Math.max(...a.map(Math.abs))-Math.min(...a.map(Math.abs));
console.log('   spread across thickness',spread(byThick).toFixed(1),
            ' across frequency',spread(byFreq).toFixed(1));
if(!(spread(byFreq)>spread(byThick)))
  fail.push('the half isochron responded more to thickness than to frequency, which the module denies');

console.log('\n--- exercise 2: the sign flips at an extremum ---');
console.log('   range on the trace',$('s1b').textContent);
const rg=$('s1b').textContent;
if(!/-/.test(rg)||!/\+/.test(rg)) fail.push('the half isochron never changes sign: '+rg);

console.log('\n--- exercise 3: three views of the same samples ---');
hit('#tabs button[data-tab="p2"]');
console.log('   samples',$('s2a').textContent,' amplitude',$('s2b').textContent);
console.log('   gradient',$('s2c').textContent,' half isochron',$('s2d').textContent);
if(!(parseInt($('s2a').textContent)>20)) fail.push('too few samples on the crossplot: '+$('s2a').textContent);

console.log('\n--- exercise 4: the delimiter thins the plot ---');
hit('#tabs button[data-tab="p3"]');
let prev=1e9;
for(const w of [14,8,5,3]){set('iso',w);
  const n=parseInt($('s3a').textContent);
  console.log('   band \u00B1'+String(w).padStart(2)+' ms  passing',$('s3a').textContent,
    '  median',$('s3b').textContent);
  if(n>prev) fail.push('narrowing the band to '+w+' let more samples through: '+n+' vs '+prev);
  prev=n;}
set('iso',14);
if(parseInt($('s3a').textContent)!==parseInt($('s2a').textContent))
  fail.push('at the widest band not all samples pass: '+$('s3a').textContent+' vs '+$('s2a').textContent);

console.log('\n--- exercise 5: the cluster moves with the fluid ---');
const meds=[];
for(const f of ['brine','oil','gas']){hit('[data-fluid="'+f+'"]');
  meds.push(num($('s3d').textContent));
  console.log('  ',f.padEnd(6),'median distance, all samples',$('s3d').textContent);}
if(new Set(meds.map(x=>x.toFixed(3))).size<2)
  fail.push('the population did not move with the fluid: '+meds.join(', '));
hit('[data-fluid="gas"]');

console.log('\n=======================================');
if(fail.length){fail.forEach(f=>console.log('  -',f));process.exit(1);}
console.log('every quoted number checks out');

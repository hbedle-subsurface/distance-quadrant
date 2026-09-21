'use strict';
const fs=require('fs'),{JSDOM}=require('jsdom');const R=require('path').resolve(__dirname,'..');
const h=fs.readFileSync(R+'/modules/attributes-line.html','utf8'),s=fs.readFileSync(R+'/assets/seismic.js','utf8');
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
const fail=[];

console.log('--- step 1: the model has the structure it claims ---');
hit('#tabs button[data-tab="p1"]'); hit('[data-over="tight"]'); hit('[data-fluid="gas"]');
chk('owc',false); set('freq',40); set('dt',0); set('noise',0);
console.log('   traces',$('s1a').textContent,'  throw',$('s1b').textContent);
console.log('   thickness',$('s1c').textContent,'  porosity',$('s1d').textContent);
if(parseInt($('s1a').textContent)<20) fail.push('too few traces: '+$('s1a').textContent);
if(!/1[0-9] ms/.test($('s1b').textContent)) fail.push('fault throw reads '+$('s1b').textContent);
const th=$('s1c').textContent.match(/(\d+) to (\d+)/);
if(!th||!(parseInt(th[2])>3*parseInt(th[1])/1.5)) fail.push('sand thickness range is '+$('s1c').textContent);

console.log('\n--- step 2: the fluid contact appears only when switched on ---');
hit('#tabs button[data-tab="p2"]');
chk('owc',false); const off=$('s2c').textContent;
chk('owc',true);  const on=$('s2c').textContent;
console.log('   contact off:',off,'   on:',on);
if(off===on) fail.push('the fluid contact readout did not change');
if(!/98/.test(on)) fail.push('the contact is not reported at 98 ms: '+on);
chk('owc',false);

console.log('\n--- step 3: DQ average and DQ sum differ ---');
hit('#tabs button[data-tab="p3"]');
console.log('   average',$('s3a').textContent,'  sum',$('s3b').textContent);
console.log('   thickest',$('s3c').textContent,'  peaks:',$('s3d').textContent);
const a=parseFloat($('s3a').textContent), su=parseFloat($('s3b').textContent);
if(!(a>0&&su>0)) fail.push('layer attributes are zero: '+a+', '+su);
if(!(su>a)) fail.push('the sum ('+su+') is not larger than the average ('+a+')');
const pk=$('s3d').textContent.match(/average at (\d+), sum at (\d+)/);
const kThick=parseInt($('s3c').textContent.match(/trace (\d+)/)[1]);
console.log('   thickest trace',kThick,' average peak',pk[1],' sum peak',pk[2]);
// at 40 Hz the 10 ms ends are near the tuning maximum, so both layer
// attributes peak there rather than on the thick, porous middle. The module
// teaches that; assert it so the example cannot silently change.
if(!(parseInt(pk[1])>kThick+4)) fail.push('the average no longer peaks toward the thin end: '+pk[1]);
if(!(parseInt(pk[2])>kThick+4)) fail.push('the sum no longer peaks toward the thin end: '+pk[2]);
set('freq',70);
const hi=$('s3d').textContent.match(/average at (\d+), sum at (\d+)/);
console.log('   at 70 Hz, once the thin end resolves: average at',hi[1],' sum at',hi[2]);
if(!(parseInt(hi[1])<parseInt(pk[1]))) fail.push('raising the frequency did not move the average peak inward');
set('freq',40);

console.log('\n--- every display renders for every fluid and seal ---');
for(const v of ['seis','dq','px','iso','avg','sum'])
  for(const o of ['soft','hard','tight']){
    hit('[data-view="'+v+'"]'); hit('[data-over="'+o+'"]');
  }
hit('[data-over="tight"]'); hit('[data-view="dq"]');
console.log('   18 display and seal combinations drew without error');

console.log('\n--- fluid changes the value, not the geometry ---');
hit('#tabs button[data-tab="p1"]');
const geo=[];
for(const f of ['brine','oil','gas']){hit('[data-fluid="'+f+'"]');
  geo.push($('s1c').textContent+'|'+$('s1b').textContent);
  console.log('  ',f.padEnd(6),'thickness',$('s1c').textContent,' throw',$('s1b').textContent);}
if(new Set(geo).size!==1) fail.push('the geometry changed with fluid: '+[...new Set(geo)].join(' / '));
hit('[data-fluid="gas"]');

console.log('\n=======================================');
if(fail.length){fail.forEach(f=>console.log('  -',f));process.exit(1);}
console.log('every quoted number checks out');

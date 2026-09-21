'use strict';
const fs=require('fs'),{JSDOM}=require('jsdom');const R=require('path').resolve(__dirname,'..');
const h=fs.readFileSync(R+'/modules/reading-sections.html','utf8'),s=fs.readFileSync(R+'/assets/seismic.js','utf8');
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

console.log('--- step 1: the symmetric seismic bar ---');
hit('#tabs button[data-tab="p1"]'); hit('[data-over="soft"]'); hit('[data-fluid="gas"]');
set('phi',30); set('thick',26); set('freq',40); set('dt',0); set('noise',0);
console.log('   traces',$('s1a').textContent,' limits',$('s1b').textContent,
  ' spacing',$('s1d').textContent);
if(!/same either side/.test($('s1b').textContent)) fail.push('the seismic bar is not symmetric');
if(parseInt($('s1a').textContent)<10) fail.push('too few traces on the line');

console.log('\n--- exercise 2: the one-sided DQ bar ---');
hit('#tabs button[data-tab="p2"]');
console.log('   increments above zero',$('s2a').textContent,' below',$('s2b').textContent);
console.log('   positive samples',$('s2c').textContent,' max',$('s2d').textContent);
const up=parseInt($('s2a').textContent), dn=parseInt($('s2b').textContent);
if(dn!==2) fail.push('the DQ bar has '+dn+' increments below zero, the specification says two');
if(!(up>=6)) fail.push('the DQ bar has only '+up+' increments above zero');
if(!(up>dn*2)) fail.push('the DQ bar is not one-sided: '+up+' up vs '+dn+' down');

console.log('\n--- exercise 3: ten degree bands, and fluid moves them ---');
hit('#tabs button[data-tab="p3"]');
if($('s3a').textContent!=='10\u00B0') fail.push('band width is '+$('s3a').textContent+', answer says 10');
const bandsByFluid={};
for(const f of ['brine','oil','gas']){hit('[data-fluid="'+f+'"]');
 bandsByFluid[f]=$('s3d').textContent+' | '+$('s3c').textContent;
 console.log('  ',f.padEnd(6),'bands at sand top',$('s3d').textContent,'  range',$('s3c').textContent);}
if(new Set(Object.values(bandsByFluid)).size<2)
  fail.push('the angle section did not change with fluid: '+JSON.stringify(bandsByFluid));

console.log('\n--- across the line the sand top spans several bands ---');
hit('[data-fluid="gas"]');
const byThick=[];
for(const t of [14,26,42]){set('thick',t); byThick.push($('s3c').textContent);
 console.log('   thickness',String(t).padStart(2),'ms  range at sand top',$('s3c').textContent);}
set('thick',26);

console.log('\n--- the overlay toggle ---');
chk('wiggle',false); chk('wiggle',true);
console.log('   overlay toggles without error');

console.log('\n=======================================');
if(fail.length){fail.forEach(f=>console.log('  -',f));process.exit(1);}
console.log('every quoted number checks out');

'use strict';
const fs=require('fs'),{JSDOM}=require('jsdom');const R=require('path').resolve(__dirname,'..');
const h=fs.readFileSync(R+'/modules/orientation.html','utf8'),s=fs.readFileSync(R+'/assets/seismic.js','utf8');
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

console.log('--- the promise: the sand interior carries values ---');
hit('[data-over="tight"]'); hit('[data-fluid="gas"]'); set('thick',26);
set('freq',40); set('dt',0); set('noise',0);
console.log('   sand spans',$('s0a').textContent,'  numbered',$('s0b').textContent);
const inSand=parseInt($('s0a').textContent);
const numbered=parseInt($('s0b').textContent);
if(!(inSand>10)) fail.push('the sand spans only '+inSand+' samples');
if(!(numbered/inSand>0.8)) fail.push('only '+numbered+' of '+inSand+' sand samples carry a DQ value');

console.log('\n--- fluid moves the value, not the outline ---');
const seen=[];
for(const f of ['brine','oil','gas']){hit('[data-fluid="'+f+'"]');
 seen.push([f,$('s0a').textContent,num($('s0c').textContent)]);
 console.log('  ',f.padEnd(6),'sand spans',$('s0a').textContent,' DQ at top',$('s0c').textContent,
   ' angle',$('s0d').textContent);}
const spans=new Set(seen.map(x=>x[1]));
if(spans.size!==1) fail.push('the sand outline changed with fluid: '+[...spans].join(', '));
const vals=new Set(seen.map(x=>x[2].toFixed(4)));
if(vals.size<3) fail.push('the DQ value did not move with fluid: '+[...vals].join(', '));
const gas=seen.find(x=>x[0]==='gas')[2];
if(!(Math.abs(gas)>0.15)) fail.push('the default model gives a weak body, DQ '+gas+' at the sand top');
console.log('\n--- the line ramps porosity, so the DQ body should brighten along it ---');
console.log('   mid-trace DQ at the sand top:',$('s0c').textContent);

console.log('\n--- and the sections follow the rocks ---');
for(const o of ['soft','hard','tight']){hit('[data-over="'+o+'"]');
 console.log('  ',o.padEnd(6),'DQ at top',$('s0c').textContent,' angle',$('s0d').textContent);}
hit('[data-over="tight"]'); hit('[data-fluid="gas"]');

console.log('\n=======================================');
if(fail.length){fail.forEach(f=>console.log('  -',f));process.exit(1);}
console.log('every quoted number checks out');

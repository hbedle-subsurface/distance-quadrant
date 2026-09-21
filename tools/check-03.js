'use strict';
const fs=require('fs'),{JSDOM}=require('jsdom');const R=require('path').resolve(__dirname,'..');
const h=fs.readFileSync(R+'/modules/stickogram.html','utf8'),s=fs.readFileSync(R+'/assets/seismic.js','utf8');
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

console.log('--- exercise 1: what survives, default model ---');
hit('#tabs button[data-tab="p1"]');
console.log('  ',$('s1a').textContent,'->',$('s1b').textContent,
 ' peaks/troughs',$('s1c').textContent,' crossings',$('s1d').textContent);
const kept=parseInt($('s1b').textContent), tot=parseInt($('s1a').textContent);
const frac=1-kept/tot;
console.log('   discarded:',(100*frac).toFixed(0)+'%');
if(!(frac>=0.86&&frac<=0.93)) fail.push('discards '+(100*frac).toFixed(0)+'%, answer says between 86 and 93%');
for(const [o,f,pp] of [['soft','gas',28],['hard','brine',20],['tight','oil',34]]){
 hit('[data-over="'+o+'"]');hit('[data-fluid="'+f+'"]');set('phi',pp);
 const k=parseInt($('s1b').textContent),t=parseInt($('s1a').textContent),d=100*(1-k/t);
 console.log('  ',(o+'/'+f+'/'+pp+'%').padEnd(18),d.toFixed(0)+'% discarded');
 if(d<86||d>93) fail.push(o+'/'+f+'/'+pp+'% discards '+d.toFixed(0)+'%, answer says 86 to 93%');}
hit('[data-over="soft"]');hit('[data-fluid="gas"]');set('phi',28);

console.log('\n--- exercise 2: crossing error against sample rate ---');
hit('#tabs button[data-tab="p2"]');
for(let k=0;k<4;k++){set('dt',k);
 const half=parseFloat($('s2a').textContent)/2, worst=parseFloat($('s2b').textContent);
 console.log('  ',$('s2a').textContent.padEnd(6),'worst',$('s2b').textContent.padEnd(8),
  'avg',$('s2c').textContent.padEnd(8),'bound',half.toFixed(2)+' ms',worst<=half+1e-9?'ok':'EXCEEDS BOUND');
 if(worst>half+1e-9) fail.push('at '+$('s2a').textContent+' the worst error '+worst+' exceeds half a sample');}
set('dt',3); const w4=parseFloat($('s2b').textContent);
if(!(w4>1.4&&w4<=2.0)) fail.push('at 4 ms the worst error is '+w4+' ms, answer says it can be two');
set('dt',0);

console.log('\n--- exercise 3: the doublet, at the default model ---');
hit('#tabs button[data-tab="p2"]');
set('thick',30); set('freq',40); chk('streak',false);
const d0=parseInt($('s2d').textContent);
chk('streak',true); const d1=parseInt($('s2d').textContent);
console.log('   30 ms / 40 Hz   streak off:',d0,'  on:',d1);
if(d0!==0) fail.push('streak off gives '+d0+' discarded, answer says zero');
if(d1!==2) fail.push('streak on gives '+d1+' discarded, answer says two');
chk('streak',false); set('thick',45); set('freq',30);
const d2=parseInt($('s2d').textContent);
console.log('   45 ms / 30 Hz   streak off:',d2);
if(d2!==3) fail.push('45 ms at 30 Hz gives '+d2+' discarded, answer says three');
set('thick',30); set('freq',40);

console.log('\n--- exercise 4: thinning until the sand holds no picks ---');
hit('#tabs button[data-tab="p1"]');
let zeroAt=null;
for(let t=30;t>=6;t--){set('thick',t);
 if(parseInt($('s1f').textContent)===0&&zeroAt===null) zeroAt=t;}
for(const t of [12,10,9,8,7,6]){set('thick',t);
 console.log('  ',String(t).padStart(2)+' ms  inside the sand:',$('s1f').textContent);}
console.log('   first reaches zero at',zeroAt,'ms');
if(zeroAt!==8) fail.push('the count first hits zero at '+zeroAt+' ms, answer says 8 ms and below');
set('thick',30);

console.log('\n--- exercise 5: noise removes picks as well as adding them ---');
const seq=[];
for(const n of [0,5,10,30,40]){set('noise',n);seq.push(parseInt($('s1b').textContent));}
console.log('   0/5/10/30/40% noise -> picks',seq.join(', '));
const want=[21,19,15,13,19];
want.forEach((v,i)=>{if(seq[i]!==v) fail.push('pick count at step '+i+' is '+seq[i]+', answer says '+v);});
set('noise',0);

console.log('\n--- step 3: the section ---');
hit('#tabs button[data-tab="p3"]');
for(const t of [0,14,30]){set('throw',t);
 console.log('   throw',String(t).padStart(2)+' ms  picks',$('s3c').textContent.padStart(6),
  ' kept',$('s3d').textContent.padStart(6),' |',$('s3e').textContent.slice(0,58)+'...');}
if($('s3a').textContent!=='70') fail.push('section has '+$('s3a').textContent+' traces, prose says seventy');

console.log('\n=======================================');
if(fail.length){fail.forEach(f=>console.log('  -',f));process.exit(1);}
console.log('every quoted number checks out');

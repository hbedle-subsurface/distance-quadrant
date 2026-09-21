'use strict';
const fs=require('fs'),{JSDOM}=require('jsdom');const R=require('path').resolve(__dirname,'..');
const h=fs.readFileSync(R+'/modules/sectors.html','utf8'),s=fs.readFileSync(R+'/assets/seismic.js','utf8');
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
const num=t=>parseFloat(String(t).replace('\u00B0',''));
const fail=[];

console.log('--- exercise 1: the distance survives the reflection ---');
hit('#tabs button[data-tab="p3"]'); chk('split',true);
for(const [o,f,p] of [['soft','gas',28],['hard','brine',20],['tight','oil',34]]){
 hit('[data-over="'+o+'"]');hit('[data-fluid="'+f+'"]');set('phi',p);
 const b=$('s3c').textContent, a=$('s3d').textContent;
 console.log('  ',(o+'/'+f+'/'+p+'%').padEnd(18),'before',b,' after',a);
 if(b!==a) fail.push(o+'/'+f+': distance changed, '+b+' -> '+a+'; a reflection must preserve it');}
hit('[data-over="soft"]');hit('[data-fluid="gas"]');set('phi',28);

console.log('\n--- exercise 2: how many samples move ---');
hit('#tabs button[data-tab="p2"]');
console.log('   moved',$('s2a').textContent,'  left alone',$('s2b').textContent);
const mv=parseInt($('s2a').textContent), tot=parseInt($('s2a').textContent.split(' of ')[1]);
console.log('   fraction moved:',(100*mv/tot).toFixed(0)+'%');
if(!(mv/tot>0.5&&mv/tot<0.8)) fail.push('fraction moved is '+(100*mv/tot).toFixed(0)+'%, answer says roughly two thirds');
if(!(mv/tot>5/9)) fail.push('fraction moved '+(mv/tot).toFixed(2)+' is not above five ninths as the answer claims');

console.log('\n--- exercise 3: only the direction moves ---');
hit('#tabs button[data-tab="p3"]');
console.log('   angle changed for',$('s3a').textContent,' by',$('s3b').textContent,'on average');
const ch=parseInt($('s3a').textContent);
const chTot=parseInt($('s3a').textContent.split(' of ')[1]);
if(!(ch>0)) fail.push('no sample changed angle');
if(Math.abs(ch/chTot-0.64)>0.08) fail.push('fraction changing angle is '+(100*ch/chTot).toFixed(0)+'%, expected about 64%');
if($('s3c').textContent!==$('s3d').textContent) fail.push('the distance moved: '+$('s3c').textContent+' -> '+$('s3d').textContent);

console.log('\n--- exercise 4: Q3-Q7 sit nearer the origin ---');
hit('#tabs button[data-tab="p1"]');
console.log('   ',$('s1d').textContent);
const m=$('s1d').textContent.match(/([\d.]+)\s+vs\s+([\d.]+)/);
if(!m) fail.push('could not read the two mean distances');
else if(!(parseFloat(m[1])<parseFloat(m[2])))
  fail.push('Q3-Q7 mean distance '+m[1]+' is not below the overall '+m[2]);
console.log('    Q3-Q7 share of samples:',$('s1b').textContent);

console.log('\n--- exercise 5: turning the step off ---');
hit('#tabs button[data-tab="p3"]'); chk('split',false);
console.log('   angle changed for',$('s3a').textContent,'with the split off');
if(parseInt($('s3a').textContent)!==0) fail.push('samples still moved with the split off');
chk('split',true);

console.log('\n--- exercise 6: coarse sampling breaks the numbering ---');
hit('#tabs button[data-tab="p1"]');
for(let k=0;k<4;k++){set('dt',k);
 console.log('  ',$('dtV').textContent.padEnd(5),'samples',$('s1a').textContent.padStart(4),
  ' Q3-Q7',$('s1b').textContent);}
set('dt',0);

console.log('\n=======================================');
if(fail.length){fail.forEach(f=>console.log('  -',f));process.exit(1);}
console.log('every quoted number checks out');

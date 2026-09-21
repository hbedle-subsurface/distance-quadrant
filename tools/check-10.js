'use strict';
const fs=require('fs'),{JSDOM}=require('jsdom');const R=require('path').resolve(__dirname,'..');
const h=fs.readFileSync(R+'/modules/theta-px.html','utf8'),s=fs.readFileSync(R+'/assets/seismic.js','utf8');
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
const nums=t=>String(t).replace(/\u2212/g,'-').split('/').map(x=>parseFloat(x));
const fail=[];

console.log('--- exercise 1: fluids separate in angle under soft shale ---');
hit('#tabs button[data-tab="p3"]'); chk('signed',true);
hit('[data-over="soft"]'); set('phi',20); set('thick',30); set('freq',40); set('dt',0); set('noise',0);
console.log('   theta px  ',$('s3a').textContent);
console.log('   distance  ',$('s3b').textContent);
const a=nums($('s3a').textContent), dd=nums($('s3b').textContent);
[[a[0],6],[a[1],15],[a[2],23]].forEach(([got,want],i)=>{
  if(Math.abs(got-want)>2) fail.push('angle '+i+' is '+got+', answer says about '+want);});
if(!(a[0]<a[1]&&a[1]<a[2])) fail.push('angles are not monotonic across brine, oil, gas: '+a.join(', '));
if(!(dd[0]>dd[2])) fail.push('distance does not fall from brine to gas: '+dd.join(', '));
[[dd[0],0.147],[dd[1],0.123],[dd[2],0.103]].forEach(([got,want],i)=>{
  if(Math.abs(got-want)>0.012) fail.push('distance '+i+' is '+got+', answer says '+want);});

console.log('\n--- exercise 2: under tight sandstone the two swap roles ---');
hit('[data-over="tight"]');
console.log('   theta px  ',$('s3a').textContent);
console.log('   distance  ',$('s3b').textContent);
const a2=nums($('s3a').textContent), d2=nums($('s3b').textContent);
const angSpread=Math.abs(a2[2]-a2[0]), dSpread=Math.abs(d2[2]-d2[0])/Math.max(...d2);
console.log('   angle spread',angSpread.toFixed(0)+'\u00B0   distance spread',(100*dSpread).toFixed(0)+'%');
if(!(angSpread<6)) fail.push('under tight sandstone the angles spread '+angSpread.toFixed(0)+'deg, answer says a few degrees');
if(!(dSpread>0.1)) fail.push('under tight sandstone the distance spread is only '+(100*dSpread).toFixed(0)+'%');
hit('[data-over="soft"]');

console.log('\n--- exercise 3: the angle fails where the distance is small ---');
hit('[data-fluid="oil"]'); set('phi',28);
hit('#tabs button[data-tab="p1"]');
console.log('   distance',$('s1d').textContent,'  folded angle',$('s1c').textContent);
const dsmall=parseFloat($('s1d').textContent);
if(!(dsmall<0.03)) fail.push('the class 2 crossover distance is '+dsmall+', expected under 0.03');
hit('[data-fluid="gas"]'); set('phi',20);

console.log('\n--- exercise 5: the fold never leaves its range ---');
let worst=0, worstS=0;
for(const o of ['soft','hard','tight'])for(const f of ['brine','oil','gas']){
 hit('[data-over="'+o+'"]');hit('[data-fluid="'+f+'"]');
 for(const p of [10,18,26,34]){set('phi',p);
  const fo=parseFloat($('s1c').textContent);
  hit('#tabs button[data-tab="p2"]');
  const sg=Math.abs(parseFloat($('s2d').textContent.replace('\u2212','-')));
  hit('#tabs button[data-tab="p1"]');
  worst=Math.max(worst,fo); worstS=Math.max(worstS,sg);}}
console.log('   largest folded angle seen:',worst.toFixed(1)+'\u00B0   largest |theta px|:',worstS.toFixed(1)+'\u00B0');
if(worst>90.001) fail.push('the fold produced '+worst+', outside 0 to 90');
if(worstS>90.001) fail.push('theta px reached '+worstS+', outside -90 to +90');
hit('[data-over="soft"]');hit('[data-fluid="gas"]');set('phi',20);

console.log('\n--- exercise 4: the sign switch ---');
hit('#tabs button[data-tab="p2"]');
chk('signed',true); const on=$('s2d').textContent;
chk('signed',false); const off=$('s2d').textContent;
console.log('   sign on',on,'  sign off',off);
if(parseFloat(off.replace('\u2212','-'))<0) fail.push('with the sign off theta px is still negative: '+off);
chk('signed',true);

console.log('\n=======================================');
if(fail.length){fail.forEach(f=>console.log('  -',f));process.exit(1);}
console.log('every quoted number checks out');

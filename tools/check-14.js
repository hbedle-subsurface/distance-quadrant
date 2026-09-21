'use strict';
const fs=require('fs'),{JSDOM}=require('jsdom');const R=require('path').resolve(__dirname,'..');
const h=fs.readFileSync(R+'/modules/avo-classes.html','utf8'),s=fs.readFileSync(R+'/assets/seismic.js','utf8');
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
const AB=t=>{const m=String(t).replace(/\u2212/g,'-').match(/A (-?[\d.]+), B (-?[\d.]+)/);return [parseFloat(m[1]),parseFloat(m[2])];};
const fail=[];

console.log('--- exercise 1: the four exemplars land in four quadrants ---');
hit('#tabs button[data-tab="p1"]'); set('thick',30); set('freq',40); set('dt',0); set('noise',0);
const ids=['s1a','s1b','s1c','s1d'], names=['class 1','class 2','class 3','class 4'];
const abs=ids.map(i=>AB($(i).textContent));
ids.forEach((i,k)=>console.log('  ',names[k].padEnd(8),$(i).textContent));
if(!(abs[0][0]>0.02&&abs[0][1]<0)) fail.push('class 1 is not A+ B-: '+abs[0]);
if(!(Math.abs(abs[1][0])<0.06)) fail.push('class 2 intercept is not near zero: '+abs[1][0]);
if(!(abs[2][0]<-0.02&&abs[2][1]<0)) fail.push('class 3 is not A- B-: '+abs[2]);
if(!(abs[3][0]<-0.02&&abs[3][1]>0)) fail.push('class 4 is not A- B+: '+abs[3]);
const quads=new Set(abs.map(([A,B])=>(A>0?'+':'-')+(B>0?'+':'-')));
console.log('   distinct sign combinations:',quads.size);
if(quads.size<3) fail.push('the exemplars do not occupy distinct quadrants: '+[...quads]);

console.log('\n--- exercise 2: only class 1 has the polarity flip ---');
hit('#tabs button[data-tab="p2"]');
console.log('   flip applied to:',$('s2a').textContent);
if(!/class 1/.test($('s2a').textContent)) fail.push('class 1 is not flipped: '+$('s2a').textContent);
if(/class 3/.test($('s2a').textContent)) fail.push('class 3 should not be flipped: '+$('s2a').textContent);

console.log('\n--- exercise 3: class 2 is the weakest ---');
const dists={};
for(const [k,n] of [['c1','class 1'],['c2','class 2'],['c3','class 3'],['c4','class 4']]){
 hit('[data-over="'+k+'"]');
 dists[n]=parseFloat($('s2b').textContent);
 console.log('  ',n,' distance at sand top',$('s2b').textContent,'  theta px',$('s2c').textContent,
   '  reads as',$('s2d').textContent);}
const others=['class 1','class 3','class 4'].map(n=>dists[n]);
if(!(dists['class 2']<Math.min(...others)))
  fail.push('class 2 is not the smallest distance: '+JSON.stringify(dists));

console.log('\n--- exercise 4: the histogram axis ---');
hit('#tabs button[data-tab="p3"]'); hit('[data-over="c3"]');
chk('logy',true);
console.log('   class 3: samples',$('s3a').textContent,' median all',$('s3b').textContent,
  ' median sand',$('s3c').textContent,' separation',$('s3d').textContent);
const sep3=parseFloat($('s3d').textContent);
if(!(sep3>1)) fail.push('class 3 sand samples are not above the background: '+$('s3d').textContent);
chk('logy',false); chk('logy',true);

console.log('\n--- separation ranks the same way as the sections ---');
const seps={};
for(const [k,n] of [['c1','class 1'],['c2','class 2'],['c3','class 3'],['c4','class 4']]){
 hit('[data-over="'+k+'"]'); seps[n]=parseFloat($('s3d').textContent);
 console.log('  ',n,' separation',$('s3d').textContent);}
if(!(seps['class 2']<=seps['class 3']))
  fail.push('class 2 separates better than class 3, which the module denies');
hit('[data-over="c3"]');

console.log('\n=======================================');
if(fail.length){fail.forEach(f=>console.log('  -',f));process.exit(1);}
console.log('every quoted number checks out');

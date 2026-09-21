'use strict';
const fs=require('fs'),{JSDOM}=require('jsdom');const R=require('path').resolve(__dirname,'..');
const h=fs.readFileSync(R+'/modules/wedge.html','utf8'),s=fs.readFileSync(R+'/assets/seismic.js','utf8');
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

console.log('--- exercise 1: the tuning peak follows the wavelet ---');
hit('#tabs button[data-tab="p1"]'); hit('[data-over="tight"]'); hit('[data-fluid="gas"]'); set('phi',24);
const peaks=[];
for(const f of [25,30,40,55]){set('freq',f);
 const m=$('s1b').textContent.match(/at (\d+) ms/); peaks.push([f,parseInt(m[1])]);
 console.log('  ',String(f).padStart(2)+' Hz  peak',$('s1b').textContent,'  quarter period',(250/f).toFixed(1),'ms');}
set('freq',40);
for(let i=1;i<peaks.length;i++) if(peaks[i][1]>peaks[i-1][1])
  fail.push('the tuning peak did not move down with frequency: '+JSON.stringify(peaks));

console.log('\n--- exercise 2: thickness moves the distance ---');
console.log('  ',$('s1d').textContent,' peak',$('s1b').textContent,' resolved',$('s1c').textContent);
const relD=num($('s1d').textContent);
if(!(relD>20&&relD<50)) fail.push('the distance varies by '+relD+'%, answer says about a third');

console.log('\n--- exercise 3: the angle is blind to thickness ---');
hit('#tabs button[data-tab="p2"]');
console.log('   distance',$('s2a').textContent,'   angle',$('s2b').textContent);
const rngP=num($('s2b').textContent);
if(!(rngP<5)) fail.push('theta px varies by '+rngP+' degrees across the wedge, answer says about one');
if(!(num($('s2a').textContent)>20)) fail.push('the distance barely varies: '+$('s2a').textContent);

console.log('\n--- exercise 4: the angle still sees fluid ---');
hit('#tabs button[data-tab="p3"]');
console.log('   angles',$('s3a').textContent);
console.log('   fluid separation',$('s3b').textContent,'  thickness effect on angle',$('s3c').textContent);
console.log('   thickness effect on distance',$('s3d').textContent);
const sep=num($('s3b').textContent), tAng=num($('s3c').textContent), tD=num($('s3d').textContent);
if(!(sep>=3*tAng)) fail.push('fluid separation '+sep+' is not several times the thickness effect '+tAng);
if(Math.abs(sep-3)>1.5) fail.push('fluid separation under the tight seal is '+sep+', answer says about three degrees');
if(!(tD>20)) fail.push('thickness moves the distance by only '+tD+'%');

console.log('\n--- exercise 5: a weak reflection breaks the division ---');
hit('[data-over="soft"]');
console.log('   soft shale: angle moves',$('s3c').textContent,' distance moves',$('s3d').textContent);
const softAng=num($('s3c').textContent);
if(!(softAng>tAng)) fail.push('under soft shale the angle moves '+softAng+', expected more than '+tAng);
hit('[data-over="tight"]');

console.log('\n=======================================');
if(fail.length){fail.forEach(f=>console.log('  -',f));process.exit(1);}
console.log('every quoted number checks out');

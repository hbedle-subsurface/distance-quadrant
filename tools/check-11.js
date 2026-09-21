'use strict';
const fs=require('fs'),{JSDOM}=require('jsdom');const R=require('path').resolve(__dirname,'..');
const h=fs.readFileSync(R+'/modules/porosity.html','utf8'),s=fs.readFileSync(R+'/assets/seismic.js','utf8');
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
const r=t=>parseFloat(String(t).replace('r = ','').replace('\u2212','-'));
const fail=[];

console.log('--- step 1: the rock, before any seismic ---');
hit('#tabs button[data-tab="p1"]'); hit('[data-fluid="brine"]');
console.log('   impedance vs porosity',$('s1a').textContent,'   Vp/Vs vs porosity',$('s1b').textContent);
if(!(r($('s1a').textContent)<-0.98)) fail.push('AI vs porosity is '+$('s1a').textContent+', answer says about -0.99');
if(!(r($('s1b').textContent)>0.99)) fail.push('Vp/Vs vs porosity is '+$('s1b').textContent+', answer says about 1.00');

console.log('\n--- exercise 1: the correlation under tight sandstone ---');
hit('#tabs button[data-tab="p2"]'); hit('[data-over="tight"]'); hit('[data-fluid="brine"]');
console.log('   distance vs porosity',$('s2a').textContent,'   vs impedance',$('s2b').textContent);
console.log('   distance spans',$('s2d').textContent);
const rl=r($('s2a').textContent);
if(Math.abs(rl-0.99)>0.02) fail.push('tight sandstone correlation is '+rl+', answer says about 0.99');
if(!(Math.abs(r($('s2b').textContent))>0.98)) fail.push('distance vs impedance is '+$('s2b').textContent);

console.log('\n--- exercise 2: soft shale reverses the sign ---');
hit('[data-over="soft"]');
console.log('   distance vs porosity',$('s2a').textContent);
const rs=r($('s2a').textContent);
if(Math.abs(rs+0.97)>0.03) fail.push('soft shale correlation is '+rs+', answer says about -0.97');
if(!(rs<0&&rl>0)) fail.push('the sign did not reverse between tight sandstone ('+rl+') and soft shale ('+rs+')');

console.log('\n--- exercises 3 and 4: the crossover, and the hard shale V ---');
hit('#tabs button[data-tab="p3"]');
console.log('   tight sandstone',$('s3a').textContent,'  soft',$('s3b').textContent,'  hard',$('s3c').textContent);
console.log('   soft-shale contrast dies at',$('s3d').textContent);
const rh=r($('s3c').textContent);
if(!(Math.abs(rh)<0.7)) fail.push('hard shale correlation is '+rh+', answer says it is not a useful number');
const dip=$('s3d').textContent;
if(!/3[2-6]%/.test(dip)) fail.push('the soft-shale minimum is at '+dip+', answer says the mid thirties');
if(!(parseFloat(dip.split('distance ')[1])<0.02)) fail.push('the minimum distance is '+dip+', answer says under a hundredth');

console.log('\n--- exercise 5: fluid lifts the curve without flipping it ---');
hit('#tabs button[data-tab="p2"]'); hit('[data-over="tight"]');
for(const f of ['brine','oil','gas']){hit('[data-fluid="'+f+'"]');
 console.log('  ',f.padEnd(6),$('s2a').textContent,'  spans',$('s2d').textContent);
 if(!(r($('s2a').textContent)>0.9)) fail.push('under tight sandstone with '+f+' the correlation is '+$('s2a').textContent);}
hit('[data-fluid="brine"]');

console.log('\n--- exercise 6: the correlation holds, then falls off a cliff ---');
const seen=[];
for(const n of [0,10,20,30,35,40]){set('noise',n);
 const v=r($('s2a').textContent); seen.push([n,v]);
 console.log('  ',String(n).padStart(2)+'%  ',$('s2a').textContent);}
set('noise',0);
const upTo35=seen.filter(([n])=>n<=35).map(([,v])=>v);
if(!(Math.min(...upTo35)>0.9)) fail.push('the correlation dips below 0.9 before 35% noise: '+upTo35.join(', '));
const at40=seen.find(([n])=>n===40)[1];
if(!(at40<0.85)) fail.push('at 40% noise the correlation is '+at40+', answer says it drops sharply');
if(!(at40<Math.min(...upTo35)-0.2)) fail.push('the drop at 40% is not sharp: '+at40+' vs '+Math.min(...upTo35));

console.log('\n--- step 4: recovering a five-sand porosity log ---');
hit('#tabs button[data-tab="p4"]'); hit('[data-fluid="brine"]'); set('noise',0);
for(const o of ['tight','soft','hard']){
 hit('[data-over="'+o+'"]');
 console.log('  ',o.padEnd(5),'tops',$('s4a').textContent.padEnd(8),
   'in',$('s4b').textContent.padEnd(22),'out',$('s4c').textContent);
 console.log('        ',$('s4d').textContent);
 const found=parseInt($('s4a').textContent);
 if(found<4) fail.push(o+': only '+found+' sand tops were found, expected at least 4');
}
hit('[data-over="tight"]');
const rl4=r($('s4d').textContent);
hit('[data-over="soft"]');
const rs4=r($('s4d').textContent);
console.log('   tight sandstone r =',rl4.toFixed(3),'  soft shale r =',rs4.toFixed(3));
if(!(rl4>0.99)) fail.push('the log is recovered at '+rl4+' under the tight seal, answer says 1.00');
if(!(rs4<-0.75)) fail.push('the log is recovered at '+rs4+' under soft shale, answer says about -0.8 or better');
if(!(rl4>0&&rs4<0)) fail.push('the log test did not reverse sign between seals');
if(!(rl4>0&&rs4<0)) fail.push('the sign did not reverse between seals on the log test');
hit('[data-over="tight"]');

console.log('\n=======================================');
if(fail.length){fail.forEach(f=>console.log('  -',f));process.exit(1);}
console.log('every quoted number checks out');

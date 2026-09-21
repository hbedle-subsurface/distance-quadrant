'use strict';
const fs=require('fs'),{JSDOM}=require('jsdom');const R=require('path').resolve(__dirname,'..');
const h=fs.readFileSync(R+'/modules/baseline.html','utf8'),s=fs.readFileSync(R+'/assets/seismic.js','utf8');
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
const num=t=>parseFloat(String(t).replace('\u2212','-').replace('\u00B0',''));
const fail=[];

console.log('--- exercise 1: the background angle under each overburden ---');
hit('#tabs button[data-tab="p1"]'); set('scatter',0);
hit('[data-axes="nf"]');
console.log('   (workflow axes: near stack against far minus near)');
const angles=[],slopes=[];
for(const o of ['soft','hard','tight']){hit('[data-over="'+o+'"]');
 const a=num($('s1b').textContent), sl=num($('s1a').textContent);
 angles.push(a); slopes.push(sl);
 console.log('  ',o.padEnd(5),'slope',$('s1a').textContent.padEnd(7),
  'angle',$('s1b').textContent.padEnd(9),'difference from -45',$('s1d').textContent);}
if(Math.abs(angles[0]-angles[1])>0.6)
  fail.push('the two shales differ by '+Math.abs(angles[0]-angles[1]).toFixed(2)+' degrees, answer says within half a degree');
if(!(Math.abs(angles[2]-angles[0])>1&&Math.abs(angles[2]-angles[0])<3))
  fail.push('the tight sandstone differs from soft shale by '+Math.abs(angles[2]-angles[0]).toFixed(2)+' degrees on the workflow axes');
[0,1].forEach(i=>{if(Math.abs(angles[i]+15.8)>0.5) fail.push('shale workflow-axis angle '+i+' is '+angles[i]+', answer says about -16');});
if(Math.abs(angles[2]+17.5)>0.6) fail.push('tight-sandstone workflow-axis angle is '+angles[2]+', answer says about -17.5');
hit('[data-over="soft"]');
if($('s1f').textContent!=='344\u00B0') fail.push('soft-shale bearing reads '+$('s1f').textContent+', answer says 344');
hit('[data-over="tight"]');
if($('s1f').textContent!=='342\u00B0') fail.push('tight-sandstone bearing reads '+$('s1f').textContent+', answer says 342');
hit('[data-over="soft"]');
hit('[data-axes="ab"]');
const abA=[],abS=[];
for(const o of ['soft','hard','tight']){hit('[data-over="'+o+'"]');
 abA.push(num($('s1b').textContent)); abS.push(num($('s1a').textContent));
 console.log('   true A vs B  '+o.padEnd(5)+'slope '+$('s1a').textContent.padEnd(7)+'angle '+$('s1b').textContent);}
[0,1].forEach(i=>{if(Math.abs(abA[i]+58.6)>0.6) fail.push('shale true-axis angle '+i+' is '+abA[i]+', answer says near -58.5');});
[0,1].forEach(i=>{if(Math.abs(abS[i]+1.64)>0.03) fail.push('shale true-axis slope '+i+' is '+abS[i]+', answer says -1.63 to -1.65');});
if(Math.abs(abA[2]+61.2)>0.8) fail.push('tight sandstone true-axis angle is '+abA[2]+', answer says -61.2');
hit('[data-axes="nf"]');
hit('[data-over="soft"]');

console.log('\n--- exercise 2: the two rotations ---');
hit('#tabs button[data-tab="p2"]');
console.log('   no rotation     ',$('s2a').textContent);
console.log('   to -45 degrees  ',$('s2b').textContent);
console.log('   onto the x axis ',$('s2c').textContent);
console.log('   residual tilt   ',$('s2d').textContent);
const s0=parseFloat($('s2a').textContent), s45=parseFloat($('s2b').textContent),
      sf=parseFloat($('s2c').textContent);
console.log('   factors:',(s0/s45).toFixed(1),'and',(s0/sf).toFixed(1));
if(Math.abs(s0-0.106)>0.006) fail.push('unrotated spread is '+s0+', answer says 0.106');
if(Math.abs(s45-0.127)>0.008) fail.push('spread at -45 is '+s45+', answer says 0.127');
if(!(s45>s0)) fail.push('the classical rotation improved the spread ('+s45+' vs '+s0+'); answer says it makes it worse');
if(Math.abs(sf-0.025)>0.004) fail.push('spread on the x axis is '+sf+', answer says 0.025');
if(!(s0/sf>3.5&&s0/sf<5)) fail.push('the x-axis rotation cut it by '+(s0/sf).toFixed(1)+'x, answer says about four');
hit('[data-axes="ab"]');
const a0=parseFloat($('s2a').textContent),a45=parseFloat($('s2b').textContent),af=parseFloat($('s2c').textContent);
console.log('   true A vs B: none '+a0+'  to -45 '+a45+'  onto trend '+af);
if(Math.abs(a0/a45-2.7)>0.3) fail.push('in true A,B the -45 rotation gives '+(a0/a45).toFixed(1)+'x, answer says 2.7');
if(!(a0/af>6&&a0/af<11)) fail.push('in true A,B the measured rotation gives '+(a0/af).toFixed(1)+'x, answer says 8');
hit('[data-axes="nf"]');
if(Math.abs(Math.abs(num($('s2d').textContent))-29.3)>1) fail.push('tilt after the -45 rotation is '+$('s2d').textContent+', answer says about 29 degrees');

console.log('\n--- exercise 4: does a gas sand separate? ---');
hit('#tabs button[data-tab="p3"]');
hit('[data-fluid="gas"]'); set('phi',28);
console.log('   departure',$('s3a').textContent,' background',$('s3b').textContent);
console.log('   separation rotated',$('s3c').textContent,'  unrotated',$('s3d').textContent);
const sr=parseFloat($('s3c').textContent), su=parseFloat($('s3d').textContent);
if(!(sr>2)) fail.push('rotated separation is '+sr+', answer says above two');
if(!(su<1)) fail.push('unrotated separation is '+su+', answer says below one');

console.log('\n--- exercise 6: a tight gas sand is a small anomaly ---');
set('phi',12);
const tight=parseFloat($('s3c').textContent);
set('phi',28);
const porous=parseFloat($('s3c').textContent);
console.log('   12% porosity separation',tight.toFixed(2),'   28% porosity',porous.toFixed(2));
if(!(tight<porous)) fail.push('a tight sand separates as well as a porous one ('+tight+' vs '+porous+')');

console.log('\n--- exercise 5: scatter degrades the fit ---');
hit('#tabs button[data-tab="p2"]');
for(const sc of [0,10,20,30]){set('scatter',sc);
 console.log('  ',String(sc).padStart(2)+'%  spread on the x axis',$('s2c').textContent,
  '  tilt',$('s2d').textContent);}
const worst=parseFloat($('s2c').textContent);
set('scatter',0);
const clean=parseFloat($('s2c').textContent);
if(!(worst>clean)) fail.push('scatter did not increase the rotated spread ('+worst+' vs '+clean+')');

console.log('\n=======================================');
if(fail.length){fail.forEach(f=>console.log('  -',f));process.exit(1);}
console.log('every quoted number checks out');

'use strict';
const fs=require('fs'),{JSDOM}=require('jsdom');const R=require('path').resolve(__dirname,'..');
const h=fs.readFileSync(R+'/modules/dq-distance.html','utf8'),s=fs.readFileSync(R+'/assets/seismic.js','utf8');
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

console.log('--- exercise 1: the two forms of the equation agree ---');
hit('#tabs button[data-tab="p1"]');
for(const [o,f,p,t] of [['soft','gas',28,30],['hard','brine',20,20],['tight','oil',34,45]]){
 hit('[data-over="'+o+'"]');hit('[data-fluid="'+f+'"]');set('phi',p);set('thick',t);
 console.log('  ',(o+'/'+f+'/'+p+'%').padEnd(18),'agreement:',$('s1d').textContent);
 if(!/machine precision|e-1[0-9]/.test($('s1d').textContent))
   fail.push(o+'/'+f+': the two forms differ by '+$('s1d').textContent);}
hit('[data-over="soft"]');hit('[data-fluid="gas"]');set('phi',28);set('thick',30);

console.log('\n--- exercise 2: the gradient against the intercept, at the sand top ---');
const seen=[];
for(const [o,f,pp,want] of [['soft','gas',28,1.03],['tight','gas',28,0.20],['soft','oil',28,3.26]]){
 hit('[data-over="'+o+'"]');hit('[data-fluid="'+f+'"]');set('phi',pp);
 const r=parseFloat($('s1f').textContent); seen.push(r);
 console.log('  ',(o+'/'+f+'/'+pp+'%').padEnd(18),'A',$('s1a').textContent,
   ' B',$('s1b').textContent,' ratio',$('s1f').textContent);
 if(Math.abs(r-want)>Math.max(0.15,0.15*want))
   fail.push(o+'/'+f+'/'+pp+'% ratio is '+r+', answer implies about '+want);}
if(!(seen[0]>0.8&&seen[0]<1.3)) fail.push('default ratio is '+seen[0]+', answer says about 1.0');
if(!(seen[2]>3)) fail.push('the class 2 crossover case gives '+seen[2]+', answer says past 3');
hit('[data-over="soft"]');hit('[data-fluid="gas"]');set('phi',28);

console.log('\n--- exercise 3: the sign split stays near even ---');
hit('#tabs button[data-tab="p2"]');
chk('signed',true);
for(const t of [10,20,30,45,55]){set('thick',t);
 const p=parseInt($('s2b').textContent);
 console.log('  ',String(t).padStart(2)+' ms  positive',$('s2b').textContent.padEnd(12),
  'negative',$('s2c').textContent);
 const tot=parseInt($('s2a').textContent);
 if(Math.abs(p/tot-0.5)>0.20) fail.push('at '+t+' ms the split is '+(100*p/tot).toFixed(0)+'% positive, answer says roughly even');}
set('thick',30);

console.log('\n--- exercise 4: turning the sign off ---');
chk('signed',false);
console.log('   ',$('s2d').textContent,'-',$('s2e').textContent.slice(0,60)+'...');
if($('s2d').textContent!=='switched off') fail.push('sign readout says '+$('s2d').textContent);
chk('signed',true);
if($('s2d').textContent!=='applied') fail.push('sign readout says '+$('s2d').textContent);

console.log('\n--- exercise 5: how blocked each trace is ---');
hit('#tabs button[data-tab="p3"]');
const bn=parseFloat($('s3a').textContent), be=parseFloat($('s3b').textContent),
      bd=parseFloat($('s3c').textContent);
console.log('   near stack',$('s3a').textContent,'  envelope',$('s3b').textContent,
            '  DQ',$('s3c').textContent,'  over',$('s3d').textContent,'loops');
if(!(bn>be&&bn>bd)) fail.push('the near stack ('+bn+') is not the least blocked of the three');
if(!(Math.abs(be-bd)<0.5*Math.max(be,bd))) fail.push('envelope '+be+' and DQ '+bd+' are not close; answer says they are');

console.log('\n--- exercise 6: a class 1 sand needs no separate rule ---');
hit('[data-over="soft"]');hit('[data-fluid="oil"]');set('phi',20);
console.log('   class',$('mClass').textContent,'  flip',$('mFlip').textContent);
if($('mClass').textContent!=='class 1') fail.push('soft/oil/20% is '+$('mClass').textContent);
if($('mFlip').textContent!=='applied') fail.push('flip reads '+$('mFlip').textContent+' for a class 1 sand');
hit('#tabs button[data-tab="p2"]');
const tot=parseInt($('s2a').textContent), pos=parseInt($('s2b').textContent);
console.log('   sign split with the flip applied:',$('s2b').textContent,'positive');
if(Math.abs(pos/tot-0.5)>0.15) fail.push('class 1 sign split is '+(100*pos/tot).toFixed(0)+'%');

console.log('\n--- step 4: the crossplot picture ---');
hit('#tabs button[data-tab="p4"]');
const seenAng=[];
for(const [o,f] of [['soft','brine'],['soft','oil'],['soft','gas'],['tight','gas']]){
 hit('[data-over="'+o+'"]');hit('[data-fluid="'+f+'"]');set('phi',28);
 const dd=parseFloat($('s4a').textContent);
 const ang=parseFloat($('s4b').textContent);
 const px=Math.abs(parseFloat($('s4e').textContent.replace('\u2212','-')));
 seenAng.push(ang);
 console.log('  ',(o+'/'+f).padEnd(13),'D',$('s4a').textContent.padStart(8),
   ' theta p',$('s4b').textContent.padStart(8),' quarter',$('s4c').textContent.padEnd(16),
   ' theta px',$('s4e').textContent);
 if(!(dd>0)) fail.push(o+'/'+f+': distance is '+dd);
 if(!(ang>=0&&ang<360)) fail.push(o+'/'+f+': polar angle '+ang+' is outside 0-360');
 if(!(px>=0&&px<=90)) fail.push(o+'/'+f+': theta px is '+px+', the fold should give 0 to 90');
 // the quarter label must agree with the angle
 const want = ang<90?'I':ang<180?'IV':ang<270?'III':'II';
 if(!$('s4c').textContent.startsWith(want))
   fail.push(o+'/'+f+': angle '+ang+' labelled '+$('s4c').textContent+', expected quarter '+want);}
if(new Set(seenAng.map(a=>a.toFixed(0))).size<3)
  fail.push('the polar angle barely moves with the fluid: '+seenAng.join(', '));
console.log('   the angle moves with the fluid while the distance need not \u2014 that is the point');
hit('[data-over="soft"]');hit('[data-fluid="gas"]');

console.log('\n--- step 4: conventional points collapse where enhanced ones do not ---');
hit('#tabs button[data-tab="p4"]');
hit('[data-over="soft"]'); hit('[data-fluid="gas"]'); set('phi',28);
console.log('   sand-top distance, enhanced:',$('s4a').textContent,
            ' polar angle',$('s4b').textContent);
if(!(parseFloat($('s4a').textContent)>0)) fail.push('no enhanced distance at the sand top');

console.log('\n=======================================');
if(fail.length){fail.forEach(f=>console.log('  -',f));process.exit(1);}
console.log('every quoted number checks out');

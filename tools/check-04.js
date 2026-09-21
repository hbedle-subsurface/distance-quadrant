'use strict';
const fs=require('fs'),{JSDOM}=require('jsdom');const R=require('path').resolve(__dirname,'..');
const h=fs.readFileSync(R+'/modules/quadrants.html','utf8'),s=fs.readFileSync(R+'/assets/seismic.js','utf8');
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

console.log('--- exercise 1: the frequency that fits exactly (1 ms) ---');
hit('#tabs button[data-tab="p2"]'); set('dt',0);
let exact=null;
for(let f=15;f<=70;f++){set('freq',f);
 const per=parseFloat($('s2b').textContent);
 if(Math.abs(per-3)<0.06&&exact===null) exact=f;}
for(const f of [40,60,62,63,65]){set('freq',f);
 console.log('  ',String(f).padStart(2)+' Hz  quarter',$('s2a').textContent.padEnd(8),
  'interior samples',$('s2b').textContent);}
console.log('   closest to exactly 3 interior samples:',exact,'Hz');
if(!(exact>=61&&exact<=63)) fail.push('exact fit lands at '+exact+' Hz, answer says around 62');

console.log('\n--- exercise 2: repetition vs omission across frequency ---');
for(const f of [20,25,30,40,50,60,65,70]){set('freq',f);
 console.log('  ',String(f).padStart(2)+' Hz  repeats',$('s2c').textContent.padEnd(10),
  'omits',$('s2d').textContent);}
set('freq',25);
const om25=parseInt($('s2d').textContent), rep25=parseInt($('s2c').textContent);
if(om25!==0) fail.push('at 25 Hz '+om25+' gaps omit, answer says none');
if(rep25===0) fail.push('at 25 Hz no gap repeats, answer says every gap does');
set('freq',70);
const om70=parseInt($('s2d').textContent);
console.log('   25 Hz omits',om25,'  70 Hz omits',om70);
if(!(om70>0)) fail.push('at 70 Hz '+om70+' gaps omit, answer says omission starts');

console.log('\n--- exercise 3: coarsening the sample rate at 40 Hz ---');
set('freq',40);
for(let k=0;k<4;k++){set('dt',k);
 console.log('  ',$('dtV').textContent.padEnd(5),'quarter',$('s2a').textContent.padEnd(8),
  'interior',$('s2b').textContent.padEnd(6),'omits',$('s2d').textContent);}
set('dt',0);
if($('s2a').textContent!=='6.3 ms') fail.push('quarter cycle at 40 Hz reads '+$('s2a').textContent+', answer says 6.3 ms');
set('dt',3); const omCoarse=parseInt($('s2d').textContent);
if(!(omCoarse>0)) fail.push('at 4 ms sampling '+omCoarse+' gaps omit, answer says omission arrives');
set('dt',0);

console.log('\n--- exercise 5: the class 1 polarity flip ---');
hit('#tabs button[data-tab="p3"]');
hit('[data-over="soft"]'); hit('[data-fluid="oil"]'); set('phi',20);
console.log('   class',$('s3b').textContent,' RC at sand top',$('s3a').textContent);
if($('s3b').textContent!=='class 1') fail.push('soft/oil/20% is '+$('s3b').textContent+', answer says class 1');
chk('skipflip',false);
const on=[$('s3d').textContent,$('s3e').textContent];
chk('skipflip',true);
const off=[$('s3d').textContent,$('s3e').textContent];
console.log('   flip on : top is a',on[0],' loop',on[1]);
console.log('   flip off: top is a',off[0],' loop',off[1]);
if(on[0]!=='trough') fail.push('with the flip the sand top is a '+on[0]+', answer says trough');
if(off[0]!=='peak') fail.push('without the flip the sand top is a '+off[0]+', answer says peak');
chk('skipflip',false);

console.log('\n--- the numbering restarts at every extremum ---');
hit('#tabs button[data-tab="p1"]');
hit('[data-over="soft"]'); hit('[data-fluid="gas"]'); set('phi',28); set('thick',30); set('freq',40);
console.log('   anchors from the picks:',$('s1b').textContent,
            '  samples numbered:',$('s1a').textContent);
const anch=parseInt($('s1b').textContent);
if(!(anch>0)) fail.push('no anchors were assigned');

console.log('\n--- exercise 6: a sand under tight sandstone needs no flip ---');
hit('#tabs button[data-tab="p3"]');
hit('[data-fluid="oil"]'); set('phi',20);
for(const o of ['soft','hard','tight']){hit('[data-over="'+o+'"]');
 console.log('  ',o.padEnd(5),$('s3b').textContent.padEnd(9),'flip:',$('s3c').textContent);}
hit('[data-over="tight"]');
if($('s3c').textContent!=='not needed') fail.push('tight sandstone overburden reports flip "'+$('s3c').textContent+'", answer says none needed');
hit('[data-over="soft"]');
if($('s3c').textContent!=='yes') fail.push('soft shale over oil sand reports flip "'+$('s3c').textContent+'", answer says it is flipped');

console.log('\n=======================================');
if(fail.length){fail.forEach(f=>console.log('  -',f));process.exit(1);}
console.log('every quoted number checks out');

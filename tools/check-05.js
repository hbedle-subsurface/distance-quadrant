'use strict';
const fs=require('fs'),{JSDOM}=require('jsdom');const R=require('path').resolve(__dirname,'..');
const h=fs.readFileSync(R+'/modules/isochron.html','utf8'),s=fs.readFileSync(R+'/assets/seismic.js','utf8');
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

console.log('--- exercise 1: the halves sum to the isochron ---');
hit('#tabs button[data-tab="p2"]');
for(const [o,f,p,t] of [['soft','gas',28,24],['hard','brine',20,30],['soft','oil',34,18],['tight','gas',30,40]]){
 hit('[data-over="'+o+'"]');hit('[data-fluid="'+f+'"]');set('phi',p);set('thick',t);
 const iso=num($('s2a').textContent),up=num($('s2b').textContent),dn=num($('s2c').textContent);
 const ok=Math.abs(iso-(up+dn))<0.001;
 console.log('  ',(o+'/'+f+'/'+p+'%/'+t+'ms').padEnd(22),
  'iso',String(iso).padStart(5),'=',String(up).padStart(4),'+',String(dn).padStart(4),ok?'ok':'MISMATCH');
 if(!ok) fail.push(o+'/'+f+': halves '+up+'+'+dn+' do not sum to '+iso);}
hit('[data-over="soft"]');hit('[data-fluid="gas"]');set('phi',28);set('thick',24);

console.log('\n--- exercise 2: a thick layer returns half the wavelet period ---');
hit('#tabs button[data-tab="p1"]');
hit('[data-prof="blocky"]'); set('thick',50);
for(const f of [15,20,25,30,40,50]){set('freq',f);
 const half=num($('s1d').textContent), big=num($('s1b').textContent);
 console.log('  ',String(f).padStart(2)+' Hz  half period',$('s1d').textContent.padEnd(9),
  'wavelet t-p',$('s1d').textContent.padEnd(9),'largest positive isochron',$('s1b').textContent);}
set('freq',25);
if($('s1d').textContent!=='15.6 ms') fail.push('wavelet trough-to-peak at 25 Hz reads '+$('s1d').textContent+', answer says 15.6 ms');
set('freq',50);
if($('s1d').textContent!=='7.8 ms') fail.push('wavelet trough-to-peak at 50 Hz reads '+$('s1d').textContent+', answer says 7.8 ms');
set('freq',25); set('thick',24);

console.log('\n--- exercises 3 and 4: the four profiles at 24 ms / 25 Hz ---');
hit('#tabs button[data-tab="p3"]');
const g=id=>$(id).textContent;
console.log('   blocky        ',g('s3a'));
console.log('   coarsening up ',g('s3b'));
console.log('   fining up     ',g('s3c'));
console.log('   wavelet t-p   ',g('s3d'));
const parse=t=>t.includes('/')?t.split('/').map(x=>num(x.trim())):null;
const bl=parse(g('s3a')),co=parse(g('s3b')),fi=parse(g('s3c'));
if(!bl||Math.abs(bl[0]-bl[1])>1.5) fail.push('blocky splits '+g('s3a')+', answer says evenly');
if(!co||!(co[0]<co[1])) fail.push('coarsening up splits '+g('s3b')+', answer says shorter at the top');
if(!fi||!(fi[1]<fi[0])) fail.push('fining up splits '+g('s3c')+', answer says shorter at the base');
console.log('   verdict:',g('s3e').slice(0,110)+'...');

console.log('\n--- exercise 5: noise moves the split more than the isochron ---');
hit('#tabs button[data-tab="p2"]');
hit('[data-prof="blocky"]'); set('thick',24); set('freq',25); set('noise',0);
const i0=num($('s2a').textContent), sp0=num($('s2d').textContent);
let dIso=0,dSplit=0;
for(const n of [0,5,10,15,20,25,30,40]){set('noise',n);
 const iso=num($('s2a').textContent), sp=num($('s2d').textContent);
 dIso=Math.max(dIso,Math.abs(iso-i0)/Math.abs(i0)*100);
 dSplit=Math.max(dSplit,Math.abs(sp-sp0));
 console.log('  ',String(n).padStart(2)+'%  isochron',$('s2a').textContent.padEnd(9),
  'split',$('s2d').textContent);}
console.log('   worst isochron drift',dIso.toFixed(0)+'% of its clean value;',
            'worst split drift',dSplit.toFixed(0),'percentage points');
if(!(dSplit<=4)) fail.push('split drifted '+dSplit.toFixed(0)+' pts, answer says about four');
set('noise',40);
if($('s2a').textContent!=='+19 ms') fail.push('isochron at 40% noise reads '+$('s2a').textContent+', answer says 19 ms');
if($('s2d').textContent!=='47%') fail.push('split at 40% noise reads '+$('s2d').textContent+', answer says 47%');
set('noise',0);
if($('s2a').textContent!=='+22 ms') fail.push('clean isochron reads '+$('s2a').textContent+', answer says 22 ms');
if($('s2d').textContent!=='50%') fail.push('clean split reads '+$('s2d').textContent+', answer says 50%');
set('noise',0);

console.log('\n--- exercise 6: the isochron quantizes to the sample interval ---');
hit('#tabs button[data-tab="p1"]');
for(let k=0;k<4;k++){set('dt',k);
 const v=num($('s1b').textContent);
 const step=[1,2,3,4][k];
 const ok=Math.abs(v%step)<0.001;
 console.log('  ',$('dtV').textContent.padEnd(5),'largest positive isochron',$('s1b').textContent.padEnd(9),
  ok?'a whole multiple of the interval':'NOT a multiple');
 if(!ok) fail.push('at '+$('dtV').textContent+' the isochron '+v+' is not a multiple of the sample interval');}
set('dt',0);

console.log('\n=======================================');
if(fail.length){fail.forEach(f=>console.log('  -',f));process.exit(1);}
console.log('every quoted number checks out');

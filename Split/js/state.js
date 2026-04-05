/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   JS — STATE
   Variables globales partagées entre tous les modules
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */


let chartData={title:'Mon Thème Jazz',key:'C',tempo:120,timeSig:'4/4',style:'Swing',sections:[]};
let currentSemitoneOffset=0,originalKey='C';
let editTarget=null,annotTarget=null;
window.bassStrings=4; // global — accessible depuis diagrams.js

function setBassStrings(n){
  window.bassStrings=n;
  localStorage.setItem('bassStrings', n);
  document.getElementById('btn-4str').classList.toggle('active', n===4);
  document.getElementById('btn-5str').classList.toggle('active', n===5);
  console.log('[bassStrings] set to', n, '— re-rendering');
  if(typeof render === 'function') render();
  else console.warn('[bassStrings] render() not found');
}
// ── Barlines & navigation ──
const BARLINE_TYPES=['normal','double','final','repeat-start','repeat-end'];
const BARLINE_LABELS={'normal':'| Normal','double':'‖ Double','final':'𝄂 Finale','repeat-start':'|: Répétition début','repeat-end':'⟨: Répétition fin'};
const BARLINE_XML={'normal':null,'double':'light-light','final':'light-heavy','repeat-start':'heavy-light','repeat-end':'light-heavy'};
const VOLTA_TYPES=[null,'1','2','3'];
const NAV_TYPES=[null,'segno','coda','dc-coda','ds-coda','dc-fine','fine','fermata'];
const NAV_DISPLAY={'segno':'𝄋','coda':'𝄌','dc-coda':'D.C. al Coda','ds-coda':'D.S. al Coda','dc-fine':'D.C. al Fine','fine':'Fine','fermata':'𝄐'};
const NAV_IS_TEXT={'dc-coda':true,'ds-coda':true,'dc-fine':true,'fine':true};
const NAV_XML_WORDS={'dc-coda':'D.C. al Coda','ds-coda':'D.S. al Coda','dc-fine':'D.C. al Fine','fine':'Fine'};
let activePopup=null;
function closeActivePopup(){if(activePopup){activePopup.remove();activePopup=null;}}
let selectedRoot='C',selectedQuality='maj7',selectedExts=[];
let selectedAnnotColor='#c4b5fd';
let aShow={mode:false,arp:false,tens:false,free:false};
let aState={modeIdx:0,invIdx:0,selTens:[]};
let labelTarget=null,selLetter='A',selSuffix='';

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   JS — TRANSPOSE
   Transposition par demi-ton ou tonalité cible
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */


function buildTransposeKeySelect(){const sel=document.getElementById('transpose-key-select');while(sel.options.length>1)sel.remove(1);ALL_KEYS.forEach(k=>{const o=document.createElement('option');o.value=k;o.textContent=k;sel.appendChild(o);});}
function snapshotOriginalChords(){chartData.sections.forEach(s=>s.measures.forEach(m=>m.chords.forEach(c=>{if(c._originalSymbol===undefined)c._originalSymbol=c.symbol;})));originalKey=chartData.key;}
function applyTranspositionToChart(semitones){const destKey=ALL_KEYS.find(k=>noteIdx(k)===(noteIdx(originalKey)+semitones+120)%12)||originalKey;chartData.sections.forEach(s=>s.measures.forEach(m=>m.chords.forEach(c=>{if(c._originalSymbol!==undefined)c.symbol=transposeChordSymbol(c._originalSymbol,semitones,destKey);})));chartData.key=destKey;currentSemitoneOffset=((semitones%12)+12)%12;if(currentSemitoneOffset>6)currentSemitoneOffset-=12;document.getElementById('semitone-display').textContent=currentSemitoneOffset>0?'+'+currentSemitoneOffset:currentSemitoneOffset;document.getElementById('meta-key').value=destKey;document.getElementById('transpose-key-select').value=destKey;render();}
function resetTranspose(){chartData.sections.forEach(s=>s.measures.forEach(m=>m.chords.forEach(c=>{if(c._originalSymbol!==undefined){c.symbol=c._originalSymbol;delete c._originalSymbol;}})));chartData.key=originalKey;currentSemitoneOffset=0;document.getElementById('semitone-display').textContent='0';document.getElementById('meta-key').value=originalKey;document.getElementById('transpose-key-select').value='';render();}
function transposeBySemitone(delta){snapshotOriginalChords();applyTranspositionToChart((semitoneDiff(originalKey,chartData.key)+delta+12)%12);}
function transposeToKey(destKeyStr){if(!destKeyStr)return;snapshotOriginalChords();applyTranspositionToChart(semitoneDiff(originalKey,destKeyStr));}
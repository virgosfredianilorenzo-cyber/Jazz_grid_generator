/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   JS — THEORY ENGINE
   Gammes, arpèges, tensions, helpers chromatiques
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */


const CHROMATIC=['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
const ENH={'C#':'Db','D#':'Eb','F#':'Gb','G#':'Ab','A#':'Bb','Db':'C#','Eb':'D#','Gb':'F#','Ab':'G#','Bb':'A#'};
const ALL_KEYS=['C','Db','D','Eb','E','F','F#','Gb','G','Ab','A','Bb','B'];
function noteIdx(n){const i=CHROMATIC.indexOf(n);return i!==-1?i:(ENH[n]?CHROMATIC.indexOf(ENH[n]):-1);}
function tr(root,s){const idx=noteIdx(root);if(idx===-1)return'?';const r=CHROMATIC[(idx+s+12)%12];return['F','Bb','Eb','Ab','Db','Gb'].includes(root)&&ENH[r]?ENH[r]:r;}
function trToKey(note,s,destKey){const idx=noteIdx(note);if(idx===-1)return'?';const r=CHROMATIC[(idx+s+12)%12];return['F','Bb','Eb','Ab','Db','Gb','Cb'].includes(destKey)&&ENH[r]?ENH[r]:r;}
function semitoneDiff(a,b){const x=noteIdx(a),y=noteIdx(b);if(x===-1||y===-1)return 0;return(y-x+12)%12;}
function transposeChordSymbol(sym,s,destKey){if(!sym||sym==='%'||sym==='%%'||sym==='N.C.'||sym==='/beat'||sym==='–')return sym;const p=sym.split('/'),main=p[0],bass=p[1]||null;const rm=main.match(/^([A-G][#b]?)(.*)/);if(!rm)return sym;return trToKey(rm[1],s,destKey||tr(rm[1],s))+rm[2]+(bass?'/'+trToKey(bass,s,destKey||tr(bass,s)):'');}
const ARP_DEF={'':    {i:[0,4,7,12],n:['1','3','5','8']},'maj7':{i:[0,4,7,11],n:['1','3','5','7']},'maj9':{i:[0,4,7,11],n:['1','3','5','7']},'maj13':{i:[0,4,7,11],n:['1','3','5','7']},'6':{i:[0,4,7,9],n:['1','3','5','6']},'6/9':{i:[0,4,7,9],n:['1','3','5','6']},'m':{i:[0,3,7,12],n:['1','b3','5','8']},'m6':{i:[0,3,7,9],n:['1','b3','5','6']},'m7':{i:[0,3,7,10],n:['1','b3','5','b7']},'m9':{i:[0,3,7,10],n:['1','b3','5','b7']},'m11':{i:[0,3,7,10],n:['1','b3','5','b7']},'m13':{i:[0,3,7,10],n:['1','b3','5','b7']},'mM7':{i:[0,3,7,11],n:['1','b3','5','7']},'7':{i:[0,4,7,10],n:['1','3','5','b7']},'9':{i:[0,4,7,10],n:['1','3','5','b7']},'11':{i:[0,4,7,10],n:['1','3','5','b7']},'13':{i:[0,4,7,10],n:['1','3','5','b7']},'dim':{i:[0,3,6,12],n:['1','b3','b5','8']},'dim7':{i:[0,3,6,9],n:['1','b3','b5','bb7']},'m7b5':{i:[0,3,6,10],n:['1','b3','b5','b7']},'aug':{i:[0,4,8,12],n:['1','3','#5','8']},'sus2':{i:[0,2,7,12],n:['1','2','5','8']},'sus4':{i:[0,5,7,12],n:['1','4','5','8']},'7sus4':{i:[0,5,7,10],n:['1','4','5','b7']}};
function getInversions(root,quality){const def=ARP_DEF[quality]||ARP_DEF['maj7'];const base=def.i.map(s=>tr(root,s)),baseN=def.n;return t('invLabels').map((label,k)=>({label,notes:[...base.slice(k),...base.slice(0,k)],degrees:[...baseN.slice(k),...baseN.slice(0,k)]}));}
const MODES_DEF={'':    [{name:'Ionien',desc:'1 2 3 4 5 6 7',i:[0,2,4,5,7,9,11]}],'maj7':[{name:'Ionien',desc:'1 2 3 4 5 6 7',i:[0,2,4,5,7,9,11]},{name:'Lydien',desc:'1 2 3 #4 5 6 7',i:[0,2,4,6,7,9,11]}],'maj9':[{name:'Ionien',desc:'1 2 3 4 5 6 7',i:[0,2,4,5,7,9,11]},{name:'Lydien',desc:'1 2 3 #4 5 6 7',i:[0,2,4,6,7,9,11]}],'maj13':[{name:'Ionien',desc:'1 2 3 4 5 6 7',i:[0,2,4,5,7,9,11]},{name:'Lydien',desc:'1 2 3 #4 5 6 7',i:[0,2,4,6,7,9,11]}],'6':[{name:'Ionien',desc:'1 2 3 4 5 6 7',i:[0,2,4,5,7,9,11]}],'6/9':[{name:'Ionien',desc:'1 2 3 4 5 6 7',i:[0,2,4,5,7,9,11]},{name:'Lydien',desc:'1 2 3 #4 5 6 7',i:[0,2,4,6,7,9,11]}],'m':[{name:'Dorien',desc:'1 2 b3 4 5 6 b7',i:[0,2,3,5,7,9,10]},{name:'Éolien',desc:'1 2 b3 4 5 b6 b7',i:[0,2,3,5,7,8,10]},{name:'Phrygien',desc:'1 b2 b3 4 5 b6 b7',i:[0,1,3,5,7,8,10]},{name:'Min. harmonique',desc:'1 2 b3 4 5 b6 7',i:[0,2,3,5,7,8,11]}],'m6':[{name:'Dorien',desc:'1 2 b3 4 5 6 b7',i:[0,2,3,5,7,9,10]},{name:'Mélodie mineure',desc:'1 2 b3 4 5 6 7',i:[0,2,3,5,7,9,11]}],'m7':[{name:'Dorien',desc:'1 2 b3 4 5 6 b7',i:[0,2,3,5,7,9,10]},{name:'Éolien',desc:'1 2 b3 4 5 b6 b7',i:[0,2,3,5,7,8,10]},{name:'Phrygien',desc:'1 b2 b3 4 5 b6 b7',i:[0,1,3,5,7,8,10]}],'m9':[{name:'Dorien',desc:'1 2 b3 4 5 6 b7',i:[0,2,3,5,7,9,10]}],'m11':[{name:'Dorien',desc:'1 2 b3 4 5 6 b7',i:[0,2,3,5,7,9,10]}],'m13':[{name:'Dorien',desc:'1 2 b3 4 5 6 b7',i:[0,2,3,5,7,9,10]}],'mM7':[{name:'Mélodie mineure',desc:'1 2 b3 4 5 6 7',i:[0,2,3,5,7,9,11]}],'7':[{name:'Mixolydien',desc:'1 2 3 4 5 6 b7',i:[0,2,4,5,7,9,10]},{name:'Lydien b7',desc:'1 2 3 #4 5 6 b7',i:[0,2,4,6,7,9,10]},{name:'Mixolydien b9b13',desc:'1 b2 3 4 5 b6 b7',i:[0,1,4,5,7,8,10]},{name:'Altéré',desc:'1 b2 #2 3 b5 b6 b7',i:[0,1,3,4,6,8,10]}],'9':[{name:'Mixolydien',desc:'1 2 3 4 5 6 b7',i:[0,2,4,5,7,9,10]},{name:'Lydien b7',desc:'1 2 3 #4 5 6 b7',i:[0,2,4,6,7,9,10]}],'11':[{name:'Mixolydien',desc:'1 2 3 4 5 6 b7',i:[0,2,4,5,7,9,10]}],'13':[{name:'Mixolydien',desc:'1 2 3 4 5 6 b7',i:[0,2,4,5,7,9,10]},{name:'Lydien b7',desc:'1 2 3 #4 5 6 b7',i:[0,2,4,6,7,9,10]}],'dim':[{name:'Dim. ton-demi',desc:'1 2 b3 4 b5 b6 6 7',i:[0,2,3,5,6,8,9,11]}],'dim7':[{name:'Dim. demi-ton',desc:'1 b2 b3 3 b5 5 6 b7',i:[0,1,3,4,6,7,9,10]}],'m7b5':[{name:'Locrien',desc:'1 b2 b3 4 b5 b6 b7',i:[0,1,3,5,6,8,10]},{name:'Locrien #2',desc:'1 2 b3 4 b5 b6 b7',i:[0,2,3,5,6,8,10]}],'aug':[{name:'Lydien augmenté',desc:'1 2 3 #4 #5 6 7',i:[0,2,4,6,8,9,11]},{name:'Tons entiers',desc:'1 2 3 #4 #5 b7',i:[0,2,4,6,8,10]}],'sus2':[{name:'Mixolydien',desc:'1 2 3 4 5 6 b7',i:[0,2,4,5,7,9,10]}],'sus4':[{name:'Mixolydien',desc:'1 2 3 4 5 6 b7',i:[0,2,4,5,7,9,10]},{name:'Dorien',desc:'1 2 b3 4 5 6 b7',i:[0,2,3,5,7,9,10]}],'7sus4':[{name:'Mixolydien',desc:'1 2 3 4 5 6 b7',i:[0,2,4,5,7,9,10]}]};
const TENSION_IV={'b9':1,'9':2,'#9':3,'11':5,'#11':6,'b13':8,'13':9,'b2':1,'b7':10,'4':5,'b6':8};
const TENS_DEF={'':    {a:['9','13'],av:['b7']},'maj7':{a:['9','#11','13'],av:[]},'maj9':{a:['9','#11','13'],av:[]},'maj13':{a:['9','#11','13'],av:[]},'6':{a:['9','#11'],av:[]},'6/9':{a:['9','#11'],av:[]},'m':{a:['9','11'],av:[]},'m6':{a:['9','11'],av:[]},'m7':{a:['9','11'],av:[]},'m9':{a:['9','11'],av:[]},'m11':{a:['9','11'],av:[]},'m13':{a:['9','11','13'],av:[]},'mM7':{a:['9','11'],av:[]},'7':{a:['b9','9','#9','#11','b13','13'],av:[]},'9':{a:['#11','b13','13'],av:[]},'11':{a:['b9','9','13'],av:[]},'13':{a:['b9','9','#9','#11'],av:[]},'dim':{a:['9','11','b13'],av:[]},'dim7':{a:['9','11','b13'],av:[]},'m7b5':{a:['9','11','b13'],av:[]},'aug':{a:['9','#11'],av:[]},'sus2':{a:['4','b7'],av:[]},'sus4':{a:['9','b7'],av:[]},'7sus4':{a:['b9','9','13'],av:[]}};

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   JS — PARSER
   Import MusicXML → chartData
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */


function parseMusicXML(xmlStr){const doc=new DOMParser().parseFromString(xmlStr,'application/xml');const te=doc.querySelector('work-title,movement-title');const title=te?te.textContent.trim():'Thème';let tempo=120;const se=doc.querySelector('sound[tempo]');if(se)tempo=parseInt(se.getAttribute('tempo'));let ts='4/4';const b=doc.querySelector('beats'),bt=doc.querySelector('beat-type');if(b&&bt)ts=`${b.textContent}/${bt.textContent}`;const bpm=parseInt(ts.split('/')[0])||4;let key='C';const fi=doc.querySelector('fifths');if(fi){const f=parseInt(fi.textContent);const km={0:'C',1:'G',2:'D',3:'A',4:'E',5:'B',6:'F#','-1':'F','-2':'Bb','-3':'Eb','-4':'Ab','-5':'Db','-6':'Gb'};key=km[f]||'C';}
  const measures=doc.querySelectorAll('measure'),pm=[];
  measures.forEach((m,idx)=>{
    const md={number:idx+1,chords:[],repeatStart:false,repeatEnd:false,
              barlineLeft:'normal',barlineRight:'normal',volta:null,navSymbol:null};
    // ── Barlines & voltas ──
    m.querySelectorAll('barline').forEach(bl=>{
      const loc=bl.getAttribute('location');
      const style=bl.querySelector('bar-style');
      const rep=bl.querySelector('repeat');
      const ending=bl.querySelector('ending');
      const styleMap={'light-light':'double','light-heavy':'final','heavy-light':'repeat-start','light-heavy':'final'};
      if(loc==='left'||loc===null){
        if(rep&&rep.getAttribute('direction')==='forward'){md.barlineLeft='repeat-start';md.repeatStart=true;}
        else if(style){const s=styleMap[style.textContent];if(s)md.barlineLeft=s;}
        if(ending&&ending.getAttribute('type')==='start')md.volta=ending.getAttribute('number')||'1';
      }
      if(loc==='right'){
        if(rep&&rep.getAttribute('direction')==='backward'){md.barlineRight='repeat-end';md.repeatEnd=true;}
        else if(style){const map2={'light-light':'double','light-heavy':'final'};const s=map2[style.textContent];if(s)md.barlineRight=s;}
      }
    });
    // ── Symboles de navigation ──
    m.querySelectorAll('direction').forEach(dir=>{
      if(dir.querySelector('segno'))md.navSymbol='segno';
      else if(dir.querySelector('coda'))md.navSymbol='coda';
      else if(dir.querySelector('fermata'))md.navSymbol='fermata';
      else{
        const w=dir.querySelector('words');
        if(w){
          const txt=w.textContent.trim();
          if(/D\.C\..*Coda/i.test(txt))md.navSymbol='dc-coda';
          else if(/D\.S\..*Coda/i.test(txt))md.navSymbol='ds-coda';
          else if(/D\.C\..*Fine/i.test(txt))md.navSymbol='dc-fine';
          else if(/^Fine$/i.test(txt))md.navSymbol='fine';
        }
      }
    });
    // ── Accords (avec détection des accords alternatifs) ──
    const harmonyEls=[...m.querySelectorAll('harmony')];
    // Grouper par offset : si deux harmonies ont le même offset ou si la 2e a footnote=alt → altChord
    const harmByOffset=new Map();
    harmonyEls.forEach(h=>{
      const off=parseInt(h.querySelector('offset')?.textContent||'0');
      const isAlt=h.querySelector('footnote')?.textContent==='alt';
      const re=h.querySelector('root-step'),ae=h.querySelector('root-alter'),ke=h.querySelector('kind'),be=h.querySelector('bass-step'),bae=h.querySelector('bass-alter');
      if(!re)return;
      let root=re.textContent.trim();
      if(ae){const a=parseFloat(ae.textContent);if(a===1)root+='#';if(a===-1)root+='b';}
      let kind=ke?ke.getAttribute('text')||ke.textContent.trim():'';
      const km={'major':'','minor':'m','dominant':'7','major-seventh':'maj7','minor-seventh':'m7','diminished':'dim','augmented':'aug','half-diminished':'m7b5','diminished-seventh':'dim7','major-ninth':'maj9','dominant-ninth':'9','minor-ninth':'m9','dominant-11th':'11','major-13th':'maj13','dominant-13th':'13','suspended-second':'sus2','suspended-fourth':'sus4','minor-major':'mM7'};
      if(km[kind]!==undefined)kind=km[kind];
      let bass='';
      if(be){bass=be.textContent.trim();if(bae){const a=parseFloat(bae.textContent);if(a===1)bass+='#';if(a===-1)bass+='b';}}
      const sym=root+kind+(bass?'/'+bass:'');
      if(isAlt){
        // Attacher comme altChord au dernier accord de cet offset
        const existing=harmByOffset.get(off);
        if(existing)existing.altChord=sym;
      } else {
        const entry={symbol:sym,beats:0,annot:null,altChord:null};
        harmByOffset.set(off,entry);
        md.chords.push(entry);
      }
    });
    if(md.chords.length>0){const t2=bpm;md.chords.forEach(c=>{c.beats=Math.round(t2/md.chords.length);});const s=md.chords.slice(0,-1).reduce((a,c)=>a+c.beats,0);md.chords[md.chords.length-1].beats=t2-s;}
    else md.chords.push({symbol:'%',beats:bpm,annot:null});
    pm.push(md);
  });
  const sections=[];let cur={label:'A',annotation:'',measures:[]};
  measures.forEach((m,idx)=>{const r=m.querySelector('rehearsal');if(r&&idx>0){if(cur.measures.length>0)sections.push(cur);cur={label:r.textContent.trim(),annotation:'',measures:[]};}cur.measures.push(pm[idx]);});
  if(cur.measures.length>0)sections.push(cur);
  return{title,key,tempo,timeSig:ts,style:'Swing',sections};
}
function parseChordSym(sym){if(!sym||sym==='%'||sym==='–'||sym==='%%'||sym==='N.C.'||sym==='/beat')return null;const c=sym.split('/')[0],rm=c.match(/^([A-G][#b]?)/);return rm?{root:rm[1],quality:c.slice(rm[1].length)}:null;}
function fmtChord(sym){if(!sym||sym==='%')return '–';if(sym==='%%')return '𝄎';if(sym==='N.C.')return 'N.C.';if(sym==='/beat')return '/';return sym.replace(/maj7/g,'Δ7').replace(/maj9/g,'Δ9').replace(/maj13/g,'Δ13').replace(/m7b5/g,'ø7').replace(/dim7/g,'°7').replace(/dim/g,'°');}
function isSpecialSym(sym){return sym==='%'||sym==='%%'||sym==='N.C.'||sym==='/beat';}
function getSymClass(sym){if(sym==='%')return 'sym-repeat';if(sym==='%%')return 'sym-repeat2';if(sym==='N.C.')return 'sym-nc';if(sym==='/beat')return 'sym-slash';return '';}
function getSymLabel(sym){if(sym==='%')return t('symRepeat');if(sym==='%%')return t('symRepeat2');if(sym==='N.C.')return t('symNC');if(sym==='/beat')return t('symSlash');return '';}
function escHtml(s){return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   JS — ACTIONS
   Mutations du chartData : add / delete / duplicate
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */


function newChart(){chartData={title:t('defaultTitle'),key:'C',tempo:120,timeSig:'4/4',style:'Swing',sections:[{label:'A',annotation:'',measures:Array.from({length:8},(_,i)=>({number:i+1,chords:[{symbol:'Cmaj7',beats:4,annot:null}],repeatStart:false,repeatEnd:false,barlineLeft:'normal',barlineRight:'normal',volta:null,navSymbol:null}))}]};originalKey='C';currentSemitoneOffset=0;document.getElementById('semitone-display').textContent='0';document.getElementById('transpose-key-select').value='';document.getElementById('dropzone').style.display='none';document.getElementById('chart-editor').style.display='block';render();}
function addSection(){snapshotUndo();chartData.sections.push({label:t('sectionDefault'),annotation:'',measures:Array.from({length:4},(_,i)=>({number:i+1,chords:[{symbol:'Cmaj7',beats:4,annot:null}],repeatStart:false,repeatEnd:false,barlineLeft:'normal',barlineRight:'normal',volta:null,navSymbol:null}))});render();}
function duplicateSection(si){snapshotUndo();const c=JSON.parse(JSON.stringify(chartData.sections[si]));c.label+=' (bis)';chartData.sections.splice(si+1,0,c);render();}
function deleteSection(si){if(chartData.sections.length<=1)return alert(t('alertLastSection'));snapshotUndo();chartData.sections.splice(si,1);render();}
function addMeasure(si){snapshotUndo();const b=parseInt((chartData.timeSig||'4/4').split('/')[0])||4;chartData.sections[si].measures.push({chords:[{symbol:'%',beats:b,annot:null}],repeatStart:false,repeatEnd:false,barlineLeft:'normal',barlineRight:'normal',volta:null,navSymbol:null});render();}
function deleteMeasure(si,mi){snapshotUndo();chartData.sections[si].measures.splice(mi,1);render();}
function duplicateMeasure(si,mi){snapshotUndo();const c=JSON.parse(JSON.stringify(chartData.sections[si].measures[mi]));chartData.sections[si].measures.splice(mi+1,0,c);render();}


/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   JS — AUTO-ANNOTATE
   Annotation automatique au chargement MusicXML
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function autoAnnotateOnImport(){
  chartData.sections.forEach(section => {
    section.measures.forEach(measure => {
      const chords = (measure.chords || []).filter(c =>
        c.symbol && !['%','%%','N.C.','/beat','–'].includes(c.symbol)
      );
      if(!chords.length) return;

      chords.forEach((chord, ci) => {
        // Ne pas écraser une annotation existante
        if(chord.annot) return;

        const parsed = parseChordSym(chord.symbol);
        if(!parsed) return;

        const quality  = parsed.quality;
        const modes    = MODES_DEF[quality] || MODES_DEF['maj7'] || [];
        const tens     = TENS_DEF[quality]  || {a:[], av:[]};
        const allTens  = tens.a || [];
        const isSingle = chords.length === 1;

        chord.annot = {
          showMode : true,
          showArp  : true,
          showTens : allTens.length > 0,
          showFree : false,
          modeIdx  : 0,              // premier mode par défaut
          invIdx   : 0,              // position fondamentale
          selTens  : [...allTens],   // toutes les tensions disponibles
          showSvg  : isSingle,       // SVG uniquement si 1 accord
          freeText : '',
          freeColor: '#c4b5fd',
          freeBold : false,
          freeItalic: true,
        };
      });
    });
  });
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   JS — I/O
   Import/export JSON  +  import/export MusicXML
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */


function syncMetaToData(){chartData.title=document.getElementById('chart-title').value;chartData.key=document.getElementById('meta-key').value;chartData.tempo=document.getElementById('meta-tempo').value;chartData.timeSig=document.getElementById('meta-time').value;chartData.style=document.getElementById('meta-style').value;}
function exportJSON(){syncMetaToData();const clean=JSON.parse(JSON.stringify(chartData));clean.sections.forEach(s=>s.measures.forEach(m=>m.chords.forEach(c=>{delete c._originalSymbol;})));const blob=new Blob([JSON.stringify(clean,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=(chartData.title||'chart')+'.json';a.click();}
document.getElementById('import-json').addEventListener('change',e=>{const file=e.target.files[0];if(!file)return;const r=new FileReader();r.onload=ev=>{try{chartData=JSON.parse(ev.target.result);originalKey=chartData.key;currentSemitoneOffset=0;document.getElementById('semitone-display').textContent='0';document.getElementById('transpose-key-select').value='';document.getElementById('dropzone').style.display='none';document.getElementById('chart-editor').style.display='block';render();}catch{alert(t('alertBadJSON'));}};r.readAsText(file);});
document.getElementById('file-input').addEventListener('change',async e=>{const file=e.target.files[0];if(!file)return;try{const xmlStr=await loadFileAsXML(file);chartData=parseMusicXML(xmlStr);originalKey=chartData.key;currentSemitoneOffset=0;document.getElementById('semitone-display').textContent='0';document.getElementById('transpose-key-select').value='';autoAnnotateOnImport();document.getElementById('dropzone').style.display='none';document.getElementById('chart-editor').style.display='block';render();}catch(err){console.error(err);alert(t('alertBadXML'));}e.target.value='';});
const dz=document.getElementById('dropzone');
dz.addEventListener('dragover',e=>{e.preventDefault();dz.classList.add('drag-over');});
dz.addEventListener('dragleave',()=>dz.classList.remove('drag-over'));
dz.addEventListener('drop',async e=>{e.preventDefault();dz.classList.remove('drag-over');const file=e.dataTransfer.files[0];if(!file)return;try{const xmlStr=await loadFileAsXML(file);chartData=parseMusicXML(xmlStr);originalKey=chartData.key;currentSemitoneOffset=0;autoAnnotateOnImport();document.getElementById('dropzone').style.display='none';document.getElementById('chart-editor').style.display='block';render();}catch(err){console.error(err);alert(t('alertBadXML'));}});
['chart-title','meta-key','meta-tempo','meta-time','meta-style'].forEach(id=>{document.getElementById(id).addEventListener('change',e=>{const m={'chart-title':'title','meta-key':'key','meta-tempo':'tempo','meta-time':'timeSig','meta-style':'style'};chartData[m[id]]=e.target.value;if(id==='meta-key')originalKey=e.target.value;});});

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   JS — MUSICXML EXPORT HELPERS
   Fonctions utilitaires pour la génération MusicXML
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */


function buildMusicXMLString(){
  syncMetaToData();
  chartData.tempo=parseInt(chartData.tempo)||120;
  const[beatsStr,beatTypeStr]=chartData.timeSig.split('/');
  const beats=parseInt(beatsStr)||4,beatType=parseInt(beatTypeStr)||4,DIVISIONS=4;
  const keyToFifths={'C':0,'G':1,'D':2,'A':3,'E':4,'B':5,'F#':6,'Cb':-7,'Gb':-6,'Db':-5,'Ab':-4,'Eb':-3,'Bb':-2,'F':-1};
  const fifths=keyToFifths[chartData.key]??0;
  // Determine major/minor mode from key
  const minorKeys=['Am','Em','Bm','F#m','C#m','G#m','D#m','Dm','Gm','Cm','Fm','Bbm'];
  const keyMode='major';
  const qToK={
    '':      {kind:'major',        text:''},
    'maj7':  {kind:'major-seventh',text:'maj7'},
    'maj9':  {kind:'major-ninth',  text:'maj9'},
    'maj13': {kind:'major-13th',   text:'maj13'},
    '6':     {kind:'major-sixth',  text:'6'},
    '6/9':   {kind:'major-sixth',  text:'6/9'},
    'm':     {kind:'minor',        text:'m'},
    'm6':    {kind:'minor-sixth',  text:'m6'},
    'm7':    {kind:'minor-seventh',text:'m7'},
    'm9':    {kind:'minor-ninth',  text:'m9'},
    'm11':   {kind:'minor-11th',   text:'m11'},
    'm13':   {kind:'minor-13th',   text:'m13'},
    'mM7':   {kind:'major-minor',  text:'mM7'},
    '7':     {kind:'dominant',     text:'7'},
    '9':     {kind:'dominant-ninth',text:'9'},
    '11':    {kind:'dominant-11th',text:'11'},
    '13':    {kind:'dominant-13th',text:'13'},
    'dim':   {kind:'diminished',   text:'dim'},
    'dim7':  {kind:'diminished-seventh',text:'dim7'},
    'm7b5':  {kind:'half-diminished',text:'m7b5'},
    'aug':   {kind:'augmented',    text:'aug'},
    'sus2':  {kind:'suspended-second',text:'sus2'},
    'sus4':  {kind:'suspended-fourth',text:'sus4'},
    '7sus4': {kind:'suspended-fourth',text:'7sus4'},
  };
  function parseChordForXML(sym){
    if(!sym||sym==='%'||sym==='–')return null;
    const sp=sym.split('/'),main=sp[0],bn=sp[1]||null;
    const rm=main.match(/^([A-G][#b]?)(.*)/);
    if(!rm)return null;
    const root=rm[1],qual=rm[2].replace(/[()]/g,'');
    let rs=root[0],ra=0;
    if(root[1]==='#')ra=1; else if(root[1]==='b')ra=-1;
    let bs=null,ba=0;
    if(bn){bs=bn[0];if(bn[1]==='#')ba=1;else if(bn[1]==='b')ba=-1;}
    const kd=qToK[qual]||{kind:'other',text:qual};
    return{rs,ra,kind:kd.kind,kt:kd.text,bs,ba};
  }
  function harmonyToXML(chord,offset){
    const p=parseChordForXML(chord.symbol);
    if(!p)return'';
    const alter=v=>v!==0?`<root-alter>${v}</root-alter>`:''
    const bass=p.bs?`<bass><bass-step>${p.bs}</bass-step>${p.ba!==0?`<bass-alter>${p.ba}</bass-alter>`:''}</bass>`:'';
    const off=offset>0?`<offset>${offset*DIVISIONS}</offset>`:'';
    let xml=`\n      <harmony placement="above">${off}<root><root-step>${p.rs}</root-step>${alter(p.ra)}</root><kind text="${p.kt}">${p.kind}</kind>${bass}</harmony>`;
    // ── Accord alternatif ──
    if(chord.altChord){
      const pa=parseChordForXML(chord.altChord);
      if(pa){
        const altBass=pa.bs?`<bass><bass-step>${pa.bs}</bass-step>${pa.ba!==0?`<bass-alter>${pa.ba}</bass-alter>`:''}</bass>`:'';
        xml+=`\n      <harmony placement="above" print-frame="no">${off}<root><root-step>${pa.rs}</root-step>${alter(pa.ra)}</root><kind text="${pa.kt}">${pa.kind}</kind>${altBass}<footnote>alt</footnote></harmony>`;
      }
    }
    return xml;
  }
  // Duration type map: beats → MusicXML type (assuming quarter=1)
  function beatType2xml(b){
    const m={0.25:'16th',0.5:'eighth',1:'quarter',2:'half',3:'dotted-half',4:'whole'};
    return m[b]||'quarter';
  }
  let mn=1,mXML='',isFirst=true;
  chartData.sections.forEach(section=>{
    section.measures.forEach((measure,mi)=>{
      const chords=measure.chords||[];
      let hXML='',ob=0;
      chords.forEach(c=>{hXML+=harmonyToXML(c,ob);ob+=c.beats||beats;});

      // ── Barlines (nouvelles + rétrocompat) ──
      const bl=measure.barlineLeft||(measure.repeatStart?'repeat-start':'normal');
      const br=measure.barlineRight||(measure.repeatEnd?'repeat-end':'normal');
      const blXML={
        'normal':   '',
        'double':   `\n      <barline location="left"><bar-style>light-light</bar-style></barline>`,
        'final':    `\n      <barline location="left"><bar-style>light-heavy</bar-style></barline>`,
        'repeat-start': `\n      <barline location="left"><bar-style>heavy-light</bar-style><repeat direction="forward"/></barline>`,
      };
      const brXML={
        'normal':   '',
        'double':   `\n      <barline location="right"><bar-style>light-light</bar-style></barline>`,
        'final':    `\n      <barline location="right"><bar-style>light-heavy</bar-style></barline>`,
        'repeat-end': `\n      <barline location="right"><bar-style>light-heavy</bar-style><repeat direction="backward"/></barline>`,
      };
      let bStart=blXML[bl]||'';
      let bEnd  =brXML[br]||'';

      // ── Volta (ending) ──
      if(measure.volta){
        bStart+=`\n      <barline location="left"><ending number="${measure.volta}" type="start"/></barline>`;
        bEnd  +=`\n      <barline location="right"><ending number="${measure.volta}" type="stop"/></barline>`;
      }

      // ── Symboles de navigation ──
      let navXML='';
      const nav=measure.navSymbol;
      if(nav==='segno')
        navXML=`\n      <direction placement="above"><direction-type><segno/></direction-type></direction>`;
      else if(nav==='coda')
        navXML=`\n      <direction placement="above"><direction-type><coda/></direction-type></direction>`;
      else if(nav==='fermata')
        navXML=`\n      <direction placement="above"><direction-type><fermata/></direction-type></direction>`;
      else if(NAV_XML_WORDS[nav])
        navXML=`\n      <direction placement="above"><direction-type><words>${NAV_XML_WORDS[nav]}</words></direction-type><sound ${nav==='dc-coda'||nav==='ds-coda'?'dacapo="yes"':nav==='dc-fine'?'dacapo="yes"':'fine="yes"'}/></direction>`;

      let rehearsal='';
      if(mi===0&&section.label){
        rehearsal=`\n      <direction placement="above"><direction-type><rehearsal enclosure="box">${escHtml(section.label)}</rehearsal></direction-type></direction>`;
        if(section.annotation)rehearsal+=`\n      <direction placement="above"><direction-type><words>${escHtml(section.annotation)}</words></direction-type></direction>`;
      }
      let attrs='';
      if(isFirst){
        attrs=`\n      <attributes>`+
          `<divisions>${DIVISIONS}</divisions>`+
          `<key><fifths>${fifths}</fifths><mode>${keyMode}</mode></key>`+
          `<time><beats>${beats}</beats><beat-type>${beatType}</beat-type></time>`+
          `<clef><sign>G</sign><line>2</line></clef>`+
          `</attributes>`+
          `\n      <direction placement="above"><direction-type>`+
          `<metronome parentheses="no"><beat-unit>quarter</beat-unit><per-minute>${chartData.tempo}</per-minute></metronome>`+
          `</direction-type><sound tempo="${chartData.tempo}"/></direction>`;
        isFirst=false;
      }
      const restDur=beats*DIVISIONS;
      mXML+=`\n    <measure number="${mn++}">${bStart}${attrs}${rehearsal}${navXML}${hXML}`+
        `\n      <note><rest measure="yes"/><duration>${restDur}</duration></note>${bEnd}`+
        `\n    </measure>`;
    });
  });
  const title=escHtml(chartData.title||'Jazz Chart');
  const today=new Date().toISOString().split('T')[0];
  return `<?xml version="1.0" encoding="UTF-8" standalone="no"?>\n`+
    `<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 3.1 Partwise//EN"\n`+
    `  "http://www.musicxml.org/dtds/partwise.dtd">\n`+
    `<score-partwise version="3.1">\n`+
    `  <work><work-title>${title}</work-title></work>\n`+
    `  <identification>\n`+
    `    <encoding>\n`+
    `      <software>Jazz Chart Editor v4</software>\n`+
    `      <encoding-date>${today}</encoding-date>\n`+
    `      <supports element="accidental" type="no"/>\n`+
    `      <supports element="beam" type="no"/>\n`+
    `    </encoding>\n`+
    `  </identification>\n`+
    `  <part-list><score-part id="P1"><part-name>${title}</part-name></score-part></part-list>\n`+
    `  <part id="P1">${mXML}\n  </part>\n`+
    `</score-partwise>`;
}

function exportMusicXML(){
  const xml=buildMusicXMLString();
  const blob=new Blob([xml],{type:'application/vnd.recordare.musicxml+xml'});
  const a=document.createElement('a');
  a.href=URL.createObjectURL(blob);
  a.download=((chartData.title||'chart').replace(/\s+/g,'_'))+'.musicxml';
  a.click();
}

async function exportMXL(){
  if(typeof JSZip==='undefined'){alert('JSZip not loaded');return;}
  const xml=buildMusicXMLString();
  const title=(chartData.title||'chart').replace(/\s+/g,'_');
  const xmlFilename=title+'.xml';
  // container.xml required by MXL spec
  const container=`<?xml version="1.0" encoding="UTF-8"?>\n`+
    `<container>\n`+
    `  <rootfiles>\n`+
    `    <rootfile full-path="${xmlFilename}" media-type="application/vnd.recordare.musicxml+xml"/>\n`+
    `  </rootfiles>\n`+
    `</container>`;
  const zip=new JSZip();
  zip.folder('META-INF').file('container.xml',container);
  zip.file(xmlFilename,xml);
  // mimetype file (uncompressed, must be first) — JSZip handles ordering
  zip.file('mimetype','application/vnd.recordare.musicxml',{compression:'STORE'});
  const blob=await zip.generateAsync({type:'blob',compression:'DEFLATE',compressionOptions:{level:6}});
  const a=document.createElement('a');
  a.href=URL.createObjectURL(blob);
  a.download=title+'.mxl';
  a.click();
}

async function loadFileAsXML(file){
  return new Promise((resolve,reject)=>{
    const ext=file.name.split('.').pop().toLowerCase();
    if(ext==='mxl'){
      if(typeof JSZip==='undefined'){reject(new Error('JSZip not loaded'));return;}
      const r=new FileReader();
      r.onload=async ev=>{
        try{
          const zip=await JSZip.loadAsync(ev.target.result);
          // Find rootfile from META-INF/container.xml
          let xmlPath=null;
          const containerFile=zip.file('META-INF/container.xml');
          if(containerFile){
            const containerXml=await containerFile.async('string');
            const m=containerXml.match(/full-path="([^"]+)"/);
            if(m)xmlPath=m[1];
          }
          // Fallback: find first .xml or .musicxml in zip
          if(!xmlPath){
            zip.forEach((p,f)=>{if(!xmlPath&&(p.endsWith('.xml')||p.endsWith('.musicxml'))&&!p.startsWith('META-INF'))xmlPath=p;});
          }
          if(!xmlPath){reject(new Error('No MusicXML found in MXL'));return;}
          const xmlStr=await zip.file(xmlPath).async('string');
          resolve(xmlStr);
        }catch(e){reject(e);}
      };
      r.onerror=()=>reject(new Error('Read failed'));
      r.readAsArrayBuffer(file);
    } else {
      const r=new FileReader();
      r.onload=ev=>resolve(ev.target.result);
      r.onerror=()=>reject(new Error('Read failed'));
      r.readAsText(file);
    }
  });
}
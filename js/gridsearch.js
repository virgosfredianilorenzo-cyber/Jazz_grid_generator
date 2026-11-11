/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   JS — TROUVER UNE GRILLE
   Recherche guidée (DuckDuckGo) + import lien iReal Pro / MusicXML
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

function gridSearchUrls(title,composer){
  const q=s=>'https://duckduckgo.com/?q='+encodeURIComponent(s);
  title=(title||'').trim();composer=(composer||'').trim();
  return {
    forum:q('site:forums.irealpro.com "'+title+'"'+(composer?' '+composer:'')),
    web:q('"'+title+'"'+(composer?' "'+composer+'"':'')+' irealb'),
    musicxml:q('"'+title+'" musicxml')
  };
}

function chartPreviewText(chart){
  return (chart.sections||[]).map(sec=>{
    const ms=(sec.measures||[]).map(m=>{
      let s=(m.chords||[]).map(c=>c.symbol).join(' ');
      if(m.volta)s='['+m.volta+'. '+s;
      if(m.repeatStart||m.barlineLeft==='repeat-start')s='‖: '+s;
      if(m.repeatEnd||m.barlineRight==='repeat-end')s+=' :‖';
      return s;
    });
    return ((sec.label||'')+' '+ms.join(' | ')).trim();
  });
}

/* ── DOM ── */
let _gsSongs=[],_gsChart=null,_gsIsXml=false;
const _gsEl=id=>document.getElementById(id);
const _gsNorm=s=>(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();

function openGridSearch(){
  _gsEl('gs-title').value=(typeof chartData!=='undefined'&&chartData&&chartData.title)||'';
  _gsEl('gs-composer').value=(typeof chartData!=='undefined'&&chartData&&chartData.composer)||'';
  _gsEl('gs-link').value='';_gsEl('gs-filter').value='';
  _gsSongs=[];_gsChart=null;_gsIsXml=false;
  _gsRenderList();_gsRenderPreview();_gsError('');_gsUpdateButtons();
  _gsEl('gridsearch-dialog').classList.add('active');
}
function closeGridSearch(){_gsEl('gridsearch-dialog').classList.remove('active');}

function _gsUpdateButtons(){
  const empty=!_gsEl('gs-title').value.trim();
  ['gs-btn-forum','gs-btn-web','gs-btn-musicxml'].forEach(id=>{_gsEl(id).disabled=empty;});
  _gsEl('gs-btn-import').disabled=!_gsChart;
}
function _gsError(key){const e=_gsEl('gs-error');e.textContent=key?t(key):'';e.style.display=key?'block':'none';}

function gridSearchOpenUrl(kind){
  const title=_gsEl('gs-title').value.trim();if(!title)return;
  window.open(gridSearchUrls(title,_gsEl('gs-composer').value)[kind],'_blank','noopener');
}

function gridSearchDecode(){
  _gsChart=null;_gsSongs=[];_gsIsXml=false;_gsError('');
  try{
    const res=decodeIRealLink(_gsEl('gs-link').value.trim());
    if(!res||!res.length)throw new Error('IREAL_INVALID');
    _gsSongs=res;
  }catch(e){_gsError('gsErrInvalid');}
  _gsEl('gs-filter').value='';
  _gsRenderList();
  if(_gsSongs.length===1)_gsSelect(0);else _gsRenderPreview();
  _gsUpdateButtons();
}

function _gsRenderList(){
  const box=_gsEl('gs-songlist'),f=_gsNorm(_gsEl('gs-filter').value.trim());
  const multi=_gsSongs.length>1;
  _gsEl('gs-filter').style.display=multi?'block':'none';
  box.style.display=multi?'block':'none';
  if(!multi){box.innerHTML='';return;}
  const rows=[];
  for(let i=0;i<_gsSongs.length&&rows.length<200;i++){
    const c=_gsSongs[i].chart;
    if(f&&_gsNorm(c.title).indexOf(f)<0)continue;
    rows.push('<div class="gs-song'+(_gsSongs[i].chart===_gsChart?' selected':'')+'" data-i="'+i+'">'+escHtml(c.title||'')+(c.composer?' <small>— '+escHtml(c.composer)+'</small>':'')+'</div>');
  }
  box.innerHTML=rows.join('');
}

function _gsSelect(i){
  _gsChart=_gsSongs[i].chart;_gsIsXml=false;_gsRenderList();_gsRenderPreview(_gsSongs[i].warnings);_gsUpdateButtons();
}

function _gsRenderPreview(warnings){
  const box=_gsEl('gs-preview');
  if(!_gsChart){box.style.display='none';box.innerHTML='';return;}
  const c=_gsChart;
  const meta=[c.key,c.timeSig,c.tempo?c.tempo+' BPM':'',c.style].filter(Boolean).join(' · ');
  let h='<div class="gs-step">'+escHtml(t('gsPreview'))+'</div><b>'+escHtml(c.title||'')+'</b>'+(c.composer?' — '+escHtml(c.composer):'')+'<div class="gs-meta">'+escHtml(meta)+'</div>';
  h+=chartPreviewText(c).map(l=>'<div class="gs-line">'+escHtml(l)+'</div>').join('');
  if(warnings&&warnings.length)h+='<div class="gs-warn">'+escHtml(t('gsWarnings'))+'<ul>'+warnings.map(w=>'<li>'+escHtml(String(w))+'</li>').join('')+'</ul></div>';
  box.innerHTML=h;box.style.display='block';
}

async function gridSearchFile(file){
  if(!file)return;
  _gsChart=null;_gsSongs=[];_gsError('');_gsRenderList();
  try{
    const xml=await loadFileAsXML(file);
    const chart=parseMusicXML(xml);
    if(!chart||!chart.sections||!chart.sections.length)throw new Error('empty');
    _gsChart=chart;_gsIsXml=true;
  }catch(e){console.error(e);_gsError('gsErrFile');}
  _gsRenderPreview();_gsUpdateButtons();
}

function gridSearchImport(){
  if(!_gsChart)return;
  if(_isDirty&&!confirm(t('gsConfirmReplace')))return;
  snapshotUndo();
  chartData=_gsChart;_ensureSectionIds(chartData);
  originalKey=chartData.key;currentSemitoneOffset=0;
  document.getElementById('semitone-display').textContent='0';
  document.getElementById('transpose-key-select').value='';
  if(_gsIsXml)autoAnnotateOnImport();
  document.getElementById('dropzone').style.display='none';
  document.getElementById('chart-editor').style.display='block';
  _isDirty=false;render();closeGridSearch();
}

function _gsInit(){
  if(typeof document==='undefined'||!_gsEl('gridsearch-dialog'))return;
  ['gs-title','gs-composer'].forEach(id=>_gsEl(id).addEventListener('input',_gsUpdateButtons));
  _gsEl('gs-btn-forum').addEventListener('click',()=>gridSearchOpenUrl('forum'));
  _gsEl('gs-btn-web').addEventListener('click',()=>gridSearchOpenUrl('web'));
  _gsEl('gs-btn-musicxml').addEventListener('click',()=>gridSearchOpenUrl('musicxml'));
  _gsEl('gs-btn-decode').addEventListener('click',gridSearchDecode);
  _gsEl('gs-filter').addEventListener('input',_gsRenderList);
  _gsEl('gs-songlist').addEventListener('click',e=>{const r=e.target.closest('.gs-song');if(r)_gsSelect(+r.dataset.i);});
  _gsEl('gs-btn-import').addEventListener('click',gridSearchImport);
  const drop=_gsEl('gs-drop'),fi=_gsEl('gs-file');
  drop.addEventListener('click',()=>fi.click());
  fi.addEventListener('change',e=>{gridSearchFile(e.target.files[0]);e.target.value='';});
  drop.addEventListener('dragover',e=>{e.preventDefault();drop.classList.add('drag-over');});
  drop.addEventListener('dragleave',()=>drop.classList.remove('drag-over'));
  drop.addEventListener('drop',e=>{e.preventDefault();drop.classList.remove('drag-over');gridSearchFile(e.dataTransfer.files[0]);});
  _gsEl('gridsearch-dialog').addEventListener('keydown',e=>{if(e.key==='Escape')closeGridSearch();});
}
_gsInit();

if(typeof module!=='undefined')module.exports={gridSearchUrls,chartPreviewText};

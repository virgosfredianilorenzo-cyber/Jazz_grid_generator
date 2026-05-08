/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   JS — MODALS
   Modales : édition accord, annotations, label section
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */


const ROOTS=['C','C#','Db','D','D#','Eb','E','F','F#','Gb','G','G#','Ab','A','A#','Bb','B'];
const QUALITIES=[{label:'',value:''},{label:'maj7',value:'maj7'},{label:'maj9',value:'maj9'},{label:'maj13',value:'maj13'},{label:'6',value:'6'},{label:'6/9',value:'6/9'},{label:'m',value:'m'},{label:'m6',value:'m6'},{label:'m7',value:'m7'},{label:'m9',value:'m9'},{label:'m11',value:'m11'},{label:'m13',value:'m13'},{label:'mM7',value:'mM7'},{label:'7',value:'7'},{label:'9',value:'9'},{label:'11',value:'11'},{label:'13',value:'13'},{label:'dim',value:'dim'},{label:'dim7',value:'dim7'},{label:'ø7',value:'m7b5'},{label:'aug',value:'aug'},{label:'sus2',value:'sus2'},{label:'sus4',value:'sus4'},{label:'7sus4',value:'7sus4'}];
const EXTS=['b5','#5','b9','#9','#11','b13','add9','add11','omit3'];
function buildModal(){
  // — Symboles rapides —
  const sc=document.getElementById('modal-sym-btns');sc.innerHTML='';
  const SYMS=[
    {label:'— '+t('symNone').replace('— ',''),value:''},
    {label:'%',value:'%',title:t('symRepeat')},
    {label:'𝄎',value:'%%',title:t('symRepeat2')},
    {label:'N.C.',value:'N.C.',title:t('symNC')},
    {label:'/',value:'/beat',title:t('symSlash')},
  ];
  SYMS.forEach(s=>{const b=document.createElement('button');b.className='modal-sym-btn';b.textContent=s.label;b.dataset.sym=s.value;if(s.title)b.title=s.title;b.onclick=()=>{document.querySelectorAll('.modal-sym-btn').forEach(x=>x.classList.remove('selected'));b.classList.add('selected');// si symbole spécial : masquer la partie accord, sinon afficher
const isSpec=s.value!=='';document.getElementById('modal-chord-section').style.display=isSpec?'none':'block';if(isSpec)document.getElementById('free-chord').value=s.value;else document.getElementById('free-chord').value='';};sc.appendChild(b);});
  const rc=document.getElementById('root-btns');rc.innerHTML='';ROOTS.forEach(r=>{const b=document.createElement('button');b.className='chord-btn';b.textContent=r;b.dataset.val=r;b.onclick=()=>{document.querySelectorAll('#root-btns .chord-btn').forEach(x=>x.classList.remove('active'));b.classList.add('active');selectedRoot=r;document.getElementById('free-chord').value='';// désélectionner les symboles
document.querySelectorAll('.modal-sym-btn').forEach(x=>x.classList.remove('selected'));document.querySelector('.modal-sym-btn[data-sym=""]').classList.add('selected');document.getElementById('modal-chord-section').style.display='block';};rc.appendChild(b);});
  const qc=document.getElementById('quality-btns');qc.innerHTML='';QUALITIES.forEach(q=>{const b=document.createElement('button');b.className='chord-btn';b.textContent=q.label||'—';b.dataset.val=q.value;b.onclick=()=>{document.querySelectorAll('#quality-btns .chord-btn').forEach(x=>x.classList.remove('active'));b.classList.add('active');selectedQuality=q.value;document.getElementById('free-chord').value='';document.querySelectorAll('.modal-sym-btn').forEach(x=>x.classList.remove('selected'));document.querySelector('.modal-sym-btn[data-sym=""]').classList.add('selected');document.getElementById('modal-chord-section').style.display='block';};qc.appendChild(b);});
  const ec=document.getElementById('ext-btns');ec.innerHTML='';EXTS.forEach(e=>{const b=document.createElement('button');b.className='chord-btn';b.textContent=e;b.dataset.val=e;b.onclick=()=>{b.classList.toggle('active');if(b.classList.contains('active')){if(!selectedExts.includes(e))selectedExts.push(e);}else selectedExts=selectedExts.filter(x=>x!==e);document.getElementById('free-chord').value='';document.querySelectorAll('.modal-sym-btn').forEach(x=>x.classList.remove('selected'));document.querySelector('.modal-sym-btn[data-sym=""]').classList.add('selected');document.getElementById('modal-chord-section').style.display='block';};ec.appendChild(b);});
}
function openModal(si,mi,ci,chord){
  editTarget={si,mi,ci};selectedExts=[];
  document.querySelectorAll('#root-btns .chord-btn,#quality-btns .chord-btn,#ext-btns .chord-btn').forEach(b=>b.classList.remove('active'));
  const bpm=parseInt((chartData.timeSig||'4/4').split('/')[0])||4;
  // — Initialiser les symboles rapides —
  document.querySelectorAll('.modal-sym-btn').forEach(x=>x.classList.remove('selected'));
  const sym=chord?chord.symbol:'';
  const isSpec=isSpecialSym(sym);
  document.getElementById('modal-chord-section').style.display=isSpec?'none':'block';
  const activeSymBtn=document.querySelector(`.modal-sym-btn[data-sym="${isSpec?sym:''}"]`);
  if(activeSymBtn)activeSymBtn.classList.add('selected');
  if(chord&&chord.symbol&&!isSpec){
    const rm=chord.symbol.match(/^([A-G][#b]?)/);
    if(rm){selectedRoot=rm[1];const btn=document.querySelector(`#root-btns .chord-btn[data-val="${selectedRoot}"]`);if(btn)btn.classList.add('active');}
    document.getElementById('free-chord').value=chord.symbol;
    document.getElementById('bass-input').value=chord.symbol.includes('/')?chord.symbol.split('/')[1]:'';
    document.getElementById('chord-beats').value=chord.beats||bpm;
  }else{
    document.getElementById('free-chord').value=isSpec?sym:'';
    document.getElementById('bass-input').value='';
    document.getElementById('chord-beats').value=chord?chord.beats||bpm:bpm;
    if(!isSpec){
      const dr=document.querySelector('#root-btns .chord-btn[data-val="C"]');if(dr)dr.classList.add('active');
      const dq=document.querySelector('#quality-btns .chord-btn[data-val="maj7"]');if(dq)dq.classList.add('active');
      selectedRoot='C';selectedQuality='maj7';
    }
  }
  document.getElementById('modal-title').textContent=ci===-1?t('modalAddChord'):t('modalEditChord');
  document.getElementById('modal-overlay').classList.add('active');
}
function closeModal(){document.getElementById('modal-overlay').classList.remove('active');editTarget=null;}
function buildChordSymbol(){
  // Symbole spécial sélectionné ?
  const selSym=document.querySelector('.modal-sym-btn.selected');
  if(selSym&&selSym.dataset.sym!=='')return selSym.dataset.sym;
  const free=document.getElementById('free-chord').value.trim();
  if(free)return free;
  const bass=document.getElementById('bass-input').value.trim();
  let sym=selectedRoot+selectedQuality;
  if(selectedExts.length>0)sym+='('+selectedExts.join(',')+')';
  if(bass)sym+='/'+bass;
  return sym;
}
function applyChord(){snapshotUndo();const{si,mi,ci}=editTarget;const symbol=buildChordSymbol(),beats=parseInt(document.getElementById('chord-beats').value)||4;const measure=chartData.sections[si].measures[mi];if(ci===-1){if(!measure.chords)measure.chords=[];measure.chords.push({symbol,beats,annot:null});}else{const ex=measure.chords[ci];measure.chords[ci]={symbol,beats,annot:ex?ex.annot:null};}closeModal();render();}
function deleteChord(){snapshotUndo();const{si,mi,ci}=editTarget;if(ci!==-1)chartData.sections[si].measures[mi].chords.splice(ci,1);closeModal();render();}
function toggleSection(key){aShow[key]=!aShow[key];document.getElementById('toggle-'+key).classList.toggle('on',aShow[key]);}
function selectAnnotColor(el){document.querySelectorAll('.color-swatch').forEach(s=>s.classList.remove('active'));el.classList.add('active');selectedAnnotColor=el.dataset.color;}
function openAnnotModal(si,mi,ci,chord){annotTarget={si,mi,ci};const annot=chord.annot||{};aShow={mode:!!annot.showMode,arp:!!annot.showArp,tens:!!annot.showTens,free:!!annot.showFree};aState={modeIdx:annot.modeIdx||0,invIdx:annot.invIdx||0,selTens:annot.selTens?[...annot.selTens]:[]};['mode','arp','tens','free'].forEach(k=>document.getElementById('toggle-'+k).classList.toggle('on',aShow[k]));const parsed=parseChordSym(chord.symbol);document.getElementById('annot-chord-name').textContent=fmtChord(chord.symbol);const mList=document.getElementById('modal-modes-list');mList.innerHTML='';if(parsed){const modes=MODES_DEF[parsed.quality]||MODES_DEF['maj7'];modes.forEach((mode,i)=>{const notes=mode.i.map(s=>tr(parsed.root,s)).join(' ');const card=document.createElement('div');card.className='mode-card'+(i===aState.modeIdx?' selected':'');card.innerHTML=`<div style="display:flex;align-items:center;justify-content:space-between"><span class="mode-name">${mode.name}</span>${i===aState.modeIdx?'<span class="mode-selected-badge">✓</span>':''}</div><div class="mode-notes">${notes}</div><div class="mode-desc">${mode.desc}</div>`;card.onclick=()=>{aState.modeIdx=i;mList.querySelectorAll('.mode-card').forEach((c,j)=>{c.classList.toggle('selected',j===i);const mn=modes[j].i.map(s=>tr(parsed.root,s)).join(' ');c.innerHTML=`<div style="display:flex;align-items:center;justify-content:space-between"><span class="mode-name">${modes[j].name}</span>${j===i?'<span class="mode-selected-badge">✓</span>':''}</div><div class="mode-notes">${mn}</div><div class="mode-desc">${modes[j].desc}</div>`;});};mList.appendChild(card);});}else mList.innerHTML=`<div style="color:#556;font-size:0.82rem;">${t('annotUnknown')}</div>`;const arpRoot=document.getElementById('modal-arp-root');arpRoot.innerHTML='';const invList=document.getElementById('modal-inv-list');invList.innerHTML='';if(parsed){const def=ARP_DEF[parsed.quality]||ARP_DEF['maj7'];def.i.forEach((iv,i)=>{const n=tr(parsed.root,iv);const p=document.createElement('div');p.className='arp-pill'+(i===0?' root':'');p.textContent=`${n} (${def.n[i]})`;arpRoot.appendChild(p);});const invs=getInversions(parsed.root,parsed.quality);invs.forEach((inv,k)=>{const card=document.createElement('div');card.className='inv-card'+(k===aState.invIdx?' selected':'');const badge=k===aState.invIdx?'<span class="inv-selected-badge">✓</span>':'';card.innerHTML=`<span class="inv-label">${inv.label}</span><span class="inv-notes">${inv.notes.join(' · ')}</span><span class="inv-intervals">(${inv.degrees.join('-')})</span>${badge}`;card.onclick=()=>{aState.invIdx=k;invList.querySelectorAll('.inv-card').forEach((c,j)=>{c.classList.toggle('selected',j===k);const b2=j===k?'<span class="inv-selected-badge">✓</span>':'';const inv2=invs[j];c.innerHTML=`<span class="inv-label">${inv2.label}</span><span class="inv-notes">${inv2.notes.join(' · ')}</span><span class="inv-intervals">(${inv2.degrees.join('-')})</span>${b2}`;});};invList.appendChild(card);});}const tensPills=document.getElementById('modal-tens-pills');tensPills.innerHTML='';const avoidPills=document.getElementById('modal-avoid-pills');avoidPills.innerHTML='';const avoidWrap=document.getElementById('modal-avoid-wrap');if(parsed){const tens=TENS_DEF[parsed.quality]||{a:[],av:[]};tens.a.forEach(t2=>{const s=TENSION_IV[t2]||0,n=tr(parsed.root,s),sel=aState.selTens.includes(t2);const p=document.createElement('div');p.className='tens-pill available'+(sel?' selected':'');p.textContent=`${t2} (${n})`;p.onclick=()=>{if(aState.selTens.includes(t2))aState.selTens=aState.selTens.filter(x=>x!==t2);else aState.selTens.push(t2);p.classList.toggle('selected',aState.selTens.includes(t2));};tensPills.appendChild(p);});if(!tens.a.length)tensPills.innerHTML=`<span style="color:#556;font-size:0.8rem;">${t('annotNone')}</span>`;if(tens.av&&tens.av.length){avoidWrap.style.display='block';tens.av.forEach(t2=>{const s=TENSION_IV[t2]||0,n=tr(parsed.root,s);const p=document.createElement('div');p.className='tens-pill avoid';p.textContent=`${t2} (${n})`;avoidPills.appendChild(p);});}else avoidWrap.style.display='none';}document.getElementById('annot-text').value=annot.freeText||'';document.getElementById('annot-bold').checked=annot.freeBold||false;document.getElementById('annot-italic').checked=annot.freeItalic!==undefined?annot.freeItalic:true;const color=annot.freeColor||'#c4b5fd';selectedAnnotColor=color;document.querySelectorAll('.color-swatch').forEach(s=>s.classList.toggle('active',s.dataset.color===color));document.getElementById('annot-overlay').classList.add('active');}
function closeAnnotModal(){document.getElementById('annot-overlay').classList.remove('active');annotTarget=null;}
function applyAnnotation(){snapshotUndo();const{si,mi,ci}=annotTarget;const freeText=document.getElementById('annot-text').value.trim();const hasAny=aShow.mode||aShow.arp||aShow.tens||(aShow.free&&freeText);chartData.sections[si].measures[mi].chords[ci].annot=hasAny?{showMode:aShow.mode,showArp:aShow.arp,showTens:aShow.tens,showFree:aShow.free&&!!freeText,modeIdx:aState.modeIdx,invIdx:aState.invIdx,selTens:[...aState.selTens],freeText,freeColor:selectedAnnotColor,freeBold:document.getElementById('annot-bold').checked,freeItalic:document.getElementById('annot-italic').checked}:null;closeAnnotModal();render();}
function clearAnnotation(){const{si,mi,ci}=annotTarget;chartData.sections[si].measures[mi].chords[ci].annot=null;closeAnnotModal();render();}

/* ── Popup accord alternatif ── */
function openAltChordPopup(e,si,mi,ci,chord){
  e.stopPropagation();closeActivePopup();
  const pop=document.createElement('div');pop.className='bl-popup';
  activePopup=pop;
  // Titre
  const title=document.createElement('div');
  title.style.cssText='font-size:0.7rem;color:#f0c060;font-weight:bold;padding:2px 8px 4px;border-bottom:1px solid #2d4a7a;margin-bottom:4px;';
  title.textContent='♯± Accord alternatif';
  pop.appendChild(title);
  // Input saisie
  const row=document.createElement('div');row.style.cssText='display:flex;gap:6px;padding:4px 4px 2px;align-items:center;';
  const inp=document.createElement('input');
  inp.type='text';inp.placeholder='ex: Db7, Bbm7…';
  inp.value=chord.altChord||'';
  inp.style.cssText='flex:1;background:#1e3a5f;border:1px solid #f0c060;color:#eee;padding:4px 7px;border-radius:4px;font-size:0.82rem;width:110px;';
  const applyBtn=document.createElement('button');
  applyBtn.textContent='✓';
  applyBtn.style.cssText='background:#f0c060;color:#1a1a2e;border:none;border-radius:4px;padding:4px 8px;cursor:pointer;font-weight:bold;';
  applyBtn.onclick=e2=>{
    e2.stopPropagation();
    const val=inp.value.trim();
    chartData.sections[si].measures[mi].chords[ci].altChord=val||null;
    closeActivePopup();render();
  };
  inp.addEventListener('keydown',e2=>{if(e2.key==='Enter')applyBtn.click();if(e2.key==='Escape')closeActivePopup();});
  row.append(inp,applyBtn);
  pop.appendChild(row);
  // Bouton supprimer (si accord existant)
  if(chord.altChord){
    const delBtn=document.createElement('button');
    delBtn.textContent='🗑 Supprimer';
    delBtn.style.cssText='background:none;border:none;color:#f87171;font-size:0.75rem;cursor:pointer;padding:4px 8px;width:100%;text-align:left;';
    delBtn.onclick=e2=>{
      e2.stopPropagation();
      chartData.sections[si].measures[mi].chords[ci].altChord=null;
      closeActivePopup();render();
    };
    pop.appendChild(delBtn);
  }
  // Suggestions rapides (subs tritoniées fréquentes)
  const parsed=parseChordSym(chord.symbol);
  if(parsed&&parsed.quality==='7'){
    const triSub=tr(parsed.root,6)+parsed.quality; // substitution tritoniée
    const sugg=document.createElement('div');
    sugg.style.cssText='font-size:0.65rem;color:#6a8aaa;padding:2px 8px;border-top:1px solid #2d4a7a;margin-top:2px;';
    sugg.textContent='Suggestion : ';
    const pill=document.createElement('span');
    pill.textContent=fmtChord(triSub);
    pill.style.cssText='color:#f0c060;cursor:pointer;text-decoration:underline;';
    pill.onclick=e2=>{e2.stopPropagation();inp.value=triSub;};
    sugg.appendChild(pill);
    pop.appendChild(sugg);
  }
  const rect=e.target.getBoundingClientRect();
  pop.style.cssText=`position:fixed;top:${rect.bottom+4}px;left:${Math.max(0,rect.left-40)}px;min-width:160px;`;
  document.body.appendChild(pop);
  setTimeout(()=>inp.focus(),50);
  setTimeout(()=>document.addEventListener('click',closeActivePopup,{once:true}),10);
}
function openBarlinePopup(e,si,mi,side){
  e.stopPropagation();closeActivePopup();
  const measure=chartData.sections[si].measures[mi];
  const pop=document.createElement('div');pop.className='bl-popup';
  activePopup=pop;
  if(side==='left'||side==='right'){
    const cur=side==='left'?measure.barlineLeft:measure.barlineRight;
    const items=side==='left'
      ?['normal','double','final','repeat-start']
      :['normal','double','final','repeat-end'];
    const icons={'normal':'| Normal','double':'‖ Double','final':'𝄂 Finale',
      'repeat-start':'|: Répét. début','repeat-end':'⟨: Répét. fin'};
    items.forEach(type=>{
      const b=document.createElement('button');
      b.textContent=icons[type]||type;
      if(type===cur)b.classList.add('active-item');
      b.onclick=e2=>{e2.stopPropagation();
        if(side==='left'){
          measure.barlineLeft=type;
          measure.repeatStart=(type==='repeat-start');
        } else {
          measure.barlineRight=type;
          measure.repeatEnd=(type==='repeat-end');
        }
        closeActivePopup();render();};
      pop.appendChild(b);
    });
    pop.appendChild(document.createElement('hr'));
    // Volta
    const vLabel=document.createElement('button');
    vLabel.textContent='— Volta (1ère / 2ème / 3ème) —';
    vLabel.style.cssText='color:#7dd3fc;font-size:0.7rem;cursor:default;';
    pop.appendChild(vLabel);
    [null,'1','2','3'].forEach(v=>{
      const b=document.createElement('button');
      b.textContent=v?`[${v}.`:'✕ Supprimer volta';
      if(v===measure.volta)b.classList.add('active-item');
      b.onclick=e2=>{e2.stopPropagation();measure.volta=v;closeActivePopup();render();};
      pop.appendChild(b);
    });
  }
  // Positionner
  const rect=e.target.getBoundingClientRect();
  pop.style.cssText=`position:fixed;top:${rect.bottom+4}px;left:${rect.left}px;visibility:hidden;`;
  document.body.appendChild(pop);
  {const _pw=pop.offsetWidth,_ph=pop.offsetHeight;let _px=Math.min(rect.left-30,window.innerWidth-_pw-8),_py=rect.bottom+4;if(_py+_ph>window.innerHeight-8)_py=rect.top-_ph-4;pop.style.left=Math.max(0,_px)+'px';pop.style.top=Math.max(0,_py)+'px';pop.style.visibility='';}
  document.body.appendChild(pop);
  setTimeout(()=>document.addEventListener('click',closeActivePopup,{once:true}),10);
}

/* ── Popup nav symbol ── */
function openNavPopup(e,si,mi){
  e.stopPropagation();closeActivePopup();
  const measure=chartData.sections[si].measures[mi];
  const pop=document.createElement('div');pop.className='bl-popup';
  activePopup=pop;
  const items=[
    {val:null,   label:'✕ Supprimer'},
    {val:'segno',label:'𝄋 Segno'},
    {val:'coda', label:'𝄌 Coda'},
    {val:'dc-coda',label:'D.C. al Coda'},
    {val:'ds-coda',label:'D.S. al Coda'},
    {val:'dc-fine',label:'D.C. al Fine'},
    {val:'fine', label:'Fine'},
    {val:'fermata',label:'𝄐 Fermata'},
  ];
  items.forEach(({val,label})=>{
    const b=document.createElement('button');
    b.textContent=label;
    if(val===measure.navSymbol)b.classList.add('active-item');
    b.onclick=e2=>{e2.stopPropagation();measure.navSymbol=val;closeActivePopup();render();};
    pop.appendChild(b);
  });
  const rect=e.target.getBoundingClientRect();
  pop.style.cssText=`position:fixed;top:${rect.bottom+4}px;left:${rect.left}px;visibility:hidden;`;
  document.body.appendChild(pop);
  {const _pw=pop.offsetWidth,_ph=pop.offsetHeight;let _px=Math.min(rect.left-30,window.innerWidth-_pw-8),_py=rect.bottom+4;if(_py+_ph>window.innerHeight-8)_py=rect.top-_ph-4;pop.style.left=Math.max(0,_px)+'px';pop.style.top=Math.max(0,_py)+'px';pop.style.visibility='';}
  document.body.appendChild(pop);
  setTimeout(()=>document.addEventListener('click',closeActivePopup,{once:true}),10);
}
const LETTERS=['A','B','C','D','E','F','G','H','I','Intro','Verse','Chorus','Bridge','Outro','Coda','Tag','Vamp','Head'];
function buildLabelModal(){const suffixVals=['',"'","''",'1','2'];const lb=document.getElementById('letter-btns');lb.innerHTML='';LETTERS.forEach(l=>{const b=document.createElement('button');b.className='chord-btn';b.textContent=l;b.dataset.val=l;b.style.minWidth='36px';b.onclick=()=>{document.querySelectorAll('#letter-btns .chord-btn').forEach(x=>x.classList.remove('active'));b.classList.add('active');selLetter=l;updateLabelPreview();};lb.appendChild(b);});const sb=document.getElementById('suffix-btns');sb.innerHTML='';t('suffixLabels').forEach((lbl,i)=>{const val=suffixVals[i];const b=document.createElement('button');b.className='chord-btn';b.textContent=lbl;b.dataset.val=val;b.style.minWidth='60px';b.onclick=()=>{document.querySelectorAll('#suffix-btns .chord-btn').forEach(x=>x.classList.remove('active'));b.classList.add('active');selSuffix=val;updateLabelPreview();};sb.appendChild(b);});}
function updateLabelPreview(){document.getElementById('label-preview').textContent=selLetter+selSuffix;}
function openLabelModal(si){labelTarget=si;const cur=chartData.sections[si].label||'A';const suffixVals=["'","''",'1','2'];const sm=suffixVals.find(v=>v&&cur.endsWith(v));selSuffix=sm||'';selLetter=sm?cur.slice(0,-sm.length):cur;document.querySelectorAll('#letter-btns .chord-btn').forEach(b=>b.classList.toggle('active',b.dataset.val===selLetter));document.querySelectorAll('#suffix-btns .chord-btn').forEach(b=>b.classList.toggle('active',b.dataset.val===selSuffix));updateLabelPreview();document.getElementById('label-overlay').classList.add('active');}
function closeLabelModal(){document.getElementById('label-overlay').classList.remove('active');labelTarget=null;}
function applyLabel(){if(labelTarget===null)return;chartData.sections[labelTarget].label=selLetter+selSuffix;closeLabelModal();render();}
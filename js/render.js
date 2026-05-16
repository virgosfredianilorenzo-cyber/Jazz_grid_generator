/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   JS — RENDER
   DOM rendering : sections, mesures, accords, symboles
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */


function render(){document.getElementById('chart-title').value=chartData.title;document.getElementById('meta-key').value=chartData.key;document.getElementById('meta-tempo').value=chartData.tempo;document.getElementById('meta-time').value=chartData.timeSig;document.getElementById('meta-style').value=chartData.style;const cont=document.getElementById('sections-container');cont.innerHTML='';chartData.sections.forEach((s,si)=>cont.appendChild(renderSection(s,si)));}
function moveSection(si,dir){const newIdx=si+dir;if(newIdx<0||newIdx>=chartData.sections.length)return;const tmp=chartData.sections[si];chartData.sections[si]=chartData.sections[newIdx];chartData.sections[newIdx]=tmp;render();}
let dragSrcIdx=null;
function renderSection(section,si){const cols=parseInt(document.getElementById('global-cols').value)||4;const div=document.createElement('div');div.className='section';div.dataset.si=si;div.draggable=true;
  // drag events
  div.addEventListener('dragstart',e=>{dragSrcIdx=si;setTimeout(()=>div.classList.add('dragging'),0);e.dataTransfer.effectAllowed='move';});
  div.addEventListener('dragend',()=>{div.classList.remove('dragging');document.querySelectorAll('.section').forEach(s=>s.classList.remove('drag-over-top','drag-over-bottom'));dragSrcIdx=null;});
  div.addEventListener('dragover',e=>{e.preventDefault();e.dataTransfer.dropEffect='move';if(dragSrcIdx===null||dragSrcIdx===si)return;const rect=div.getBoundingClientRect();const mid=rect.top+rect.height/2;document.querySelectorAll('.section').forEach(s=>s.classList.remove('drag-over-top','drag-over-bottom'));div.classList.add(e.clientY<mid?'drag-over-top':'drag-over-bottom');});
  div.addEventListener('dragleave',()=>div.classList.remove('drag-over-top','drag-over-bottom'));
  div.addEventListener('drop',e=>{e.preventDefault();div.classList.remove('drag-over-top','drag-over-bottom');if(dragSrcIdx===null||dragSrcIdx===si)return;const rect=div.getBoundingClientRect();const mid=rect.top+rect.height/2;let targetIdx=e.clientY<mid?si:si+1;if(dragSrcIdx<targetIdx)targetIdx--;const moved=chartData.sections.splice(dragSrcIdx,1)[0];chartData.sections.splice(targetIdx,0,moved);dragSrcIdx=null;render();});
  const hdr=document.createElement('div');hdr.className='section-header';const topRow=document.createElement('div');topRow.className='section-header-top';
  // drag handle
  const handle=document.createElement('span');handle.className='section-drag-handle';handle.textContent='⠿';handle.title='Glisser pour déplacer';handle.addEventListener('mousedown',()=>div.draggable=true);
  const li=document.createElement('button');li.className='section-label';li.innerHTML=`<span class="sec-label-text">${section.label||'A'}</span><span class="sec-label-edit"> ✎</span>`;li.onclick=()=>openLabelModal(si);const idBadge=document.createElement('span');idBadge.className='section-id-badge';idBadge.textContent=section.id?'#'+section.id:'';idBadge.title='ID unique de section';const acts=document.createElement('div');acts.className='section-actions';
  // ▲▼ move buttons
  const btnUp=document.createElement('button');btnUp.textContent='▲';btnUp.title='Monter';btnUp.disabled=si===0;btnUp.style.opacity=si===0?'0.3':'1';btnUp.onclick=()=>moveSection(si,-1);
  const btnDn=document.createElement('button');btnDn.textContent='▼';btnDn.title='Descendre';btnDn.disabled=si===chartData.sections.length-1;btnDn.style.opacity=si===chartData.sections.length-1?'0.3':'1';btnDn.onclick=()=>moveSection(si,+1);
  acts.append(btnUp,btnDn);
  [t('secAddMeasure'),t('secDuplicate'),t('secDelete')].forEach((txt,k)=>{const b=document.createElement('button');b.textContent=txt;b.onclick=[()=>addMeasure(si),()=>duplicateSection(si),()=>deleteSection(si)][k];acts.appendChild(b);});topRow.append(handle,li,idBadge,acts);const annotRow=document.createElement('div');annotRow.className='section-annot-row';const annotBadge=document.createElement('span');annotBadge.className='section-annot-badge';annotBadge.textContent='✎';const annotInput=document.createElement('input');annotInput.type='text';annotInput.className='section-annot-input';annotInput.value=section.annotation||'';annotInput.placeholder=t('secAnnotPlaceholder');const annotDisplayEl=document.createElement('div');annotInput.addEventListener('change',()=>{chartData.sections[si].annotation=annotInput.value;renderSectionAnnotDisplay(annotInput.value,annotDisplayEl);});annotInput.addEventListener('input',()=>renderSectionAnnotDisplay(annotInput.value,annotDisplayEl));annotRow.append(annotBadge,annotInput);hdr.append(topRow,annotRow);renderSectionAnnotDisplay(section.annotation||'',annotDisplayEl);const grid=document.createElement('div');grid.className='measures-grid';grid.style.gridTemplateColumns=`repeat(${cols},1fr)`;grid.dataset.cols=cols;section.measures.forEach((m,mi)=>grid.appendChild(renderMeasure(m,si,mi)));const ab=document.createElement('button');ab.className='add-measure-btn';ab.textContent='+';ab.onclick=()=>addMeasure(si);grid.appendChild(ab);div.append(hdr,annotDisplayEl,grid);return div;}
function renderSectionAnnotDisplay(text,el){if(!text||!text.trim()){el.style.display='none';return;}el.style.display='flex';el.className='section-annot-display';el.innerHTML=`<span class="annot-icon">💬</span><span>${escHtml(text)}</span>`;}
function moveMeasure(si,mi,dir){const measures=chartData.sections[si].measures;const newMi=mi+dir;if(newMi<0||newMi>=measures.length)return;const tmp=measures[mi];measures[mi]=measures[newMi];measures[newMi]=tmp;render();}
let dragMeasureSrc=null; // {si, mi}
function renderMeasure(measure,si,mi){
  // ── Normaliser les champs (rétrocompat JSON anciens) ──
  if(!measure.barlineLeft) measure.barlineLeft = measure.repeatStart?'repeat-start':'normal';
  if(!measure.barlineRight) measure.barlineRight = measure.repeatEnd?'repeat-end':'normal';

  const div=document.createElement('div');
  div.className='measure';
  div.dataset.si=si; div.dataset.mi=mi;
  div.style.position='relative';
  div.style.marginTop = (measure.volta||measure.navSymbol)?'22px':'';

  // Appliquer classes barline
  div.classList.remove('barline-repeat-start','barline-repeat-end');
  ['left','right'].forEach(side=>{
    const val=side==='left'?measure.barlineLeft:measure.barlineRight;
    const cls=`bl-${val}-${side==='left'?'left':'right'}`;
    if(val==='repeat-start'||val==='repeat-end'){
      div.classList.add(val==='repeat-start'?'barline-repeat-start':'barline-repeat-end');
    } else if(val&&val!=='normal'){
      div.classList.add(cls);
    }
  });

  // ── Volta bracket ──
  if(measure.volta){
    const vb=document.createElement('div');
    vb.className='volta-bracket volta-open';
    vb.textContent=measure.volta+'.';
    vb.onclick=e=>{e.stopPropagation();openBarlinePopup(e,si,mi,'volta');};
    div.appendChild(vb);
  }

  // ── Nav symbol ──
  if(measure.navSymbol){
    const ns=document.createElement('div');
    const isText=NAV_IS_TEXT[measure.navSymbol];
    ns.className='nav-symbol'+(isText?' nav-text':'')+(measure.navSymbol==='coda'?' nav-coda':measure.navSymbol==='segno'?' nav-segno':'');
    ns.textContent=NAV_DISPLAY[measure.navSymbol]||measure.navSymbol;
    ns.title='Cliquer pour modifier';
    ns.onclick=e=>{e.stopPropagation();openNavPopup(e,si,mi);};
    div.appendChild(ns);
  }

  // drag & drop
  div.draggable=true;
  div.addEventListener('dragstart',e=>{dragMeasureSrc={si,mi};setTimeout(()=>div.classList.add('measure-dragging'),0);e.dataTransfer.effectAllowed='move';e.stopPropagation();});
  div.addEventListener('dragend',e=>{div.classList.remove('measure-dragging');document.querySelectorAll('.measure').forEach(m=>m.classList.remove('measure-drag-over-left','measure-drag-over-right'));dragMeasureSrc=null;e.stopPropagation();});
  div.addEventListener('dragover',e=>{if(!dragMeasureSrc)return;e.preventDefault();e.stopPropagation();e.dataTransfer.dropEffect='move';const rect=div.getBoundingClientRect();const mid=rect.left+rect.width/2;document.querySelectorAll('.measure').forEach(m=>m.classList.remove('measure-drag-over-left','measure-drag-over-right'));div.classList.add(e.clientX<mid?'measure-drag-over-left':'measure-drag-over-right');});
  div.addEventListener('dragleave',e=>{div.classList.remove('measure-drag-over-left','measure-drag-over-right');});
  div.addEventListener('drop',e=>{e.preventDefault();e.stopPropagation();div.classList.remove('measure-drag-over-left','measure-drag-over-right');if(!dragMeasureSrc)return;const src=dragMeasureSrc;const rect=div.getBoundingClientRect();const mid=rect.left+rect.width/2;const insertAfter=e.clientX>=mid;const srcMeasures=chartData.sections[src.si].measures;const moved=srcMeasures.splice(src.mi,1)[0];const tgtMeasures=chartData.sections[si].measures;let tgtIdx=mi;if(src.si===si&&src.mi<mi)tgtIdx--;if(insertAfter)tgtIdx++;tgtIdx=Math.max(0,Math.min(tgtIdx,tgtMeasures.length));tgtMeasures.splice(tgtIdx,0,moved);dragMeasureSrc=null;render();});

  const topRow=document.createElement('div');topRow.style.cssText='display:flex;align-items:flex-start;gap:2px;';
  const handle=document.createElement('span');handle.className='measure-drag-handle';handle.textContent='⠿';handle.title='Glisser pour déplacer';
  const numEl=document.createElement('div');numEl.className='measure-number';numEl.textContent=mi+1;
  const btnL=document.createElement('button');btnL.textContent='◀';btnL.title='Reculer';btnL.style.cssText='background:none;border:none;color:#4a6a9a;font-size:0.55rem;cursor:pointer;padding:0 2px;opacity:0;transition:opacity 0.15s;';btnL.disabled=mi===0;btnL.onclick=e=>{e.stopPropagation();moveMeasure(si,mi,-1);};
  const btnR=document.createElement('button');btnR.textContent='▶';btnR.title='Avancer';btnR.style.cssText='background:none;border:none;color:#4a6a9a;font-size:0.55rem;cursor:pointer;padding:0 2px;opacity:0;transition:opacity 0.15s;';btnR.disabled=mi===chartData.sections[si].measures.length-1;btnR.onclick=e=>{e.stopPropagation();moveMeasure(si,mi,+1);};
  topRow.append(handle,numEl,btnL,btnR);div.appendChild(topRow);
  div.addEventListener('mouseenter',()=>{btnL.style.opacity=mi===0?'0.2':'0.8';btnR.style.opacity=mi===chartData.sections[si].measures.length-1?'0.2':'0.8';});
  div.addEventListener('mouseleave',()=>{btnL.style.opacity='0';btnR.style.opacity='0';});

  // ── Boutons barline gauche/droit (hover) ──
  const blLeft=document.createElement('button');
  blLeft.className='barline-btn barline-btn-left';blLeft.textContent='◧';blLeft.title='Barre gauche';
  blLeft.onclick=e=>{e.stopPropagation();openBarlinePopup(e,si,mi,'left');};
  const blRight=document.createElement('button');
  blRight.className='barline-btn barline-btn-right';blRight.textContent='◨';blRight.title='Barre droite';
  blRight.onclick=e=>{e.stopPropagation();openBarlinePopup(e,si,mi,'right');};
  div.appendChild(blLeft);div.appendChild(blRight);

  // ── Bouton nav symbol (hover) ──
  const navBtn=document.createElement('button');
  navBtn.className='nav-add-btn';navBtn.textContent='𝄌';navBtn.title='Ajouter symbole de navigation';
  navBtn.onclick=e=>{e.stopPropagation();openNavPopup(e,si,mi);};
  div.appendChild(navBtn);

  const beatsRow=document.createElement('div');beatsRow.className='beats-row';(measure.chords||[]).forEach((chord,ci)=>beatsRow.appendChild(renderChordSlot(chord,si,mi,ci)));const addBtn=document.createElement('button');addBtn.className='add-chord-btn';addBtn.textContent='+';addBtn.title=t('tipAddChord');addBtn.onclick=e=>{e.stopPropagation();openModal(si,mi,-1,null);};beatsRow.appendChild(addBtn);div.appendChild(beatsRow);
  const delM=document.createElement('button');delM.className='chord-del-btn';delM.textContent='✕';delM.title=t('tipDeleteMeasure');delM.onclick=e=>{e.stopPropagation();deleteMeasure(si,mi);};div.appendChild(delM);
  const dupM=document.createElement('button');dupM.style.cssText='position:absolute;top:2px;right:18px;background:none;border:none;color:#f0a500;font-size:0.6rem;cursor:pointer;opacity:0;transition:opacity 0.2s;';dupM.textContent='⧉';dupM.title=t('tipDupMeasure');dupM.onclick=e=>{e.stopPropagation();duplicateMeasure(si,mi);};div.appendChild(dupM);
  div.addEventListener('mouseenter',()=>dupM.style.opacity='1');
  div.addEventListener('mouseleave',()=>dupM.style.opacity='0');
  div.addEventListener('contextmenu',e=>{e.preventDefault();openModal(si,mi,-1,null);});
  return div;
}
function renderChordSlot(chord,si,mi,ci){const annot=chord.annot||{},parsed=parseChordSym(chord.symbol);
  const symClass=getSymClass(chord.symbol);
  const slot=document.createElement('div');
  slot.className='chord-slot'+(symClass?' '+symClass:'')+(annot&&(annot.showMode||annot.showArp||annot.showTens||annot.showFree)?' has-annot':'');
  slot.style.flex=chord.beats||1;
  // — Rendu symbole spécial —
  if(symClass){
    const disp=document.createElement('div');disp.className='sym-display';disp.textContent=fmtChord(chord.symbol);
    const lbl=document.createElement('div');lbl.className='sym-label';lbl.textContent=getSymLabel(chord.symbol);
    const hint=document.createElement('div');hint.className='chord-edit-hint';hint.textContent=t('editHint');
    slot.appendChild(disp);slot.appendChild(lbl);slot.appendChild(hint);
    slot.onclick=e=>{e.stopPropagation();openModal(si,mi,ci,chord);};
    return slot;
  }
  const hdr=document.createElement('div');hdr.className='chord-header alt-chord-wrap';
  // ── Accord alternatif existant ──
  if(chord.altChord){
    const alt=document.createElement('div');alt.className='alt-chord-display';
    alt.textContent=fmtChord(chord.altChord);alt.title='Cliquer pour modifier l\'accord alternatif';
    alt.onclick=e=>{e.stopPropagation();openAltChordPopup(e,si,mi,ci,chord);};
    hdr.appendChild(alt);
  }
  // ── Bouton ajout accord alternatif (hover) ──
  const altBtn=document.createElement('button');altBtn.className='alt-chord-btn';
  altBtn.textContent='♯±';altBtn.title='Ajouter un accord alternatif';
  altBtn.onclick=e=>{e.stopPropagation();openAltChordPopup(e,si,mi,ci,chord);};
  hdr.appendChild(altBtn);
  hdr.innerHTML+=`<div class="chord-symbol">${fmtChord(chord.symbol)}</div><div class="chord-duration">${chord.beats||''}♩</div><div class="chord-edit-hint">${t('editHint')}</div>`;
  hdr.querySelector('.chord-symbol').onclick=e=>{e.stopPropagation();openModal(si,mi,ci,chord);};
  hdr.querySelector('.chord-duration').onclick=e=>{e.stopPropagation();openModal(si,mi,ci,chord);};
  hdr.querySelector('.chord-edit-hint').onclick=e=>{e.stopPropagation();openModal(si,mi,ci,chord);};
  slot.appendChild(hdr);
  if(parsed&&annot.showMode){
    const modes=MODES_DEF[parsed.quality]||MODES_DEF['maj7'];
    const idx=Math.min(annot.modeIdx||0,modes.length-1);
    const modeName=modes[idx].name;
    // showSvg : true par défaut sauf si explicitement false (mesures multi-accords)
    const doSvg = annot.showSvg !== false;
    if(doSvg){
      const svgContent=getModesvg(modeName);
      if(svgContent){
        const wrap=document.createElement('div');
        wrap.className='mode-diagram-wrap';
        const lbl=document.createElement('div');lbl.className='mode-diagram-label';lbl.textContent=modeName;
        wrap.appendChild(lbl);
        wrap.innerHTML+=transposeModesvg(svgContent,parsed.root,modeName,parsed.quality);
        slot.appendChild(wrap);
      }
    } else {
      // Mode texte uniquement
      const modeLabel=document.createElement('div');
      modeLabel.className='theory-row';
      modeLabel.innerHTML=`<span class="theory-row-label">M:</span><span class="theory-row-value mode-val">${modeName}</span>`;
      slot.appendChild(modeLabel);
    }
  }
  if(parsed&&(annot.showArp||annot.showTens||annot.showMode)){
    const td=document.createElement('div');td.className='chord-theory';
    if(annot.showArp){const invs=getInversions(parsed.root,parsed.quality);const idx=Math.min(annot.invIdx||0,invs.length-1);const row=document.createElement('div');row.className='theory-row';row.innerHTML=`<span class="theory-row-label">A:</span><span class="theory-row-value arp-val">${invs[idx].notes.join('·')}</span>`;td.appendChild(row);}
    if(annot.showTens&&annot.selTens&&annot.selTens.length){const notes=annot.selTens.map(t2=>tr(parsed.root,TENSION_IV[t2]||0));const row=document.createElement('div');row.className='theory-row';row.innerHTML=`<span class="theory-row-label">T:</span><span class="theory-row-value tens-val">${notes.join(' ')}</span>`;td.appendChild(row);}
    // Modes alternatifs
    const allModes=MODES_DEF[parsed.quality]||[];
    if(allModes.length){
      const mRow=document.createElement('div');mRow.className='modes-alt-row';
      mRow.textContent=allModes.map(m=>m.name).join(' · ');
      td.appendChild(mRow);
    }
    slot.appendChild(td);
  }
  if(annot.showFree&&annot.freeText){const fa=document.createElement('div');fa.className='chord-free-annot';fa.textContent=annot.freeText;fa.style.color=annot.freeColor||'#c4b5fd';fa.style.fontWeight=annot.freeBold?'bold':'normal';fa.style.fontStyle=annot.freeItalic?'italic':'normal';slot.appendChild(fa);}const icon=document.createElement('div');icon.className='chord-annot-icon';icon.textContent='✏️';icon.onclick=e=>{e.stopPropagation();openAnnotModal(si,mi,ci,chord);};slot.appendChild(icon);return slot;}
/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   JS — TOUCH SUPPORT
   Drag & drop tactile (sections + mesures) + pinch-to-zoom grille
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

/* ── Drag tactile générique ── */
function makeTouchDraggable(handle, getEl, onDrop){
  let ghost=null,active=false,startX=0,startY=0;
  handle.addEventListener('touchstart',e=>{
    if(e.touches.length!==1)return;
    const t=e.touches[0]; startX=t.clientX; startY=t.clientY; active=true;
    handle._touchTimer=setTimeout(()=>{
      const el=getEl(); if(!el)return;
      ghost=el.cloneNode(true);
      ghost.style.cssText=`position:fixed;opacity:0.7;pointer-events:none;z-index:9999;width:${el.offsetWidth}px;box-shadow:0 6px 24px rgba(0,0,0,0.5);border-radius:6px;`;
      ghost.style.left=startX-el.offsetWidth/2+'px'; ghost.style.top=startY-30+'px';
      document.body.appendChild(ghost); el.style.opacity='0.35';
    },180);
    e.stopPropagation();
  },{passive:true});
  handle.addEventListener('touchmove',e=>{
    if(!active||!ghost)return; e.preventDefault();
    const t=e.touches[0];
    ghost.style.left=t.clientX-parseInt(ghost.style.width)/2+'px';
    ghost.style.top=t.clientY-30+'px';
    ghost.style.display='none';
    handle._touchTarget=document.elementFromPoint(t.clientX,t.clientY);
    ghost.style.display='';
  },{passive:false});
  handle.addEventListener('touchend',e=>{
    clearTimeout(handle._touchTimer); active=false;
    if(ghost){ghost.remove();ghost=null;const el=getEl();if(el)el.style.opacity='';if(handle._touchTarget)onDrop(handle._touchTarget);handle._touchTarget=null;}
  },{passive:true});
  handle.addEventListener('touchcancel',()=>{
    clearTimeout(handle._touchTimer); active=false;
    if(ghost){ghost.remove();ghost=null;const el=getEl();if(el)el.style.opacity='';}
  },{passive:true});
}

/* ── Pinch-to-zoom sur la grille ── */
(function initPinchZoom(){
  const editor=document.getElementById('chart-editor');
  if(!editor)return;
  let scale=1,lastDist=null;
  editor.addEventListener('touchstart',e=>{if(e.touches.length===2)lastDist=null;},{passive:true});
  editor.addEventListener('touchmove',e=>{
    if(e.touches.length!==2)return; e.preventDefault();
    const dx=e.touches[0].clientX-e.touches[1].clientX;
    const dy=e.touches[0].clientY-e.touches[1].clientY;
    const dist=Math.sqrt(dx*dx+dy*dy);
    if(lastDist!==null){const delta=dist-lastDist;scale=Math.min(2,Math.max(0.5,scale+delta*0.003));editor.style.transform=`scale(${scale})`;editor.style.transformOrigin='top center';}
    lastDist=dist;
  },{passive:false});
  editor.addEventListener('touchend',e=>{if(e.touches.length<2)lastDist=null;},{passive:true});
})();

/* ── MutationObserver — patch tactile post-render ── */
(function patchTouchAfterRender(){
  const cont=document.getElementById('sections-container');
  if(!cont)return;
  const obs=new MutationObserver(()=>applyTouchPatches());
  obs.observe(cont,{childList:true,subtree:false});
  function applyTouchPatches(){
    // Sections
    cont.querySelectorAll('.section-drag-handle').forEach(handle=>{
      if(handle._touchPatched)return; handle._touchPatched=true;
      const section=handle.closest('.section');
      makeTouchDraggable(handle,()=>section,target=>{
        const destSection=target.closest('.section');
        if(!destSection||destSection===section)return;
        const srcIdx=parseInt(section.dataset.si);
        const dstIdx=parseInt(destSection.dataset.si);
        if(isNaN(srcIdx)||isNaN(dstIdx))return;
        snapshotUndo();
        const moved=chartData.sections.splice(srcIdx,1)[0];
        chartData.sections.splice(srcIdx<dstIdx?dstIdx-1:dstIdx,0,moved);
        render();
      });
    });
    // Mesures
    cont.querySelectorAll('.measure-drag-handle').forEach(handle=>{
      if(handle._touchPatched)return; handle._touchPatched=true;
      const measure=handle.closest('.measure');
      makeTouchDraggable(handle,()=>measure,target=>{
        const destMeasure=target.closest('.measure');
        if(!destMeasure||destMeasure===measure)return;
        const si=parseInt(measure.dataset.si), mi=parseInt(measure.dataset.mi);
        const dsi=parseInt(destMeasure.dataset.si), dmi=parseInt(destMeasure.dataset.mi);
        if(isNaN(si)||isNaN(mi)||isNaN(dsi)||isNaN(dmi))return;
        snapshotUndo();
        if(si===dsi){const ms=chartData.sections[si].measures;const moved=ms.splice(mi,1)[0];ms.splice(mi<dmi?dmi-1:dmi,0,moved);}
        else{const moved=chartData.sections[si].measures.splice(mi,1)[0];chartData.sections[dsi].measures.splice(dmi,0,moved);}
        render();
      });
    });
  }
})();


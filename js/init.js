/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   JS — INIT
   Initialisation : event listeners globaux, premier render
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

(function(){
  if(new URLSearchParams(location.search).get('mode')!=='view')return;
  document.addEventListener('DOMContentLoaded',()=>{
    document.body.classList.add('view-mode');
  });
  window.addEventListener('message',e=>{
    if(!e.data||e.data.type!=='loadChart')return;
    if(!e.data.chart)return;
    chartData=JSON.parse(JSON.stringify(e.data.chart));
    window.bassStrings=e.data.bassStrings||4;
    const ed=document.getElementById('chart-editor');
    if(ed)ed.style.display='block';
    if(typeof render==='function'){
      render();
      requestAnimationFrame(()=>{
        const h=document.documentElement.scrollHeight;
        (e.source||window.parent).postMessage({type:'contentHeight',height:h}, e.origin||window.location.origin);
      });
    }
  });
})();

document.getElementById('modal-overlay').addEventListener('click',e=>{if(e.target===document.getElementById('modal-overlay'))closeModal();});
document.getElementById('annot-overlay').addEventListener('click',e=>{if(e.target===document.getElementById('annot-overlay'))closeAnnotModal();});
document.getElementById('label-overlay').addEventListener('click',e=>{if(e.target===document.getElementById('label-overlay'))closeLabelModal();});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeModal();closeAnnotModal();closeLabelModal();closeActivePopup();}if((e.ctrlKey||e.metaKey)&&e.key==='z'&&!e.shiftKey){e.preventDefault();undo();}if((e.ctrlKey||e.metaKey)&&(e.key==='y'||(e.key==='z'&&e.shiftKey))){e.preventDefault();redo();}});
buildModal();
buildLabelModal();
buildTransposeKeySelect();
applyTranslations();
// Restaurer le choix 4/5 cordes
(function(){const saved=localStorage.getItem('bassStrings');window.bassStrings=saved?parseInt(saved):4;document.getElementById('btn-4str').classList.toggle('active',window.bassStrings===4);document.getElementById('btn-5str').classList.toggle('active',window.bassStrings===5);})();
function updateTimestamp(){const n=new Date();const pad=v=>String(v).padStart(2,'0');const ts=String(n.getFullYear()).slice(2)+pad(n.getMonth()+1)+pad(n.getDate())+pad(n.getHours())+pad(n.getMinutes())+pad(n.getSeconds());document.getElementById('toolbar-ts').textContent=ts;document.getElementById('print-ts').textContent=ts;}
updateTimestamp();
setInterval(updateTimestamp,1000);
updateUndoButtons();
window.addEventListener('beforeunload',e=>{if(_isDirty){e.preventDefault();e.returnValue='';}});
(function(){
  const metroOn  = localStorage.getItem('jgg_metro_on') === 'true';
  const metroVol = parseFloat(localStorage.getItem('jgg_metro_vol') || '0.35');
  METRO.volume = metroVol;
  const cbMetro = document.getElementById('cb-metro');
  if (cbMetro) cbMetro.checked = metroOn;
  const slider  = document.getElementById('metro-vol-slider');
  if (slider)   slider.value  = Math.round(metroVol * 100);
})();

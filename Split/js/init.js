/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   JS — INIT
   Initialisation : event listeners globaux, premier render
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */


document.getElementById('modal-overlay').addEventListener('click',e=>{if(e.target===document.getElementById('modal-overlay'))closeModal();});
document.getElementById('annot-overlay').addEventListener('click',e=>{if(e.target===document.getElementById('annot-overlay'))closeAnnotModal();});
document.getElementById('label-overlay').addEventListener('click',e=>{if(e.target===document.getElementById('label-overlay'))closeLabelModal();});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeModal();closeAnnotModal();closeLabelModal();closeActivePopup();}});
buildModal();
buildLabelModal();
buildTransposeKeySelect();
applyTranslations();
// Restaurer le choix 4/5 cordes
(function(){const saved=localStorage.getItem('bassStrings');window.bassStrings=saved?parseInt(saved):4;document.getElementById('btn-4str').classList.toggle('active',window.bassStrings===4);document.getElementById('btn-5str').classList.toggle('active',window.bassStrings===5);})();
function updateTimestamp(){const n=new Date();const pad=v=>String(v).padStart(2,'0');const ts=String(n.getFullYear()).slice(2)+pad(n.getMonth()+1)+pad(n.getDate())+pad(n.getHours())+pad(n.getMinutes())+pad(n.getSeconds());document.getElementById('toolbar-ts').textContent=ts;document.getElementById('print-ts').textContent=ts;}
updateTimestamp();
setInterval(updateTimestamp,1000);
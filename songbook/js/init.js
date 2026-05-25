(async function() {
  await dbOpen();

  const lastView = localStorage.getItem('sb_last_view') || 'library';
  if (lastView === 'library') renderLibrary();
  else if (lastView === 'setlists') renderSetlists();
  else renderLibrary();

  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      localStorage.setItem('sb_last_view', btn.dataset.view);
    });
  });

  _updateBleUI();
})();

/* ── Helpers ── */
function _uuid() {
  return (crypto.randomUUID ? crypto.randomUUID()
    : Date.now().toString(36) + Math.random().toString(36).slice(2));
}
function _esc(s) {
  return String(s)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function _fmt(s) { return s != null ? String(s) : ''; }

/* ── Routing ── */
const VIEWS = ['library','setlists','setlist-detail','song','song-edit','ble'];

function showView(name) {
  VIEWS.forEach(v => {
    const el = document.getElementById(`view-${v}`);
    if (el) el.classList.toggle('hidden', v !== name);
  });
  document.querySelectorAll('.nav-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.view === name);
  });
}

document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const v = btn.dataset.view;
    if (v === 'library') renderLibrary();
    else if (v === 'setlists') renderSetlists();
    else if (v === 'ble') showView('ble');
  });
});

/* ── Library ── */
async function renderLibrary() {
  showView('library');
  const songs = await dbGetAllSongs();
  const q = document.getElementById('library-search').value.trim().toLowerCase();
  const filtered = q
    ? songs.filter(s =>
        s.title.toLowerCase().includes(q) ||
        (s.key||'').toLowerCase().includes(q) ||
        (s.tags||[]).some(t => t.toLowerCase().includes(q)))
    : songs;

  filtered.sort((a,b) => a.title.localeCompare(b.title));

  const list = document.getElementById('song-list');
  if (!filtered.length) {
    list.innerHTML = '<p style="text-align:center;color:#888;padding:40px">Aucun morceau. Tapez + pour importer.</p>';
    return;
  }
  list.innerHTML = filtered.map(s => `
    <div class="song-card" data-id="${_esc(s.id)}">
      <div>
        <div class="song-card-title">${_esc(s.title)}</div>
        <div class="song-card-meta">${_esc(s.key||'—')} · ${s.tempo||'?'} BPM · ${_esc(s.style||'')}</div>
        ${(s.tags||[]).length ? `<div class="song-card-meta">${s.tags.map(_esc).join(', ')}</div>` : ''}
      </div>
      <div class="song-card-actions">
        <button class="btn-edit-song" data-id="${_esc(s.id)}">✎</button>
        <button class="btn-delete-song" data-id="${_esc(s.id)}">🗑</button>
      </div>
    </div>
  `).join('');

  list.querySelectorAll('.song-card').forEach(card => {
    card.addEventListener('click', e => {
      if (e.target.closest('.song-card-actions')) return;
      openSong(card.dataset.id, null);
    });
  });
  list.querySelectorAll('.btn-edit-song').forEach(btn =>
    btn.addEventListener('click', () => openSongEdit(btn.dataset.id)));
  list.querySelectorAll('.btn-delete-song').forEach(btn =>
    btn.addEventListener('click', async () => {
      if (!confirm('Supprimer ce morceau ?')) return;
      const s = await dbGetSong(btn.dataset.id);
      if (s && s.audioFileId) await dbDeleteAudio(s.audioFileId);
      await dbDeleteSong(btn.dataset.id);
      renderLibrary();
    }));
}

document.getElementById('library-search').addEventListener('input', () => renderLibrary());

/* ── Import modal ── */
let _pendingJson = null;

document.getElementById('btn-add-song').addEventListener('click', () => {
  _pendingJson = null;
  document.getElementById('import-json-file').value = '';
  document.getElementById('import-title').value = '';
  document.getElementById('import-key').value = '';
  document.getElementById('import-tempo').value = '';
  document.getElementById('import-tags').value = '';
  document.getElementById('modal-import').classList.remove('hidden');
});

document.getElementById('import-json-file').addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    try {
      _pendingJson = JSON.parse(ev.target.result);
      document.getElementById('import-title').value = _pendingJson.title || file.name.replace(/\.json$/i,'');
      document.getElementById('import-key').value = _pendingJson.key || '';
      document.getElementById('import-tempo').value = _pendingJson.tempo || 120;
    } catch {
      alert('Fichier JSON invalide.'); _pendingJson = null;
    }
  };
  reader.readAsText(file);
});

document.getElementById('btn-import-cancel').addEventListener('click', () =>
  document.getElementById('modal-import').classList.add('hidden'));

document.getElementById('btn-import-save').addEventListener('click', async () => {
  if (!_pendingJson) { alert('Sélectionner un fichier JSON JGG.'); return; }
  const song = {
    id: _uuid(),
    title: document.getElementById('import-title').value.trim() || 'Sans titre',
    key: document.getElementById('import-key').value.trim(),
    tempo: parseInt(document.getElementById('import-tempo').value) || 120,
    style: _pendingJson.style || '',
    jggJson: _pendingJson,
    audioFileId: null,
    scrollSpeed: 30,
    midiPreset: { channel: 1, programChange: null, cc: [] },
    tags: document.getElementById('import-tags').value.split(',').map(t=>t.trim()).filter(Boolean),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  await dbSaveSong(song);
  document.getElementById('modal-import').classList.add('hidden');
  renderLibrary();
});

/* ── Placeholders pour tâches suivantes ── */
function openSong(songId, setlistContext) { /* Task 5 */ }
function openSongEdit(songId) { /* Task 10 */ }
function renderSetlists() { showView('setlists'); /* Task 9 */ }

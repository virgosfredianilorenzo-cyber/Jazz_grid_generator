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
        <div class="song-card-meta">${_esc(s.key||'—')} · ${_esc(String(s.tempo||'?'))} BPM · ${_esc(s.style||'')}</div>
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
/* ── État navigation song ── */
let _songContext = null; // { songId, setlistId, songIds, index } | null

/* ── Listener hauteur iframe ── */
window.addEventListener('message', e => {
  if (!e.data || e.data.type !== 'contentHeight') return;
  const frame = document.getElementById('jgg-frame');
  frame.style.height = Math.max(200, e.data.height) + 'px';
});

async function openSong(songId, setlistContext) {
  const song = await dbGetSong(songId);
  if (!song) return;

  _songContext = setlistContext
    ? { songId, setlistId: setlistContext.setlistId, songIds: setlistContext.songIds, index: setlistContext.index }
    : null;

  document.getElementById('song-title').textContent = song.title;
  document.getElementById('song-meta').textContent =
    [song.key, song.tempo ? song.tempo + ' BPM' : '', song.style].filter(Boolean).join(' · ');

  const hasNav = !!_songContext;
  document.getElementById('setlist-nav').style.display = hasNav ? '' : 'none';

  const ss = song.scrollSpeed || 30;
  document.getElementById('scroll-speed-input').value = ss;
  document.getElementById('scroll-speed-value').textContent = ss;

  const frame = document.getElementById('jgg-frame');
  frame.style.height = '400px';
  document.getElementById('song-grid-container').scrollTop = 0;

  frame.onload = () => {
    frame.contentWindow.postMessage(
      { type: 'loadChart', chart: song.jggJson, bassStrings: 4 }, '*'
    );
  };
  frame.src = '../index.html?mode=view';

  scrollStop();
  document.getElementById('btn-scroll-toggle').classList.remove('active');
  document.getElementById('scroll-speed-panel').classList.remove('visible');

  playerLoad(song);

  const mp = song.midiPreset;
  if (mp && (mp.programChange !== null || (mp.cc && mp.cc.length > 0))) {
    midiSendPreset(mp);
  }

  showView('song');
}

/* ── Navigation setlist ── */
document.getElementById('btn-song-back').addEventListener('click', () => {
  scrollStop();
  playerStop();
  if (_songContext) renderSetlistDetail(_songContext.setlistId);
  else renderLibrary();
});

document.getElementById('btn-prev').addEventListener('click', async () => {
  if (!_songContext || _songContext.index <= 0) return;
  const newIdx = _songContext.index - 1;
  await openSong(_songContext.songIds[newIdx], {
    setlistId: _songContext.setlistId,
    songIds: _songContext.songIds,
    index: newIdx
  });
});

document.getElementById('btn-next').addEventListener('click', async () => {
  if (!_songContext || _songContext.index >= _songContext.songIds.length - 1) return;
  const newIdx = _songContext.index + 1;
  await openSong(_songContext.songIds[newIdx], {
    setlistId: _songContext.setlistId,
    songIds: _songContext.songIds,
    index: newIdx
  });
});

/* ── Auto-scroll controls ── */
document.getElementById('btn-scroll-toggle').addEventListener('click', async () => {
  const btn = document.getElementById('btn-scroll-toggle');
  const panel = document.getElementById('scroll-speed-panel');
  if (scrollIsRunning()) {
    scrollStop();
    btn.classList.remove('active');
    panel.classList.remove('visible');
  } else {
    const speed = _songContext
      ? ((await dbGetSong(_songContext.songId)) || {}).scrollSpeed || 30
      : 30;
    scrollStart(document.getElementById('song-grid-container'), speed);
    btn.classList.add('active');
  }
});

(function() {
  let _lpTimer;
  const btn = document.getElementById('btn-scroll-toggle');
  btn.addEventListener('touchstart', () => {
    _lpTimer = setTimeout(() => {
      document.getElementById('scroll-speed-panel').classList.toggle('visible');
    }, 600);
  }, { passive: true });
  btn.addEventListener('touchend', () => clearTimeout(_lpTimer), { passive: true });
  btn.addEventListener('touchmove', () => clearTimeout(_lpTimer), { passive: true });
})();

document.getElementById('scroll-speed-input').addEventListener('input', async e => {
  const speed = parseInt(e.target.value);
  document.getElementById('scroll-speed-value').textContent = speed;
  if (scrollIsRunning()) {
    scrollStop();
    scrollStart(document.getElementById('song-grid-container'), speed);
  }
  if (_songContext) {
    const song = await dbGetSong(_songContext.songId);
    if (song) { song.scrollSpeed = speed; await dbSaveSong(song); }
  }
});

function openSongEdit(songId) { /* Task 10 */ }
function renderSetlists() { showView('setlists'); /* Task 9 */ }

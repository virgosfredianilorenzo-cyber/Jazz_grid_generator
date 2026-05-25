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
      { type: 'loadChart', chart: song.jggJson, bassStrings: 4 }, window.location.origin
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
    const speed = parseInt(document.getElementById('scroll-speed-input').value) || 30;
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

let _editingSongId = null;

async function openSongEdit(songId) {
  _editingSongId = songId;
  const song = await dbGetSong(songId);
  if (!song) return;

  const form = document.getElementById('song-edit-form');
  const mp = song.midiPreset || { channel: 1, programChange: null, cc: [] };

  form.innerHTML = `
    <div class="form-group">
      <label for="edit-title">Titre</label>
      <input type="text" id="edit-title" value="${_esc(_fmt(song.title))}">
    </div>
    <div class="form-group">
      <label for="edit-key">Tonalité</label>
      <input type="text" id="edit-key" value="${_esc(_fmt(song.key))}">
    </div>
    <div class="form-group">
      <label for="edit-tempo">BPM</label>
      <input type="number" id="edit-tempo" value="${song.tempo||120}" min="20" max="300">
    </div>
    <div class="form-group">
      <label for="edit-tags">Tags (virgule)</label>
      <input type="text" id="edit-tags" value="${_esc((song.tags||[]).join(', '))}">
    </div>
    <hr style="border-color:#0f3460;margin:16px 0">
    <div style="font-weight:700;margin-bottom:12px">Preset MIDI (HX Stomp)</div>
    <div class="form-group">
      <label for="edit-midi-ch">Canal MIDI (1-16)</label>
      <input type="number" id="edit-midi-ch" value="${mp.channel||1}" min="1" max="16">
    </div>
    <div class="form-group">
      <label for="edit-midi-pc">Program Change (0-127, vide = aucun)</label>
      <input type="number" id="edit-midi-pc" value="${mp.programChange !== null && mp.programChange !== undefined ? mp.programChange : ''}" min="0" max="127" placeholder="Aucun">
    </div>
    <div id="cc-list">
      ${(mp.cc||[]).map((c,i) => `
        <div class="form-group" style="display:flex;gap:8px;align-items:flex-end">
          <div style="flex:1"><label>CC#</label><input type="number" class="cc-num" data-i="${i}" value="${c.number}" min="0" max="127"></div>
          <div style="flex:1"><label>Valeur</label><input type="number" class="cc-val" data-i="${i}" value="${c.value}" min="0" max="127"></div>
          <button class="btn-rm-cc" data-i="${i}" style="margin-bottom:1px;padding:8px">×</button>
        </div>
      `).join('')}
    </div>
    <button id="btn-add-cc" style="margin:8px 0;padding:8px 14px;background:#0f3460;border:none;color:#e0e0e0;border-radius:6px;cursor:pointer">+ Ajouter CC</button>
    <hr style="border-color:#0f3460;margin:16px 0">
    <div style="font-weight:700;margin-bottom:12px">Backing track</div>
    ${song.audioFileId
      ? `<p style="color:#4caf50;margin-bottom:8px">✓ Fichier audio chargé</p>
         <button id="btn-rm-audio" style="padding:8px 14px;background:#333;border:none;color:#e0e0e0;border-radius:6px;cursor:pointer;margin-bottom:8px">Supprimer l'audio</button><br>`
      : ''}
    <div class="form-group">
      <label for="edit-audio-file">Importer MP3/WAV</label>
      <input type="file" id="edit-audio-file" accept=".mp3,.wav,audio/mpeg,audio/wav">
    </div>
  `;

  document.getElementById('btn-add-cc').addEventListener('click', () => {
    const list = document.getElementById('cc-list');
    const i = list.children.length;
    const div = document.createElement('div');
    div.className = 'form-group';
    div.style.cssText = 'display:flex;gap:8px;align-items:flex-end';
    div.innerHTML = `
      <div style="flex:1"><label>CC#</label><input type="number" class="cc-num" data-i="${i}" value="64" min="0" max="127"></div>
      <div style="flex:1"><label>Valeur</label><input type="number" class="cc-val" data-i="${i}" value="127" min="0" max="127"></div>
      <button class="btn-rm-cc" data-i="${i}" style="margin-bottom:1px;padding:8px">×</button>`;
    list.appendChild(div);
    div.querySelector('.btn-rm-cc').addEventListener('click', () => div.remove());
  });

  form.querySelectorAll('.btn-rm-cc').forEach(btn =>
    btn.addEventListener('click', () => btn.closest('.form-group').remove()));

  if (song.audioFileId) {
    document.getElementById('btn-rm-audio').addEventListener('click', async () => {
      await dbDeleteAudio(song.audioFileId);
      song.audioFileId = null;
      await dbSaveSong(song);
      openSongEdit(songId);
    });
  }

  showView('song-edit');
}

document.getElementById('btn-song-edit-back').addEventListener('click', () => renderLibrary());

document.getElementById('btn-song-edit-save').addEventListener('click', async () => {
  if (!_editingSongId) return;
  const song = await dbGetSong(_editingSongId);
  if (!song) return;

  song.title = document.getElementById('edit-title').value.trim() || song.title;
  song.key = document.getElementById('edit-key').value.trim();
  song.tempo = parseInt(document.getElementById('edit-tempo').value) || song.tempo;
  song.tags = document.getElementById('edit-tags').value.split(',').map(t=>t.trim()).filter(Boolean);
  song.updatedAt = new Date().toISOString();

  const pcVal = document.getElementById('edit-midi-pc').value.trim();
  const ccNums = [...document.querySelectorAll('.cc-num')];
  const ccVals = [...document.querySelectorAll('.cc-val')];
  song.midiPreset = {
    channel: parseInt(document.getElementById('edit-midi-ch').value) || 1,
    programChange: pcVal !== '' ? parseInt(pcVal) : null,
    cc: ccNums.map((n, i) => ({
      number: parseInt(n.value) || 0,
      value: parseInt(ccVals[i].value) || 0
    }))
  };

  const audioFile = document.getElementById('edit-audio-file').files[0];
  if (audioFile) {
    const arrayBuffer = await audioFile.arrayBuffer();
    const audioId = _uuid();
    await dbSaveAudio({ id: audioId, songId: song.id, filename: audioFile.name,
      mimeType: audioFile.type, data: arrayBuffer });
    if (song.audioFileId) await dbDeleteAudio(song.audioFileId);
    song.audioFileId = audioId;
  }

  await dbSaveSong(song);
  renderLibrary();
});

let _currentSetlistId = null;

async function renderSetlists() {
  showView('setlists');
  const setlists = await dbGetAllSetlists();
  const list = document.getElementById('setlist-list');
  if (!setlists.length) {
    list.innerHTML = '<p style="text-align:center;color:#888;padding:40px">Aucune setlist.</p>';
    return;
  }
  list.innerHTML = setlists.map(sl => `
    <div class="setlist-card" data-id="${_esc(sl.id)}">
      <div>
        <div class="setlist-card-title">${_esc(sl.name)}</div>
        <div class="setlist-card-meta">${sl.songIds.length} morceau(x)${sl.date ? ' · ' + _esc(sl.date) : ''}</div>
      </div>
      <div class="song-card-actions">
        <button class="btn-delete-setlist" data-id="${_esc(sl.id)}">🗑</button>
      </div>
    </div>
  `).join('');

  list.querySelectorAll('.setlist-card').forEach(card => {
    card.addEventListener('click', e => {
      if (e.target.closest('.song-card-actions')) return;
      renderSetlistDetail(card.dataset.id);
    });
  });
  list.querySelectorAll('.btn-delete-setlist').forEach(btn =>
    btn.addEventListener('click', async () => {
      if (!confirm('Supprimer cette setlist ?')) return;
      await dbDeleteSetlist(btn.dataset.id);
      renderSetlists();
    }));
}

document.getElementById('btn-new-setlist').addEventListener('click', async () => {
  const name = prompt('Nom de la setlist :');
  if (!name || !name.trim()) return;
  const sl = { id: _uuid(), name: name.trim(), date: null, songIds: [] };
  await dbSaveSetlist(sl);
  renderSetlists();
});

async function renderSetlistDetail(setlistId) {
  const sl = await dbGetSetlist(setlistId);
  if (!sl) return;
  _currentSetlistId = setlistId;
  showView('setlist-detail');
  document.getElementById('setlist-detail-title').textContent = sl.name;

  const container = document.getElementById('setlist-detail-songs');
  const songs = await Promise.all(sl.songIds.map(id => dbGetSong(id)));

  if (!songs.length) {
    container.innerHTML = '<p style="text-align:center;color:#888;padding:24px">Aucun morceau.</p>';
  } else {
    container.innerHTML = songs.map((s, i) => s ? `
      <div class="setlist-song-row" data-idx="${i}">
        <span class="ss-num">${i + 1}.</span>
        <span class="ss-title">${_esc(s.title)}</span>
        <span class="ss-meta">${_esc(s.key||'')} · ${_esc(String(s.tempo||'?'))} BPM</span>
        <button class="btn-ss-up" data-idx="${i}" ${i===0?'disabled':''}>▲</button>
        <button class="btn-ss-dn" data-idx="${i}" ${i===songs.length-1?'disabled':''}>▼</button>
        <button class="btn-ss-rm" data-idx="${i}">×</button>
      </div>
    ` : '').join('');

    container.querySelectorAll('.btn-ss-up').forEach(btn =>
      btn.addEventListener('click', async () => {
        const i = parseInt(btn.dataset.idx);
        if (i <= 0) return;
        [sl.songIds[i-1], sl.songIds[i]] = [sl.songIds[i], sl.songIds[i-1]];
        await dbSaveSetlist(sl); renderSetlistDetail(setlistId);
      }));
    container.querySelectorAll('.btn-ss-dn').forEach(btn =>
      btn.addEventListener('click', async () => {
        const i = parseInt(btn.dataset.idx);
        if (i >= sl.songIds.length - 1) return;
        [sl.songIds[i], sl.songIds[i+1]] = [sl.songIds[i+1], sl.songIds[i]];
        await dbSaveSetlist(sl); renderSetlistDetail(setlistId);
      }));
    container.querySelectorAll('.btn-ss-rm').forEach(btn =>
      btn.addEventListener('click', async () => {
        const i = parseInt(btn.dataset.idx);
        sl.songIds.splice(i, 1);
        await dbSaveSetlist(sl); renderSetlistDetail(setlistId);
      }));
  }

  const allSongs = await dbGetAllSongs();
  const picker = document.getElementById('setlist-song-picker');
  picker.innerHTML = '<option value="">-- Ajouter --</option>' +
    allSongs.map(s => `<option value="${_esc(s.id)}">${_esc(s.title)}</option>`).join('');

  document.getElementById('btn-setlist-play').onclick = async () => {
    if (!sl.songIds.length) return;
    await openSong(sl.songIds[0], { setlistId, songIds: sl.songIds, index: 0 });
  };

  document.getElementById('btn-setlist-back').onclick = () => renderSetlists();
}

document.getElementById('btn-setlist-add-song').addEventListener('click', async () => {
  const picker = document.getElementById('setlist-song-picker');
  const songId = picker.value;
  if (!songId || !_currentSetlistId) return;
  const sl = await dbGetSetlist(_currentSetlistId);
  if (!sl || sl.songIds.includes(songId)) return;
  sl.songIds.push(songId);
  await dbSaveSetlist(sl);
  renderSetlistDetail(sl.id);
});

let _audio = null;
let _blobUrl = null;

function _fmtTime(s) {
  if (!isFinite(s)) return '0:00';
  const m = Math.floor(s / 60);
  return m + ':' + String(Math.floor(s % 60)).padStart(2, '0');
}

function _freeBlobUrl() {
  if (_blobUrl) { URL.revokeObjectURL(_blobUrl); _blobUrl = null; }
}

function playerStop() {
  if (_audio) { _audio.pause(); _audio.currentTime = 0; }
  document.getElementById('btn-play').textContent = '▶';
}

async function playerLoad(song) {
  playerStop();
  _freeBlobUrl();

  if (_audio) { _audio.src = ''; _audio = null; }

  document.getElementById('player-seek').value = 0;
  document.getElementById('player-time').textContent = '0:00';
  document.getElementById('player-duration').textContent = '0:00';

  if (!song.audioFileId) return;

  const blob = await dbGetAudio(song.audioFileId);
  if (!blob) return;

  _blobUrl = URL.createObjectURL(new Blob([blob.data], { type: blob.mimeType }));
  _audio = new Audio(_blobUrl);
  _audio.volume = parseFloat(document.getElementById('player-volume').value);

  _audio.addEventListener('loadedmetadata', () => {
    document.getElementById('player-duration').textContent = _fmtTime(_audio.duration);
    document.getElementById('player-seek').max = _audio.duration;
  });
  _audio.addEventListener('timeupdate', () => {
    document.getElementById('player-time').textContent = _fmtTime(_audio.currentTime);
    document.getElementById('player-seek').value = _audio.currentTime;
  });
  _audio.addEventListener('ended', () => {
    document.getElementById('btn-play').textContent = '▶';
  });
}

document.getElementById('btn-play').addEventListener('click', () => {
  if (!_audio) return;
  if (_audio.paused) {
    _audio.play();
    document.getElementById('btn-play').textContent = '⏸';
  } else {
    _audio.pause();
    document.getElementById('btn-play').textContent = '▶';
  }
});

document.getElementById('player-seek').addEventListener('input', e => {
  if (_audio) _audio.currentTime = parseFloat(e.target.value);
});

document.getElementById('player-volume').addEventListener('input', e => {
  if (_audio) _audio.volume = parseFloat(e.target.value);
});

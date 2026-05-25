const DB_NAME = 'jazz-songbook';
const DB_VERSION = 1;
let _db = null;

function dbOpen() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = e => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('songs'))
        db.createObjectStore('songs', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('setlists'))
        db.createObjectStore('setlists', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('audioblobs'))
        db.createObjectStore('audioblobs', { keyPath: 'id' });
    };
    req.onsuccess = e => { _db = e.target.result; resolve(_db); };
    req.onerror = e => reject(e.target.error);
  });
}

function _txGet(store, id) {
  if (!_db) return Promise.reject(new Error('DB not open'));
  return new Promise((resolve, reject) => {
    const req = _db.transaction(store, 'readonly').objectStore(store).get(id);
    req.onsuccess = e => resolve(e.target.result);
    req.onerror = e => reject(e.target.error);
  });
}
function _txPut(store, obj) {
  if (!_db) return Promise.reject(new Error('DB not open'));
  return new Promise((resolve, reject) => {
    const req = _db.transaction(store, 'readwrite').objectStore(store).put(obj);
    req.onsuccess = e => resolve(e.target.result);
    req.onerror = e => reject(e.target.error);
  });
}
function _txDelete(store, id) {
  if (!_db) return Promise.reject(new Error('DB not open'));
  return new Promise((resolve, reject) => {
    const req = _db.transaction(store, 'readwrite').objectStore(store).delete(id);
    req.onsuccess = () => resolve();
    req.onerror = e => reject(e.target.error);
  });
}
function _txGetAll(store) {
  if (!_db) return Promise.reject(new Error('DB not open'));
  return new Promise((resolve, reject) => {
    const req = _db.transaction(store, 'readonly').objectStore(store).getAll();
    req.onsuccess = e => resolve(e.target.result);
    req.onerror = e => reject(e.target.error);
  });
}

// Songs
function dbSaveSong(song) { return _txPut('songs', song); }
function dbGetSong(id) { return _txGet('songs', id); }
function dbDeleteSong(id) { return _txDelete('songs', id); }
function dbGetAllSongs() { return _txGetAll('songs'); }

// Setlists
function dbSaveSetlist(sl) { return _txPut('setlists', sl); }
function dbGetSetlist(id) { return _txGet('setlists', id); }
function dbDeleteSetlist(id) { return _txDelete('setlists', id); }
function dbGetAllSetlists() { return _txGetAll('setlists'); }

// Audio blobs
function dbSaveAudio(blob) { return _txPut('audioblobs', blob); }
function dbGetAudio(id) { return _txGet('audioblobs', id); }
function dbDeleteAudio(id) { return _txDelete('audioblobs', id); }

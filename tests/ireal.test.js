const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { irealUnscramble, splitSongs } = require('../js/ireal.js');
const { encodeLink } = require('./helpers/ireal-encode.js');
const SONGS = require('./helpers/ireal-songs.js');
const fx = f => fs.readFileSync(path.join(__dirname, 'fixtures', f), 'utf8').trim();

test('irealUnscramble laisse intactes les chaînes courtes', () => {
  assert.equal(irealUnscramble('C^7 D-7'), 'C^7 D-7');
});
test('irealUnscramble applique les substitutions', () => {
  assert.equal(irealUnscramble('C^7LZD-7Kcl'), 'C^7 |D-7| x');
});
test('irealUnscramble remet en ordre un bloc de 50', () => {
  const s = '0123456789'.repeat(6);
  const r = irealUnscramble(s);
  assert.equal(r.slice(50), s.slice(50));
  assert.equal(r[0], s[49]);
});
test('splitSongs lit un morceau irealbook', () => {
  const l = 'irealbook://Blue%20Bossa=Dorham%20Kenny=Bossa%20Nova=C-==' + encodeURIComponent('*A{T44C-7 |F-7 |Dh7 |G7b9 }');
  const r = splitSongs(l);
  assert.equal(r.length, 1);
  assert.equal(r[0].title, 'Blue Bossa');
  assert.equal(r[0].composer, 'Dorham Kenny');
  assert.equal(r[0].style, 'Bossa Nova');
  assert.equal(r[0].key, 'C-');
  assert.ok(r[0].music.startsWith('*A{T44C-7'));
});
test('les fixtures irealb correspondent à l\'encodeur de test (données lisibles)', () => {
  assert.equal(fx('ireal-one.txt'), encodeLink(SONGS.one));
  assert.equal(fx('ireal-playlist.txt'), encodeLink(SONGS.playlist, SONGS.playlistName));
});
test('splitSongs lit un morceau irealb', () => {
  const r = splitSongs(fx('ireal-one.txt'));
  assert.deepEqual(r, [{title:'Autumn Leaves', composer:'Kosma Joseph', style:'Medium Swing', key:'G', tempo:120, music:SONGS.one[0].music}]);
  assert.ok(r[0].music.includes('T44'));
});
test('splitSongs ignore le nom de playlist', () => {
  const r = splitSongs(fx('ireal-playlist.txt'));
  assert.deepEqual(r.map(s => s.title), ['Song One', 'Song Two', 'Song Three']);
  assert.deepEqual(r.map(s => s.tempo), [100, 60, null]);
  assert.equal(r[1].music, SONGS.playlist[1].music);
});
test('splitSongs tolère les retours à la ligne et espaces dans le lien', () => {
  const l = fx('ireal-playlist.txt');
  const broken = l.slice(0, 20) + '\n' + l.slice(20, 90) + ' \r\n  ' + l.slice(90);
  assert.deepEqual(splitSongs(broken), splitSongs(l));
});
test('splitSongs rejette un lien invalide', () => {
  assert.throws(() => splitSongs('https://example.com'), /IREAL_INVALID/);
});

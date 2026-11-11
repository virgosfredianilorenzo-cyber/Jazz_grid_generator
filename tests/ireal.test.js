const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { irealUnscramble, splitSongs } = require('../js/ireal.js');
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
test('splitSongs lit un morceau irealb', () => {
  const r = splitSongs(fx('ireal-one.txt'));
  assert.equal(r.length, 1);
  assert.equal(r[0].title, 'Autumn Leaves');
  assert.equal(r[0].key, 'G');
  assert.equal(r[0].tempo, 120);
  assert.ok(r[0].music.includes('T44'));
});
test('splitSongs ignore le nom de playlist', () => {
  const r = splitSongs(fx('ireal-playlist.txt'));
  assert.equal(r.length, 3);
  assert.ok(r.every(s => s.title !== 'My Playlist'));
  assert.equal(r[2].tempo, null);
});
test('splitSongs rejette un lien invalide', () => {
  assert.throws(() => splitSongs('https://example.com'), /IREAL_INVALID/);
});

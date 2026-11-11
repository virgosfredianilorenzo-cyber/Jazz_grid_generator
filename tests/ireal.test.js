const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { irealUnscramble, splitSongs, irealQualityToJgg, irealToChart, decodeIRealLink } = require('../js/ireal.js');
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

test('splitSongs saute un morceau malformé au milieu d\'une playlist', () => {
  const good = n => encodeURIComponent(`Song ${n}=Comp=Swing=C==*A{T44C7 |F7 }`);
  const l = 'irealbook://' + [good(1), encodeURIComponent('Cassé=x'), good(2), encodeURIComponent('Ma Playlist')].join('===');
  assert.deepEqual(splitSongs(l).map(s => s.title), ['Song 1', 'Song 2']);
});
test('splitSongs rejette un lien dont aucun morceau n\'est exploitable', () => {
  assert.throws(() => splitSongs('irealbook://' + encodeURIComponent('Cassé=x')), /IREAL_INVALID/);
});

// ── Task 2 : conversion en chartData ──
const book = (music, key = 'C') => 'irealbook://T=C=Swing=' + key + '==' + encodeURIComponent(music);
const conv = (music, key) => decodeIRealLink(book(music, key))[0];
const syms = m => m.chords.map(c => c.symbol);

test('irealQualityToJgg', () => {
  const cases = {'^7':'maj7','-7':'m7','h7':'m7b5','h':'m7b5','o7':'dim7','o':'dim','-':'m','+':'aug','7sus':'7sus4','sus':'sus4','-^7':'mM7','6':'6','-6':'m6','69':'6/9','^9':'maj9','-9':'m9','-11':'m11','13':'13','':'','7#9b13':''};
  for (const [q, e] of Object.entries(cases)) assert.equal(irealQualityToJgg(q), e, q);
});
test('convertit Blue Bossa', () => {
  const {chart} = conv('*A{T44C-7 |F-7 |Dh7 |G7b9 }', 'C-');
  assert.equal(chart.title, 'T');
  assert.equal(chart.key, 'Cm');
  assert.equal(chart.timeSig, '4/4');
  assert.equal(chart.sections.length, 1);
  const s = chart.sections[0];
  assert.equal(s.label, 'A');
  assert.ok(s.id);
  assert.deepEqual(s.measures.map(m => m.chords[0].symbol), ['Cm7','Fm7','Dm7b5','G7b9']);
  assert.equal(s.measures[0].barlineLeft, 'repeat-start');
  assert.equal(s.measures[0].repeatStart, true);
  assert.equal(s.measures[3].barlineRight, 'repeat-end');
  assert.equal(s.measures[3].repeatEnd, true);
  assert.equal(chart.style, 'Swing');
  assert.equal(chart.composer, 'C');
});
test('convertit les voltas et la coda', () => {
  const {chart} = conv('*A{T44C^7 Q|A-7 S|N1D-7 |G7 }|N2D-7 G7 |C^7 Z');
  const ms = chart.sections[0].measures;
  assert.equal(ms.length, 6);
  assert.equal(ms[0].navSymbol, 'coda');
  assert.equal(ms[1].navSymbol, 'segno');
  assert.equal(ms[2].volta, '1');
  assert.equal(ms[4].volta, '2');
  assert.deepEqual(ms[4].chords.map(c => c.beats), [2, 2]);
  assert.equal(ms[5].barlineRight, 'final');
  assert.equal(ms[3].barlineRight, 'repeat-end');
});
test('convertit N.C., % et slash', () => {
  const {chart} = conv('T44n |x |C^7/E |C7(Db7) |');
  const ms = chart.sections[0].measures;
  assert.equal(ms[0].chords[0].symbol, 'N.C.');
  assert.equal(ms[1].chords[0].symbol, '%');
  assert.equal(ms[2].chords[0].symbol, 'Cmaj7/E');
  assert.equal(ms[3].chords[0].symbol, 'C7');
  assert.equal(ms[3].chords[0].altChord, 'Db7');
  assert.equal(ms[0].chords[0].altChord, null);
});
test('convertit les qualités inconnues en symbole libre', () => {
  const {chart} = conv('T44C7#9b13 |C7alt |C^7#11 |');
  assert.deepEqual(chart.sections[0].measures.map(m => m.chords[0].symbol), ['C7#9b13','C7alt','C^7#11']);
});
test('répartit les temps en 3/4 et 5/4', () => {
  const beats = (m, i = 0) => conv(m).chart.sections[0].measures[i].chords.map(c => c.beats);
  assert.deepEqual(beats('T34C^7 D-7 |'), [2, 1]);
  assert.deepEqual(beats('T54C^7 D-7 |'), [3, 2]);
  assert.deepEqual(beats('T44C D E |'), [2, 1, 1]);
  assert.deepEqual(beats('T44C |'), [4]);
});
test('annote les indications sans équivalent', () => {
  const {chart, warnings} = conv('*AT44C |<D.S. al Fine>D7 |G7 |');
  const ms = chart.sections[0].measures;
  assert.ok(ms.every(m => m.navSymbol === null));
  assert.ok(warnings.length > 0);
  assert.ok(chart.sections[0].annotation.includes('D.S. al Fine'));
});
test('convertit les indications de navigation reconnues', () => {
  const {chart, warnings} = conv('T44C |<D.C. al Coda>D7 |<Fine>G7 |');
  const ms = chart.sections[0].measures;
  assert.equal(ms[1].navSymbol, 'dc-coda');
  assert.equal(ms[2].navSymbol, 'fine');
  assert.equal(warnings.length, 0);
});
test('plusieurs sections, mesures numérotées par section, section vide ignorée', () => {
  const {chart} = conv('*AT44C |D |*B*iE |F |G |');
  assert.deepEqual(chart.sections.map(s => s.label), ['A', 'Intro']);
  assert.deepEqual(chart.sections[1].measures.map(m => m.number), [1, 2, 3]);
  assert.notEqual(chart.sections[0].id, chart.sections[1].id);
});
test('r, p, l, s, W, Y sont gérés', () => {
  const {chart, warnings} = conv('T44C7 |r|lG7 p |W Y|');
  const ms = chart.sections[0].measures;
  assert.deepEqual(ms.map(syms), [['C7'], ['%'], ['%'], ['G7','G7']]);
  assert.ok(warnings.length >= 1);
});
test('decodeIRealLink rejette un lien tronqué', () => {
  assert.throws(() => decodeIRealLink('irealb://%E0%A4%A'), /IREAL_INVALID/);
});
test('importe le tempo quand il existe', () => {
  const r = decodeIRealLink(fx('ireal-one.txt'));
  assert.equal(r[0].chart.tempo, 120);
  const r2 = decodeIRealLink(fx('ireal-playlist.txt'));
  assert.deepEqual(r2.map(x => x.chart.tempo), [100, 60, 120]);
  assert.equal(r2[2].chart.key, 'Cm');
});
test('decodeIRealLink convertit chaque morceau d\'une playlist', () => {
  const r = decodeIRealLink(fx('ireal-playlist.txt'));
  assert.deepEqual(r.map(x => x.chart.title), ['Song One', 'Song Two', 'Song Three']);
  assert.equal(r[1].chart.timeSig, '3/4');
});

// ── Revue finale ──
test('une lettre de contrôle collée à l\'accord n\'est pas avalée (Z, Q)', () => {
  const a = conv('T44D-7 G7Z').chart.sections[0].measures;
  const last = a[a.length - 1];
  assert.equal(last.chords[last.chords.length - 1].symbol, 'G7');
  assert.equal(last.barlineRight, 'final');
  const b = conv('T44C^7Q|').chart.sections[0].measures;
  assert.equal(b[0].chords[0].symbol, 'Cmaj7');
  assert.equal(b[0].navSymbol, 'coda');
});
test('les qualités iReal usuelles restent lues en entier', () => {
  const qs = ['7sus', '7alt', '7#9#5', '-^7', '^7#11', 'h7', '7b9b13', '13sus', '7susadd3'];
  const {chart} = conv('T44' + qs.map(q => 'C' + q).join(' |') + ' |');
  assert.deepEqual(chart.sections[0].measures.map(m => m.chords[0].symbol),
    ['C7sus4', 'C7alt', 'C7#9#5', 'CmM7', 'C^7#11', 'Cm7b5', 'C7b9b13', 'C13sus', 'C7susadd3']);
});
test('le préfixe de position *NN des commentaires est retiré', () => {
  const {chart, warnings} = conv('T44C |<*72D.C. al Coda>D7 |');
  const ms = chart.sections[0].measures;
  assert.equal(ms[1].navSymbol, 'dc-coda');
  assert.equal(chart.sections[0].annotation, '');
  assert.equal(warnings.length, 0);
});
test('navigation et notes en fin de morceau ne sont pas perdues', () => {
  const {chart} = conv('T44C^7 |Z<D.C. al Fine>');
  const ms = chart.sections[0].measures;
  assert.equal(ms[ms.length - 1].navSymbol, 'dc-fine');
  const r = conv('T44C^7 |Z<Repeat 3 times>');
  assert.ok(r.chart.sections[0].annotation.includes('Repeat 3 times'));
  assert.ok(r.warnings.includes('Repeat 3 times'));
});

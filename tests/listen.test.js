const test = require('node:test');
const assert = require('node:assert/strict');
const dsp = require('../js/listen-dsp.js');
const synth = require('./helpers/synth.js');
const L = require('../js/listen.js');

const track = (kind, readyState = 'live') => ({ kind, readyState });

test('listenStreamHasAudio : au moins une piste audio vivante', () => {
  assert.equal(L.listenStreamHasAudio(null), false);
  assert.equal(L.listenStreamHasAudio({ getAudioTracks: () => [] }), false);
  assert.equal(L.listenStreamHasAudio({ getAudioTracks: () => [track('audio', 'ended')] }), false);
  assert.equal(L.listenStreamHasAudio({ getAudioTracks: () => [track('audio', 'ended'), track('audio')] }), true);
  assert.equal(L.listenStreamHasAudio({ getAudioTracks: () => [track('audio')] }), true);
});

test('listenTitleFromFile : nom sans extension', () => {
  assert.equal(L.listenTitleFromFile('Knucklehead.mp3'), 'Knucklehead');
  assert.equal(L.listenTitleFromFile('01 - So What.final.m4a'), '01 - So What.final');
  assert.equal(L.listenTitleFromFile('sans-extension'), 'sans-extension');
  assert.equal(L.listenTitleFromFile('.cache'), '.cache');
  assert.equal(L.listenTitleFromFile(''), '');
});

test('listenTitleFromTrackLabel : libellé technique → titre par défaut', () => {
  assert.equal(L.listenTitleFromTrackLabel('Knucklehead - YouTube', 'Défaut'), 'Knucklehead - YouTube');
  assert.equal(L.listenTitleFromTrackLabel('web-contents-media-stream://1234:5', 'Défaut'), 'Défaut');
  assert.equal(L.listenTitleFromTrackLabel('screen:0:0', 'Défaut'), 'Défaut');
  assert.equal(L.listenTitleFromTrackLabel('window:123:0', 'Défaut'), 'Défaut');
  assert.equal(L.listenTitleFromTrackLabel('  ', 'Défaut'), 'Défaut');
  assert.equal(L.listenTitleFromTrackLabel(undefined, 'Défaut'), 'Défaut');
});

test('nextSectionLabel : A, B, C… puis A2', () => {
  assert.equal(L.nextSectionLabel([]), 'A');
  assert.equal(L.nextSectionLabel(['A']), 'B');
  assert.equal(L.nextSectionLabel(['A', 'B']), 'C');
  const az = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i));
  assert.equal(L.nextSectionLabel(az), 'A2');
  assert.equal(L.nextSectionLabel(az.concat(['A2'])), 'B2');
});

test('listenNewChart : une section A vide, annotation fournie', () => {
  const c = L.listenNewChart({ title: 'Knucklehead', bpm: 104, timeSig: '3/4', annotation: 'à vérifier' });
  assert.equal(c.title, 'Knucklehead');
  assert.equal(c.key, 'C');
  assert.equal(c.tempo, 104);
  assert.equal(c.timeSig, '3/4');
  assert.equal(c.style, '');
  assert.equal(c.sections.length, 1);
  assert.equal(c.sections[0].label, 'A');
  assert.equal(c.sections[0].annotation, 'à vérifier');
  assert.deepEqual(c.sections[0].measures, []);
  assert.ok(c.sections[0].id);
  const auto = L.listenNewChart({ title: 'X', bpm: null, timeSig: '4/4', annotation: '' });
  assert.equal(auto.tempo, 120); // provisoire, remplacé par le tempo détecté
});

test('listenMeasureFromBar : _uncertain seulement sur les tétrades incertaines', () => {
  const m = L.listenMeasureFromBar({ type: 'bar', chords: [
    { symbol: 'Fm7', beats: 2, uncertain: true }, { symbol: 'Bb7', beats: 2, uncertain: false }] });
  assert.deepEqual(m.chords, [
    { symbol: 'Fm7', beats: 2, annot: null, _uncertain: true }, { symbol: 'Bb7', beats: 2, annot: null }]);
  assert.equal(m.barlineLeft, 'normal');
  assert.equal(m.barlineRight, 'normal');
  assert.equal(m.volta, null);
  const nc = L.listenMeasureFromBar({ chords: [{ symbol: 'N.C.', beats: 4, uncertain: true }] });
  assert.deepEqual(nc.chords, [{ symbol: 'N.C.', beats: 4, annot: null }]);
});

test('listenBeatsPerBar', () => {
  assert.equal(L.listenBeatsPerBar('4/4'), 4);
  assert.equal(L.listenBeatsPerBar('3/4'), 3);
  assert.equal(L.listenBeatsPerBar('12/8'), 12);
  assert.equal(L.listenBeatsPerBar('n/a'), 4);
});

test('listenTapBpm : moyenne des 4 derniers intervalles', () => {
  assert.equal(L.listenTapBpm([]), null);
  assert.equal(L.listenTapBpm([1000]), null);
  assert.equal(L.listenTapBpm([0, 500]), 120);
  // 6 frappes : seuls les 4 derniers intervalles (500 ms) comptent.
  assert.equal(L.listenTapBpm([0, 2000, 2500, 3000, 3500, 4000]), 120);
  assert.equal(L.listenTapBpm([0, 600, 1200, 1800, 2400]), 100);
});

test('listenDistributeBars : garde les sections, la dernière prend le reste', () => {
  const secs = [
    { id: 'a', label: 'A', annotation: 'x', measures: [{}, {}] },
    { id: 'b', label: 'B', annotation: '', measures: [{}, {}, {}] }];
  const bars = ['C', 'D', 'E', 'F', 'G', 'A'].map(s => ({ chords: [{ symbol: s, beats: 4, uncertain: false }] }));
  const out = L.listenDistributeBars(secs, bars);
  assert.deepEqual(out.map(s => [s.id, s.label, s.annotation, s.measures.map(m => m.chords[0].symbol)]), [
    ['a', 'A', 'x', ['C', 'D']], ['b', 'B', '', ['E', 'F', 'G', 'A']]]);
  const fewer = L.listenDistributeBars(secs, bars.slice(0, 3));
  assert.deepEqual(fewer.map(s => s.measures.length), [2, 1]);
});

test('listenSplitSections : sections proposées, annotation gardée sur la première', () => {
  const sec = { id: 'a', label: 'A', annotation: 'à vérifier', measures: 'abcdefghij'.split('').map(x => ({ chords: [{ symbol: x }] })) };
  const out = L.listenSplitSections(sec, [{ start: 0, length: 4, label: 'A' }, { start: 4, length: 4, label: 'A' }, { start: 8, length: 2, label: 'B' }]);
  assert.deepEqual(out.map(s => [s.label, s.measures.map(m => m.chords[0].symbol).join('')]), [['A', 'abcd'], ['A', 'efgh'], ['B', 'ij']]);
  assert.equal(out[0].annotation, 'à vérifier');
  assert.equal(out[1].annotation, '');
  assert.equal(new Set(out.map(s => s.id)).size, 3);
  assert.equal(out[0].id, 'a');
});

test('listenFeedSamples : même découpage que la boucle trame par trame', () => {
  const SR = 44100;
  const s = synth.progression(['Fm7', 'Bb7'], 120);
  // Référence : fenêtres FRAME_SIZE avancées de HOP_SIZE, comme le test du moteur.
  const ref = dsp.createBarAssembler({ beatsPerBar: 4, chordsPerBar: 1, bpm: 120, hopSec: dsp.HOP_SIZE / SR });
  let prev = null, refFrames = 0;
  const refEv = [];
  for (let p = 0; p + dsp.FRAME_SIZE <= s.length; p += dsp.HOP_SIZE) {
    const r = dsp.chromaFromFrame(s.subarray(p, p + dsp.FRAME_SIZE), SR);
    refEv.push(...ref.pushFrame({ chroma: r.chroma, bass: r.bass, rms: r.rms, onset: dsp.onsetStrength(prev, r.mags) }));
    prev = r.mags; refFrames++;
  }
  refEv.push(...ref.flush());
  // Colle : blocs de 2048 (ScriptProcessorNode) puis un bloc irrégulier.
  const st = L.listenCreateProcessor({ beatsPerBar: 4, chordsPerBar: 1, bpm: 120, sampleRate: SR });
  const ev = [];
  let p = 0;
  for (const size of [1000, 2048, 5000]) { ev.push(...L.listenFeedSamples(st, s.subarray(p, p + size), SR)); p += size; }
  for (; p < s.length; p += 2048) ev.push(...L.listenFeedSamples(st, s.subarray(p, Math.min(s.length, p + 2048)), SR));
  ev.push(...st.assembler.flush());
  assert.equal(st.frames, refFrames);
  assert.deepEqual(ev, refEv);
});

test('bout en bout : WAV de synthèse Fm7×8 Bbm7×8 à 120 BPM, tempo auto', () => {
  const SR = 44100;
  const bars = Array(8).fill('Fm7').concat(Array(8).fill('Bbm7'));
  const s = synth.concat(synth.silence(1, SR), synth.progression(bars, 120, 4, SR), synth.silence(2, SR));
  // Passage par l'encodage WAV 16 bits (le fichier joué dans le navigateur).
  const samples = synth.wavDecode(synth.wav(s, SR)).samples;
  const st = L.listenCreateProcessor({ beatsPerBar: 4, chordsPerBar: 1, bpm: null, sampleRate: SR });
  const ev = [];
  for (let p = 0; p < samples.length; p += 2048) ev.push(...L.listenFeedSamples(st, samples.subarray(p, p + 2048), SR));
  ev.push(...st.assembler.flush());
  const symbols = ev.filter(e => e.type === 'bar').map(e => e.chords.map(c => c.symbol).join(' '));
  assert.deepEqual(symbols, bars);
  const tempo = ev.filter(e => e.type === 'tempo');
  assert.equal(tempo.length, 1);
  assert.ok(tempo[0].bpm >= 118 && tempo[0].bpm <= 122, 'tempo ' + tempo[0].bpm);
  assert.equal(dsp.estimateKey(st.assembler.data().beatChroma), 'Fm');
});

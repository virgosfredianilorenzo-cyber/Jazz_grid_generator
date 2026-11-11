// Suivi de temps sur des enregistrements de synthèse sans métronome fixe : dérive, marche aléatoire,
// tempo saisi un peu faux, trou de mise en mémoire tampon, introduction rubato.
// Échantillons envoyés par blocs de 8192 comme la colle (ScriptProcessorNode).
const test = require('node:test');
const assert = require('node:assert/strict');
const synth = require('./helpers/synth.js');
const L = require('../js/listen.js');
const dsp = require('../js/listen-dsp.js');

const SR = synth.SR;
const PROG = ['Dm7', 'G7', 'Cmaj7', 'A7', 'Dm7', 'G7', 'Em7b5', 'A7'];
const BARS = Array.from({ length: 96 }, (_, i) => PROG[i % 8]);
// Changements au milieu de la mesure (mode 2 accords) : un décalage de phase les rend faux.
const PROG2 = [['Dm7', 'G7'], 'Cmaj7', ['Em7b5', 'A7'], 'Dm7', ['Dm7', 'G7'], 'Cmaj7', ['Fm7', 'Bb7'], 'Ebmaj7'];
const BARS2 = Array.from({ length: 96 }, (_, i) => PROG2[i % 8]);
const text = b => Array.isArray(b) ? b.join(' ') : b;

function listen(samples, opts = {}) {
  const st = L.listenCreateProcessor(Object.assign({ beatsPerBar: 4, chordsPerBar: 1, bpm: null, sampleRate: SR }, opts));
  const ev = [];
  for (let p = 0; p < samples.length; p += 8192) ev.push(...L.listenFeedSamples(st, samples.subarray(p, p + 8192), SR));
  ev.push(...st.assembler.flush());
  return { st, ev, bars: ev.filter(e => e.type === 'bar').map(b => b.chords.map(c => c.symbol).join(' ')) };
}

// Mesures justes (même rang ; maxShift > 0 : meilleur alignement, mesures d'introduction ignorées).
function score(bars, expected, maxShift = 0) {
  let best = null;
  for (let s = 0; s <= maxShift; s++) {
    let ok = 0, last = 0;
    const q = expected.length - Math.floor(expected.length / 4) * 3;
    expected.forEach((x, i) => { if (bars[i + s] === x) { ok++; if (i >= expected.length - q) last++; } });
    if (!best || ok > best.ok) best = { ok, last, q, ratio: ok / expected.length, lastRatio: last / q, shift: s };
  }
  return best;
}

function check(name, r, expected, maxShift = 0) {
  const s = score(r.bars, expected, maxShift);
  const msg = `${name} : ${s.ok}/${expected.length} justes, dernier quart ${s.last}/${s.q}\n` + r.bars.join(' | ');
  assert.ok(s.ratio >= 0.9, msg);
  assert.ok(s.lastRatio >= 0.85, msg);
  return s;
}

test('suivi : dérive linéaire 120 → 126 BPM sur 96 mesures', () => {
  const r = listen(synth.progressionTempo(BARS, i => 120 + 6 * i / 96));
  check('dérive', r, BARS);
  // Les frontières de temps corrigées sont gardées : la reconstruction sans décalage redonne le direct.
  const d = r.st.assembler.data();
  const live = r.ev.filter(e => e.type === 'bar').map(b => ({ chords: b.chords }));
  assert.deepEqual(dsp.rebuildBars(d, { beatsPerBar: 4, chordsPerBar: 1, beatOffset: 0 }), live);
  assert.ok(d.bpm > 122 && d.bpm < 124.5, 'tempo médian ' + d.bpm);
  const at = d.beatChroma.map(b => b.at);
  assert.ok(at.every((x, i) => i === 0 || x > at[i - 1]), 'débuts de temps croissants');
});

test('suivi : marche aléatoire 116–124 BPM', () => {
  const r = synth.rng(24); // reste longtemps loin de 120 (de 117 à 124)
  let v = 120;
  const tempi = BARS.map(() => (v = Math.max(116, Math.min(124, v + (r() - 0.5) * 2))));
  check('marche', listen(synth.progressionTempo(BARS, i => tempi[i])), BARS);
});

test('suivi : tempo saisi 1 % faux (120 pour 121,2 et 118,8)', () => {
  check('121,2', listen(synth.progressionTempo(BARS, () => 121.2), { bpm: 120 }), BARS);
  check('118,8', listen(synth.progressionTempo(BARS, () => 118.8), { bpm: 120 }), BARS);
});

test('suivi : trou de 0,37 s au milieu (mise en mémoire tampon)', () => {
  const s = synth.progressionTempo(BARS2, () => 120);
  const at = Math.round((48 * 2 + 0.7) * SR); // au milieu d'un temps de la mesure 49
  const gap = synth.concat(s.subarray(0, at), synth.silence(0.37), s.subarray(at));
  check('trou, 2 accords', listen(gap, { chordsPerBar: 2 }), BARS2.map(text));
  // Le compte des temps est gardé : la grille est retardée de la durée du trou, pas recalée au plus près.
  const one = listen(gap, { chordsPerBar: 1 });
  assert.equal(one.bars.length, 96);
});

test('suivi : introduction rubato de 12 s puis tempo stable', () => {
  // Intro : temps de 0,4 à 0,6 s (autour de 120), accords de 4 temps, un clic par temps.
  const r = synth.rng(11);
  const parts = [];
  const intro = ['Cmaj7', 'Am7', 'Fmaj7', 'G7'];
  let t = 0, k = 0;
  while (t < 12) {
    const d = 0.4 + 0.2 * r();
    parts.push(synth.mix(synth.chord(intro[(k >> 2) % 4], d, SR), synth.clickTrain(1, d, SR), 0.5));
    t += d; k++;
  }
  const s = synth.concat(...parts, synth.progressionTempo(BARS, () => 120));
  check('rubato', listen(s), BARS, 12);
});

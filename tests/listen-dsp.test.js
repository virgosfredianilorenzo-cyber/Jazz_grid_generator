const test = require('node:test');
const assert = require('node:assert/strict');
const dsp = require('../js/listen-dsp.js');
const synth = require('./helpers/synth.js');

const SR = 44100;
const { FRAME_SIZE, HOP_SIZE } = dsp;

function firstFrame(samples) { return samples.subarray(0, FRAME_SIZE); }

function onsetEnvelope(samples) {
  const out = [];
  let prev = null;
  for (let p = 0; p + FRAME_SIZE <= samples.length; p += HOP_SIZE) {
    const mags = dsp.fftMagnitudes(samples.subarray(p, p + FRAME_SIZE));
    out.push(prev ? dsp.onsetStrength(prev, mags) : 0);
    prev = mags;
  }
  return out;
}

test('constantes et vocabulaire', () => {
  assert.equal(FRAME_SIZE, 8192);
  assert.equal(HOP_SIZE, 2048);
  assert.deepEqual(dsp.CHORD_QUALITIES, ['maj7', 'm7', '7', 'm7b5', 'dim7']);
  assert.deepEqual(dsp.ROOT_NAMES, ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B']);
});

test("fftMagnitudes trouve la fréquence d'un sinus", () => {
  const s = synth.chordSamples([69], 0.5, SR, { harmonics: 1 });
  const mags = dsp.fftMagnitudes(firstFrame(s));
  assert.equal(mags.length, FRAME_SIZE / 2);
  let k = 0;
  for (let i = 1; i < mags.length; i++) if (mags[i] > mags[k]) k = i;
  assert.ok(Math.abs(k - Math.round(440 * FRAME_SIZE / SR)) <= 1, 'indice ' + k);
});

test('chromaFromFrame : classe dominante', () => {
  const s = synth.chordSamples([69], 0.5, SR, { harmonics: 1 });
  const r = dsp.chromaFromFrame(firstFrame(s), SR);
  assert.equal(r.chroma.length, 12);
  assert.equal(r.bass.length, 12);
  assert.equal(r.chroma.indexOf(Math.max(...r.chroma)), 9);
  assert.ok(Math.abs(r.chroma.reduce((a, b) => a + b, 0) - 1) < 1e-9);
  assert.ok(r.rms > 0.1);
  assert.equal(r.mags.length, FRAME_SIZE / 2);

  const z = dsp.chromaFromFrame(firstFrame(synth.silence(0.5, SR)), SR);
  assert.ok(z.rms < 1e-4);
  assert.deepEqual(z.chroma, new Array(12).fill(0));
  assert.deepEqual(z.bass, new Array(12).fill(0));
});

test('matchChord reconnaît les tétrades', () => {
  for (const sym of ['Fm7', 'Bbm7', 'Ebmaj7', 'G7', 'Bm7b5', 'Bdim7']) {
    const r = dsp.chromaFromFrame(firstFrame(synth.chord(sym, 0.5, SR)), SR);
    const m = dsp.matchChord(r.chroma, r.bass);
    assert.equal(m.symbol, sym);
    assert.ok(m.margin > 0, sym + ' margin ' + m.margin);
    assert.ok(m.score > 0);
  }
});

test('matchChord écrit des tétrades même pour une triade', () => {
  const r = dsp.chromaFromFrame(firstFrame(synth.chord('Ebmaj', 0.5, SR)), SR);
  const m = dsp.matchChord(r.chroma, r.bass);
  assert.ok(m.symbol === 'Ebmaj7' || m.symbol === 'Eb7', m.symbol);
});

test('onsetStrength : positif à une attaque, nul en régime stable', () => {
  const s = synth.concat(synth.silence(0.3, SR), synth.chord('G7', 1, SR));
  const quiet = dsp.fftMagnitudes(s.subarray(0, FRAME_SIZE));
  const loud = dsp.fftMagnitudes(s.subarray(SR, SR + FRAME_SIZE));
  assert.ok(dsp.onsetStrength(quiet, loud) > 1);
  assert.ok(dsp.onsetStrength(loud, quiet) < 1e-9);
});

test('estimateTempo 120', () => {
  const env = onsetEnvelope(synth.clickTrain(120, 12, SR));
  const t = dsp.estimateTempo(env, HOP_SIZE / SR);
  assert.ok(t.bpm >= 118 && t.bpm <= 122, 'bpm ' + t.bpm);
  assert.ok(Math.abs(t.period - 60 / 120 / (HOP_SIZE / SR)) < 0.3, 'period ' + t.period);
  assert.ok(t.phase >= 0 && t.phase < t.period, 'phase ' + t.phase);
});

test('estimateTempo 174 (pas 87)', () => {
  const env = onsetEnvelope(synth.clickTrain(174, 12, SR));
  const t = dsp.estimateTempo(env, HOP_SIZE / SR);
  assert.ok(t.bpm >= 171 && t.bpm <= 177, 'bpm ' + t.bpm);
});

test('estimateTempo : phase du premier temps', () => {
  const hopSec = HOP_SIZE / SR;
  const env = new Array(400).fill(0);
  for (let f = 5; f < env.length; f += 12) env[f] = 1; // période 12 trames, premier temps en 5
  const t = dsp.estimateTempo(env, hopSec);
  assert.ok(Math.abs(t.period - 12) < 0.1, 'period ' + t.period);
  assert.ok(Math.abs(t.phase - 5) < 0.6, 'phase ' + t.phase);
});

test('estimateTempo : 10 minutes en moins de 2 s', () => {
  const hopSec = HOP_SIZE / SR;
  const n = Math.round(600 / hopSec);
  const env = new Array(n).fill(0);
  const P = 60 / 132 / hopSec;
  for (let x = 3; x < n; x += P) env[Math.round(x)] = 1;
  const t0 = Date.now();
  const t = dsp.estimateTempo(env, hopSec);
  assert.ok(Date.now() - t0 < 2000);
  assert.ok(Math.abs(t.bpm - 132) < 2, 'bpm ' + t.bpm);
});

// ── Task 2 : assembleur de mesures, tonalité, sections ──────────────────────
// Trames synthétiques {chroma, bass, rms, onset} : une attaque forte sur la première trame de chaque temps.
const HOP_SEC = HOP_SIZE / SR;
const PCS = { C: 0, Db: 1, D: 2, Eb: 3, E: 4, F: 5, Gb: 6, G: 7, Ab: 8, A: 9, Bb: 10, B: 11 };
const IVS = { maj7: [0, 4, 7, 11], m7: [0, 3, 7, 10], '7': [0, 4, 7, 10], m7b5: [0, 3, 6, 10], dim7: [0, 3, 6, 9] };

function chordVectors(sym) {
  const mt = /^([A-G]b?)(.*)$/.exec(sym);
  const r = PCS[mt[1]];
  const chroma = new Array(12).fill(0), bass = new Array(12).fill(0);
  IVS[mt[2]].forEach(i => { chroma[(r + i) % 12] = 0.25; });
  bass[r] = 1;
  return { chroma, bass };
}

// beats : un symbole, un objet {chroma, bass} ou null (silence) par temps.
function framesFor(beats, bpm, opts = {}) {
  const P = 60 / bpm / HOP_SEC;
  const total = Math.ceil(beats.length * P);
  const out = [];
  for (let g = 0; g < total; g++) {
    const k = Math.floor((g + 1e-9) / P);
    const b = beats[Math.min(k, beats.length - 1)];
    const first = g === Math.ceil(k * P - 1e-9);
    if (b == null) { out.push({ chroma: new Array(12).fill(0), bass: new Array(12).fill(0), rms: 0, onset: 0 }); continue; }
    const v = typeof b === 'string' ? chordVectors(b) : b;
    out.push({ chroma: v.chroma.slice(), bass: v.bass.slice(), rms: opts.rms || 0.1, onset: first ? 5 : 0.05 });
  }
  return out;
}

function silentFrames(seconds) {
  const n = Math.round(seconds / HOP_SEC);
  return Array.from({ length: n }, () => ({ chroma: new Array(12).fill(0), bass: new Array(12).fill(0), rms: 0, onset: 0 }));
}

function beatsOf(bars, beatsPerBar = 4) {
  const out = [];
  for (const b of bars) {
    if (Array.isArray(b)) b.forEach(x => out.push(x)); // un symbole par temps
    else for (let i = 0; i < beatsPerBar; i++) out.push(b);
  }
  return out;
}

function runAssembler(frames, opts) {
  const a = dsp.createBarAssembler(Object.assign({ hopSec: HOP_SEC }, opts));
  const ev = [];
  for (const f of frames) ev.push(...a.pushFrame(f));
  ev.push(...a.flush());
  return { a, ev, bars: ev.filter(e => e.type === 'bar') };
}

const syms = bar => bar.chords.map(c => c.symbol).join(' ');

test('assembleur : 8 mesures Fm7 puis Bbm7', () => {
  const frames = framesFor(beatsOf(['Fm7', 'Fm7', 'Fm7', 'Fm7', 'Bbm7', 'Bbm7', 'Bbm7', 'Bbm7']), 120);
  const { ev, bars } = runAssembler(frames, { beatsPerBar: 4, chordsPerBar: 1, bpm: 120 });
  assert.equal(bars.length, 8);
  assert.deepEqual(bars.map(syms), ['Fm7', 'Fm7', 'Fm7', 'Fm7', 'Bbm7', 'Bbm7', 'Bbm7', 'Bbm7']);
  bars.forEach(b => { assert.equal(b.chords.length, 1); assert.equal(b.chords[0].beats, 4); assert.equal(b.chords[0].uncertain, false); });
  assert.ok(!ev.some(e => e.type === 'pause' || e.type === 'tempo'));
});

test('assembleur : les mesures sortent en direct, pas seulement au flush', () => {
  // Les premières mesures attendent le choix du premier temps (DOWNBEAT_DECIDE_BARS = 4 mesures).
  const frames = framesFor(beatsOf(['Fm7', 'Fm7', 'Bbm7', 'Bbm7', 'Fm7', 'Fm7', 'Bbm7', 'Bbm7']), 120);
  const a = dsp.createBarAssembler({ beatsPerBar: 4, chordsPerBar: 1, bpm: 120, hopSec: HOP_SEC });
  const live = [];
  for (const f of frames) live.push(...a.pushFrame(f));
  assert.ok(live.filter(e => e.type === 'bar').length >= 6);
});

test('assembleur : 2 accords par mesure seulement si changement', () => {
  const beats = beatsOf(['Fm7', ['Fm7', 'Fm7', 'Bb7', 'Bb7']]);
  const { bars } = runAssembler(framesFor(beats, 120), { beatsPerBar: 4, chordsPerBar: 2, bpm: 120 });
  assert.equal(bars.length, 2);
  assert.deepEqual(bars[0].chords.map(c => [c.symbol, c.beats]), [['Fm7', 4]]);
  assert.deepEqual(bars[1].chords.map(c => [c.symbol, c.beats]), [['Fm7', 2], ['Bb7', 2]]);

  const b3 = beatsOf(['Fm7', ['Fm7', 'Fm7', 'Bb7']], 3);
  const r3 = runAssembler(framesFor(b3, 120), { beatsPerBar: 3, chordsPerBar: 2, bpm: 120 });
  assert.equal(r3.bars.length, 2);
  assert.deepEqual(r3.bars[0].chords.map(c => [c.symbol, c.beats]), [['Fm7', 3]]);
  assert.deepEqual(r3.bars[1].chords.map(c => [c.symbol, c.beats]), [['Fm7', 2], ['Bb7', 1]]);

  const b5 = beatsOf([['Fm7', 'Fm7', 'Fm7', 'Bb7', 'Bb7']], 5);
  const r5 = runAssembler(framesFor(b5, 120), { beatsPerBar: 5, chordsPerBar: 2, bpm: 120 });
  assert.deepEqual(r5.bars[0].chords.map(c => [c.symbol, c.beats]), [['Fm7', 3], ['Bb7', 2]]);
});

test('assembleur : silence court → N.C.', () => {
  const frames = framesFor(beatsOf(['Fm7', null, 'Bb7']), 120);
  const { ev, bars } = runAssembler(frames, { beatsPerBar: 4, chordsPerBar: 1, bpm: 120 });
  assert.deepEqual(bars.map(syms), ['Fm7', 'N.C.', 'Bb7']);
  assert.equal(bars[1].chords[0].beats, 4);
  assert.ok(!ev.some(e => e.type === 'pause'));
});

test('silence long arrête le compteur', () => {
  const frames = framesFor(beatsOf(['Fm7', 'Fm7', null, null, null, 'Bb7', 'Ebmaj7']), 120);
  const { ev } = runAssembler(frames, { beatsPerBar: 4, chordsPerBar: 1, bpm: 120 });
  const seq = ev.map(e => e.type === 'bar' ? syms(e) : e.type);
  assert.deepEqual(seq, ['Fm7', 'Fm7', 'pause', 'resume', 'Bb7', 'Ebmaj7']);
});

test('silence long : reprise décalée par rapport à la grille, recalée sur la première attaque', () => {
  // La reprise tombe au milieu d'un temps de l'ancienne grille.
  const f1 = framesFor(beatsOf(['Fm7', 'Fm7']), 120);
  const f2 = framesFor(beatsOf(['Bb7', 'Ebmaj7']), 120);
  const frames = f1.concat(silentFrames(5.27), f2);
  const { ev } = runAssembler(frames, { beatsPerBar: 4, chordsPerBar: 2, bpm: 120 });
  const seq = ev.map(e => e.type === 'bar' ? e.chords.map(c => c.symbol + ':' + c.beats).join(' ') : e.type);
  assert.deepEqual(seq, ['Fm7:4', 'Fm7:4', 'pause', 'resume', 'Bb7:4', 'Ebmaj7:4']);
});

test('assembleur : silence initial puis musique (tempo estimé)', () => {
  const prog = ['Fm7', 'Bb7', 'Ebmaj7', 'Abmaj7', 'Dm7b5', 'G7'];
  const frames = silentFrames(3).concat(framesFor(beatsOf(prog), 120));
  const a = dsp.createBarAssembler({ beatsPerBar: 4, chordsPerBar: 1, hopSec: HOP_SEC });
  const ev = [];
  let tempoAt = -1;
  frames.forEach((f, i) => {
    const e = a.pushFrame(f);
    if (e.some(x => x.type === 'tempo')) tempoAt = i;
    ev.push(...e);
  });
  ev.push(...a.flush());
  const tempos = ev.filter(e => e.type === 'tempo');
  assert.equal(tempos.length, 1);
  assert.ok(tempos[0].bpm >= 118 && tempos[0].bpm <= 122, 'bpm ' + tempos[0].bpm);
  assert.ok((tempoAt - 3 / HOP_SEC) * HOP_SEC >= 8 - 0.1, 'tempo établi trop tôt : trame ' + tempoAt);
  assert.equal(ev.findIndex(e => e.type === 'tempo'), 0, 'aucune mesure avant le tempo');
  const bars = ev.filter(e => e.type === 'bar');
  assert.deepEqual(bars.map(syms), prog);
  const d = a.data();
  assert.ok(d.bpm >= 118 && d.bpm <= 122);
  assert.ok(Math.abs(d.firstBeatFrame - 3 / HOP_SEC) < 2, 'firstBeatFrame ' + d.firstBeatFrame);
  assert.equal(d.beatChroma.length, 24);
});

test("assembleur : pas de tempo sur une enveloppe sans attaques", () => {
  const n = Math.round(12 / HOP_SEC);
  const v = chordVectors('Fm7');
  const frames = Array.from({ length: n }, () => ({ chroma: v.chroma, bass: v.bass, rms: 0.1, onset: 0 }));
  const { ev } = runAssembler(frames, { beatsPerBar: 4, chordsPerBar: 1 });
  assert.equal(ev.length, 0);
});

test('estimateTempo : indicateur de confiance', () => {
  assert.equal(dsp.estimateTempo([], HOP_SEC).confident, false);
  assert.equal(dsp.estimateTempo(new Array(300).fill(0), HOP_SEC).confident, false);
  const env = onsetEnvelope(synth.clickTrain(120, 12, SR));
  assert.equal(dsp.estimateTempo(env, HOP_SEC).confident, true);
});

test('accord incertain', () => {
  // Moitié Cmaj7, moitié C7 : deux gabarits presque égaux.
  const amb = { chroma: [0.25, 0, 0, 0, 0.25, 0, 0, 0.25, 0, 0, 0.125, 0.125], bass: [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] };
  assert.ok(dsp.matchChord(amb.chroma, amb.bass).margin < dsp.UNCERTAIN_MARGIN);
  assert.equal(dsp.UNCERTAIN_MARGIN, 0.04);
  const frames = framesFor(beatsOf(['Fm7', amb]), 120);
  const { bars } = runAssembler(frames, { beatsPerBar: 4, chordsPerBar: 1, bpm: 120 });
  assert.equal(bars[0].chords[0].uncertain, false);
  assert.equal(bars[1].chords[0].uncertain, true);
});

test('rebuildBars décale d\'un temps', () => {
  // Deux temps d'anacrouse (G7) puis Fm7 | Bb7 | Ebmaj7 : trop court (< 4 mesures) pour un choix automatique
  // du premier temps, la première attaque reste le premier temps.
  const beats = ['G7', 'G7'].concat(beatsOf(['Fm7', 'Bb7', 'Ebmaj7']));
  const { a, bars } = runAssembler(framesFor(beats, 120), { beatsPerBar: 4, chordsPerBar: 2, bpm: 120 });
  const d = a.data();
  const same = dsp.rebuildBars(d, { beatsPerBar: 4, chordsPerBar: 2, beatOffset: 0 });
  assert.deepEqual(same, bars.map(b => ({ chords: b.chords })));
  assert.deepEqual(same.map(syms), ['G7 Fm7', 'Fm7 Bb7', 'Bb7 Ebmaj7', 'Ebmaj7']); // à cheval
  // Décalage +2 : l'anacrouse de deux temps (une demi-mesure) forme une mesure complétée devant.
  const shifted = dsp.rebuildBars(d, { beatsPerBar: 4, chordsPerBar: 2, beatOffset: 2 });
  assert.deepEqual(shifted.map(syms), ['G7', 'Fm7', 'Bb7', 'Ebmaj7']);
  shifted.forEach(b => assert.equal(b.chords[0].beats, 4));
  const one = dsp.rebuildBars(d, { beatsPerBar: 4, chordsPerBar: 1, beatOffset: 2 });
  assert.deepEqual(one.map(syms), ['G7', 'Fm7', 'Bb7', 'Ebmaj7']);
  // Décalage −2 : même grille (décalage modulo la mesure).
  assert.deepEqual(dsp.rebuildBars(d, { beatsPerBar: 4, chordsPerBar: 1, beatOffset: -2 }), one);
  // Décalage +3 : anacrouse de 3 temps (G7 G7 Fm7), complétée devant.
  const three = dsp.rebuildBars(d, { beatsPerBar: 4, chordsPerBar: 1, beatOffset: 3 });
  assert.equal(three.length, 4);
  three.forEach(b => assert.equal(b.chords[0].beats, 4));
  // Métrique différente : 3/4 sur les mêmes données (14 temps → 4 mesures + 2 temps gardés).
  const b3 = dsp.rebuildBars(d, { beatsPerBar: 3, chordsPerBar: 1, beatOffset: 0 });
  assert.equal(b3.length, 5);
});

test('rebuildBars garde les pauses', () => {
  const frames = framesFor(beatsOf(['Fm7', 'Fm7', null, null, null, 'Bb7', 'Ebmaj7']), 120);
  const { a } = runAssembler(frames, { beatsPerBar: 4, chordsPerBar: 1, bpm: 120 });
  const r = dsp.rebuildBars(a.data(), { beatsPerBar: 4, chordsPerBar: 1, beatOffset: 0 });
  assert.deepEqual(r.map(syms), ['Fm7', 'Fm7', 'Bb7', 'Ebmaj7']);
});

test('estimateKey', () => {
  const beat = (w) => ({ chroma: w, bass: new Array(12).fill(0), silent: false });
  // Fa mineur harmonique, tonique / tierce / quinte appuyées.
  const fm = new Array(12).fill(0);
  [[5, 3], [7, 1], [8, 2], [10, 1], [0, 2], [1, 1], [4, 1]].forEach(([p, w]) => { fm[p] = w; });
  assert.equal(dsp.estimateKey([beat(fm), beat(fm)]), 'Fm');
  // La bémol majeur.
  const ab = new Array(12).fill(0);
  [[8, 3], [10, 1], [0, 2], [1, 1], [3, 2], [5, 1], [7, 1]].forEach(([p, w]) => { ab[p] = w; });
  assert.equal(dsp.estimateKey([beat(ab), { chroma: new Array(12).fill(0), bass: new Array(12).fill(0), silent: true }]), 'Ab');
});

test('proposeSections', () => {
  const rep = (s, n) => new Array(n).fill(s);
  const bars = rep('Fm7', 8).concat(rep('Fm7', 8), rep('Eb7', 8));
  assert.deepEqual(dsp.proposeSections(bars), [
    { start: 0, length: 8, label: 'A' }, { start: 8, length: 8, label: 'A' }, { start: 16, length: 8, label: 'B' }
  ]);
  const four = ['C', 'D', 'E', 'F', 'C', 'D', 'E', 'F', 'G', 'A', 'B', 'Db'];
  assert.deepEqual(dsp.proposeSections(four), [
    { start: 0, length: 4, label: 'A' }, { start: 4, length: 4, label: 'A' }, { start: 8, length: 4, label: 'B' }
  ]);
  const none = ['C', 'D', 'E', 'F', 'G', 'A', 'B', 'Db', 'Eb', 'Gb', 'Ab', 'Bb'];
  assert.equal(dsp.proposeSections(none), null);
});

// ── Revue finale ─────────────────────────────────────────────────────────────
// Mélange de deux accords : (1 − λ)·a + λ·b (chroma et basse).
function blend(a, b, lambda) {
  const A = chordVectors(a), B = chordVectors(b);
  return {
    chroma: A.chroma.map((x, i) => (1 - lambda) * x + lambda * B.chroma[i]),
    bass: A.bass.map((x, i) => (1 - lambda) * x + lambda * B.bass[i])
  };
}

test('mode 2 : pas de coupe sur des mesures à un accord, coupe sur un vrai changement', () => {
  // 8 mesures propres d'un accord par mesure → aucune coupe.
  const clean = runAssembler(framesFor(beatsOf(['Fm7', 'Bb7', 'Ebmaj7', 'Abmaj7', 'Fm7', 'Bb7', 'Ebmaj7', 'Abmaj7']), 120),
    { beatsPerBar: 4, chordsPerBar: 2, bpm: 120 });
  assert.equal(clean.bars.length, 8);
  assert.equal(clean.bars.filter(b => b.chords.length > 1).length, 0);
  // Moitiés presque identiques (Cmaj7 teinté de La, un peu plus en seconde moitié) : symboles différents
  // mais écart minime → une seule harmonie.
  const h1 = blend('Cmaj7', 'Am7', 0.45), h2 = blend('Cmaj7', 'Am7', 0.56);
  const bar = [h1, h1, h2, h2];
  const amb = runAssembler(framesFor(beatsOf(['Cmaj7', bar, bar, bar, bar, 'Cmaj7']), 120), { beatsPerBar: 4, chordsPerBar: 2, bpm: 120 });
  assert.equal(amb.bars.length, 6);
  assert.equal(amb.bars.filter(b => b.chords.length > 1).length, 0, amb.bars.map(syms).join(' | '));
  // Vrai changement au milieu de la mesure.
  const real = runAssembler(framesFor(beatsOf(['Fm7', ['Fm7', 'Fm7', 'Bb7', 'Bb7'], ['Ebmaj7', 'Ebmaj7', 'Cm7', 'Cm7']]), 120),
    { beatsPerBar: 4, chordsPerBar: 2, bpm: 120 });
  assert.deepEqual(real.bars.map(syms), ['Fm7', 'Fm7 Bb7', 'Ebmaj7 Cm7']);
});

// Mesure à deux accords (2 + 2 temps).
const H = (x, y) => [x, x, y, y];

test('premier temps de mesure choisi par suite (début, reprise après pause), direct = reconstruction', () => {
  // Suite 1 : un temps d'anacrouse ; suite 2 (après une pause) : trois temps avant le premier temps fort.
  // Une mesure sur deux change au milieu : une grille décalée d'un temps rendrait les mesures fausses.
  const f1 = framesFor(['Db7'].concat(beatsOf([H('Fm7', 'Bb7'), 'Ebmaj7', H('Dm7b5', 'G7'), 'Cm7', H('Fm7', 'Bb7'), 'Ebmaj7'])), 120);
  const f2 = framesFor(['Gb7', 'Gb7', 'Gb7'].concat(beatsOf([H('Bm7', 'E7'), 'Amaj7', H('Abm7b5', 'Db7'), 'Gbm7', H('Bm7', 'E7'), 'Amaj7'])), 120);
  const { a, ev, bars } = runAssembler(f1.concat(silentFrames(5.27), f2), { beatsPerBar: 4, chordsPerBar: 2, bpm: 120 });
  const seq = ev.map(e => e.type === 'bar' ? syms(e) : e.type);
  // L'anacrouse d'un temps est écartée (moins d'une demi-mesure), celle de trois temps forme une mesure.
  assert.deepEqual(seq, ['Fm7 Bb7', 'Ebmaj7', 'Dm7b5 G7', 'Cm7', 'Fm7 Bb7', 'Ebmaj7', 'pause', 'resume',
    'Gb7', 'Bm7 E7', 'Amaj7', 'Abm7b5 Db7', 'Gbm7', 'Bm7 E7', 'Amaj7']);
  const d = a.data();
  assert.deepEqual(dsp.rebuildBars(d, { beatsPerBar: 4, chordsPerBar: 2, beatOffset: 0 }), bars.map(b => ({ chords: b.chords })));
  // ◀ ▶ : décalage global en plus du choix automatique.
  const left = dsp.rebuildBars(d, { beatsPerBar: 4, chordsPerBar: 2, beatOffset: -2 });
  assert.deepEqual(left.map(syms).slice(0, 3), ['Db7 Fm7', 'Bb7 Ebmaj7', 'Ebmaj7 Dm7b5']);
});

test('premier temps de mesure : recalage en cours de suite quand les changements glissent d\'un temps', () => {
  // 8 mesures alignées, puis un temps manqué par le suivi (temps supprimé) : les accords changent sur le
  // 4e temps de la grille. La grille de mesures se recale (la mesure courte de 3 temps est complétée).
  const P = [H('Fm7', 'Bb7'), 'Ebmaj7', H('Dm7b5', 'G7'), 'Cm7'];
  const exp = ['Fm7 Bb7', 'Ebmaj7', 'Dm7b5 G7', 'Cm7'];
  const seq = beatsOf(P.concat(P)).concat(beatsOf(P.concat(P, P, P)).slice(1));
  const { a, bars } = runAssembler(framesFor(seq, 120), { beatsPerBar: 4, chordsPerBar: 2, bpm: 120 });
  const s = bars.map(syms);
  assert.deepEqual(s.slice(0, 8), exp.concat(exp));
  assert.deepEqual(s.slice(-8), exp.concat(exp), s.join(' | '));
  assert.equal(s.length, 24, s.join(' | ')); // le compte des mesures est gardé
  assert.deepEqual(dsp.rebuildBars(a.data(), { beatsPerBar: 4, chordsPerBar: 2, beatOffset: 0 }), bars.map(b => ({ chords: b.chords })));
});

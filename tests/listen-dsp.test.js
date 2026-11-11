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

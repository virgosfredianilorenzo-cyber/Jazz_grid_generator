// Moteur d'analyse audio de la « grille à l'écoute » : FFT, chroma, gabarits de tétrades, tempo.
// Fonctions pures, aucun accès au DOM. Chargé à la demande dans le navigateur (globals) ;
// exporté sous Node pour les tests.
//
// Attaques : chromaFromFrame renvoie aussi `mags` (magnitudes de la FFT de la trame) ; l'appelant
// calcule onset = onsetStrength(magsPrécédentes, mags) sans refaire de FFT.

const FRAME_SIZE = 8192;
const HOP_SIZE = 2048;
const CHORD_QUALITIES = ['maj7', 'm7', '7', 'm7b5', 'dim7'];
const ROOT_NAMES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

const CHORD_INTERVALS = { maj7: [0, 4, 7, 11], m7: [0, 3, 7, 10], '7': [0, 4, 7, 10], m7b5: [0, 3, 6, 10], dim7: [0, 3, 6, 9] };
const CHORD_WEIGHTS = [1, 1, 0.8, 0.8]; // racine, tierce, quinte, septième
const BASS_BONUS = 0.3;                 // ajouté × part de la basse sur la racine
const CHROMA_RANGE = [55, 2000];
const BASS_RANGE = [40, 220];

// ── FFT ──────────────────────────────────────────────────────────────────────
const _dspFftCache = {};
function _dspFftTables(n) {
  if (_dspFftCache[n]) return _dspFftCache[n];
  const bits = Math.round(Math.log2(n));
  if ((1 << bits) !== n) throw new Error('FFT : longueur non puissance de 2 (' + n + ')');
  const rev = new Uint32Array(n);
  for (let i = 0; i < n; i++) {
    let r = 0;
    for (let b = 0; b < bits; b++) r |= ((i >> b) & 1) << (bits - 1 - b);
    rev[i] = r;
  }
  const win = new Float64Array(n);
  for (let i = 0; i < n; i++) win[i] = 0.5 - 0.5 * Math.cos(2 * Math.PI * i / n);
  const cos = new Float64Array(n / 2), sin = new Float64Array(n / 2);
  for (let i = 0; i < n / 2; i++) { cos[i] = Math.cos(2 * Math.PI * i / n); sin[i] = -Math.sin(2 * Math.PI * i / n); }
  return (_dspFftCache[n] = { rev, win, cos, sin });
}

// Magnitudes (longueur n/2) de la FFT radix-2 de la trame fenêtrée par Hann.
function fftMagnitudes(frame) {
  const n = frame.length;
  const { rev, win, cos, sin } = _dspFftTables(n);
  const re = new Float64Array(n), im = new Float64Array(n);
  for (let i = 0; i < n; i++) re[rev[i]] = frame[i] * win[i];
  for (let size = 2; size <= n; size <<= 1) {
    const half = size >> 1, step = n / size;
    for (let start = 0; start < n; start += size) {
      for (let k = 0; k < half; k++) {
        const wr = cos[k * step], wi = sin[k * step];
        const a = start + k, b = a + half;
        const tr = re[b] * wr - im[b] * wi, ti = re[b] * wi + im[b] * wr;
        re[b] = re[a] - tr; im[b] = im[a] - ti;
        re[a] += tr; im[a] += ti;
      }
    }
  }
  const out = new Float32Array(n / 2);
  for (let i = 0; i < n / 2; i++) out[i] = Math.sqrt(re[i] * re[i] + im[i] * im[i]);
  return out;
}

// ── Chroma ───────────────────────────────────────────────────────────────────
function _dspNormalize(v) {
  const s = v.reduce((a, b) => a + b, 0);
  return s > 1e-12 ? v.map(x => x / s) : v.map(() => 0);
}

// Pics spectraux (maxima locaux), fréquence affinée par interpolation parabolique sur le log,
// magnitude du pic ajoutée à sa classe de hauteur — évite l'étalement du lobe de Hann dans le grave.
function chromaFromFrame(frame, sampleRate) {
  const n = frame.length;
  let sq = 0;
  for (let i = 0; i < n; i++) sq += frame[i] * frame[i];
  const rms = Math.sqrt(sq / n);
  const mags = fftMagnitudes(frame);
  const chroma = new Array(12).fill(0), bass = new Array(12).fill(0);
  let maxMag = 0;
  for (let i = 0; i < mags.length; i++) if (mags[i] > maxMag) maxMag = mags[i];
  if (rms > 1e-6 && maxMag > 0) {
    const floor = maxMag * 1e-3, binHz = sampleRate / n;
    const kMin = Math.max(1, Math.floor(Math.min(CHROMA_RANGE[0], BASS_RANGE[0]) / binHz) - 1);
    const kMax = Math.min(mags.length - 2, Math.ceil(Math.max(CHROMA_RANGE[1], BASS_RANGE[1]) / binHz) + 1);
    for (let k = kMin; k <= kMax; k++) {
      const m = mags[k];
      if (m < floor || m <= mags[k - 1] || m < mags[k + 1]) continue;
      const a = Math.log(mags[k - 1] + 1e-12), b = Math.log(m), c = Math.log(mags[k + 1] + 1e-12);
      const d = a - 2 * b + c;
      const delta = d < 0 ? 0.5 * (a - c) / d : 0;
      const f = (k + delta) * binHz;
      const pc = ((Math.round(12 * Math.log2(f / 440)) + 69) % 12 + 12) % 12;
      if (f >= CHROMA_RANGE[0] && f <= CHROMA_RANGE[1]) chroma[pc] += m;
      if (f >= BASS_RANGE[0] && f <= BASS_RANGE[1]) bass[pc] += m;
    }
  }
  return { chroma: _dspNormalize(chroma), bass: _dspNormalize(bass), rms, mags };
}

// ── Accords ──────────────────────────────────────────────────────────────────
const _DSP_TEMPLATES = (() => {
  const out = [];
  for (let r = 0; r < 12; r++) {
    for (const q of CHORD_QUALITIES) {
      const v = new Array(12).fill(0);
      CHORD_INTERVALS[q].forEach((iv, j) => { v[(r + iv) % 12] = CHORD_WEIGHTS[j]; });
      const norm = Math.sqrt(v.reduce((s, x) => s + x * x, 0));
      out.push({ root: r, quality: q, symbol: ROOT_NAMES[r] + q, v: v.map(x => x / norm) });
    }
  }
  return out;
})();

// Similarité cosinus aux 60 gabarits + bonus de basse sur la racine.
// margin = meilleur score − second meilleur (autre racine ou autre qualité).
function matchChord(chroma, bass) {
  const cn = Math.sqrt(chroma.reduce((s, x) => s + x * x, 0));
  let best = null, second = -Infinity;
  for (const t of _DSP_TEMPLATES) {
    let dot = 0;
    for (let i = 0; i < 12; i++) dot += chroma[i] * t.v[i];
    const score = (cn > 0 ? dot / cn : 0) + BASS_BONUS * ((bass && bass[t.root]) || 0);
    if (!best || score > best.score) { if (best) second = best.score; best = { symbol: t.symbol, score }; }
    else if (score > second) second = score;
  }
  return { symbol: best.symbol, score: best.score, margin: best.score - second };
}

// ── Attaques et tempo ────────────────────────────────────────────────────────
// Flux spectral positif sur log(1 + magnitude).
function onsetStrength(prevMags, mags) {
  if (!prevMags) return 0;
  let s = 0;
  const n = Math.min(prevMags.length, mags.length);
  for (let i = 0; i < n; i++) {
    const d = Math.log1p(mags[i]) - Math.log1p(prevMags[i]);
    if (d > 0) s += d;
  }
  return s;
}

function _dspSampleAt(arr, x) {
  const i = Math.floor(x);
  if (i < 0 || i + 1 >= arr.length) return i >= 0 && i < arr.length ? arr[i] : 0;
  const f = x - i;
  return arr[i] * (1 - f) + arr[i + 1] * f;
}

// Tempo par autocorrélation de l'enveloppe d'attaques lissée (délais entiers, sommet et hauteur
// affinés par interpolation parabolique) ; parmi les pics ≥ 0.9 × le maximum, le plus petit délai (tempo
// le plus rapide). La période est ensuite affinée (±0.5 trame) en ajustant une grille de temps sur
// tout le signal, ce qui donne aussi la phase : décalage (en trames, dans [0, period)) du premier
// temps qui maximise la somme des attaques sur la grille phase + k·period.
// period et phase sont fractionnaires (en trames de hopSec).
function estimateTempo(onsets, hopSec, minBpm = 60, maxBpm = 200) {
  const n = onsets.length;
  const fallback = { bpm: 120, period: 60 / 120 / hopSec, phase: 0 };
  if (n < 4) return fallback;
  // Lissage gaussien (σ = 1 trame) : tolère l'arrondi des attaques à la trame.
  const K = [0.0044, 0.054, 0.242, 0.399, 0.242, 0.054, 0.0044];
  const sm = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    let s = 0;
    for (let j = -3; j <= 3; j++) { const t = i + j; if (t >= 0 && t < n) s += K[j + 3] * onsets[t]; }
    sm[i] = s;
  }
  let mean = 0;
  for (let i = 0; i < n; i++) mean += sm[i];
  mean /= n;
  const o = new Float64Array(n);
  for (let i = 0; i < n; i++) o[i] = sm[i] - mean;

  const lMin = Math.max(1, Math.floor(60 / maxBpm / hopSec)), lMax = Math.min(n - 3, Math.ceil(60 / minBpm / hopSec));
  if (lMax <= lMin) return fallback;
  const ac = new Float64Array(lMax + 2);
  for (let L = Math.max(0, lMin - 1); L <= lMax + 1; L++) {
    let s = 0;
    for (let t = 0; t + L < n; t++) s += o[t] * o[t + L];
    ac[L] = s / (n - L);
  }
  const pMin = 60 / maxBpm / hopSec, pMax = 60 / minBpm / hopSec;
  const peaks = [];
  for (let L = Math.max(1, lMin); L <= lMax; L++) {
    if (ac[L] > 0 && ac[L] > ac[L - 1] && ac[L] >= ac[L + 1]) {
      const a = ac[L - 1], b = ac[L], c = ac[L + 1], d = a - 2 * b + c;
      // Sommet de la parabole : position et hauteur (un pic à cheval sur deux délais entiers
      // n'est pas sous-estimé face à son double).
      const p = L + (d < 0 ? 0.5 * (a - c) / d : 0);
      const v = d < 0 ? b - (a - c) * (a - c) / (8 * d) : b;
      if (p >= pMin - 0.5 && p <= pMax + 0.5) peaks.push({ p, v });
    }
  }
  if (!peaks.length) return fallback;
  const maxAc = Math.max(...peaks.map(k => k.v));
  const p0 = peaks.find(k => k.v >= 0.9 * maxAc).p;

  // Ajustement de grille : période (pas 0.01) et phase (pas 0.1) maximisant la moyenne des attaques.
  let period = p0, phase = 0, best = -Infinity;
  for (let p = p0 - 0.5; p <= p0 + 0.5 + 1e-9; p += 0.01) {
    for (let ph = 0; ph < p; ph += 0.1) {
      let s = 0, cnt = 0;
      for (let x = ph; x < n - 1; x += p) { s += _dspSampleAt(sm, x); cnt++; }
      if (cnt && s / cnt > best) { best = s / cnt; period = p; phase = ph; }
    }
  }
  period = Math.min(Math.max(period, pMin), pMax);
  return { bpm: 60 / (period * hopSec), period, phase: Math.round(phase * 100) / 100 };
}

if (typeof module !== 'undefined') module.exports = {
  FRAME_SIZE, HOP_SIZE, CHORD_QUALITIES, ROOT_NAMES,
  fftMagnitudes, chromaFromFrame, matchChord, onsetStrength, estimateTempo
};

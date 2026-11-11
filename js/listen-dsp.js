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
// confidence = hauteur du pic retenu / variance de l'enveloppe (0 si aucun pic) ;
// confident = confidence ≥ TEMPO_MIN_CONFIDENCE. Le repli (120 BPM) n'est jamais « confident ».
const TEMPO_MIN_CONFIDENCE = 0.1;
function estimateTempo(onsets, hopSec, minBpm = 60, maxBpm = 200) {
  const n = onsets.length;
  const fallback = { bpm: 120, period: 60 / 120 / hopSec, phase: 0, confidence: 0, confident: false };
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
  let variance = 0;
  for (let i = 0; i < n; i++) { o[i] = sm[i] - mean; variance += o[i] * o[i]; }
  variance /= n;
  if (variance < 1e-12) return fallback;

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
  const pk = peaks.find(k => k.v >= 0.9 * maxAc), p0 = pk.p;
  const confidence = Math.max(0, pk.v / variance);

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
  return {
    bpm: 60 / (period * hopSec), period, phase: Math.round(phase * 100) / 100,
    confidence, confident: confidence >= TEMPO_MIN_CONFIDENCE
  };
}

// ── Mesures ──────────────────────────────────────────────────────────────────
// Trames → temps (chroma / basse moyens des trames sonores, drapeau `silent`) → mesures.
// Un temps est silencieux si plus de la moitié de ses trames le sont ; une trame est silencieuse si
// rms < max(SILENCE_FLOOR, SILENCE_RATIO × rms médian des trames sonores).
// Silence court (< 2 mesures) → N.C. ; silence long (≥ 2 mesures) → pause, la grille est recalée
// sur la première attaque à la reprise.

const UNCERTAIN_MARGIN = 0.04;   // uncertain = margin < UNCERTAIN_MARGIN (à ajuster sur des morceaux réels)
const SILENCE_FLOOR = 1e-4;
const SILENCE_RATIO = 0.01;
const TEMPO_MIN_SOUND_SEC = 8;   // son nécessaire avant d'estimer le tempo
const TEMPO_RETRY_SEC = 2;       // nouvel essai si l'estimation n'est pas fiable
const TEMPO_ACCEPT_SEC = 30;     // au-delà, on accepte une estimation peu fiable (s'il y a un pic)

// Médiane approchée des rms sonores : histogramme en log10, pas de 0.05 décade, de 1e-4 à 10.
function _dspRmsStats() {
  const LO = -4, STEP = 0.05, N = 100, hist = new Uint32Array(N);
  let count = 0;
  return {
    add(rms) {
      if (!(rms >= SILENCE_FLOOR)) return;
      const b = Math.min(N - 1, Math.max(0, Math.floor((Math.log10(rms) - LO) / STEP)));
      hist[b]++; count++;
    },
    threshold() {
      if (!count) return SILENCE_FLOOR;
      let acc = 0, b = 0;
      for (; b < N; b++) { acc += hist[b]; if (acc * 2 >= count) break; }
      const median = Math.pow(10, LO + (b + 0.5) * STEP);
      return Math.max(SILENCE_FLOOR, SILENCE_RATIO * median);
    }
  };
}

// Temps à partir de ses trames.
function _dspMakeBeat(frames, thr) {
  const chroma = new Array(12).fill(0), bass = new Array(12).fill(0);
  let sounding = 0;
  for (const f of frames) {
    if (!(f.rms >= thr)) continue;
    sounding++;
    for (let i = 0; i < 12; i++) { chroma[i] += f.chroma[i]; bass[i] += (f.bass && f.bass[i]) || 0; }
  }
  if (sounding) for (let i = 0; i < 12; i++) { chroma[i] /= sounding; bass[i] /= sounding; }
  return { chroma, bass, silent: sounding * 2 <= frames.length };
}

// Accord d'un groupe de temps : N.C. si plus de la moitié des temps présents sont silencieux ;
// sinon matchChord sur le chroma moyen des temps sonores. null si aucun temps présent.
// Un temps `absent` (bourrage) ne compte pas.
function _dspSegmentChord(beats) {
  const present = beats.filter(b => !b.absent);
  if (!present.length) return null;
  const sounding = present.filter(b => !b.silent);
  if (sounding.length * 2 < present.length) return { symbol: 'N.C.', uncertain: false };
  const chroma = new Array(12).fill(0), bass = new Array(12).fill(0);
  for (const b of sounding) for (let i = 0; i < 12; i++) { chroma[i] += b.chroma[i]; bass[i] += b.bass[i]; }
  for (let i = 0; i < 12; i++) { chroma[i] /= sounding.length; bass[i] /= sounding.length; }
  const m = matchChord(chroma, bass);
  return { symbol: m.symbol, uncertain: m.margin < UNCERTAIN_MARGIN };
}

// Une mesure complète (beats.length = beatsPerBar). Mode 2 = « jusqu'à 2 » : coupe ceil(n/2) + floor(n/2)
// (4/4 → 2+2, 3/4 → 2+1, 5/4 → 3+2), second accord seulement si les deux moitiés diffèrent.
function _dspBar(beats, chordsPerBar) {
  const n = beats.length;
  if (chordsPerBar === 2 && n >= 2) {
    const n1 = Math.ceil(n / 2);
    const c1 = _dspSegmentChord(beats.slice(0, n1)), c2 = _dspSegmentChord(beats.slice(n1));
    if (c1 && c2 && c1.symbol !== c2.symbol) {
      return { chords: [
        { symbol: c1.symbol, beats: n1, uncertain: c1.uncertain },
        { symbol: c2.symbol, beats: n - n1, uncertain: c2.uncertain }
      ] };
    }
  }
  const c = _dspSegmentChord(beats);
  return { chords: [{ symbol: c.symbol, beats: n, uncertain: c.uncertain }] };
}

// Mesures d'une suite de temps contigus qui se termine (fin d'écoute ou pause) : les silences longs
// (≥ 2 mesures) coupent la suite et la grille de mesures repart au temps sonore suivant ; le silence
// final est retiré ; la dernière mesure incomplète est gardée si au moins la moitié des temps sont là.
function _dspBarsFromBeats(beats, beatsPerBar, chordsPerBar) {
  const out = [];
  const longRun = 2 * beatsPerBar;
  const quiet = b => b.silent || b.absent;
  const emitPart = (part) => {
    let end = part.length;
    while (end > 0 && quiet(part[end - 1])) end--;
    let i = 0;
    for (; i + beatsPerBar <= end; i += beatsPerBar) out.push(_dspBar(part.slice(i, i + beatsPerBar), chordsPerBar));
    const rest = end - i;
    if (rest > 0 && rest * 2 >= beatsPerBar) {
      const bar = part.slice(i, end);
      while (bar.length < beatsPerBar) bar.push({ absent: true, silent: true });
      out.push(_dspBar(bar, chordsPerBar));
    }
  };
  let start = 0, i = 0;
  while (i < beats.length) {
    if (!quiet(beats[i])) { i++; continue; }
    let j = i;
    while (j < beats.length && quiet(beats[j])) j++;
    if (j - i >= longRun) {
      emitPart(beats.slice(start, i));
      start = j;
    }
    i = j;
  }
  emitPart(beats.slice(start));
  return out;
}

// opts = {beatsPerBar, chordsPerBar: 1|2, bpm?, hopSec}
function createBarAssembler(opts) {
  const beatsPerBar = Math.max(1, opts.beatsPerBar | 0 || 4);
  const chordsPerBar = opts.chordsPerBar === 2 ? 2 : 1;
  const hopSec = opts.hopSec;
  const stats = _dspRmsStats();
  let period = opts.bpm ? 60 / opts.bpm / hopSec : null;
  let bpm = opts.bpm || null;
  let tempoEmitted = false;

  let frameIndex = 0;          // index global de la prochaine trame reçue
  let mode = 'waiting';        // waiting (pas de son) | anchoring (son, grille pas encore posée) | running
  let paused = false;          // une pause a eu lieu (la prochaine reprise émet 'resume')
  let buffer = [];             // trames {g, f} en attente (anchoring)
  let soundFrames = 0;         // trames sonores dans buffer
  let nextTry = 0;             // nombre de trames sonores requis avant le prochain essai d'estimation
  let anchor = 0, beatK = 0, beatFrames = [];
  let firstBeatFrame = null;
  const beatChroma = [];
  let seg = null;              // {start: index dans beatChroma, emitted: mesures émises}
  let silentRun = 0;

  const minSound = Math.round(TEMPO_MIN_SOUND_SEC / hopSec);
  const retry = Math.round(TEMPO_RETRY_SEC / hopSec);
  const accept = Math.round(TEMPO_ACCEPT_SEC / hopSec);
  const beatStart = k => Math.round(anchor + k * period);

  function segBeats(fromBar) { return beatChroma.slice(seg.start + fromBar * beatsPerBar); }

  function closeSegment(ev) {
    for (const bar of _dspBarsFromBeats(segBeats(seg.emitted), beatsPerBar, chordsPerBar)) ev.push(Object.assign({ type: 'bar' }, bar));
    seg = null;
  }

  function finishBeat(ev) {
    const beat = _dspMakeBeat(beatFrames, stats.threshold());
    beatFrames = [];
    beatK++;
    if (!seg) { seg = { start: beatChroma.length, emitted: 0 }; beat.start = true; }
    beatChroma.push(beat);
    silentRun = beat.silent ? silentRun + 1 : 0;
    if (silentRun >= 2 * beatsPerBar) {
      closeSegment(ev);
      ev.push({ type: 'pause' });
      paused = true;
      mode = 'waiting';
      silentRun = 0;
      return;
    }
    const len = beatChroma.length - seg.start;
    const ready = Math.floor((len - silentRun) / beatsPerBar);
    while (seg.emitted < ready) {
      const s = seg.start + seg.emitted * beatsPerBar;
      ev.push(Object.assign({ type: 'bar' }, _dspBar(beatChroma.slice(s, s + beatsPerBar), chordsPerBar)));
      seg.emitted++;
    }
  }

  function startRunning(anchorFrame, ev) {
    anchor = anchorFrame;
    beatK = 0; beatFrames = []; silentRun = 0;
    if (firstBeatFrame == null) firstBeatFrame = Math.round(anchor);
    if (paused) { ev.push({ type: 'resume' }); paused = false; }
    mode = 'running';
    const pending = buffer;
    buffer = []; soundFrames = 0;
    for (const it of pending) process(it, ev);
  }

  function tryTempo(ev, force) {
    const t = estimateTempo(buffer.map(it => it.f.onset || 0), hopSec);
    const ok = t.confident || (force ? t.confidence > 0 : (soundFrames >= accept && t.confidence > 0));
    if (!ok) return false;
    period = t.period; bpm = t.bpm;
    if (!tempoEmitted) { ev.push({ type: 'tempo', bpm }); tempoEmitted = true; }
    let a = buffer[0].g + t.phase;
    if (a - period >= buffer[0].g - 1) a -= period; // phase repliée juste avant le début du son
    startRunning(a, ev);
    return true;
  }

  function process(it, ev) {
    const { g, f } = it;
    const sounding = f.rms >= stats.threshold();
    if (mode === 'waiting') {
      if (!sounding) return;
      mode = 'anchoring';
      buffer = []; soundFrames = 0; nextTry = minSound;
    }
    if (mode === 'anchoring') {
      buffer.push(it);
      if (sounding) soundFrames++;
      if (period == null) {
        if (soundFrames >= nextTry) { if (!tryTempo(ev, false)) nextTry = soundFrames + retry; }
      } else if (buffer.length >= Math.ceil(period / 2) + 1) {
        // Tempo connu : la grille part de l'attaque la plus forte du premier demi-temps.
        const win = buffer.slice(0, Math.ceil(period / 2) + 1);
        let best = win[0];
        for (const w of win) if ((w.f.onset || 0) > (best.f.onset || 0)) best = w;
        startRunning(best.g, ev);
      }
      return;
    }
    // running
    if (g < beatStart(0)) return;
    while (g >= beatStart(beatK + 1)) {
      finishBeat(ev);
      if (mode !== 'running') { process(it, ev); return; }
    }
    beatFrames.push(f);
  }

  return {
    pushFrame(f) {
      stats.add(f.rms);
      const ev = [];
      process({ g: frameIndex++, f }, ev);
      return ev;
    },
    flush() {
      const ev = [];
      if (mode === 'anchoring') {
        if (period == null) { if (soundFrames < 4 || !tryTempo(ev, true)) return ev; }
        else startRunning(buffer[0].g, ev);
      }
      if (mode === 'running') {
        const expected = beatStart(beatK + 1) - beatStart(beatK);
        if (beatFrames.length * 2 >= expected && beatFrames.length) finishBeat(ev);
        if (seg) closeSegment(ev);
        mode = 'waiting';
      }
      return ev;
    },
    data() {
      return { bpm, beatChroma, firstBeatFrame };
    }
  };
}

// Reconstruit toutes les mesures depuis les temps gardés (mêmes règles que l'assembleur).
// Les temps marqués `start` (début d'écoute, reprise après pause) recommencent une grille de mesures.
// beatOffset > 0 : on saute les premiers temps de chaque suite ; < 0 : temps absents ajoutés devant.
function rebuildBars(data, opts) {
  const beatsPerBar = Math.max(1, opts.beatsPerBar | 0 || 4);
  const chordsPerBar = opts.chordsPerBar === 2 ? 2 : 1;
  const off = opts.beatOffset | 0;
  const beats = (data && data.beatChroma) || [];
  const segments = [];
  for (const b of beats) {
    if (b.start || !segments.length) segments.push([]);
    segments[segments.length - 1].push(b);
  }
  const out = [];
  for (let s of segments) {
    if (off > 0) s = s.slice(off);
    else if (off < 0) s = Array.from({ length: -off }, () => ({ absent: true, silent: true })).concat(s);
    for (const bar of _dspBarsFromBeats(s, beatsPerBar, chordsPerBar)) out.push(bar);
  }
  return out;
}

// ── Tonalité ─────────────────────────────────────────────────────────────────
const _DSP_KK_MAJOR = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88];
const _DSP_KK_MINOR = [6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17];

function _dspPearson(a, b) {
  const n = a.length;
  const ma = a.reduce((s, x) => s + x, 0) / n, mb = b.reduce((s, x) => s + x, 0) / n;
  let num = 0, da = 0, db = 0;
  for (let i = 0; i < n; i++) { num += (a[i] - ma) * (b[i] - mb); da += (a[i] - ma) ** 2; db += (b[i] - mb) ** 2; }
  return da > 0 && db > 0 ? num / Math.sqrt(da * db) : 0;
}

// Tonalité ('Ab', 'Fm'…) par corrélation du chroma total des temps sonores avec les profils de
// Krumhansl-Kessler (24 tonalités). null s'il n'y a aucun temps sonore.
function estimateKey(beatChroma) {
  const total = new Array(12).fill(0);
  let any = false;
  for (const b of beatChroma || []) {
    if (!b || b.silent || !b.chroma) continue;
    for (let i = 0; i < 12; i++) total[i] += b.chroma[i];
    any = true;
  }
  if (!any || total.every(x => x === 0)) return null;
  let best = null, bestR = -Infinity;
  for (let r = 0; r < 12; r++) {
    for (const [prof, suffix] of [[_DSP_KK_MAJOR, ''], [_DSP_KK_MINOR, 'm']]) {
      const rot = prof.map((_, i) => prof[(i - r + 12) % 12]);
      const c = _dspPearson(total, rot);
      if (c > bestR) { bestR = c; best = ROOT_NAMES[r] + suffix; }
    }
  }
  return best;
}

// ── Sections ─────────────────────────────────────────────────────────────────
// Blocs de sizes[0] mesures (sinon sizes[1]…) ; le dernier bloc peut être plus court. Blocs identiques
// → même lettre, dans l'ordre d'apparition. Première taille où un bloc se répète ; null sinon.
function proposeSections(symbolsPerBar, sizes = [8, 4]) {
  const bars = symbolsPerBar || [];
  for (const size of sizes) {
    if (!(size > 0) || bars.length < 2 * size) continue;
    const blocks = [];
    for (let s = 0; s < bars.length; s += size) {
      const len = Math.min(size, bars.length - s);
      blocks.push({ start: s, length: len, key: len + '|' + bars.slice(s, s + len).join('\u0001') });
    }
    const seen = new Map();
    let repeated = false;
    for (const b of blocks) {
      if (seen.has(b.key)) repeated = true;
      else seen.set(b.key, String.fromCharCode(65 + (seen.size % 26)));
    }
    if (repeated) return blocks.map(b => ({ start: b.start, length: b.length, label: seen.get(b.key) }));
  }
  return null;
}

if (typeof module !== 'undefined') module.exports = {
  FRAME_SIZE, HOP_SIZE, CHORD_QUALITIES, ROOT_NAMES, UNCERTAIN_MARGIN,
  fftMagnitudes, chromaFromFrame, matchChord, onsetStrength, estimateTempo,
  createBarAssembler, rebuildBars, estimateKey, proposeSections
};

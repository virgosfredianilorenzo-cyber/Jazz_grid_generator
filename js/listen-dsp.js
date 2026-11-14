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
// affinés par interpolation parabolique), de 40 à 280 BPM ; parmi les pics ≥ 0.9 × le maximum, le plus
// petit délai (tempo le plus rapide). Octave : au-dessus de OCTAVE_FAST_BPM, si le pic au double du délai
// (moitié du tempo) est nettement plus haut (pic rapide < OCTAVE_ACCENT × pic lent : une attaque sur deux
// est plus faible, ce sont des croches), la moitié du tempo est retenue ; des noires égales (bebop à 240)
// gardent le tempo rapide. Des croches parfaitement égales restent ambiguës : boutons ×2 / ÷2. La période est ensuite affinée (±0.5 trame) en ajustant une grille de temps sur
// tout le signal, ce qui donne aussi la phase : décalage (en trames, dans [0, period)) du premier
// temps qui maximise la somme des attaques sur la grille phase + k·period.
// period et phase sont fractionnaires (en trames de hopSec).
// confidence = hauteur du pic retenu / variance de l'enveloppe (0 si aucun pic) ;
// confident = confidence ≥ TEMPO_MIN_CONFIDENCE. Le repli (120 BPM) n'est jamais « confident ».
const TEMPO_MIN_CONFIDENCE = 0.1;
const TEMPO_MIN_BPM = 40, TEMPO_MAX_BPM = 280;
const OCTAVE_FAST_BPM = 160;
const OCTAVE_ACCENT = 0.955;
function estimateTempo(onsets, hopSec, minBpm = TEMPO_MIN_BPM, maxBpm = TEMPO_MAX_BPM) {
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
  let pk = peaks.find(k => k.v >= 0.9 * maxAc);
  if (60 / (pk.p * hopSec) > OCTAVE_FAST_BPM) {
    const slow = peaks.find(k => Math.abs(k.p - 2 * pk.p) <= 1.5);
    if (slow && pk.v < OCTAVE_ACCENT * slow.v) pk = slow;
  }
  const p0 = pk.p;
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
const SPLIT_MARGIN = 0.05;       // mode 2 : gain minimal (score moyen) de deux accords sur un seul
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

// Somme des chroma / basse des trames sonores d'un morceau de temps : {chroma, bass, n (trames), s (sonores)}.
function _dspAccum(frames, thr) {
  const chroma = new Array(12).fill(0), bass = new Array(12).fill(0);
  let s = 0;
  for (const f of frames) {
    if (!(f.rms >= thr)) continue;
    s++;
    for (let i = 0; i < 12; i++) { chroma[i] += f.chroma[i]; bass[i] += (f.bass && f.bass[i]) || 0; }
  }
  return { chroma, bass, n: frames.length, s };
}

// Temps à partir de ses parties (sommes) : chroma / basse moyens des trames sonores, drapeau `silent`.
function _dspBeatFromParts(parts) {
  const chroma = new Array(12).fill(0), bass = new Array(12).fill(0);
  let n = 0, s = 0;
  for (const p of parts) {
    n += p.n; s += p.s;
    for (let i = 0; i < 12; i++) { chroma[i] += p.chroma[i]; bass[i] += p.bass[i]; }
  }
  if (s) for (let i = 0; i < 12; i++) { chroma[i] /= s; bass[i] /= s; }
  return { chroma, bass, silent: s * 2 <= n };
}

// Temps à partir de ses trames ; `h` garde les deux moitiés (sommes) : bords d'une coupe, tempo ×2.
function _dspMakeBeat(frames, thr) {
  const m = Math.ceil(frames.length / 2);
  const h = [_dspAccum(frames.slice(0, m), thr), _dspAccum(frames.slice(m), thr)];
  return Object.assign(_dspBeatFromParts(h), { h });
}

// Demi-temps (moitié i d'un temps qui garde ses moitiés), null s'il est vide.
function _dspHalfBeat(b, i) {
  if (!b || b.absent || !b.h || !b.h[i] || !b.h[i].n) return null;
  return _dspBeatFromParts([b.h[i]]);
}

// Score du gabarit `symbol` sur un chroma (même calcul que matchChord).
function _dspTemplateScore(chroma, bass, symbol) {
  const t = _DSP_TEMPLATES.find(x => x.symbol === symbol);
  if (!t) return -Infinity;
  const cn = Math.sqrt(chroma.reduce((s, x) => s + x * x, 0));
  let dot = 0;
  for (let i = 0; i < 12; i++) dot += chroma[i] * t.v[i];
  return (cn > 0 ? dot / cn : 0) + BASS_BONUS * ((bass && bass[t.root]) || 0);
}

// Accord d'un groupe de temps : N.C. si plus de la moitié des temps présents sont silencieux ;
// sinon matchChord sur le chroma moyen des temps sonores. null si aucun temps présent.
// Un temps `absent` (bourrage) ne compte pas.
function _dspSegmentChord(beats) {
  const present = beats.filter(b => b && !b.absent);
  if (!present.length) return null;
  const sounding = present.filter(b => !b.silent);
  if (sounding.length * 2 < present.length) return { symbol: 'N.C.', uncertain: false };
  const chroma = new Array(12).fill(0), bass = new Array(12).fill(0);
  for (const b of sounding) for (let i = 0; i < 12; i++) { chroma[i] += b.chroma[i]; bass[i] += b.bass[i]; }
  for (let i = 0; i < 12; i++) { chroma[i] /= sounding.length; bass[i] /= sounding.length; }
  const m = matchChord(chroma, bass);
  return { symbol: m.symbol, uncertain: m.margin < UNCERTAIN_MARGIN, score: m.score, chroma, bass };
}

// Une mesure complète (beats.length = beatsPerBar). Mode 2 = « jusqu'à 2 » : coupe ceil(n/2) + floor(n/2)
// (4/4 → 2+2, 3/4 → 2+1, 5/4 → 3+2). Second accord seulement si les deux moitiés diffèrent, qu'aucune
// n'est incertaine et que l'ajustement à deux accords gagne au moins SPLIT_MARGIN sur l'accord unique.
// Les moitiés sont évaluées sans les bords de la coupe (dernier demi-temps avant, premier demi-temps après),
// où une fenêtre d'analyse voit les deux accords.
function _dspBar(beats, chordsPerBar) {
  const n = beats.length;
  const whole = _dspSegmentChord(beats);
  if (chordsPerBar === 2 && n >= 2) {
    const n1 = Math.ceil(n / 2);
    const A = beats.slice(0, n1), B = beats.slice(n1);
    const a = _dspHalfBeat(A[A.length - 1], 0), b = _dspHalfBeat(B[0], 1);
    if (a) A[A.length - 1] = a;
    if (b) B[0] = b;
    const c1 = _dspSegmentChord(A), c2 = _dspSegmentChord(B);
    let split = !!(c1 && c2 && c1.symbol !== c2.symbol);
    if (split && c1.symbol !== 'N.C.' && c2.symbol !== 'N.C.') {
      const gain = whole && whole.symbol !== 'N.C.'
        ? (n1 * (c1.score - _dspTemplateScore(c1.chroma, c1.bass, whole.symbol)) +
           (n - n1) * (c2.score - _dspTemplateScore(c2.chroma, c2.bass, whole.symbol))) / n
        : Infinity;
      split = !c1.uncertain && !c2.uncertain && gain >= SPLIT_MARGIN;
    }
    if (split) {
      return { chords: [
        { symbol: c1.symbol, beats: n1, uncertain: c1.uncertain },
        { symbol: c2.symbol, beats: n - n1, uncertain: c2.uncertain }
      ] };
    }
  }
  return { chords: [{ symbol: whole.symbol, beats: n, uncertain: whole.uncertain }] };
}

// ── Premier temps de mesure ──
// Chaque suite de temps (début d'écoute, reprise après pause) choisit sa grille de mesures : le décalage
// (0 … beatsPerBar − 1 temps) qui minimise la variance du chroma à l'intérieur des mesures (les accords
// changent sur les barres de mesure), sur les DOWNBEAT_DECIDE_BARS premières mesures ; à égalité (vamp sur
// un accord), la première attaque reste le premier temps. En cours de suite, toutes les mesures, la même
// mesure est faite sur les DOWNBEAT_WINDOW_BARS dernières mesures ; si un autre décalage est nettement
// meilleur deux fois de suite (temps perdu ou gagné par le suivi), la grille se recale : les temps sautés
// forment une mesure complétée s'ils en font au moins la moitié, sinon ils sont écartés.
// Limite : un morceau dont l'harmonie change toujours au milieu de la mesure (ou en avance, sur le 4e temps)
// peut être calé à contretemps ; ◀ ▶ décalent alors toute la grille.
const DOWNBEAT_DECIDE_BARS = 4;
const DOWNBEAT_WINDOW_BARS = 8;
const DOWNBEAT_MIN_BARS = 4;      // mesures depuis le dernier recalage avant d'en envisager un autre
const DOWNBEAT_FIRST_RATIO = 0.7;  // premier choix : un décalage doit faire mieux que 0.7 × le coût sans décalage
const DOWNBEAT_REPHASE_RATIO = 0.6;
const DOWNBEAT_MIN_COST = 0.02;

const _DSP_ABSENT = () => ({ absent: true, silent: true });

// Variance (somme des écarts au carré) du chroma + 0.5 × basse des temps sonores d'une mesure.
function _dspBarCost(beats, from, to) {
  const vs = [];
  for (let i = from; i < to; i++) {
    const b = beats[i];
    if (!b || b.silent || b.absent || !b.chroma) continue;
    vs.push(b.chroma.concat((b.bass || []).map(x => 0.5 * x)));
  }
  if (vs.length < 2) return 0;
  const m = vs[0].map((_, k) => vs.reduce((s, v) => s + (v[k] || 0), 0) / vs.length);
  let c = 0;
  for (const v of vs) for (let k = 0; k < m.length; k++) c += ((v[k] || 0) - m[k]) ** 2;
  return c;
}

// Coût moyen par mesure de chaque décalage o : K mesures [from + o + k·bpb, …), le même nombre K pour
// tous les décalages (toutes entières dans [from, to)).
function _dspPhaseCosts(beats, from, to, bpb) {
  const K = Math.floor((to - from - (bpb - 1)) / bpb);
  const out = [];
  for (let o = 0; o < bpb; o++) {
    let c = 0;
    for (let k = 0; k < K; k++) { const s = from + o + k * bpb; c += _dspBarCost(beats, s, s + bpb); }
    out.push(K > 0 ? c / K : 0);
  }
  return out;
}

// Une mesure incomplète au début (complétée devant) ou à la fin (complétée derrière).
function _dspPadBar(beats, bpb, front) {
  const pad = Array.from({ length: bpb - beats.length }, _DSP_ABSENT);
  return front ? pad.concat(beats) : beats.concat(pad);
}

// Assemble les mesures d'une suite de temps, temps par temps (même suite de décisions en direct et à la
// reconstruction). shift : décalage global (◀ ▶) ajouté au premier temps choisi.
// Un silence long (≥ 2 mesures) coupe la suite : la grille repart (nouveau choix) au temps sonore suivant ;
// le silence final est retiré ; la dernière mesure incomplète est gardée si au moins la moitié des temps
// sont là. Une mesure n'est émise que lorsqu'elle ne finit pas par un silence (il peut devenir une pause).
function _dspBarBuilder(beatsPerBar, chordsPerBar, shift) {
  const bpb = beatsPerBar, longRun = 2 * bpb;
  let beats = [], pos = null, gridFrom = 0, cand = 0, quiet = 0, waitSound = false;
  const isQuiet = b => b.silent || b.absent;
  const bar = (bs, out) => out.push(_dspBar(bs, chordsPerBar));

  function decide(end, out) {
    let o = 0;
    const c = _dspPhaseCosts(beats, 0, end, bpb);
    if (end >= DOWNBEAT_DECIDE_BARS * bpb) for (let k = 1; k < bpb; k++) if (c[k] < c[o]) o = k;
    if (o && !(c[0] > DOWNBEAT_MIN_COST && c[o] < DOWNBEAT_FIRST_RATIO * c[0])) o = 0;
    const p = (((o + (shift | 0)) % bpb) + bpb) % bpb;
    if (p && p * 2 >= bpb) bar(_dspPadBar(beats.slice(0, p), bpb, true), out);
    pos = gridFrom = p; cand = 0;
  }

  // Mesures entières jusqu'à `end` ; recalage éventuel avant chacune.
  function emit(end, out) {
    while (pos + bpb <= end) {
      const e = pos + bpb;
      if (e - gridFrom >= DOWNBEAT_MIN_BARS * bpb) {
        const c = _dspPhaseCosts(beats, Math.max(gridFrom, e - DOWNBEAT_WINDOW_BARS * bpb), e, bpb);
        let o = 0;
        for (let k = 1; k < bpb; k++) if (c[k] < c[o]) o = k;
        if (o && c[0] > DOWNBEAT_MIN_COST && c[o] < DOWNBEAT_REPHASE_RATIO * c[0]) {
          if (cand === o) {
            if (o * 2 >= bpb) bar(_dspPadBar(beats.slice(pos, pos + o), bpb, true), out);
            pos = gridFrom = pos + o; cand = 0;
            continue;
          }
          cand = o;
        } else cand = 0;
      }
      bar(beats.slice(pos, e), out);
      pos = e;
    }
  }

  function closePart(out) {
    const end = beats.length - quiet;
    if (end > 0) {
      if (pos === null) decide(end, out);
      emit(end, out);
      const rest = end - pos;
      if (rest > 0 && rest * 2 >= bpb) bar(_dspPadBar(beats.slice(pos, end), bpb, false), out);
    }
    beats = []; pos = null; quiet = 0; cand = 0;
  }

  return {
    push(b) {
      const out = [];
      if (waitSound) { if (isQuiet(b)) return out; waitSound = false; }
      beats.push(b);
      quiet = isQuiet(b) ? quiet + 1 : 0;
      if (quiet >= longRun) { closePart(out); waitSound = true; return out; }
      if (pos === null) {
        if (beats.length - quiet < DOWNBEAT_DECIDE_BARS * bpb) return out;
        decide(beats.length - quiet, out);
      }
      emit(beats.length - quiet, out);
      return out;
    },
    close() { const out = []; if (beats.length) closePart(out); waitSound = false; return out; }
  };
}

// Suivi de temps (boucle à verrouillage de phase). La grille n'est pas figée : à chaque temps prédit, on
// cherche l'attaque la plus forte à ±TRACK_WINDOW période ; l'erreur e (trames) corrige la frontière du
// temps (TRACK_ALPHA × e) et la période (TRACK_BETA × e). La période reste à ±TRACK_CLAMP d'une référence
// qui la suit lentement (dérive cumulée permise). Sans attaque nette dans la fenêtre, la grille continue.
// Décrochage (trou de lecture, saut de tempo) : si, sur REACQ_BEATS temps, les attaques tombent nettement
// ailleurs qu'autour des temps prédits, la grille est recalée sur elles ; après un court silence de durée d
// compatible avec ce décalage (trou de mise en mémoire tampon), la grille est retardée de d (le compte des
// temps est gardé), sinon recalée au plus près.
// Le tempo saisi ou tapé n'est qu'un point de départ, affiné de la même façon.
const TRACK_WINDOW = 0.15;
const TRACK_ALPHA = 0.2;
const TRACK_BETA = 0.02;
const TRACK_CLAMP = 0.05;
const TRACK_REF_RATE = 0.02;
const TRACK_MIN_LEVEL = 0.25;  // attaque retenue si ≥ 0.25 × niveau habituel des attaques sur les temps
const REACQ_BEATS = 4;
const REACQ_RATIO = 2;
const PHASE_BINS = 20;
const FRAME_SPAN = FRAME_SIZE / HOP_SIZE; // trames qui voient un même échantillon
// Nouvelle estimation (tempo initial faux, p. ex. intro rubato) : toutes les TEMPO_RETRY_SEC, tempo estimé
// sur les RETRACK_SEC dernières secondes ; la grille est reposée sur ce tempo s'il est fiable, ni proche du
// tempo suivi ni à l'octave, confirmé deux fois de suite, et si sa grille tombe nettement mieux sur les
// attaques (≥ RETRACK_GAIN ×) que les temps suivis.
const RETRACK_SEC = 10;
const RETRACK_GAIN = 1.3;

// opts = {beatsPerBar, chordsPerBar: 1|2, bpm?, hopSec}
function createBarAssembler(opts) {
  const beatsPerBar = Math.max(1, opts.beatsPerBar | 0 || 4);
  const chordsPerBar = opts.chordsPerBar === 2 ? 2 : 1;
  const hopSec = opts.hopSec;
  const stats = _dspRmsStats();
  let period = opts.bpm ? 60 / opts.bpm / hopSec : null;
  let pref = period;           // référence de période (suit lentement la période suivie)
  let bpm = opts.bpm || null;
  let tempoEmitted = false;

  let frameIndex = 0;          // index global de la prochaine trame reçue
  let mode = 'waiting';        // waiting (pas de son) | anchoring (son, grille pas encore posée) | running
  let paused = false;          // une pause a eu lieu (la prochaine reprise émet 'resume')
  let buffer = [];             // trames {g, f} en attente (anchoring)
  let soundFrames = 0;         // trames sonores dans buffer
  let nextTry = 0;             // nombre de trames sonores requis avant le prochain essai d'estimation
  let cur = 0, next = 0;       // début du temps en cours, début prédit du suivant (trames, fractionnaires)
  let pend = [];               // trames {g, f} reçues depuis le début du temps en cours
  let level = 0;               // niveau habituel des attaques retenues
  let profiles = [];           // profils de phase des derniers temps (décrochage)
  let quietFrames = 0, lastGap = null; // court silence le plus récent {end, len} (trames)
  let recent = [], retrackAt = 0, retrackCand = null; // attaques récentes {g, v} (nouvelle estimation)
  let firstBeatFrame = null;
  const beatChroma = [], beatLengths = [];
  let builder = null;          // mesures de la suite en cours (null : pas de suite ouverte)
  let silentRun = 0;

  const minSound = Math.round(TEMPO_MIN_SOUND_SEC / hopSec);
  const retry = Math.round(TEMPO_RETRY_SEC / hopSec);
  const accept = Math.round(TEMPO_ACCEPT_SEC / hopSec);
  const onsetOf = it => it.f.onset || 0;

  function finishBeat(ev, frames, b0, b1) {
    const beat = _dspMakeBeat(frames.map(it => it.f), stats.threshold());
    beat.at = Math.round(b0 * 100) / 100;
    beatLengths.push(b1 - b0);
    if (!builder) { builder = _dspBarBuilder(beatsPerBar, chordsPerBar, 0); beat.start = true; }
    beatChroma.push(beat);
    for (const bar of builder.push(beat)) ev.push(Object.assign({ type: 'bar' }, bar));
    silentRun = beat.silent ? silentRun + 1 : 0;
    if (silentRun >= 2 * beatsPerBar) {
      closeSegment(ev);
      ev.push({ type: 'pause' });
      paused = true;
      mode = 'waiting';
      silentRun = 0;
    }
  }

  function closeSegment(ev) {
    for (const bar of builder.close()) ev.push(Object.assign({ type: 'bar' }, bar));
    builder = null;
  }

  // Profil de phase du temps [b0, b1) (attaques normalisées par classe de phase) ; décrochage éventuel.
  function phaseCheck(frames, b0, b1) {
    const prof = new Float64Array(PHASE_BINS);
    let tot = 0;
    for (const it of frames) {
      let ph = (it.g - b0) / (b1 - b0);
      ph -= Math.floor(ph); // une trame juste avant b0 (frontière arrondie) est en fin de cycle
      const v = onsetOf(it);
      if (v <= 0) continue;
      prof[Math.min(PHASE_BINS - 1, Math.floor(ph * PHASE_BINS))] += v; tot += v;
    }
    if (tot > 0) for (let i = 0; i < PHASE_BINS; i++) prof[i] /= tot;
    profiles.push(prof);
    if (profiles.length > REACQ_BEATS) profiles.shift();
    if (profiles.length < REACQ_BEATS) return;
    const sum = new Float64Array(PHASE_BINS);
    for (const p of profiles) for (let i = 0; i < PHASE_BINS; i++) sum[i] += p[i];
    // Somme sur ±TRACK_WINDOW autour de chaque classe (circulaire).
    const half = Math.round(TRACK_WINDOW * PHASE_BINS);
    const around = c => { let s = 0; for (let d = -half; d <= half; d++) s += sum[(c + d + PHASE_BINS) % PHASE_BINS]; return s; };
    const inWin = around(0);
    let bc = -1, bv = 0;
    for (let c = 2 * half; c <= PHASE_BINS - 2 * half; c++) { const v = around(c); if (v > bv) { bv = v; bc = c; } }
    if (bc < 0 || bv <= REACQ_RATIO * inWin) return;
    // Centre de gravité de la classe retenue et de ses voisines.
    let m = 0, w = 0;
    for (let d = -half; d <= half; d++) { const v = sum[(bc + d + PHASE_BINS) % PHASE_BINS]; m += v * (bc + d + 0.5); w += v; }
    const phi = (w > 0 ? m / w : bc + 0.5) / PHASE_BINS;
    const P = period;
    // Les attaques tombent à b1 + phi·P : recaler au plus près (avance ou retard), ou retarder de la durée
    // d'un court silence récent si elle correspond (le compte des temps est gardé).
    let shift = phi < 0.5 ? phi * P : (phi - 1) * P;
    if (lastGap && lastGap.end >= b0 - (REACQ_BEATS + 2) * P) {
      const d = lastGap.len + FRAME_SPAN - 1; // durée du trou (les trames qui le chevauchent ne sont pas muettes)
      const k = Math.round((d - phi * P) / P);
      if (Math.abs(d - phi * P - k * P) <= 2 * TRACK_WINDOW * P) shift = phi * P + k * P;
      lastGap = null;
    }
    next = b1 + P + shift;
    if (next < b1 + 0.5 * P) next += P;
    profiles = [];
  }

  // Frontière du temps en cours : attaque la plus forte près du temps prédit, corrections de phase et de période.
  function decideBeat(ev) {
    const w = TRACK_WINDOW * period;
    let bi = -1;
    for (let j = 0; j < pend.length; j++) {
      const d = pend[j].g - next;
      if (d < -w || d > w) continue;
      if (bi < 0 || onsetOf(pend[j]) > onsetOf(pend[bi])) bi = j;
    }
    let e = 0;
    if (bi >= 0) {
      const v = onsetOf(pend[bi]);
      if (v > 0 && v >= TRACK_MIN_LEVEL * level) {
        let pos = pend[bi].g;
        if (bi > 0 && bi + 1 < pend.length) {
          const a = onsetOf(pend[bi - 1]), c = onsetOf(pend[bi + 1]), dd = a - 2 * v + c;
          if (dd < 0) pos += Math.max(-0.5, Math.min(0.5, 0.5 * (a - c) / dd));
        }
        e = Math.max(-w, Math.min(w, pos - next));
        level = level ? level + 0.1 * (v - level) : v;
      }
    }
    let b = next + TRACK_ALPHA * e;
    period = Math.min(pref * (1 + TRACK_CLAMP), Math.max(pref * (1 - TRACK_CLAMP), period + TRACK_BETA * e));
    pref += TRACK_REF_RATE * (period - pref);
    b = Math.max(b, cur + 0.5 * period);
    const end = Math.round(b);
    let k = 0;
    while (k < pend.length && pend[k].g < end) k++;
    const frames = pend.slice(0, k);
    pend = pend.slice(k);
    const b0 = cur;
    cur = b; next = b + period;
    phaseCheck(frames, b0, b);
    finishBeat(ev, frames, b0, b);
    if (mode !== 'running') { const rest = pend; pend = []; for (const it of rest) process(it, ev); }
  }

  // Attaque la plus forte à ±1 trame de x (attaques récentes).
  function onsetNear(x) {
    const i0 = recent.length ? recent[0].g : 0, c = Math.round(x) - i0;
    let m = 0;
    for (let d = -1; d <= 1; d++) { const it = recent[c + d]; if (it && it.v > m) m = it.v; }
    return m;
  }

  function retrack() {
    const t = estimateTempo(recent.map(it => it.v), hopSec);
    const r = t.period / period;
    if (!t.confident || Math.abs(r - 1) < 0.08 || Math.abs(r - 2) < 0.16 || Math.abs(r - 0.5) < 0.04) { retrackCand = null; return; }
    const g0 = recent[0].g, g1 = recent[recent.length - 1].g;
    let eNew = 0, nNew = 0, eCur = 0, nCur = 0;
    for (let x = g0 + t.phase; x <= g1; x += t.period) { eNew += onsetNear(x); nNew++; }
    for (let i = beatChroma.length - 1; i >= 0 && beatChroma[i].at >= g0; i--) { eCur += onsetNear(beatChroma[i].at); nCur++; }
    if (!nNew || !nCur || eNew / nNew < RETRACK_GAIN * (eCur / nCur)) { retrackCand = null; return; }
    if (!retrackCand || Math.abs(retrackCand / t.period - 1) > 0.03) { retrackCand = t.period; return; }
    retrackCand = null;
    period = pref = t.period;
    const k = Math.ceil((cur + 0.5 * period - (g0 + t.phase)) / period);
    next = g0 + t.phase + k * period;
    profiles = []; level = 0;
  }

  function startRunning(anchorFrame, ev) {
    cur = anchorFrame; next = cur + period;
    pend = []; silentRun = 0; profiles = []; recent = []; retrackCand = null;
    retrackAt = frameIndex + retry;
    if (firstBeatFrame == null) firstBeatFrame = Math.round(cur);
    if (paused) { ev.push({ type: 'resume' }); paused = false; }
    mode = 'running';
    const pending = buffer;
    buffer = []; soundFrames = 0;
    for (const it of pending) process(it, ev);
  }

  function tryTempo(ev, force) {
    const t = estimateTempo(buffer.map(onsetOf), hopSec);
    const ok = t.confident || (force ? t.confidence > 0 : (soundFrames >= accept && t.confidence > 0));
    if (!ok) return false;
    period = pref = t.period; bpm = t.bpm;
    if (!tempoEmitted) { ev.push({ type: 'tempo', bpm }); tempoEmitted = true; }
    let a = buffer[0].g + t.phase;
    // Phase repliée avant le début du son : la trame 0 n'a pas d'attaque (pas de trame précédente), un son
    // qui commence à l'échantillon 0 n'a son premier temps visible qu'au deuxième temps.
    if (a - period >= buffer[0].g - period / 2) a -= period;
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
        for (const w of win) if (onsetOf(w) > onsetOf(best)) best = w;
        startRunning(best.g, ev);
      }
      return;
    }
    // running
    recent.push({ g, v: onsetOf(it) });
    if (recent.length > RETRACK_SEC / hopSec) recent.shift();
    if (g < Math.round(cur)) return;
    pend.push(it);
    while (mode === 'running' && g >= next + TRACK_WINDOW * period + 1) decideBeat(ev);
    if (mode === 'running' && g >= retrackAt) {
      retrackAt = g + retry;
      if (recent.length >= RETRACK_SEC / hopSec - 1) retrack();
    }
  }

  function flushAll() {
    const ev = [];
    if (mode === 'anchoring') {
      if (period == null) { if (soundFrames < 4 || !tryTempo(ev, true)) return ev; }
      else startRunning(buffer[0].g, ev);
    }
    if (mode === 'running') {
      const end = Math.round(next);
      const frames = pend.filter(it => it.g < end);
      if (frames.length && frames.length * 2 >= end - Math.round(cur)) finishBeat(ev, frames, cur, next);
      pend = [];
      if (builder) closeSegment(ev);
      mode = 'waiting';
    }
    return ev;
  }

  // Courts silences (trous de lecture) : durée en trames entièrement silencieuses.
  function watchGaps(g, f) {
    if (f.rms < stats.threshold()) { quietFrames++; return; }
    if (quietFrames >= 2 && period && quietFrames < 2 * beatsPerBar * period) lastGap = { end: g, len: quietFrames };
    quietFrames = 0;
  }

  return {
    pushFrame(f) {
      stats.add(f.rms);
      const ev = [];
      const g = frameIndex++;
      watchGaps(g, f);
      process({ g, f }, ev);
      return ev;
    },
    flush() { return flushAll(); },
    // Pause de l'analyse (onglet : la musique continue, on n'écoute plus) : fin de la suite comme au flush,
    // événement 'pause' ; les trames suivantes reprennent comme après un silence long ('resume', grille
    // recalée sur la première attaque, tempo gardé).
    pause() {
      const ev = flushAll();
      ev.push({ type: 'pause' });
      paused = true;
      buffer = []; soundFrames = 0; quietFrames = 0; lastGap = null;
      return ev;
    },
    data() {
      // Tempo : médiane des durées de temps suivies (sinon le tempo estimé ou saisi).
      let b = bpm;
      if (beatLengths.length >= 8) {
        const s = beatLengths.slice().sort((x, y) => x - y);
        b = 60 / (s[s.length >> 1] * hopSec);
      }
      return { bpm: b, beatChroma, firstBeatFrame };
    }
  };
}

// Somme de parties de temps (voir _dspAccum).
function _dspSumParts(parts) {
  const out = { chroma: new Array(12).fill(0), bass: new Array(12).fill(0), n: 0, s: 0 };
  for (const p of parts) {
    out.n += p.n; out.s += p.s;
    for (let i = 0; i < 12; i++) { out.chroma[i] += p.chroma[i]; out.bass[i] += p.bass[i]; }
  }
  return out;
}

// Tempo ×2 (factor 2 : chaque temps coupé en ses deux moitiés) ou ÷2 (factor 0.5 : temps fusionnés par
// paires, à partir du premier temps de chaque suite ; un dernier temps seul reste seul). Autre facteur :
// temps inchangés. Les marques `start` (suites) sont gardées.
function scaleBeats(beats, factor) {
  beats = beats || [];
  if (factor === 2) {
    const out = [];
    for (const b of beats) {
      if (!b.h) { out.push(b, Object.assign({}, b, { start: undefined })); continue; }
      b.h.forEach((part, i) => {
        const nb = Object.assign(_dspBeatFromParts([part]), { at: b.at });
        if (i === 0 && b.start) nb.start = true;
        out.push(nb);
      });
    }
    return out;
  }
  if (factor === 0.5) {
    const out = [];
    let i = 0;
    while (i < beats.length) {
      const a = beats[i], b = beats[i + 1];
      if (!b || b.start || !a.h || !b.h) { out.push(a); i++; continue; }
      const h = [_dspSumParts(a.h), _dspSumParts(b.h)];
      const nb = Object.assign(_dspBeatFromParts(h), { h, at: a.at });
      if (a.start) nb.start = true;
      out.push(nb);
      i += 2;
    }
    return out;
  }
  return beats;
}

// Reconstruit toutes les mesures depuis les temps gardés : chaque suite (temps marqué `start` : début
// d'écoute, reprise après pause) repasse dans un assembleur de mesures neuf, temps par temps, comme en direct
// (sans décalage, même métrique, même mode et facteur 1 : mesures identiques au direct).
// beatOffset : décalage global (en temps) ajouté au premier temps choisi de chaque suite.
// tempoFactor : 2 (tempo double, temps coupés) ou 0.5 (moitié, temps fusionnés), 1 par défaut.
function rebuildBars(data, opts) {
  const beatsPerBar = Math.max(1, opts.beatsPerBar | 0 || 4);
  const chordsPerBar = opts.chordsPerBar === 2 ? 2 : 1;
  const off = opts.beatOffset | 0;
  const beats = scaleBeats((data && data.beatChroma) || [], opts.tempoFactor);
  const out = [];
  let builder = null;
  for (const b of beats) {
    if (b.start || !builder) {
      if (builder) out.push(...builder.close());
      builder = _dspBarBuilder(beatsPerBar, chordsPerBar, off);
    }
    out.push(...builder.push(b));
  }
  if (builder) out.push(...builder.close());
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
  FRAME_SIZE, HOP_SIZE, CHORD_QUALITIES, ROOT_NAMES, UNCERTAIN_MARGIN, TEMPO_MIN_BPM, TEMPO_MAX_BPM,
  fftMagnitudes, chromaFromFrame, matchChord, onsetStrength, estimateTempo,
  createBarAssembler, rebuildBars, scaleBeats, estimateKey, proposeSections
};

// Générateur de signaux de test pour le moteur d'écoute (aucune dépendance).
// Toutes les fonctions renvoient des Float32Array d'échantillons mono.
const SR = 44100;
const PC = { C: 0, Db: 1, D: 2, Eb: 3, E: 4, F: 5, Gb: 6, G: 7, Ab: 8, A: 9, Bb: 10, B: 11 };
const INTERVALS = {
  maj7: [0, 4, 7, 11], m7: [0, 3, 7, 10], '7': [0, 4, 7, 10], m7b5: [0, 3, 6, 10], dim7: [0, 3, 6, 9],
  maj: [0, 4, 7], m: [0, 3, 7]
};

function midiToHz(m) { return 440 * Math.pow(2, (m - 69) / 12); }

function silence(seconds, sr = SR) { return new Float32Array(Math.round(seconds * sr)); }

// notes : numéros MIDI. opts.harmonics (défaut 3, amplitudes 1, 1/2, 1/3…),
// opts.bass : numéro MIDI d'une basse ajoutée (même enveloppe), opts.amp : amplitude crête approx.
function chordSamples(notes, seconds, sr = SR, opts = {}) {
  const harmonics = opts.harmonics == null ? 3 : opts.harmonics;
  const amp = opts.amp == null ? 0.5 : opts.amp;
  const n = Math.round(seconds * sr);
  const out = new Float32Array(n);
  const voices = notes.map(m => ({ m, g: 1 }));
  if (opts.bass != null) voices.push({ m: opts.bass, g: 1.2 });
  let norm = 0;
  voices.forEach(v => { for (let h = 1; h <= harmonics; h++) norm += v.g / h; });
  voices.forEach((v, vi) => {
    const f0 = midiToHz(v.m);
    for (let h = 1; h <= harmonics; h++) {
      const f = f0 * h;
      if (f >= sr / 2) break;
      const a = amp * v.g / h / norm;
      const w = 2 * Math.PI * f / sr;
      const ph = (vi * 1.3 + h * 0.7) % (2 * Math.PI);
      for (let i = 0; i < n; i++) out[i] += a * Math.sin(w * i + ph);
    }
  });
  return out;
}

// 'Fm7' -> { notes: [MIDI…] (racine entre C3 et B3), bass: racine une octave en dessous }
function chordNotes(symbol) {
  const mt = /^([A-G](?:b)?)(.*)$/.exec(symbol);
  if (!mt || !(mt[1] in PC) || !(mt[2] in INTERVALS)) throw new Error('accord inconnu : ' + symbol);
  const root = 48 + PC[mt[1]];
  return { notes: INTERVALS[mt[2]].map(i => root + i), bass: root - 12 };
}

function chord(symbol, seconds, sr = SR, opts = {}) {
  const c = chordNotes(symbol);
  return chordSamples(c.notes, seconds, sr, Object.assign({ bass: c.bass }, opts));
}

// Train de clics : salve de bruit déterministe de 5 ms à décroissance exponentielle, sur chaque temps.
function clickTrain(bpm, seconds, sr = SR, opts = {}) {
  const amp = opts.amp == null ? 0.8 : opts.amp;
  const offset = opts.offset || 0; // secondes avant le premier clic
  const out = new Float32Array(Math.round(seconds * sr));
  const len = Math.round(0.005 * sr);
  let seed = 12345;
  const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x40000000 - 1; };
  for (let t = offset; t < seconds; t += 60 / bpm) {
    const s0 = Math.round(t * sr);
    for (let i = 0; i < len && s0 + i < out.length; i++) out[s0 + i] += amp * rnd() * Math.exp(-i / (len / 4));
  }
  return out;
}

function concat(...arrays) {
  const out = new Float32Array(arrays.reduce((s, a) => s + a.length, 0));
  let p = 0;
  for (const a of arrays) { out.set(a, p); p += a.length; }
  return out;
}

// Somme de b (gain g) dans une copie de a ; la longueur est celle du plus long.
function mix(a, b, g = 1) {
  const out = new Float32Array(Math.max(a.length, b.length));
  out.set(a);
  for (let i = 0; i < b.length; i++) out[i] += g * b[i];
  return out;
}

// bars : tableau de mesures ; chaque mesure = symbole ('Fm7'), tableau de symboles
// (répartis à parts égales) ou null (silence). opts.clicks (défaut true) ajoute un clic par temps.
function progression(bars, bpm, beatsPerBar = 4, sr = SR, opts = {}) {
  const barSec = beatsPerBar * 60 / bpm;
  const parts = bars.map(b => {
    if (b == null) return silence(barSec, sr);
    const syms = Array.isArray(b) ? b : [b];
    return concat(...syms.map(s => chord(s, barSec / syms.length, sr, opts)));
  });
  let out = concat(...parts);
  if (opts.clicks !== false) out = mix(out, clickTrain(bpm, out.length / sr, sr), opts.clickGain == null ? 0.5 : opts.clickGain);
  return out;
}

// Fichier WAV mono PCM 16 bits (Buffer) ; les échantillons sont écrêtés à [-1, 1].
function wav(samples, sr = SR) {
  const buf = Buffer.alloc(44 + samples.length * 2);
  buf.write('RIFF', 0); buf.writeUInt32LE(36 + samples.length * 2, 4); buf.write('WAVE', 8);
  buf.write('fmt ', 12); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(1, 22);
  buf.writeUInt32LE(sr, 24); buf.writeUInt32LE(sr * 2, 28); buf.writeUInt16LE(2, 32); buf.writeUInt16LE(16, 34);
  buf.write('data', 36); buf.writeUInt32LE(samples.length * 2, 40);
  for (let i = 0; i < samples.length; i++) {
    const x = Math.max(-1, Math.min(1, samples[i]));
    buf.writeInt16LE(Math.round(x < 0 ? x * 32768 : x * 32767), 44 + i * 2);
  }
  return buf;
}

// Inverse de wav() (mono 16 bits uniquement) : { sampleRate, samples: Float32Array }.
function wavDecode(buf) {
  const sampleRate = buf.readUInt32LE(24), n = buf.readUInt32LE(40) / 2;
  const samples = new Float32Array(n);
  for (let i = 0; i < n; i++) samples[i] = buf.readInt16LE(44 + i * 2) / 32768;
  return { sampleRate, samples };
}

module.exports = { SR, midiToHz, silence, chordSamples, chordNotes, chord, clickTrain, concat, mix, progression, wav, wavDecode };

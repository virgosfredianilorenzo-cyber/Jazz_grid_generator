'use strict';
// In-browser playback via Web Audio API (no dependencies).
// Depends on theory.js globals: noteIdx, tr, parseChordSym, ARP_DEF, chartData.

const PLAYER = { ctx: null, timers: [], playing: false };

// ── Navigation resolver ───────────────────────────────────────────────────
// Flattens chartData following: repeat bars, volta brackets,
// D.C. al Coda, D.S. al Coda, D.C. al Fine, Fine, Segno.

function _flatMeasures() {
  const out = [];
  (chartData.sections || []).forEach((sec, si) => {
    (sec.measures || []).forEach((m, mi) => out.push({ si, mi, m }));
  });
  return out;
}

function _resolvePlayOrder() {
  const measures = _flatMeasures();
  const n = measures.length;
  if (!n) return [];

  const segnoIdx = measures.findIndex(({ m }) => m.navSymbol === 'segno');
  // codaIdx: index of the 𝄌 coda section header
  const codaIdx  = measures.findIndex(({ m }) => m.navSymbol === 'coda');

  const playOrder   = [];
  const repeatCount = {}; // 'r<startIdx>' → how many times repeat-end was hit

  let pc           = 0;
  let goingToCoda  = false; // after D.C./D.S., skip until coda mark
  let stopAtFine   = false; // after D.C. al Fine, stop at Fine mark
  let guard        = 0;
  const MAX        = n * 40;

  while (guard++ < MAX && pc < n) {
    const { si, mi, m } = measures[pc];

    // ── Volta bracket: skip wrong pass ───────────────────────────────────
    if (m.volta && !goingToCoda && !stopAtFine) {
      const voltaNum = parseInt(m.volta) || 1;
      // Find the nearest repeat-start before this measure
      let startIdx = 0;
      for (let i = pc - 1; i >= 0; i--) {
        if (measures[i].m.barlineLeft === 'repeat-start') { startIdx = i; break; }
      }
      const pass = repeatCount['r' + startIdx] || 0;
      // voltaNum 1 plays on pass 1 (count=0 before first jump-back), 2 on pass 2, etc.
      if (voltaNum !== pass + 1) { pc++; continue; }
    }

    // ── goingToCoda: skip until 𝄌 coda mark ─────────────────────────────
    if (goingToCoda) {
      if (m.navSymbol === 'coda') {
        goingToCoda = false;
        // fall through: this is the coda start, include it
      } else {
        pc++;
        continue;
      }
    }

    // ── stopAtFine: stop here when Fine is reached ───────────────────────
    if (stopAtFine && m.navSymbol === 'fine') {
      playOrder.push({ si, mi });
      break;
    }

    playOrder.push({ si, mi });

    // ── Repeat-end: jump back ────────────────────────────────────────────
    if (m.barlineRight === 'repeat-end' && !goingToCoda && !stopAtFine) {
      let startIdx = 0;
      for (let i = pc - 1; i >= 0; i--) {
        if (measures[i].m.barlineLeft === 'repeat-start') { startIdx = i; break; }
      }
      const key = 'r' + startIdx;
      repeatCount[key] = (repeatCount[key] || 0) + 1;
      if (repeatCount[key] < 2) { pc = startIdx; continue; }
    }

    // ── Nav symbols ──────────────────────────────────────────────────────
    if (!goingToCoda && !stopAtFine) {
      if (m.navSymbol === 'dc-coda') {
        goingToCoda = true;
        Object.keys(repeatCount).forEach(k => delete repeatCount[k]);
        pc = 0; continue;
      }
      if (m.navSymbol === 'ds-coda') {
        goingToCoda = true;
        Object.keys(repeatCount).forEach(k => delete repeatCount[k]);
        pc = segnoIdx >= 0 ? segnoIdx : 0; continue;
      }
      if (m.navSymbol === 'dc-fine') {
        stopAtFine = true;
        Object.keys(repeatCount).forEach(k => delete repeatCount[k]);
        pc = 0; continue;
      }
    }

    pc++;
  }

  return playOrder;
}

// ── Build linear chord event list ─────────────────────────────────────────
// Resolves %, /beat → previous chord symbol. N.C. / — → null (silence).

function _buildEvents(playOrder, loops) {
  const onePass = [];
  let prevSym = null;

  playOrder.forEach(({ si, mi }) => {
    const measure = (chartData.sections[si] || {}).measures?.[mi];
    if (!measure) return;
    (measure.chords || []).forEach(chord => {
      let sym = chord.symbol;
      if (sym === '%' || sym === '/beat') sym = prevSym;
      else if (sym === '%%')              sym = prevSym;
      else if (sym === '—' || sym === '') sym = null;
      if (sym && sym !== 'N.C.')          prevSym = sym;
      else if (sym === 'N.C.')            sym = null;
      onePass.push({ si, mi, sym, beats: chord.beats || 1 });
    });
  });

  // Repeat the resolved sequence `loops` times
  const events = [];
  for (let i = 0; i < loops; i++) events.push(...onePass);
  return events;
}

// ── Web Audio synthesis ───────────────────────────────────────────────────

function _freq(midi) { return 440 * Math.pow(2, (midi - 69) / 12); }

function _midiNote(name, octave) {
  const idx = noteIdx(name);
  return idx === -1 ? 60 : Math.min(127, Math.max(0, (octave + 1) * 12 + idx));
}

function _scheduleNote(ctx, midi, t0, dur, vol) {
  const osc  = ctx.createOscillator();
  const gain = ctx.createGain();
  const t1   = t0 + 0.015;                    // attack end
  const t2   = t0 + Math.min(0.12, dur * 0.3); // decay end
  const t3   = Math.max(t1, t0 + dur - 0.05); // release start
  const t4   = t0 + dur + 0.02;               // release end

  osc.type = 'triangle';
  osc.frequency.value = _freq(midi);
  gain.gain.setValueAtTime(0, t0);
  gain.gain.linearRampToValueAtTime(vol, t1);
  gain.gain.exponentialRampToValueAtTime(vol * 0.45, t2);
  gain.gain.setValueAtTime(vol * 0.45, t3);
  gain.gain.linearRampToValueAtTime(0.0001, t4);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(t0);
  osc.stop(t4 + 0.01);
}

function _scheduleChord(ctx, sym, t0, dur) {
  if (!sym) return;
  const parsed = parseChordSym(sym);
  if (!parsed) return;

  const { root, quality } = parsed;
  const def = ARP_DEF[quality] || ARP_DEF[''] || { i: [0, 4, 7] };

  // Bass: root at octave 2, sawtooth-like mix (triangle is smoother)
  _scheduleNote(ctx, _midiNote(root, 2), t0, dur, 0.55);

  // Chord voicing: octave 4, up to 4 notes
  def.i.slice(0, 4).forEach(s => {
    _scheduleNote(ctx, _midiNote(tr(root, s), 4), t0, dur, 0.28);
  });
}

// ── Visual highlight ──────────────────────────────────────────────────────

function _clearHighlight() {
  document.querySelectorAll('.measure.playing').forEach(el => el.classList.remove('playing'));
}

function _highlight(si, mi) {
  _clearHighlight();
  const el = document.querySelector(`.measure[data-si="${si}"][data-mi="${mi}"]`);
  if (el) {
    el.classList.add('playing');
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}

// ── Public API ────────────────────────────────────────────────────────────

function startPlayback(loops) {
  if (PLAYER.playing) stopPlayback();

  loops = Math.max(1, Math.min(16, parseInt(loops) || 1));
  const bpm     = chartData.tempo || 120;
  const spb     = 60 / bpm; // seconds per beat

  const playOrder = _resolvePlayOrder();
  const events    = _buildEvents(playOrder, loops);
  if (!events.length) return;

  PLAYER.ctx     = new AudioContext();
  PLAYER.playing = true;

  const btn = document.getElementById('btn-play');
  if (btn) { btn.textContent = '⏹'; btn.classList.add('playing'); }

  let t = PLAYER.ctx.currentTime + 0.08;

  events.forEach(ev => {
    const dur = ev.beats * spb;
    _scheduleChord(PLAYER.ctx, ev.sym, t, dur);

    // Visual: fire slightly early so UI updates on the beat
    const delay = Math.max(0, (t - PLAYER.ctx.currentTime) * 1000 - 30);
    const id = setTimeout(() => _highlight(ev.si, ev.mi), delay);
    PLAYER.timers.push(id);

    t += dur;
  });

  // Auto-stop
  const total = (t - PLAYER.ctx.currentTime + 0.15) * 1000;
  PLAYER.timers.push(setTimeout(stopPlayback, total));
}

function stopPlayback() {
  PLAYER.timers.forEach(clearTimeout);
  PLAYER.timers = [];
  if (PLAYER.ctx) { PLAYER.ctx.close(); PLAYER.ctx = null; }
  PLAYER.playing = false;
  _clearHighlight();
  const btn = document.getElementById('btn-play');
  if (btn) { btn.textContent = '▶'; btn.classList.remove('playing'); }
}

function openPlayerDialog() {
  if (PLAYER.playing) { stopPlayback(); return; }
  document.getElementById('player-dialog').classList.add('active');
}

function closePlayerDialog() {
  document.getElementById('player-dialog').classList.remove('active');
}

function confirmPlay() {
  const loops = document.getElementById('player-loops').value;
  closePlayerDialog();
  startPlayback(loops);
}

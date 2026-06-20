'use strict';
// In-browser playback via soundfont-player (CDN) + Web Audio API.
// Depends on: theory.js globals (noteIdx, tr, parseChordSym, ARP_DEF, chartData),
//             Soundfont global loaded from CDN before this script.

const PLAYER = { ctx: null, timers: [], playing: false, piano: null, bass: null };
const METRO  = { timers: [], running: false, volume: 0.5, nextBeat: 0, beat: 0 };

// ── Metronome engine ──────────────────────────────────────────────────────

function _metroClick(t, isDown) {
  if (!PLAYER.ctx) return;
  const osc = PLAYER.ctx.createOscillator();
  const env = PLAYER.ctx.createGain();
  osc.connect(env);
  env.connect(PLAYER.ctx.destination);
  osc.frequency.value = isDown ? 1000 : 800;
  const g = (isDown ? 0.7 : 0.5) * METRO.volume;
  env.gain.setValueAtTime(g, t);
  env.gain.exponentialRampToValueAtTime(0.001, t + 0.055);
  osc.start(t);
  osc.stop(t + 0.055);
}

function _metroSchedule() {
  if (!METRO.running || !PLAYER.ctx) return;
  const bpm   = chartData.tempo || 120;
  const [num] = (chartData.timeSig || '4/4').split('/').map(Number);
  const spb   = 60 / bpm;
  while (METRO.nextBeat < PLAYER.ctx.currentTime + 0.4) {
    _metroClick(METRO.nextBeat, (METRO.beat % num) === 0);
    METRO.nextBeat += spb;
    METRO.beat++;
  }
  METRO.timers.push(setTimeout(_metroSchedule, 100));
}

function startMetro(t0) {
  METRO.running  = true;
  METRO.beat     = 0;
  METRO.nextBeat = (t0 !== undefined) ? t0 : PLAYER.ctx.currentTime + 0.05;
  METRO.timers   = [];
  _metroSchedule();
  const btn = document.getElementById('btn-metro');
  if (btn) btn.classList.add('active');
}

function stopMetro() {
  METRO.timers.forEach(clearTimeout);
  METRO.timers   = [];
  METRO.running  = false;
  METRO.beat     = 0;
  METRO.nextBeat = 0;
  const btn = document.getElementById('btn-metro');
  if (btn) btn.classList.remove('active');
}

function toggleMetro() {
  if (METRO.running) { stopMetro(); return; }
  _ensureInstruments()
    .then(() => startMetro())
    .catch(e => console.error('Metro init failed:', e));
}

// ── Navigation resolver ───────────────────────────────────────────────────
// Flattens chartData following: repeat bars, volta brackets,
// D.C./D.S. al Coda, D.C. al Fine, Fine, Segno.

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
  const codaIdx  = measures.findIndex(({ m }) => m.navSymbol === 'coda');

  const playOrder   = [];
  const repeatCount = {};

  let pc          = 0;
  let goingToCoda = false;
  let stopAtFine  = false;
  let guard       = 0;
  const MAX       = n * 40;

  while (guard++ < MAX && pc < n) {
    const { si, mi, m } = measures[pc];

    // Volta bracket: skip wrong pass
    if (m.volta && !goingToCoda && !stopAtFine) {
      const voltaNum = parseInt(m.volta) || 1;
      let startIdx = 0;
      for (let i = pc - 1; i >= 0; i--) {
        if (measures[i].m.barlineLeft === 'repeat-start') { startIdx = i; break; }
      }
      const pass = repeatCount['r' + startIdx] || 0;
      if (voltaNum !== pass + 1) { pc++; continue; }
    }

    // goingToCoda: skip until 𝄌 coda mark
    if (goingToCoda) {
      if (m.navSymbol === 'coda') goingToCoda = false;
      else { pc++; continue; }
    }

    // stopAtFine: stop here when Fine reached
    if (stopAtFine && m.navSymbol === 'fine') {
      playOrder.push({ si, mi });
      break;
    }

    playOrder.push({ si, mi });

    // Repeat-end: jump back
    if (m.barlineRight === 'repeat-end' && !goingToCoda && !stopAtFine) {
      let startIdx = 0;
      for (let i = pc - 1; i >= 0; i--) {
        if (measures[i].m.barlineLeft === 'repeat-start') { startIdx = i; break; }
      }
      const key = 'r' + startIdx;
      repeatCount[key] = (repeatCount[key] || 0) + 1;
      if (repeatCount[key] < 2) { pc = startIdx; continue; }
    }

    // Nav symbols
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

function _buildEvents(playOrder, loops) {
  const onePass = [];
  let prevSym = null;

  playOrder.forEach(({ si, mi }) => {
    const measure = (chartData.sections[si] || {}).measures?.[mi];
    if (!measure) return;
    (measure.chords || []).forEach(chord => {
      let sym = chord.symbol;
      if (sym === '%' || sym === '/beat' || sym === '%%') sym = prevSym;
      else if (sym === '—' || sym === '')                 sym = null;
      if (sym && sym !== 'N.C.')                          prevSym = sym;
      else if (sym === 'N.C.')                            sym = null;
      onePass.push({ si, mi, sym, beats: chord.beats || 1 });
    });
  });

  const events = [];
  for (let i = 0; i < loops; i++) events.push(...onePass);
  return events;
}

// ── Instrument loading ────────────────────────────────────────────────────
// AudioContext and instruments are kept alive between plays to avoid
// reloading soundfonts on every play press.

async function _ensureInstruments() {
  if (!PLAYER.ctx || PLAYER.ctx.state === 'closed') {
    PLAYER.ctx   = new AudioContext();
    PLAYER.piano = null;
    PLAYER.bass  = null;
  }
  if (PLAYER.ctx.state === 'suspended') await PLAYER.ctx.resume();
  if (!PLAYER.piano || !PLAYER.bass) {
    [PLAYER.piano, PLAYER.bass] = await Promise.all([
      Soundfont.instrument(PLAYER.ctx, 'acoustic_grand_piano'),
      Soundfont.instrument(PLAYER.ctx, 'acoustic_bass'),
    ]);
  }
}

// ── Chord scheduling ──────────────────────────────────────────────────────

function _midiNote(name, octave) {
  const idx = noteIdx(name);
  return idx === -1 ? 60 : Math.min(127, Math.max(0, (octave + 1) * 12 + idx));
}

function _scheduleChord(sym, t0, dur) {
  if (!sym) return;

  // Slash chord: "Cmaj7/E" → chordPart="Cmaj7", bassOverride="E"
  let chordPart    = sym;
  let bassOverride = null;
  const slashIdx   = sym.lastIndexOf('/');
  if (slashIdx > 0) {
    const candidate = sym.slice(slashIdx + 1).trim();
    if (noteIdx(candidate) !== -1) {
      chordPart    = sym.slice(0, slashIdx).trim();
      bassOverride = candidate;
    }
  }

  const parsed = parseChordSym(chordPart);
  if (!parsed) return;

  const { root, quality } = parsed;
  const def     = ARP_DEF[quality] || ARP_DEF[''] || { i: [0, 4, 7] };
  const noteDur = dur * 0.88;

  // Bass: slash note or root at octave 2
  PLAYER.bass.play(_midiNote(bassOverride || root, 2), t0, { duration: noteDur, gain: 0.9 });

  // Piano: spread voicing — each note strictly above the previous.
  // Reference starts one octave below oct 4 so root lands at oct 4.
  let prevMidi = _midiNote(root, 3);
  def.i.forEach(s => {
    let midi = _midiNote(tr(root, s), 4);
    while (midi <= prevMidi) midi += 12;
    if (midi > 96) midi -= 12; // cap near C7
    PLAYER.piano.play(midi, t0, { duration: noteDur, gain: 0.55 });
    prevMidi = midi;
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

// ── Concert mode ──────────────────────────────────────────────────────────

function _onChartConcertClick() { stopPlayback(); }

function _enterConcertMode(totalMeas) {
  const prog = document.getElementById('concert-progress');
  if (prog) prog.textContent = '1 / ' + totalMeas;
  document.body.classList.add('concert-mode');
  const chart = document.getElementById('chart-editor');
  if (chart) chart.addEventListener('click', _onChartConcertClick);
}

function _exitConcertMode() {
  document.body.classList.remove('concert-mode');
  const chart = document.getElementById('chart-editor');
  if (chart) chart.removeEventListener('click', _onChartConcertClick);
}

// ── Public API ────────────────────────────────────────────────────────────

async function startPlayback(loops) {
  if (PLAYER.playing) { stopPlayback(); return; }

  loops = Math.max(1, Math.min(16, parseInt(loops) || 1));
  const bpm = chartData.tempo || 120;
  const spb = 60 / bpm;

  const playOrder = _resolvePlayOrder();
  const events    = _buildEvents(playOrder, loops);
  if (!events.length) return;

  const btn = document.getElementById('btn-play');
  if (btn) btn.textContent = '⏳';

  try {
    await _ensureInstruments();
  } catch (e) {
    console.error('SoundFont load failed:', e);
    if (btn) { btn.textContent = '▶'; btn.classList.remove('playing'); }
    return;
  }

  PLAYER.playing = true;
  if (btn) { btn.textContent = '⏹'; btn.classList.add('playing'); }

  // Concert mode
  const totalMeas = playOrder.length * loops;
  _enterConcertMode(totalMeas);

  // Métronome synchronisé avec le play
  if (METRO.running) stopMetro();
  if (document.getElementById('cb-metro')?.checked) startMetro(PLAYER.ctx.currentTime + 0.1);

  let t        = PLAYER.ctx.currentTime + 0.1;
  let lastSiMi = null;
  let measIdx  = 0;

  events.forEach(ev => {
    const dur     = ev.beats * spb;
    _scheduleChord(ev.sym, t, dur);

    const siMiKey = `${ev.si},${ev.mi}`;
    if (siMiKey !== lastSiMi) { measIdx++; lastSiMi = siMiKey; }
    const captured = measIdx;

    const delay = Math.max(0, (t - PLAYER.ctx.currentTime) * 1000 - 30);
    PLAYER.timers.push(setTimeout(() => {
      _highlight(ev.si, ev.mi);
      const prog = document.getElementById('concert-progress');
      if (prog) prog.textContent = captured + ' / ' + totalMeas;
    }, delay));

    t += dur;
  });

  const total = (t - PLAYER.ctx.currentTime + 0.2) * 1000;
  PLAYER.timers.push(setTimeout(stopPlayback, total));
}

function stopPlayback() {
  PLAYER.timers.forEach(clearTimeout);
  PLAYER.timers = [];
  if (PLAYER.piano) PLAYER.piano.stop();
  if (PLAYER.bass)  PLAYER.bass.stop();
  PLAYER.playing = false;
  _clearHighlight();
  const btn = document.getElementById('btn-play');
  if (btn) { btn.textContent = '▶'; btn.classList.remove('playing'); }
  _exitConcertMode();
  stopMetro();
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

// Space bar: toggle play/stop (ignored when focus is on an input/textarea/select)
document.addEventListener('keydown', e => {
  if (e.code !== 'Space') return;
  const tag = document.activeElement && document.activeElement.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
  e.preventDefault();
  openPlayerDialog();
});

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   JS — GRILLE À L'ÉCOUTE
   Écoute d'un onglet (getDisplayMedia) ou d'un fichier audio ; la grille
   se remplit mesure par mesure. Le moteur (js/listen-dsp.js) est chargé
   à la première ouverture de la fenêtre. L'audio n'est jamais stocké.
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

// ── Fonctions pures (testées sous Node) ──────────────────────────────

// Moteur : globals du navigateur (listen-dsp.js chargé), sinon require sous Node.
function _lsDsp() {
  if (typeof chromaFromFrame === 'function') {
    return { FRAME_SIZE, HOP_SIZE, chromaFromFrame, onsetStrength, createBarAssembler, rebuildBars, estimateKey, proposeSections };
  }
  return require('./listen-dsp.js');
}

function _lsNewId() {
  if (typeof _newSectionId === 'function') return _newSectionId();
  const c = 'BCDFGHJKMNPQRSTVWXZ23456789';
  let id = '';
  for (let i = 0; i < 4; i++) id += c[Math.floor(Math.random() * c.length)];
  return id;
}

function listenTabSupported(nav) {
  if (!nav || !nav.mediaDevices || !nav.mediaDevices.getDisplayMedia) return false;
  const ua = nav.userAgent || '';
  return !/Firefox\//.test(ua) && !/Android|iPhone|iPad|Mobile/.test(ua);
}

function listenStreamHasAudio(stream) {
  if (!stream || typeof stream.getAudioTracks !== 'function') return false;
  return stream.getAudioTracks().some(tr => tr && tr.readyState !== 'ended');
}

function listenTitleFromFile(name) {
  name = String(name || '');
  const dot = name.lastIndexOf('.');
  return dot > 0 ? name.slice(0, dot) : name;
}

// Le libellé de la piste vidéo d'un partage est souvent technique (web-contents-media-stream://…).
function listenTitleFromTrackLabel(label, fallback) {
  const s = String(label || '').trim();
  if (!s || /^(web-contents-media-stream|screen:|window:)/i.test(s) || /^[a-z-]+:\/\//i.test(s)) return fallback;
  return s;
}

// A, B… Z, A2… Z2, A3… : premier libellé de la suite absent de `labels`.
function nextSectionLabel(labels) {
  const used = new Set(labels || []);
  for (let round = 1; ; round++) {
    for (let i = 0; i < 26; i++) {
      const l = String.fromCharCode(65 + i) + (round > 1 ? round : '');
      if (!used.has(l)) return l;
    }
  }
}

function listenNewChart(opts) {
  return {
    title: opts.title || '', key: 'C', tempo: opts.bpm || 120, timeSig: opts.timeSig || '4/4', style: '',
    sections: [{ id: _lsNewId(), label: 'A', annotation: opts.annotation || '', measures: [] }]
  };
}

// Événement `bar` du moteur → mesure JazzGrid. Seuls les accords (pas N.C.) incertains sont marqués.
function listenMeasureFromBar(bar) {
  return {
    chords: (bar.chords || []).map(c => {
      const ch = { symbol: c.symbol, beats: c.beats, annot: null };
      if (c.uncertain && c.symbol !== 'N.C.') ch._uncertain = true;
      return ch;
    }),
    repeatStart: false, repeatEnd: false, barlineLeft: 'normal', barlineRight: 'normal', volta: null, navSymbol: null
  };
}

function listenBeatsPerBar(timeSig) {
  const n = parseInt(String(timeSig || '').split('/')[0], 10);
  return n > 0 ? n : 4;
}

// Tempo tapé : moyenne des 4 derniers intervalles (temps en ms). null s'il y a moins de 2 frappes.
function listenTapBpm(times) {
  if (!times || times.length < 2) return null;
  const last = times.slice(-5);
  const avg = (last[last.length - 1] - last[0]) / (last.length - 1);
  return avg > 0 ? Math.round(60000 / avg) : null;
}

// Remplit les sections existantes (mêmes id / libellé / annotation) avec `bars`, dans l'ordre,
// en gardant leur nombre de mesures ; la dernière prend le reste.
function listenDistributeBars(sections, bars) {
  let p = 0;
  return sections.map((s, i) => {
    const n = i === sections.length - 1 ? bars.length - p : Math.min(s.measures.length, bars.length - p);
    const measures = bars.slice(p, p + Math.max(0, n)).map(listenMeasureFromBar);
    p += measures.length;
    return { id: s.id, label: s.label, annotation: s.annotation || '', measures };
  });
}

// Découpe une section selon proposeSections ; la première garde l'id et l'annotation.
function listenSplitSections(section, proposals) {
  return proposals.map((pr, i) => ({
    id: i === 0 ? section.id : _lsNewId(), label: pr.label, annotation: i === 0 ? (section.annotation || '') : '',
    measures: section.measures.slice(pr.start, pr.start + pr.length)
  }));
}

// Empreinte de tout le contenu des sections (accords, annotations, barres, reprises, voltas,
// repères, libellés, annotations de section), sans les champs internes `_…` des accords.
function listenSectionsFingerprint(sections) {
  const c = JSON.parse(JSON.stringify(sections || []));
  c.forEach(sec => (sec.measures || []).forEach(m => (m.chords || []).forEach(ch => {
    Object.keys(ch).forEach(k => { if (k[0] === '_') delete ch[k]; });
  })));
  return JSON.stringify(c);
}

// Découpage proposé pour la grille actuelle : seulement s'il n'y a qu'une section.
function listenProposeSections(sections) {
  if (!sections || sections.length !== 1) return null;
  return _lsDsp().proposeSections(sections[0].measures.map(m => (m.chords || []).map(c => c.symbol).join(' ')));
}

// File d'événements : le rappel audio empile, la grille est mise à jour plus tard (schedule), dans l'ordre.
function listenCreateEventQueue(schedule, apply) {
  let q = [], pending = false;
  const take = () => { const out = q; q = []; return out; };
  return {
    push(events) {
      if (!events.length) return;
      for (const e of events) q.push(e);
      if (!pending) {
        pending = true;
        schedule(() => { pending = false; const evs = take(); if (evs.length) apply(evs); });
      }
    },
    take
  };
}

// Taille des blocs du ScriptProcessorNode (le plus grand permis) : marge si le fil principal est occupé.
const LISTEN_PROC_BUFFER = 8192;

// État d'analyse : assembleur + tampon d'échantillons + magnitudes précédentes (attaques).
function listenCreateProcessor(opts) {
  const d = _lsDsp();
  return {
    assembler: d.createBarAssembler({
      beatsPerBar: opts.beatsPerBar, chordsPerBar: opts.chordsPerBar, bpm: opts.bpm || undefined,
      hopSec: d.HOP_SIZE / opts.sampleRate
    }),
    prevMags: null, frames: 0,
    buf: new Float32Array(d.FRAME_SIZE * 2), len: 0
  };
}

// Une trame (FRAME_SIZE échantillons) → événements de l'assembleur.
function listenProcessFrame(state, frame, sr) {
  const d = _lsDsp();
  const r = d.chromaFromFrame(frame, sr);
  const onset = d.onsetStrength(state.prevMags, r.mags);
  state.prevMags = r.mags;
  state.frames++;
  return state.assembler.pushFrame({ chroma: r.chroma, bass: r.bass, rms: r.rms, onset });
}

// Échantillons reçus par blocs quelconques → trames de FRAME_SIZE avancées de HOP_SIZE.
function listenFeedSamples(state, samples, sr) {
  const d = _lsDsp();
  const ev = [];
  let i = 0;
  while (i < samples.length) {
    const take = Math.min(samples.length - i, state.buf.length - state.len);
    state.buf.set(samples.subarray(i, i + take), state.len);
    state.len += take; i += take;
    let p = 0;
    while (state.len - p >= d.FRAME_SIZE) {
      for (const e of listenProcessFrame(state, state.buf.subarray(p, p + d.FRAME_SIZE), sr)) ev.push(e);
      p += d.HOP_SIZE;
    }
    if (p) { state.buf.copyWithin(0, p, state.len); state.len -= p; }
  }
  return ev;
}

// ── Colle navigateur ─────────────────────────────────────────────────

const _ls = {
  dspPromise: null,
  active: false,        // écoute en cours
  done: false,          // bandeau en mode « terminé »
  kind: null,           // 'tab' | 'file'
  ctx: null, src: null, proc: null, stream: null,
  state: null, chart: null, sampleRate: 44100,
  beatsPerBar: 4, chordsPerBar: 1, userBpm: null,
  sectionsByUser: false, bars: 0, noTempoShown: false,
  data: null, offset: 0, snapshot: null, proposals: null, proposalsFor: null,
  taps: [], starting: false, queue: null
};
const _lsEl = id => document.getElementById(id);
const _lsListening = () => typeof document !== 'undefined' && document.body.classList.contains('listening');

function _lsLoadDsp() {
  if (typeof chromaFromFrame === 'function') return Promise.resolve();
  if (_ls.dspPromise) return _ls.dspPromise;
  _ls.dspPromise = new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'js/listen-dsp.js';
    s.onload = () => resolve();
    s.onerror = () => { _ls.dspPromise = null; s.remove(); reject(new Error('listen-dsp')); };
    document.head.appendChild(s);
  });
  return _ls.dspPromise;
}

async function openListen() {
  if (_ls.active) return;
  try { await _lsLoadDsp(); } catch (e) { console.error(e); alert(t('listenErrFile')); return; }
  _lsEl('ls-btn-tab').style.display = listenTabSupported(navigator) ? '' : 'none';
  _lsEl('ls-tab-hint').style.display = _lsEl('ls-btn-tab').style.display;
  _lsError('');
  _ls.taps = [];
  _lsEl('listen-dialog').classList.add('active');
}
function closeListen() { _lsEl('listen-dialog').classList.remove('active'); }

function _lsError(key) {
  const e = _lsEl('ls-error');
  e.textContent = key ? t(key) : '';
  e.style.display = key ? 'block' : 'none';
}

// Démarrage en cours (décodage, fenêtre de partage) : un seul à la fois, contrôles désactivés.
function _lsSetStarting(on) {
  _ls.starting = on;
  ['ls-btn-tab', 'ls-file', 'ls-timesig', 'ls-tempo', 'ls-tap', 'ls-chords'].forEach(id => { const e = _lsEl(id); if (e) e.disabled = on; });
  const d = _lsEl('ls-drop');
  if (d) d.classList.toggle('disabled', on);
}

// Erreur au démarrage, après _lsBegin ou pendant : tout est relâché, message affiché.
function _lsStartFailed(e, ctx, stream) {
  console.error(e);
  if (_ls.active) {
    if (!_ls.ctx) _ls.ctx = ctx;
    if (!_ls.stream) _ls.stream = stream;
    try { listenStop(); } catch (e2) { console.error(e2); }
  } else {
    if (stream) stream.getTracks().forEach(tr => tr.stop());
    if (ctx) ctx.close().catch(() => {});
  }
  _ls.active = false;
  document.body.classList.remove('listening');
  if (document.body.classList.contains('listen-bar-on')) _lsMsg(t('listenErrStart'));
  else { _lsError('listenErrStart'); _lsEl('listen-dialog').classList.add('active'); }
}

function _lsSettings() {
  const timeSig = _lsEl('ls-timesig').value || '4/4';
  const v = parseFloat(_lsEl('ls-tempo').value);
  return {
    timeSig, beatsPerBar: listenBeatsPerBar(timeSig),
    chordsPerBar: _lsEl('ls-chords').value === '2' ? 2 : 1,
    bpm: v >= 30 && v <= 300 ? Math.round(v) : null
  };
}

function listenTap() {
  const now = performance.now();
  if (_ls.taps.length && now - _ls.taps[_ls.taps.length - 1] > 2000) _ls.taps = [];
  _ls.taps.push(now);
  if (_ls.taps.length > 5) _ls.taps.shift();
  const bpm = listenTapBpm(_ls.taps);
  if (bpm) _lsEl('ls-tempo').value = bpm;
}

// Démarrage commun, une fois la source audio prête. false si l'utilisateur refuse de remplacer la grille.
function _lsBegin(kind, title, settings) {
  if (_isDirty && !confirm(t('listenConfirmReplace'))) return false;
  if (typeof PLAYER !== 'undefined' && PLAYER.playing && typeof stopPlayback === 'function') stopPlayback();
  snapshotUndo();
  chartData = listenNewChart({ title, bpm: settings.bpm, timeSig: settings.timeSig, annotation: t('listenAnnot') });
  originalKey = chartData.key; currentSemitoneOffset = 0;
  _lsEl('semitone-display').textContent = '0';
  _lsEl('transpose-key-select').value = '';
  Object.assign(_ls, {
    active: true, done: false, kind, chart: chartData,
    beatsPerBar: settings.beatsPerBar, chordsPerBar: settings.chordsPerBar, userBpm: settings.bpm,
    sectionsByUser: false, bars: 0, noTempoShown: false, data: null, offset: 0, snapshot: null, proposals: null
  });
  _ls.state = listenCreateProcessor({ beatsPerBar: settings.beatsPerBar, chordsPerBar: settings.chordsPerBar, bpm: settings.bpm, sampleRate: _ls.sampleRate });
  _ls.queue = listenCreateEventQueue(fn => setTimeout(fn, 0), evs => { if (_ls.active) _lsHandleEvents(evs); });
  closeListen();
  _lsEl('dropzone').style.display = 'none';
  _lsEl('chart-editor').style.display = 'block';
  render();
  document.body.classList.add('listening');
  _lsShowBar();
  return true;
}

// Nœud d'analyse : reçoit chaque bloc d'échantillons (horloge = flux audio lui-même, pas de minuterie,
// donc pas de trame perdue quand l'onglet de l'appli est en arrière-plan). Sortie muette.
// Le rappel ne fait que l'analyse ; la grille est mise à jour hors du rappel (file + setTimeout 0,
// pas requestAnimationFrame qui s'arrête dans un onglet caché).
function _lsMakeProcessor(ctx) {
  const proc = ctx.createScriptProcessor(LISTEN_PROC_BUFFER, 2, 1);
  let mono = null;
  proc.onaudioprocess = e => {
    if (!_ls.active) return;
    const ib = e.inputBuffer, n = ib.length, ch = ib.numberOfChannels;
    if (!mono || mono.length !== n) mono = new Float32Array(n);
    const a = ib.getChannelData(0);
    if (ch > 1) { const b = ib.getChannelData(1); for (let i = 0; i < n; i++) mono[i] = 0.5 * (a[i] + b[i]); }
    else mono.set(a);
    _ls.queue.push(listenFeedSamples(_ls.state, mono, ctx.sampleRate));
    _lsCheckNoTempo();
  };
  proc.connect(ctx.destination);
  return proc;
}

async function listenStartTab() {
  if (_ls.active || _ls.starting) return;
  const settings = _lsSettings();
  _lsError('');
  _lsSetStarting(true);
  let stream = null, ctx = null;
  try {
    try {
      stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
    } catch (e) { console.warn(e); return; } // partage annulé : rien ne change
    if (_ls.active) { stream.getTracks().forEach(tr => tr.stop()); return; } // une autre écoute a démarré
    if (!listenStreamHasAudio(stream)) {
      stream.getTracks().forEach(tr => tr.stop());
      _lsError('listenErrNoAudio');
      return;
    }
    const video = stream.getVideoTracks()[0];
    const title = listenTitleFromTrackLabel(video && video.label, t('listenDefaultTitle'));
    if (video) video.stop();
    ctx = new AudioContext();
    _ls.sampleRate = ctx.sampleRate;
    if (!_lsBegin('tab', title, settings)) { stream.getTracks().forEach(tr => tr.stop()); ctx.close(); return; }
    _ls.ctx = ctx; _ls.stream = stream;
    const src = ctx.createMediaStreamSource(stream);
    _ls.src = src;
    _ls.proc = _lsMakeProcessor(ctx);
    src.connect(_ls.proc); // pas vers les haut-parleurs : l'onglet joue déjà
    stream.getAudioTracks().forEach(tr => tr.addEventListener('ended', () => { if (_ls.stream === stream) listenStop(); }));
    if (ctx.state === 'suspended') await ctx.resume();
  } catch (e) {
    _lsStartFailed(e, ctx, stream);
  } finally {
    _lsSetStarting(false);
  }
}

async function listenStartFile(file) {
  if (_ls.active || _ls.starting || !file) return;
  const settings = _lsSettings();
  _lsError('');
  _lsSetStarting(true);
  let ctx = null;
  try {
    ctx = new AudioContext();
    let buffer;
    try {
      buffer = await ctx.decodeAudioData(await file.arrayBuffer());
    } catch (e) { console.error(e); ctx.close(); _lsError('listenErrFile'); return; }
    if (_ls.active) { ctx.close(); return; } // une autre écoute a démarré
    _ls.sampleRate = ctx.sampleRate;
    if (!_lsBegin('file', listenTitleFromFile(file.name), settings)) { ctx.close(); return; }
    _ls.ctx = ctx;
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    _ls.src = src;
    _ls.proc = _lsMakeProcessor(ctx);
    src.connect(ctx.destination); // audible
    src.connect(_ls.proc);
    src.onended = () => { if (_ls.src === src) listenStop(); };
    if (ctx.state === 'suspended') await ctx.resume();
    src.start();
  } catch (e) {
    _lsStartFailed(e, ctx, null);
  } finally {
    _lsSetStarting(false);
  }
}

// Pause / reprise du fichier : le contexte audio est suspendu, l'analyse aussi.
async function listenTogglePause() {
  if (!_ls.active || _ls.kind !== 'file' || !_ls.ctx) return;
  const ctx = _ls.ctx;
  if (ctx.state === 'running') await ctx.suspend(); else await ctx.resume();
  _lsUpdateBar();
}

// Événements de l'assembleur → grille. `live` : surligner la dernière mesure.
function _lsHandleEvents(events, live = true) {
  if (events.length && chartData !== _ls.chart) { if (live) listenStop(); return; } // grille remplacée entre-temps
  let added = false;
  for (const e of events) {
    if (e.type === 'bar') {
      const secs = chartData.sections;
      secs[secs.length - 1].measures.push(listenMeasureFromBar(e));
      _ls.bars++; added = true;
    } else if (e.type === 'tempo') {
      chartData.tempo = Math.round(e.bpm);
      _lsEl('meta-tempo').value = chartData.tempo;
    }
    // pause / resume : rien à faire (paire vide tolérée)
  }
  if (added) {
    render();
    if (live) _lsHighlightLast();
  }
  if (live) _lsCheckNoTempo();
  if (events.length) _lsUpdateBar();
}

// Aucun tempo après un long passage sonore (tempo auto) : conseiller de le saisir ou de le taper.
function _lsCheckNoTempo() {
  if (_ls.userBpm || _ls.bars || _ls.noTempoShown || !_ls.state) return;
  const sec = _ls.state.frames * _lsDsp().HOP_SIZE / _ls.sampleRate;
  if (sec >= 45) { _ls.noTempoShown = true; _lsMsg(t('listenErrNoTempo')); }
}

function _lsHighlightLast() {
  document.querySelectorAll('.measure.playing').forEach(el => el.classList.remove('playing'));
  const si = chartData.sections.length - 1, mi = chartData.sections[si].measures.length - 1;
  if (mi < 0) return;
  const el = document.querySelector(`.measure[data-si="${si}"][data-mi="${mi}"]`);
  if (el) { el.classList.add('playing'); el.scrollIntoView({ block: 'nearest' }); }
}

function listenNewSection() {
  if (!_ls.active || chartData !== _ls.chart) return;
  const secs = chartData.sections;
  const last = secs[secs.length - 1];
  _ls.sectionsByUser = true;
  if (!last.measures.length) return; // section vide déjà prête
  secs.push({ id: _lsNewId(), label: nextSectionLabel(secs.map(s => s.label)), annotation: '', measures: [] });
  render();
  _lsHighlightLast();
}

function listenStop() {
  if (!_ls.active) return;
  _ls.active = false;
  const st = _ls.state;
  // Événements encore en file, puis les dernières mesures de l'assembleur (sans surlignage), dans l'ordre.
  const queued = _ls.queue ? _ls.queue.take() : [];
  _lsHandleEvents(queued.concat(st ? st.assembler.flush() : []), false);
  const src = _ls.src, proc = _ls.proc, ctx = _ls.ctx, stream = _ls.stream;
  _ls.src = _ls.proc = _ls.ctx = _ls.stream = null;
  try { if (src && src.stop) src.stop(); } catch (_) {}
  try { if (src) src.disconnect(); } catch (_) {}
  if (proc) { proc.onaudioprocess = null; try { proc.disconnect(); } catch (_) {} }
  if (stream) stream.getTracks().forEach(tr => tr.stop());
  if (ctx) ctx.close().catch(() => {});
  document.body.classList.remove('listening');
  document.querySelectorAll('.measure.playing').forEach(el => el.classList.remove('playing'));
  if (chartData !== _ls.chart) { _lsHideBar(); return; }
  // Section vide créée par « Nouvelle section » juste avant l'arrêt : retirée.
  const secs = chartData.sections;
  if (secs.length > 1 && !secs[secs.length - 1].measures.length) secs.pop();
  _ls.data = st ? st.assembler.data() : null;
  const key = _ls.data && _lsDsp().estimateKey(_ls.data.beatChroma);
  if (key) { chartData.key = key; originalKey = key; }
  if (_ls.data && _ls.data.bpm) chartData.tempo = Math.round(_ls.data.bpm);
  _isDirty = true;
  _ls.done = true;
  _ls.proposals = null;
  render();
  _lsSnapshot();
  if (!_ls.sectionsByUser) _lsRefreshProposals();
  _lsShowBar();
  if (!_ls.bars && !_ls.userBpm) _lsMsg(t('listenErrNoTempo'));
}

function _lsSnapshot() { _ls.snapshot = listenSectionsFingerprint(chartData.sections); }
function _lsEditedSinceStop() { return _ls.snapshot !== listenSectionsFingerprint(chartData.sections); }

// Propositions de sections pour la grille telle qu'elle est maintenant (empreinte mémorisée).
function _lsRefreshProposals() {
  _ls.proposals = listenProposeSections(chartData.sections);
  _ls.proposalsFor = _ls.proposals ? listenSectionsFingerprint(chartData.sections) : null;
}

// Décalage d'un temps (cumulé) ou changement du nombre d'accords par mesure, sans réécouter.
function _lsRebuild(offsetDelta, chordsPerBar) {
  if (!_ls.done || !_ls.data) return;
  if (chartData !== _ls.chart) { _lsHideBar(); return; } // une autre grille a été ouverte depuis
  if (_lsEditedSinceStop() && !confirm(t('listenConfirmReplace'))) return;
  snapshotUndo();
  _ls.offset += offsetDelta;
  if (chordsPerBar) _ls.chordsPerBar = chordsPerBar;
  const bars = _lsDsp().rebuildBars(_ls.data, { beatsPerBar: _ls.beatsPerBar, chordsPerBar: _ls.chordsPerBar, beatOffset: _ls.offset });
  chartData.sections = listenDistributeBars(chartData.sections, bars);
  _ls.bars = bars.length;
  render();
  _lsSnapshot();
  if (_ls.proposals) _lsRefreshProposals();
  _lsUpdateBar();
}
function listenShift(delta) { _lsRebuild(delta, 0); }
function listenSetChordsPerBar(n) { if (n !== _ls.chordsPerBar) _lsRebuild(0, n); }

// N'applique que des propositions calculées sur la grille actuelle ; sinon elles sont recalculées
// (et montrées à nouveau) ou retirées, jamais appliquées à l'aveugle.
function listenApplySections() {
  if (!_ls.proposals) return;
  if (chartData !== _ls.chart) { _lsHideBar(); return; } // une autre grille a été ouverte depuis
  if (_ls.proposalsFor !== listenSectionsFingerprint(chartData.sections)) {
    _lsRefreshProposals();
    _lsUpdateBar();
    _lsMsg(t(_ls.proposals ? 'listenSectionsUpdated' : 'listenSectionsNone'));
    return;
  }
  snapshotUndo();
  chartData.sections = listenSplitSections(chartData.sections[0], _ls.proposals);
  _ls.proposals = null;
  render();
  _lsSnapshot();
  _lsUpdateBar();
}
function listenIgnoreSections() { _ls.proposals = null; _lsUpdateBar(); }

function listenCloseBar() { _ls.done = false; _lsHideBar(); }

// ── Bandeau ──
function _lsMsg(text) {
  const m = _lsEl('lb-msg');
  m.textContent = text || '';
  m.style.display = text ? '' : 'none';
}

function _lsShowBar() {
  _lsMsg('');
  document.body.classList.add('listen-bar-on');
  _lsUpdateBar();
}
function _lsHideBar() {
  document.body.classList.remove('listen-bar-on');
  document.body.style.removeProperty('--lb-h');
}

function _lsUpdateBar() {
  if (!document.body.classList.contains('listen-bar-on')) return;
  const live = _ls.active;
  _lsEl('listen-bar').classList.toggle('done', !live);
  _lsEl('lb-status').style.display = live ? '' : 'none';
  const tempo = _ls.userBpm || (_ls.state && _ls.state.assembler.data().bpm);
  _lsEl('lb-tempo').textContent = tempo ? Math.round(tempo) + ' BPM' : '… BPM';
  _lsEl('lb-timesig').textContent = chartData.timeSig;
  const total = chartData.sections.reduce((n, s) => n + s.measures.length, 0);
  _lsEl('lb-bar').textContent = t('listenBar') + ' ' + total;
  _lsEl('lb-live').style.display = live ? '' : 'none';
  _lsEl('lb-pause').style.display = live && _ls.kind === 'file' ? '' : 'none';
  _lsEl('lb-pause').textContent = t(_ls.ctx && _ls.ctx.state === 'suspended' ? 'listenResume' : 'listenPause');
  _lsEl('lb-done').style.display = live ? 'none' : '';
  _lsEl('lb-cpb-1').classList.toggle('active', _ls.chordsPerBar === 1);
  _lsEl('lb-cpb-2').classList.toggle('active', _ls.chordsPerBar === 2);
  const canRebuild = !!(_ls.data && _ls.data.beatChroma && _ls.data.beatChroma.length);
  ['lb-shift-left', 'lb-shift-right', 'lb-cpb-1', 'lb-cpb-2'].forEach(id => { _lsEl(id).disabled = !canRebuild; });
  const ps = _lsEl('lb-sections');
  if (!live && _ls.proposals) {
    _lsEl('lb-sections-list').textContent = _ls.proposals.map(p => p.label + '(' + p.length + ')').join(' ');
    ps.style.display = '';
  } else ps.style.display = 'none';
  document.body.style.setProperty('--lb-h', _lsEl('listen-bar').offsetHeight + 'px');
}

function _lsKeydown(e) {
  if (!_lsListening() || e.ctrlKey || e.metaKey || e.altKey) return;
  if (e.key !== 'n' && e.key !== 'N') return;
  const a = document.activeElement, tag = a && a.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (a && a.isContentEditable)) return;
  e.preventDefault();
  listenNewSection();
}

function _lsInit() {
  if (typeof document === 'undefined' || !_lsEl('listen-dialog')) return;
  _lsEl('ls-btn-tab').addEventListener('click', listenStartTab);
  _lsEl('ls-tap').addEventListener('click', listenTap);
  const drop = _lsEl('ls-drop'), fi = _lsEl('ls-file');
  drop.addEventListener('click', () => fi.click());
  fi.addEventListener('change', e => { listenStartFile(e.target.files[0]); e.target.value = ''; });
  drop.addEventListener('dragover', e => { e.preventDefault(); drop.classList.add('drag-over'); });
  drop.addEventListener('dragleave', () => drop.classList.remove('drag-over'));
  drop.addEventListener('drop', e => { e.preventDefault(); drop.classList.remove('drag-over'); listenStartFile(e.dataTransfer.files[0]); });
  _lsEl('lb-newsec').addEventListener('click', listenNewSection);
  _lsEl('lb-stop').addEventListener('click', listenStop);
  _lsEl('lb-pause').addEventListener('click', listenTogglePause);
  _lsEl('lb-shift-left').addEventListener('click', () => listenShift(-1));
  _lsEl('lb-shift-right').addEventListener('click', () => listenShift(1));
  _lsEl('lb-cpb-1').addEventListener('click', () => listenSetChordsPerBar(1));
  _lsEl('lb-cpb-2').addEventListener('click', () => listenSetChordsPerBar(2));
  _lsEl('lb-apply').addEventListener('click', listenApplySections);
  _lsEl('lb-ignore').addEventListener('click', listenIgnoreSections);
  _lsEl('lb-close').addEventListener('click', listenCloseBar);
  document.addEventListener('keydown', _lsKeydown);
  window.addEventListener('resize', _lsUpdateBar);
}
_lsInit();

if (typeof module !== 'undefined') module.exports = {
  listenTabSupported, listenStreamHasAudio, listenTitleFromFile, listenTitleFromTrackLabel, nextSectionLabel, listenNewChart,
  listenMeasureFromBar, listenBeatsPerBar, listenTapBpm, listenDistributeBars, listenSplitSections,
  listenCreateProcessor, listenProcessFrame, listenFeedSamples,
  listenSectionsFingerprint, listenProposeSections, listenCreateEventQueue, LISTEN_PROC_BUFFER
};

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   JS — AI : SETTINGS
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

const _AI_STORAGE_KEY = 'jgg_ai_settings';
const _AI_DEFAULTS = {
  provider: 'claude',
  claudeModel: 'claude-sonnet-4-6',
  openaiModel: 'gpt-4o',
  claudeKey: '',
  openaiKey: '',
  infomaniakModel: 'euria',
  infomaniakKey: '',
  infomaniakProductId: ''
};

function aiSettingsLoad() {
  try {
    const raw = localStorage.getItem(_AI_STORAGE_KEY);
    return raw ? Object.assign({}, _AI_DEFAULTS, JSON.parse(raw)) : Object.assign({}, _AI_DEFAULTS);
  } catch (e) { console.warn('[AI] settings parse error, using defaults', e); return Object.assign({}, _AI_DEFAULTS); }
}

function aiSettingsSave(patch) {
  localStorage.setItem(_AI_STORAGE_KEY,
    JSON.stringify(Object.assign(aiSettingsLoad(), patch)));
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   JS — AI : PROVIDERS
   Interface commune : aiProviderChat(systemPrompt, messages, tools, settings)
   → Promise<{ message: string, toolCalls: [{id, name, args}] }>
   messages format : [{role:'user'|'assistant', content:string}]
   tools format    : [{name, description, inputSchema:{type,properties,required}}]
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

async function aiProviderChat(systemPrompt, messages, tools, settings) {
  if (settings.provider === 'openai') return _aiCallOpenAI(systemPrompt, messages, tools, settings);
  if (settings.provider === 'infomaniak') return _aiCallInfomaniak(systemPrompt, messages, tools, settings);
  return _aiCallClaude(systemPrompt, messages, tools, settings);
}

async function _aiCallClaude(systemPrompt, messages, tools, settings) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': settings.claudeKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
      'anthropic-dangerous-direct-browser-access': 'true'
    },
    body: JSON.stringify({
      model: settings.claudeModel || 'claude-sonnet-4-6',
      max_tokens: 4096,
      system: systemPrompt,
      messages: messages.map(m => ({ role: m.role, content: m.content })),
      tools: tools.map(t => ({ name: t.name, description: t.description, input_schema: t.inputSchema }))
    })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error('Claude ' + res.status + ': ' + (err.error?.message || res.statusText));
  }
  const data = await res.json();
  let message = '';
  const toolCalls = [];
  for (const block of data.content || []) {
    if (block.type === 'text') message += block.text;
    else if (block.type === 'tool_use') toolCalls.push({ id: block.id, name: block.name, args: block.input });
  }
  return { message, toolCalls };
}

async function _aiCallOpenAI(systemPrompt, messages, tools, settings) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + settings.openaiKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: settings.openaiModel || 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages.map(m => ({ role: m.role, content: m.content }))
      ],
      tools: tools.map(t => ({ type: 'function', function: { name: t.name, description: t.description, parameters: t.inputSchema } }))
    })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error('OpenAI ' + res.status + ': ' + (err.error?.message || res.statusText));
  }
  const data = await res.json();
  const msg = data.choices?.[0]?.message || {};
  return {
    message: msg.content || '',
    toolCalls: (msg.tool_calls || []).map(tc => ({
      id: tc.id, name: tc.function.name,
      args: JSON.parse(tc.function.arguments || '{}')
    }))
  };
}

async function _aiCallInfomaniak(systemPrompt, messages, tools, settings) {
  const productId = settings.infomaniakProductId;
  if (!productId) throw new Error('Product ID Infomaniak non configuré');
  const res = await fetch('https://api.infomaniak.com/2/ai/' + productId + '/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + settings.infomaniakKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: settings.infomaniakModel || 'euria',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages.map(m => ({ role: m.role, content: m.content }))
      ],
      tools: tools.map(t => ({ type: 'function', function: { name: t.name, description: t.description, parameters: t.inputSchema } }))
    })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error('Infomaniak ' + res.status + ': ' + (err.error?.message || res.statusText));
  }
  const data = await res.json();
  const msg = data.choices?.[0]?.message || {};
  return {
    message: msg.content || '',
    toolCalls: (msg.tool_calls || []).map(tc => ({
      id: tc.id, name: tc.function.name,
      args: JSON.parse(tc.function.arguments || '{}')
    }))
  };
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   JS — AI : TOOLS — schémas (envoyés à l'API)
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

const AI_TOOLS = [
  {
    name: 'set_chart_metadata',
    description: 'Modifie les métadonnées du chart : titre, tonalité, tempo, mesure (timeSig), style. Tous les paramètres sont optionnels.',
    inputSchema: { type: 'object', properties: {
      title: { type: 'string', description: 'Titre du morceau' },
      key: { type: 'string', description: 'Tonalité ex: C, Bb, F#m' },
      tempo: { type: 'number', description: 'Tempo en BPM' },
      timeSignature: { type: 'string', description: 'Mesure ex: 4/4, 3/4' },
      style: { type: 'string', description: 'Style ex: Swing, Bossa Nova' }
    }, required: [] }
  },
  {
    name: 'transpose_chart',
    description: 'Transpose tout le chart d\'un nombre de demi-tons (positif = monte, négatif = descend).',
    inputSchema: { type: 'object', properties: {
      semitones: { type: 'number', description: 'Nombre de demi-tons, ex: 2 ou -3' }
    }, required: ['semitones'] }
  },
  {
    name: 'set_columns',
    description: 'Change le nombre de colonnes par ligne dans la grille (1 à 4).',
    inputSchema: { type: 'object', properties: {
      count: { type: 'number', description: '1, 2, 3 ou 4' }
    }, required: ['count'] }
  },
  {
    name: 'set_bass_strings',
    description: 'Bascule entre basse 4 cordes (EADG) et 5 cordes (BEADG) pour les diagrammes SVG.',
    inputSchema: { type: 'object', properties: {
      count: { type: 'number', description: '4 pour EADG, 5 pour BEADG' }
    }, required: ['count'] }
  },
  {
    name: 'add_section',
    description: 'Ajoute une nouvelle section VIDE (sans accords). Pour copier une section existante avec ses accords, utiliser duplicate_section.',
    inputSchema: { type: 'object', properties: {
      label: { type: 'string', description: 'Nom de section ex: A, B, Intro, Verse, Chorus' },
      suffix: { type: 'string', description: "Suffixe optionnel : ', '', 1, 2" },
      position: { type: 'number', description: 'Index d\'insertion 0-based. Omis = fin.' },
      barCount: { type: 'number', description: 'Nombre de mesures. Défaut : 4.' }
    }, required: ['label'] }
  },
  {
    name: 'duplicate_section',
    description: 'Duplique une section entière (accords, annotations, barres) juste après la section originale. Le label reçoit le suffixe " (bis)".',
    inputSchema: { type: 'object', properties: {
      sectionIndex: { type: 'number', description: 'Index de la section à dupliquer (0-based).' }
    }, required: ['sectionIndex'] }
  },
  {
    name: 'remove_section',
    description: 'Supprime une section (index 0-based). Impossible si c\'est la dernière.',
    inputSchema: { type: 'object', properties: {
      sectionIndex: { type: 'number' }
    }, required: ['sectionIndex'] }
  },
  {
    name: 'rename_section',
    description: 'Renomme une section.',
    inputSchema: { type: 'object', properties: {
      sectionIndex: { type: 'number' },
      label: { type: 'string', description: 'Nouveau nom' },
      suffix: { type: 'string', description: "Suffixe optionnel : ', '', 1, 2" }
    }, required: ['sectionIndex', 'label'] }
  },
  {
    name: 'add_bar',
    description: 'Ajoute une mesure VIDE (sans accords) dans une section. Pour copier une mesure existante avec ses accords, utiliser duplicate_bar.',
    inputSchema: { type: 'object', properties: {
      sectionIndex: { type: 'number' },
      position: { type: 'number', description: 'Index d\'insertion. Omis = fin de section.' }
    }, required: ['sectionIndex'] }
  },
  {
    name: 'duplicate_bar',
    description: 'Duplique une mesure entière (accords, annotations, barres) juste après la mesure originale.',
    inputSchema: { type: 'object', properties: {
      sectionIndex: { type: 'number', description: 'Index de la section (0-based).' },
      barIndex: { type: 'number', description: 'Index de la mesure à dupliquer (0-based).' }
    }, required: ['sectionIndex', 'barIndex'] }
  },
  {
    name: 'remove_bar',
    description: 'Supprime une mesure d\'une section.',
    inputSchema: { type: 'object', properties: {
      sectionIndex: { type: 'number' },
      barIndex: { type: 'number', description: 'Index 0-based de la mesure' }
    }, required: ['sectionIndex', 'barIndex'] }
  },
  {
    name: 'set_barline',
    description: 'Change le type de barre d\'une mesure (gauche ou droite).',
    inputSchema: { type: 'object', properties: {
      sectionIndex: { type: 'number' },
      barIndex: { type: 'number' },
      side: { type: 'string', description: '"left" ou "right"' },
      type: { type: 'string', description: '"normal", "double", "final", "repeat-start", "repeat-end"' }
    }, required: ['sectionIndex', 'barIndex', 'side', 'type'] }
  },
  {
    name: 'add_chord',
    description: 'Ajoute un accord dans une mesure existante.',
    inputSchema: { type: 'object', properties: {
      sectionIndex: { type: 'number' },
      barIndex: { type: 'number' },
      symbol: { type: 'string', description: 'Symbole complet ex: Cmaj7, Dm7, G7, Bb7, Am7b5/G' },
      beats: { type: 'number', description: 'Durée en temps. Défaut : 2.' },
      position: { type: 'number', description: 'Index d\'insertion. Omis = fin de mesure.' }
    }, required: ['sectionIndex', 'barIndex', 'symbol'] }
  },
  {
    name: 'edit_chord',
    description: 'Modifie symbole et/ou durée d\'un accord existant.',
    inputSchema: { type: 'object', properties: {
      sectionIndex: { type: 'number' },
      barIndex: { type: 'number' },
      chordIndex: { type: 'number' },
      symbol: { type: 'string', description: 'Nouveau symbole. Omis = inchangé.' },
      beats: { type: 'number', description: 'Nouvelle durée. Omis = inchangée.' }
    }, required: ['sectionIndex', 'barIndex', 'chordIndex'] }
  },
  {
    name: 'remove_chord',
    description: 'Supprime un accord. Impossible si c\'est le seul accord de la mesure.',
    inputSchema: { type: 'object', properties: {
      sectionIndex: { type: 'number' },
      barIndex: { type: 'number' },
      chordIndex: { type: 'number' }
    }, required: ['sectionIndex', 'barIndex', 'chordIndex'] }
  },
  {
    name: 'set_chord_alt',
    description: 'Définit ou efface l\'accord alternatif (substitution) d\'un accord.',
    inputSchema: { type: 'object', properties: {
      sectionIndex: { type: 'number' },
      barIndex: { type: 'number' },
      chordIndex: { type: 'number' },
      altSymbol: { type: 'string', description: 'Symbole alternatif ex: Db7. null pour effacer.' }
    }, required: ['sectionIndex', 'barIndex', 'chordIndex'] }
  },
  {
    name: 'set_annotation',
    description: 'Ajoute/modifie l\'annotation théorique d\'un accord (mode, arpège, tensions, note libre).',
    inputSchema: { type: 'object', properties: {
      sectionIndex: { type: 'number' },
      barIndex: { type: 'number' },
      chordIndex: { type: 'number' },
      showMode: { type: 'boolean', description: 'Afficher le mode compatible' },
      showArp: { type: 'boolean', description: 'Afficher l\'arpège 4 sons' },
      showTens: { type: 'boolean', description: 'Afficher les tensions' },
      tensions: { type: 'array', items: { type: 'string' }, description: 'Tensions sélectionnées ex: ["b9","#11"]' },
      freeText: { type: 'string', description: 'Note libre' }
    }, required: ['sectionIndex', 'barIndex', 'chordIndex'] }
  }
];

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   JS — AI : TOOLS — exécuteurs (opèrent sur le draft JSON)
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

const _AI_TOOL_EXECUTORS = {

  set_chart_metadata(draft, a) {
    if (a.title !== undefined) draft.title = a.title;
    if (a.key !== undefined) draft.key = a.key;
    if (a.tempo !== undefined) draft.tempo = parseInt(a.tempo);
    if (a.timeSignature !== undefined) draft.timeSig = a.timeSignature;
    if (a.style !== undefined) draft.style = a.style;
  },

  transpose_chart(draft, a) {
    const s = parseInt(a.semitones);
    if (!s) return;
    const origKey = draft.key;
    const destKey = ALL_KEYS.find(k => noteIdx(k) === (noteIdx(origKey) + s + 120) % 12) || origKey;
    draft.sections.forEach(sec => sec.measures.forEach(m => m.chords.forEach(c => {
      if (c.symbol && !['%', '%%', 'N.C.', '/', '–', '/beat'].includes(c.symbol))
        c.symbol = transposeChordSymbol(c.symbol, s, destKey);
    })));
    draft.key = destKey;
  },

  set_columns(draft, a) { draft._uiColumns = Math.max(1, Math.min(4, parseInt(a.count))); },

  set_bass_strings(draft, a) {
    const n = parseInt(a.count);
    if (n === 4 || n === 5) draft._uiBassStrings = n;
  },

  add_section(draft, a) {
    const beats = parseInt((draft.timeSig || '4/4').split('/')[0]) || 4;
    const barCount = Math.max(1, parseInt(a.barCount) || 4);
    const newSection = {
      label: (a.label || 'A') + (a.suffix || ''),
      annotation: '',
      measures: Array.from({ length: barCount }, () => ({
        chords: [{ symbol: '%', beats, annot: null }],
        barlineLeft: 'normal', barlineRight: 'normal',
        repeatStart: false, repeatEnd: false, volta: null, navSymbol: null
      }))
    };
    const pos = a.position !== undefined ? parseInt(a.position) : draft.sections.length;
    draft.sections.splice(Math.max(0, Math.min(pos, draft.sections.length)), 0, newSection);
  },

  duplicate_section(draft, a) {
    const idx = parseInt(a.sectionIndex);
    if (idx < 0 || idx >= draft.sections.length) throw new Error('sectionIndex out of range');
    const clone = JSON.parse(JSON.stringify(draft.sections[idx]));
    clone.label += ' (bis)';
    draft.sections.splice(idx + 1, 0, clone);
  },

  remove_section(draft, a) {
    if (draft.sections.length <= 1) throw new Error('Cannot remove the last section');
    const idx = parseInt(a.sectionIndex);
    if (idx < 0 || idx >= draft.sections.length) throw new Error('sectionIndex out of range');
    draft.sections.splice(idx, 1);
  },

  rename_section(draft, a) {
    const s = draft.sections[parseInt(a.sectionIndex)];
    if (!s) throw new Error('Section not found');
    s.label = a.label + (a.suffix || '');
  },

  add_bar(draft, a) {
    const sec = draft.sections[parseInt(a.sectionIndex)];
    if (!sec) throw new Error('Section not found');
    const beats = parseInt((draft.timeSig || '4/4').split('/')[0]) || 4;
    const bar = {
      chords: [{ symbol: '%', beats, annot: null }],
      barlineLeft: 'normal', barlineRight: 'normal',
      repeatStart: false, repeatEnd: false, volta: null, navSymbol: null
    };
    const pos = a.position !== undefined ? parseInt(a.position) : sec.measures.length;
    sec.measures.splice(Math.max(0, Math.min(pos, sec.measures.length)), 0, bar);
  },

  duplicate_bar(draft, a) {
    const sec = draft.sections[parseInt(a.sectionIndex)];
    if (!sec) throw new Error('Section not found');
    const idx = parseInt(a.barIndex);
    if (idx < 0 || idx >= sec.measures.length) throw new Error('barIndex out of range');
    const clone = JSON.parse(JSON.stringify(sec.measures[idx]));
    sec.measures.splice(idx + 1, 0, clone);
  },

  remove_bar(draft, a) {
    const sec = draft.sections[parseInt(a.sectionIndex)];
    if (!sec) throw new Error('Section not found');
    if (sec.measures.length <= 1) throw new Error('Cannot remove the last measure');
    const idx = parseInt(a.barIndex);
    if (idx < 0 || idx >= sec.measures.length) throw new Error('barIndex out of range');
    sec.measures.splice(idx, 1);
  },

  set_barline(draft, a) {
    const m = draft.sections[parseInt(a.sectionIndex)]?.measures[parseInt(a.barIndex)];
    if (!m) throw new Error('Measure not found');
    if (a.side === 'left') m.barlineLeft = a.type;
    else m.barlineRight = a.type;
  },

  add_chord(draft, a) {
    const bar = draft.sections[parseInt(a.sectionIndex)]?.measures[parseInt(a.barIndex)];
    if (!bar) throw new Error('Measure not found');
    const chord = { symbol: a.symbol, beats: parseInt(a.beats) || 2, annot: null };
    const pos = a.position !== undefined ? parseInt(a.position) : bar.chords.length;
    bar.chords.splice(Math.max(0, Math.min(pos, bar.chords.length)), 0, chord);
  },

  edit_chord(draft, a) {
    const chord = draft.sections[parseInt(a.sectionIndex)]?.measures[parseInt(a.barIndex)]?.chords[parseInt(a.chordIndex)];
    if (!chord) throw new Error('Chord not found');
    if (a.symbol !== undefined) chord.symbol = a.symbol;
    if (a.beats !== undefined) chord.beats = parseInt(a.beats);
  },

  remove_chord(draft, a) {
    const bar = draft.sections[parseInt(a.sectionIndex)]?.measures[parseInt(a.barIndex)];
    if (!bar) throw new Error('Measure not found');
    if (bar.chords.length <= 1) throw new Error('Cannot remove the last chord');
    const idx = parseInt(a.chordIndex);
    if (idx < 0 || idx >= bar.chords.length) throw new Error('chordIndex out of range');
    bar.chords.splice(idx, 1);
  },

  set_chord_alt(draft, a) {
    const chord = draft.sections[parseInt(a.sectionIndex)]?.measures[parseInt(a.barIndex)]?.chords[parseInt(a.chordIndex)];
    if (!chord) throw new Error('Chord not found');
    if (a.altSymbol != null && a.altSymbol !== '') chord.altChord = a.altSymbol;
    else delete chord.altChord;
  },

  set_annotation(draft, a) {
    const chord = draft.sections[parseInt(a.sectionIndex)]?.measures[parseInt(a.barIndex)]?.chords[parseInt(a.chordIndex)];
    if (!chord) throw new Error('Chord not found');
    chord.annot = {
      showMode: !!a.showMode, showArp: !!a.showArp,
      showTens: !!(a.showTens && a.tensions?.length),
      showFree: !!(a.freeText),
      modeIdx: 0, invIdx: 0,
      selTens: a.tensions || [], showSvg: true,
      freeText: a.freeText || '',
      freeColor: '#c4b5fd', freeBold: false, freeItalic: true
    };
  }
};

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   JS — AI : DRAFT
   Copie profonde du chartData pour preview avant application
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

let _aiDraft = null;

function aiDraftCreate() {
  _aiDraft = JSON.parse(JSON.stringify(chartData));
  return _aiDraft;
}

function aiDraftApplyTool(name, args) {
  if (!_aiDraft) throw new Error('No draft active');
  const exec = _AI_TOOL_EXECUTORS[name];
  if (!exec) throw new Error('Unknown tool: ' + name);
  exec(_aiDraft, args);
}

function aiDraftDiff() {
  if (!_aiDraft) return [];
  const c = chartData, d = _aiDraft;
  const lines = [];
  if (d.title !== c.title) lines.push('Titre : "' + c.title + '" → "' + d.title + '"');
  if (d.key !== c.key) lines.push('Tonalité : ' + c.key + ' → ' + d.key);
  if (String(d.tempo) !== String(c.tempo)) lines.push('Tempo : ' + c.tempo + ' → ' + d.tempo);
  if (d.timeSig !== c.timeSig) lines.push('Mesure : ' + c.timeSig + ' → ' + d.timeSig);
  if (d.style !== c.style) lines.push('Style : ' + c.style + ' → ' + d.style);
  if (d.sections.length !== c.sections.length)
    lines.push('Sections : ' + c.sections.length + ' → ' + d.sections.length);
  const minS = Math.min(d.sections.length, c.sections.length);
  for (let si = 0; si < minS; si++) {
    const ds = d.sections[si], cs = c.sections[si];
    if (ds.label !== cs.label) lines.push('Section ' + (si+1) + ' : "' + cs.label + '" → "' + ds.label + '"');
    if (ds.measures.length !== cs.measures.length)
      lines.push(ds.label + ' : ' + cs.measures.length + ' → ' + ds.measures.length + ' mesure(s)');
    const minM = Math.min(ds.measures.length, cs.measures.length);
    for (let mi = 0; mi < minM; mi++) {
      const dc = ds.measures[mi].chords.map(ch => ch.symbol).join(' | ');
      const cc = cs.measures[mi].chords.map(ch => ch.symbol).join(' | ');
      if (dc !== cc) lines.push(ds.label + ' mes.' + (mi+1) + ' : ' + cc + ' → ' + dc);
    }
  }
  if (d._uiBassStrings && d._uiBassStrings !== window.bassStrings)
    lines.push('Cordes basse : ' + window.bassStrings + ' → ' + d._uiBassStrings);
  if (d._uiColumns) {
    const cur = parseInt(document.getElementById('global-cols')?.value) || 4;
    if (d._uiColumns !== cur) lines.push('Colonnes : ' + cur + ' → ' + d._uiColumns);
  }
  return lines;
}

function aiDraftApply() {
  if (!_aiDraft) return;
  snapshotUndo();
  if (_aiDraft._uiBassStrings) { setBassStrings(_aiDraft._uiBassStrings); delete _aiDraft._uiBassStrings; }
  if (_aiDraft._uiColumns) {
    const sel = document.getElementById('global-cols');
    if (sel) sel.value = _aiDraft._uiColumns;
    delete _aiDraft._uiColumns;
  }
  chartData = _aiDraft;
  _aiDraft = null;
  render();
}

function aiDraftDiscard() { _aiDraft = null; }

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   JS — AI : CHAT
   Orchestration, historique, rendu messages + preview
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

let _aiHistory = [];
const _AI_MAX_HISTORY = 20;

function aiChatToggle() {
  document.getElementById('ai-panel').classList.toggle('ai-open');
  if (document.getElementById('ai-panel').classList.contains('ai-open'))
    document.getElementById('ai-input').focus();
}

function _aiSystemPrompt() {
  const lang = (typeof currentLang !== 'undefined' ? currentLang : null)
    || document.getElementById('lang-select')?.value || 'fr';
  const prompts = {
    fr: "Tu es un assistant musical intégré à Jazz Grid Generator. Aide l'utilisateur à construire et modifier des grilles jazz en utilisant les outils disponibles. Avant d'agir, résume en 1-2 phrases ce que tu vas faire. Si une demande est ambiguë, pose une question de clarification. Réponds en français.\nRègle importante : pour dupliquer/copier une section → duplicate_section ; pour dupliquer/copier une mesure → duplicate_bar. N'utilise jamais add_section ou add_bar pour dupliquer.\n\nÉtat actuel de la grille :\n",
    en: "You are a musical assistant integrated into Jazz Grid Generator. Help the user build and modify jazz chord charts using the available tools. Before acting, summarize in 1-2 sentences what you will do. If a request is ambiguous, ask for clarification. Respond in English.\nImportant rule: to duplicate/copy a section → duplicate_section; to duplicate/copy a bar → duplicate_bar. Never use add_section or add_bar to duplicate.\n\nCurrent chart state:\n",
    es: "Eres un asistente musical integrado en Jazz Grid Generator. Ayuda al usuario con sus grillas jazz usando las herramientas disponibles. Antes de actuar, resume en 1-2 frases lo que harás. Si algo es ambiguo, pregunta. Responde en español.\nRegla importante: para duplicar una sección → duplicate_section; para duplicar un compás → duplicate_bar.\n\nEstado actual:\n",
    it: "Sei un assistente musicale in Jazz Grid Generator. Aiuta l'utente con griglie jazz usando gli strumenti disponibili. Prima di agire, riassumi in 1-2 frasi. Se ambiguo, chiedi. Rispondi in italiano.\nRegola importante: per duplicare una sezione → duplicate_section; per duplicare una misura → duplicate_bar.\n\nGriglia attuale:\n"
  };
  return (prompts[lang] || prompts.en) + JSON.stringify(chartData);
}

async function aiChatSend(text) {
  text = (text || '').trim();
  if (!text) return;
  const settings = aiSettingsLoad();
  const key = settings.provider === 'openai'     ? settings.openaiKey
            : settings.provider === 'infomaniak' ? settings.infomaniakKey
            : settings.claudeKey;
  if (!key) { _aiMsg('error', 'Clé API non configurée — cliquer ⚙'); return; }

  document.getElementById('ai-input').value = '';
  _aiMsg('user', text);
  _aiHistory.push({ role: 'user', content: text });
  const loadEl = _aiMsg('loading', '…');
  document.getElementById('ai-send').disabled = true;

  try {
    const resp = await aiProviderChat(
      _aiSystemPrompt(),
      _aiHistory.slice(-_AI_MAX_HISTORY),
      AI_TOOLS, settings
    );
    _aiHistory.push({ role: 'assistant', content: resp.message });

    if (resp.toolCalls && resp.toolCalls.length > 0) {
      if (_aiDraft) aiDraftDiscard();
      aiDraftCreate();
      const errors = [];
      for (const tc of resp.toolCalls) {
        try { aiDraftApplyTool(tc.name, tc.args); }
        catch (e) { errors.push(tc.name + ': ' + e.message); }
      }
      _aiRenderPreview(resp.message, aiDraftDiff(), errors);
    } else {
      if (resp.message) _aiMsg('assistant', resp.message);
    }
  } catch (err) {
    _aiMsg('error', 'Erreur : ' + err.message);
  } finally {
    loadEl.remove();
    document.getElementById('ai-send').disabled = false;
  }
}

function _aiMsg(role, text) {
  const log = document.getElementById('ai-log');
  const div = document.createElement('div');
  div.className = 'ai-msg ai-msg-' + role;
  div.textContent = text;
  log.appendChild(div);
  log.scrollTop = log.scrollHeight;
  return div;
}

function _aiRenderPreview(message, diff, errors) {
  const log = document.getElementById('ai-log');
  const card = document.createElement('div');
  card.className = 'ai-preview-card';
  let html = '';
  if (message) html += '<p class="ai-preview-msg">' + escHtml(message) + '</p>';
  if (diff.length) html += '<ul class="ai-preview-diff">' + diff.map(l => '<li>' + escHtml(l) + '</li>').join('') + '</ul>';
  if (errors.length) html += '<p class="ai-preview-err">⚠ ' + escHtml(errors.join(', ')) + '</p>';
  html += '<div class="ai-preview-btns"><button class="ai-btn-apply" onclick="aiChatApply(this)">✅ Appliquer</button><button class="ai-btn-cancel" onclick="aiChatCancel(this)">✕ Annuler</button></div>';
  card.innerHTML = html;
  log.appendChild(card);
  log.scrollTop = log.scrollHeight;
}

function aiChatApply(btn) {
  aiDraftApply();
  btn.closest('.ai-preview-btns').innerHTML = '<span class="ai-preview-status">✅ Appliqué</span>';
}

function aiChatCancel(btn) {
  aiDraftDiscard();
  btn.closest('.ai-preview-btns').innerHTML = '<span class="ai-preview-status">✕ Annulé</span>';
}

function aiChatHandleKey(e) {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); aiChatSend(document.getElementById('ai-input').value); }
}

function aiConfigToggle() {
  const panel = document.getElementById('ai-config');
  panel.classList.toggle('ai-config-open');
  if (panel.classList.contains('ai-config-open')) _aiConfigRender();
}

function _aiConfigRender() {
  const s = aiSettingsLoad();
  document.getElementById('ai-cfg-provider').value = s.provider;
  document.getElementById('ai-cfg-claude-model').value = s.claudeModel;
  document.getElementById('ai-cfg-openai-model').value = s.openaiModel;
  document.getElementById('ai-cfg-claude-key').value = s.claudeKey;
  document.getElementById('ai-cfg-openai-key').value = s.openaiKey;
  aiConfigUpdateRows(s.provider);
}

function aiConfigUpdateRows(provider) {
  document.getElementById('ai-cfg-row-claude').style.display = provider === 'claude' ? '' : 'none';
  document.getElementById('ai-cfg-row-openai').style.display = provider === 'openai' ? '' : 'none';
}

function aiConfigSave() {
  aiSettingsSave({
    provider: document.getElementById('ai-cfg-provider').value,
    claudeModel: document.getElementById('ai-cfg-claude-model').value,
    openaiModel: document.getElementById('ai-cfg-openai-model').value,
    claudeKey: document.getElementById('ai-cfg-claude-key').value,
    openaiKey: document.getElementById('ai-cfg-openai-key').value
  });
  document.getElementById('ai-config').classList.remove('ai-config-open');
}

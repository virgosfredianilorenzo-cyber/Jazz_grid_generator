/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   JS — AI : SETTINGS
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

const _AI_STORAGE_KEY = 'jgg_ai_settings';
const _AI_DEFAULTS = {
  provider: 'claude',
  claudeModel: 'claude-sonnet-4-6',
  openaiModel: 'gpt-4o',
  claudeKey: '',
  openaiKey: ''
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
    description: 'Ajoute une nouvelle section vide (défaut 4 mesures).',
    inputSchema: { type: 'object', properties: {
      label: { type: 'string', description: 'Nom de section ex: A, B, Intro, Verse, Chorus' },
      suffix: { type: 'string', description: "Suffixe optionnel : ', '', 1, 2" },
      position: { type: 'number', description: 'Index d\'insertion 0-based. Omis = fin.' },
      barCount: { type: 'number', description: 'Nombre de mesures. Défaut : 4.' }
    }, required: ['label'] }
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
    description: 'Ajoute une mesure vide dans une section.',
    inputSchema: { type: 'object', properties: {
      sectionIndex: { type: 'number' },
      position: { type: 'number', description: 'Index d\'insertion. Omis = fin de section.' }
    }, required: ['sectionIndex'] }
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

  remove_section(draft, a) {
    if (draft.sections.length <= 1) throw new Error('Cannot remove the last section');
    draft.sections.splice(parseInt(a.sectionIndex), 1);
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

  remove_bar(draft, a) {
    const sec = draft.sections[parseInt(a.sectionIndex)];
    if (!sec) throw new Error('Section not found');
    if (sec.measures.length <= 1) throw new Error('Cannot remove the last measure');
    sec.measures.splice(parseInt(a.barIndex), 1);
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
    bar.chords.splice(parseInt(a.chordIndex), 1);
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

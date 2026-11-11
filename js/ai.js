/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   JS — AI : SETTINGS
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

const _AI_STORAGE_KEY = 'jgg_ai_settings';
const AI_CLAUDE_MODELS = ['claude-opus-5-5', 'claude-sonnet-5-5', 'claude-haiku-5-5'];
const _AI_DEFAULTS = {
  claudeModel: AI_CLAUDE_MODELS[0],
  claudeKey: ''
};

// Retire les anciens réglages (OpenAI) et rend le modèle Claude valide.
function aiSettingsMigrate(raw) {
  const out = Object.assign({}, raw);
  delete out.provider;
  delete out.openaiKey;
  delete out.openaiModel;
  if (typeof out.claudeKey !== 'string') out.claudeKey = '';
  if (!AI_CLAUDE_MODELS.includes(out.claudeModel)) out.claudeModel = AI_CLAUDE_MODELS[0];
  return out;
}

function aiSettingsLoad() {
  try {
    const raw = localStorage.getItem(_AI_STORAGE_KEY);
    if (!raw) return Object.assign({}, _AI_DEFAULTS);
    const parsed = JSON.parse(raw);
    const migrated = aiSettingsMigrate(parsed);
    if (JSON.stringify(migrated) !== JSON.stringify(parsed))
      localStorage.setItem(_AI_STORAGE_KEY, JSON.stringify(migrated));
    return Object.assign({}, _AI_DEFAULTS, migrated);
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

async function aiProviderChat(systemPrompt, messages, tools, settings, opts) {
  return _aiCallClaude(systemPrompt, messages, tools, settings, opts || {});
}

const _AI_WEB_SEARCH_TOOL = { type: 'web_search_20260209', name: 'web_search', max_uses: 5 };
const _AI_FALLBACK_MODELS = ['claude-opus-5-5', 'claude-sonnet-5-5'];
const _AI_MAX_PAUSES = 3;

// Corps JSON de la requête /v1/messages.
function aiBuildClaudeBody({ system, messages, tools, model, webSearch }) {
  const body = {
    model: model || AI_CLAUDE_MODELS[0],
    max_tokens: 16000,
    system,
    messages: (messages || []).map(m => ({ role: m.role, content: m.content })),
    tools: (tools || []).map(t => t.inputSchema
      ? { name: t.name, description: t.description, input_schema: t.inputSchema }
      : t)
  };
  if (webSearch) body.tools.push(Object.assign({}, _AI_WEB_SEARCH_TOOL));
  if (_AI_FALLBACK_MODELS.includes(body.model)) body.fallbacks = 'default';
  return body;
}

// Extrait texte, appels d'outils et sources d'un tableau de blocs `content`.
function aiParseClaudeContent(content) {
  let message = '';
  const toolCalls = [];
  const cited = [], searched = [];
  const add = (list, url, title) => {
    if (typeof url === 'string' && url && !list.some(x => x.url === url)) list.push({ url, title: title || url });
  };
  for (const block of content || []) {
    if (!block) continue;
    if (block.type === 'text') {
      message += block.text || '';
      for (const c of block.citations || []) add(cited, c.url, c.title);
    } else if (block.type === 'tool_use') {
      toolCalls.push({ id: block.id, name: block.name, args: block.input });
    } else if (block.type === 'web_search_tool_result') {
      // En cas d'erreur, `content` est un objet (HTTP 200) : ne pas l'itérer.
      if (Array.isArray(block.content))
        for (const r of block.content) if (r && r.type === 'web_search_result') add(searched, r.url, r.title);
    }
  }
  return { message, toolCalls, sources: cited.length ? cited : searched };
}

function _aiErr(key, fallback) {
  return typeof t === 'function' && t(key) !== key ? t(key) : fallback;
}

// Exécute un tour : relance sur pause_turn (max 3), lève sur refusal.
async function aiRunClaudeTurn(body, doFetch) {
  const usage = { in: 0, out: 0 };
  let cur = body;
  const acc = []; // blocs de tous les segments (texte, sources, outils)
  for (let pauses = 0; ; pauses++) {
    const data = await doFetch(cur);
    acc.push(...(data.content || []));
    usage.in += data.usage?.input_tokens || 0;
    usage.out += data.usage?.output_tokens || 0;
    if (data.stop_reason === 'refusal') throw new Error(_aiErr('aiErrRefusal', 'Claude refused this request.'));
    if (data.stop_reason === 'pause_turn' && pauses < _AI_MAX_PAUSES) {
      cur = Object.assign({}, body, { messages: [...body.messages, { role: 'assistant', content: acc.slice() }] });
      continue;
    }
    return Object.assign(aiParseClaudeContent(acc), { usage });
  }
}

async function _aiCallClaude(systemPrompt, messages, tools, settings, opts) {
  const model = settings.claudeModel || AI_CLAUDE_MODELS[0];
  const body = aiBuildClaudeBody({ system: systemPrompt, messages, tools, model, webSearch: !!opts.webSearch });
  return aiRunClaudeTurn(body, async b => {
    const headers = {
      'x-api-key': settings.claudeKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
      'anthropic-dangerous-direct-browser-access': 'true'
    };
    if (b.fallbacks) headers['anthropic-beta'] = 'server-side-fallback-2026-07-01';
    const res = await fetch('https://api.anthropic.com/v1/messages', { method: 'POST', headers, body: JSON.stringify(b) });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error('Claude ' + res.status + ': ' + (err.error?.message || res.statusText));
    }
    return res.json();
  });
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   JS — AI : TOOLS — schémas (envoyés à l'API)
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

const AI_TOOLS = [
  {
    name: 'set_full_chart',
    description: 'Remplace TOUTE la grille par une nouvelle grille complète (titre, tonalité, sections, mesures, accords). À utiliser pour proposer la grille d\'un morceau trouvé ou connu. L\'annotation de la première section peut citer les sources.',
    inputSchema: { type: 'object', properties: {
      title: { type: 'string' }, key: { type: 'string', description: 'Tonalité ex: Cm' },
      tempo: { type: 'number' }, timeSig: { type: 'string', description: 'ex: 4/4' },
      style: { type: 'string' }, composer: { type: 'string' },
      sections: { type: 'array', items: { type: 'object', properties: {
        label: { type: 'string', description: 'A, B, Intro…' },
        annotation: { type: 'string' },
        measures: { type: 'array', items: { type: 'object', properties: {
          chords: { type: 'array', items: { type: 'object', properties: {
            symbol: { type: 'string', description: 'ex: Cm7, F7, Bbmaj7' }, beats: { type: 'number' }
          }, required: ['symbol'] } },
          barlineLeft: { type: 'string', description: 'normal, repeat-start, double' },
          barlineRight: { type: 'string', description: 'normal, repeat-end, double, final' },
          volta: { type: 'string', description: '1, 2 ou 3' },
          navSymbol: { type: 'string', description: 'segno, coda, dc-coda, ds-coda, dc-fine, fine, fermata' }
        }, required: ['chords'] } }
      }, required: ['label', 'measures'] } }
    }, required: ['sections'] }
  },
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
    description: 'Duplique une section entière (accords, annotations, barres) en conservant le même label. Par défaut insère juste après l\'originale. Utiliser afterIndex pour choisir la position : la copie sera placée après la section dont l\'index est afterIndex.',
    inputSchema: { type: 'object', properties: {
      sectionIndex: { type: 'number', description: 'Index de la section à dupliquer (0-based).' },
      afterIndex: { type: 'number', description: 'Index de la section après laquelle insérer la copie. Omis = juste après l\'originale.' }
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
    description: 'Ajoute/modifie l\'annotation théorique d\'un accord (mode, arpège, tensions, note libre, diagramme SVG). Indices 0-based.',
    inputSchema: { type: 'object', properties: {
      sectionIndex: { type: 'number', description: 'Index 0-based de la section' },
      barIndex: { type: 'number', description: 'Index 0-based de la mesure dans la section' },
      chordIndex: { type: 'number', description: 'Index 0-based de l\'accord dans la mesure' },
      showMode: { type: 'boolean', description: 'Afficher le mode compatible' },
      showArp: { type: 'boolean', description: 'Afficher l\'arpège 4 sons' },
      showTens: { type: 'boolean', description: 'Afficher les tensions' },
      showSvg: { type: 'boolean', description: 'Afficher le diagramme basse SVG (true par défaut)' },
      tensions: { type: 'array', items: { type: 'string' }, description: 'Tensions sélectionnées ex: ["b9","#11"]' },
      freeText: { type: 'string', description: 'Note libre' }
    }, required: ['sectionIndex', 'barIndex', 'chordIndex'] }
  },
  {
    name: 'toggle_all_diagrams',
    description: 'Affiche ou cache les diagrammes de basse SVG sur TOUS les accords de toute la grille en un seul appel. Utiliser ce tool plutôt que d\'itérer set_annotation accord par accord.',
    inputSchema: { type: 'object', properties: {
      show: { type: 'boolean', description: 'true = afficher tous les diagrammes, false = cacher tous les diagrammes' }
    }, required: ['show'] }
  }
];

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   JS — AI : TOOLS — exécuteurs (opèrent sur le draft JSON)
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

const _AI_TOOL_EXECUTORS = {

  set_full_chart(draft, a) {
    if (!Array.isArray(a.sections) || !a.sections.length) throw new Error('sections required');
    let n = 0;
    const mkId = () => typeof _newSectionId === 'function' ? _newSectionId() : 'sec' + (++n);
    const str = v => (v === undefined || v === null) ? '' : String(v);
    const timeSig = str(a.timeSig) || draft.timeSig || '4/4';
    const defBeats = parseInt(timeSig.split('/')[0]) || 4;
    const BARS = ['normal', 'repeat-start', 'repeat-end', 'double', 'final'];
    const bar = (v, def) => BARS.includes(v) ? v : def;
    const emptyBar = i => ({ number: i, chords: [{ symbol: '%', beats: defBeats, annot: null }], repeatStart: false, repeatEnd: false, barlineLeft: 'normal', barlineRight: 'normal', volta: null, navSymbol: null });
    const sections = a.sections.map(sec => {
      sec = sec || {};
      const measures = (Array.isArray(sec.measures) ? sec.measures : []).map((m, i) => {
        m = m || {};
        const chords = (Array.isArray(m.chords) ? m.chords : [])
          .filter(c => c && str(c.symbol).trim())
          .map(c => {
            const ch = { symbol: str(c.symbol).trim(), beats: parseInt(c.beats) || defBeats, annot: null };
            if (c.altChord) ch.altChord = str(c.altChord);
            return ch;
          });
        if (!chords.length) chords.push({ symbol: 'N.C.', beats: defBeats, annot: null });
        const left = bar(m.barlineLeft, 'normal'), right = bar(m.barlineRight, 'normal');
        return {
          number: i + 1, chords,
          repeatStart: left === 'repeat-start', repeatEnd: right === 'repeat-end',
          barlineLeft: left, barlineRight: right,
          volta: ['1', '2', '3'].includes(String(m.volta)) ? String(m.volta) : null,
          navSymbol: m.navSymbol ? str(m.navSymbol) : null
        };
      });
      return { id: mkId(), label: str(sec.label) || 'A', annotation: str(sec.annotation), measures: measures.length ? measures : [emptyBar(1)] };
    });
    if (a.title !== undefined) draft.title = str(a.title);
    if (a.key !== undefined) draft.key = str(a.key) || draft.key;
    if (a.tempo !== undefined) draft.tempo = parseInt(a.tempo) || draft.tempo;
    draft.timeSig = timeSig;
    if (a.style !== undefined) draft.style = str(a.style);
    if (a.composer !== undefined) draft.composer = str(a.composer);
    draft.sections = sections;
  },

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
      id: _newSectionId(),
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
    clone.id = _newSectionId();
    const rawAfter = a.afterIndex !== undefined ? parseInt(a.afterIndex) : idx;
    const insertAfter = Math.max(0, Math.min(rawAfter, draft.sections.length - 1));
    draft.sections.splice(insertAfter + 1, 0, clone);
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
      selTens: a.tensions || [],
      showSvg: a.showSvg !== false,
      freeText: a.freeText || '',
      freeColor: '#c4b5fd', freeBold: false, freeItalic: true
    };
  },

  toggle_all_diagrams(draft, a) {
    draft.sections.forEach(s => s.measures.forEach(m => m.chords.forEach(c => {
      if (!c.annot) c.annot = { showMode: false, showArp: false, showTens: false, showFree: false, modeIdx: 0, invIdx: 0, selTens: [], freeText: '', freeColor: '#c4b5fd', freeBold: false, freeItalic: true };
      c.annot.showSvg = !!a.show;
    })));
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
let _aiTokens = { in: 0, out: 0 };

function _aiUpdateTokenDisplay() {
  const el = document.getElementById('ai-token-count');
  if (!el) return;
  const total = _aiTokens.in + _aiTokens.out;
  el.textContent = total > 999 ? Math.round(total / 100) / 10 + 'k tk' : total + ' tk';
  el.title = 'Session — entrée : ' + _aiTokens.in + ' / sortie : ' + _aiTokens.out;
}

// Jamais de message assistant vide (400 à la requête suivante).
function _aiHistoryPushAssistant(message, toolCalls) {
  const txt = (message || '').trim()
    || (toolCalls && toolCalls.length ? '[' + toolCalls.map(c => c.name).join(', ') + ']' : '[…]');
  _aiHistory.push({ role: 'assistant', content: txt });
}

function aiChatToggle() {
  document.getElementById('ai-panel').classList.toggle('ai-open');
  if (document.getElementById('ai-panel').classList.contains('ai-open')) {
    document.getElementById('ai-input').focus();
    _aiUpdateTokenDisplay();
  }
}

function _aiT(key, fb) { return typeof t === 'function' && t(key) !== key ? t(key) : fb; }

function _aiSystemPrompt(webSearch) {
  const lang = (typeof currentLang !== 'undefined' ? currentLang : null)
    || document.getElementById('lang-select')?.value || 'fr';
  const prompts = {
    fr: "Tu es un assistant musical intégré à Jazz Grid Generator. Aide l'utilisateur à construire et modifier des grilles jazz en utilisant les outils disponibles. Avant d'agir, résume en 1-2 phrases ce que tu vas faire. Si une demande est ambiguë, pose une question de clarification. Réponds en français.\nRègle importante : pour dupliquer/copier une section → duplicate_section ; pour dupliquer/copier une mesure → duplicate_bar. N'utilise jamais add_section ou add_bar pour dupliquer. Pour placer la copie après une section précise (et non juste après l'originale), utiliser le paramètre afterIndex de duplicate_section.\n\nÉtat actuel de la grille :\n",
    en: "You are a musical assistant integrated into Jazz Grid Generator. Help the user build and modify jazz chord charts using the available tools. Before acting, summarize in 1-2 sentences what you will do. If a request is ambiguous, ask for clarification. Respond in English.\nImportant rule: to duplicate/copy a section → duplicate_section; to duplicate/copy a bar → duplicate_bar. Never use add_section or add_bar to duplicate. To place the copy after a specific section (not just after the original), use the afterIndex parameter of duplicate_section.\n\nCurrent chart state:\n",
    es: "Eres un asistente musical integrado en Jazz Grid Generator. Ayuda al usuario con sus grillas jazz usando las herramientas disponibles. Antes de actuar, resume en 1-2 frases lo que harás. Si algo es ambiguo, pregunta. Responde en español.\nRegla importante: para duplicar una sección → duplicate_section; para duplicar un compás → duplicate_bar. Para colocar la copia después de una sección específica, usar el parámetro afterIndex de duplicate_section.\n\nEstado actual:\n",
    it: "Sei un assistente musicale in Jazz Grid Generator. Aiuta l'utente con griglie jazz usando gli strumenti disponibili. Prima di agire, riassumi in 1-2 frasi. Se ambiguo, chiedi. Rispondi in italiano.\nRegola importante: per duplicare una sezione → duplicate_section; per duplicare una misura → duplicate_bar. Per inserire la copia dopo una sezione specifica, usare il parametro afterIndex di duplicate_section.\n\nGriglia attuale:\n"
  };
  const web = {
    fr: "\n\nRECHERCHE WEB ACTIVE : cherche sur le web la grille du morceau demandé, de préférence une grille partagée (forum iReal Pro, partitions libres), et cite tes sources. Construis la grille avec set_full_chart ; dans l'annotation de la première section, écris « " + _aiT('aiGridSourceNote', "Grille proposée par l'IA à partir de :") + " » suivi des titres des sources, puis « — "+_aiT('aiGridCheck',"à vérifier à l'oreille")+" ». Si rien de fiable n'est trouvé, dis-le clairement au lieu d'inventer. Si tu trouves un lien irealb://, donne-le tel quel.",
    en: "\n\nWEB SEARCH ENABLED: search the web for the chord chart of the requested tune, preferring shared charts (iReal Pro forum, free lead sheets), and cite your sources. Build the chart with set_full_chart; in the first section's annotation write \"" + _aiT('aiGridSourceNote', 'Chart proposed by AI from:') + "\" followed by the source titles, then \"— "+_aiT('aiGridCheck','to be checked by ear')+"\". If nothing reliable is found, say so clearly instead of inventing. If you find an irealb:// link, give it verbatim.",
    es: "\n\nBÚSQUEDA WEB ACTIVA: busca en la web la cuadrícula del tema pedido, preferiblemente una cuadrícula compartida (foro iReal Pro, partituras libres), y cita tus fuentes. Construye la cuadrícula con set_full_chart; en la anotación de la primera sección escribe «" + _aiT('aiGridSourceNote', 'Cuadrícula propuesta por la IA a partir de:') + "» seguido de los títulos de las fuentes y « — "+_aiT('aiGridCheck','a comprobar de oído')+" ». Si no encuentras nada fiable, dilo claramente en lugar de inventar. Si encuentras un enlace irealb://, dalo tal cual.",
    it: "\n\nRICERCA WEB ATTIVA: cerca sul web la griglia del brano richiesto, di preferenza una griglia condivisa (forum iReal Pro, spartiti liberi), e cita le fonti. Costruisci la griglia con set_full_chart; nell'annotazione della prima sezione scrivi «" + _aiT('aiGridSourceNote', "Griglia proposta dall'IA a partire da:") + "» seguito dai titoli delle fonti e « — "+_aiT('aiGridCheck','da verificare a orecchio')+" ». Se non trovi nulla di affidabile, dillo chiaramente invece di inventare. Se trovi un link irealb://, forniscilo così com'è."
  };
  return (prompts[lang] || prompts.en) + JSON.stringify(chartData) + (webSearch ? (web[lang] || web.en) : '');
}

async function aiChatSend(text) {
  text = (text || '').trim();
  if (!text) return;
  const settings = aiSettingsLoad();
  if (!settings.claudeKey) { _aiMsg('error', 'Clé API non configurée — cliquer ⚙'); return; }

  // Interrupteur lu une fois, puis remis à off quelle que soit l'issue.
  const wsEl = document.getElementById('ai-websearch');
  const webSearch = !!(wsEl && wsEl.checked);
  if (wsEl) wsEl.checked = false;

  document.getElementById('ai-input').value = '';
  _aiMsg('user', text);
  _aiHistory.push({ role: 'user', content: text });
  const loadEl = _aiMsg('loading', '…');
  document.getElementById('ai-send').disabled = true;

  try {
    const resp = await aiProviderChat(
      _aiSystemPrompt(webSearch),
      _aiHistory.slice(-_AI_MAX_HISTORY),
      AI_TOOLS, settings, { webSearch }
    );
    _aiHistoryPushAssistant(resp.message, resp.toolCalls);

    if (resp.usage) { _aiTokens.in += resp.usage.in; _aiTokens.out += resp.usage.out; _aiUpdateTokenDisplay(); }

    if (resp.toolCalls && resp.toolCalls.length > 0) {
      if (_aiDraft) aiDraftDiscard();
      aiDraftCreate();
      const errors = [];
      for (const tc of resp.toolCalls) {
        try { aiDraftApplyTool(tc.name, tc.args); }
        catch (e) { errors.push(tc.name + ': ' + e.message); }
      }
      _aiRenderPreview(resp.message, aiDraftDiff(), errors, resp.sources);
    } else {
      if (resp.message) _aiMsg('assistant', resp.message);
      _aiRenderSources(resp.sources);
    }
  } catch (err) {
    _aiMsg('error', 'Erreur : ' + err.message);
  } finally {
    loadEl.remove();
    document.getElementById('ai-send').disabled = false;
  }
}

function _aiMdToHtml(raw) {
  const esc = s => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  const inline = s => s
    .replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>')
    .replace(/\*(.+?)\*/g,'<em>$1</em>')
    .replace(/`([^`]+)`/g,'<code>$1</code>');
  return esc(raw).split(/\n{2,}/).map(block => {
    if (!block.trim()) return '';
    const lines = block.split('\n').filter(l => l.trim());
    if (lines.every(l => /^[-*•]\s/.test(l)))
      return '<ul>' + lines.map(l => '<li>' + inline(l.replace(/^[-*•]\s+/,'')) + '</li>').join('') + '</ul>';
    if (lines.every(l => /^\d+[.)]\s/.test(l)))
      return '<ol>' + lines.map(l => '<li>' + inline(l.replace(/^\d+[.)]\s+/,'')) + '</li>').join('') + '</ol>';
    return '<p>' + inline(block.split('\n').join('<br>')) + '</p>';
  }).join('');
}

function _aiMsg(role, text) {
  const log = document.getElementById('ai-log');
  const div = document.createElement('div');
  div.className = 'ai-msg ai-msg-' + role;
  if (role === 'assistant') div.innerHTML = _aiMdToHtml(text);
  else div.textContent = text;
  log.appendChild(div);
  log.scrollTop = log.scrollHeight;
  return div;
}

// Liste de liens de sources : texte échappé, href seulement si http(s).
function _aiSourcesHtml(sources) {
  const items = (sources || []).map(s => {
    const url = String(s.url || ''), title = escHtml(String(s.title || url));
    if (!/^https?:\/\//i.test(url)) return '<li>' + title + '</li>';
    const href = escHtml(url).replace(/"/g, '&quot;');
    return '<li><a href="' + href + '" target="_blank" rel="noopener noreferrer">' + title + '</a></li>';
  });
  if (!items.length) return '';
  return '<div class="ai-sources"><span class="ai-sources-lbl">' + escHtml(_aiT('aiSources', 'Sources :')) + '</span><ul>' + items.join('') + '</ul></div>';
}

function _aiRenderSources(sources) {
  const html = _aiSourcesHtml(sources);
  if (!html) return;
  const log = document.getElementById('ai-log');
  const div = document.createElement('div');
  div.className = 'ai-msg ai-msg-sources';
  div.innerHTML = html;
  log.appendChild(div);
  log.scrollTop = log.scrollHeight;
}

function _aiRenderPreview(message, diff, errors, sources) {
  const log = document.getElementById('ai-log');
  const card = document.createElement('div');
  card.className = 'ai-preview-card';
  let html = '';
  if (message) html += '<div class="ai-preview-msg">' + _aiMdToHtml(message) + '</div>';
  if (diff.length) html += '<ul class="ai-preview-diff">' + diff.map(l => '<li>' + escHtml(l) + '</li>').join('') + '</ul>';
  if (errors.length) html += '<p class="ai-preview-err">⚠ ' + escHtml(errors.join(', ')) + '</p>';
  html += _aiSourcesHtml(sources);
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
  document.getElementById('ai-cfg-claude-model').value = s.claudeModel;
  document.getElementById('ai-cfg-claude-key').value   = s.claudeKey;
}

function aiConfigSave() {
  aiSettingsSave({
    claudeModel: document.getElementById('ai-cfg-claude-model').value,
    claudeKey:   document.getElementById('ai-cfg-claude-key').value
  });
  document.getElementById('ai-config').classList.remove('ai-config-open');
}

// Migration des réglages au démarrage (navigateur uniquement)
if (typeof document !== 'undefined') {
  const _aiStartupMigrate = () => { try { aiSettingsLoad(); } catch (e) {} };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', _aiStartupMigrate);
  else _aiStartupMigrate();
}

if (typeof module !== 'undefined') module.exports = { aiSettingsMigrate, aiSettingsLoad, AI_CLAUDE_MODELS, aiBuildClaudeBody, aiParseClaudeContent, aiRunClaudeTurn, AI_TOOLS, _AI_TOOL_EXECUTORS, _aiHistoryPushAssistant, _aiHistoryGet: () => _aiHistory };

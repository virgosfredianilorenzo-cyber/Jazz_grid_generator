# AI Chat Integration — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remplacer le `ai.js` existant par un assistant conversationnel complet avec function calling natif (Claude + OpenAI), prévisualisation avant application, et historique de conversation.

**Architecture:** Réécriture complète de `Split/js/ai.js` en 5 sections (Settings / Providers / Tools / Draft / Chat), mise à jour du HTML du tiroir dans `index.html`, et mise à jour du CSS dans `app.css`. Aucun autre fichier existant n'est modifié.

**Tech Stack:** Vanilla JS ES2020+, Anthropic Messages API v1, OpenAI Chat Completions API, localStorage pour la persistance des settings. Zéro dépendance externe.

---

## Contexte technique important

Globals disponibles dans `ai.js` (chargé en dernier) :
- `chartData`, `render()`, `snapshotUndo()`, `setBassStrings()` — depuis `state.js`
- `ALL_KEYS`, `noteIdx()`, `transposeChordSymbol()`, `escHtml()` — depuis `theory.js`
- `currentLang` — depuis `i18n.js`
- `moveSection()`, `addMeasure()`, `deleteMeasure()`, `addSection()`, `deleteSection()` — depuis `actions.js`

L'`ai.js` existant utilise une IIFE `(function(){})()` qui rend les fonctions non-globales. La réécriture n'utilise **pas** d'IIFE.

Structure du `chartData` :
```js
{
  title, key, tempo, timeSig, style,
  sections: [{
    label, annotation,
    measures: [{
      chords: [{ symbol, beats, annot, altChord }],
      barlineLeft, barlineRight, repeatStart, repeatEnd, volta, navSymbol
    }]
  }]
}
```

---

## Fichiers modifiés / créés

| Fichier | Action |
|---------|--------|
| `Split/js/ai.js` | Réécriture complète |
| `Split/index.html` | Remplacement du HTML du tiroir (injection JS → HTML statique) |
| `Split/css/app.css` | Remplacement des règles `#ai-*` (lignes 205-225) |

---

## Task 1 : Settings — ai.js skeleton + module settings

**Files:**
- Rewrite: `Split/js/ai.js`

- [ ] **Step 1 : Écrire le fichier ai.js avec la section Settings**

Créer `Split/js/ai.js` (remplace l'existant) :

```js
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
  } catch { return Object.assign({}, _AI_DEFAULTS); }
}

function aiSettingsSave(patch) {
  localStorage.setItem(_AI_STORAGE_KEY,
    JSON.stringify(Object.assign(aiSettingsLoad(), patch)));
}
```

- [ ] **Step 2 : Écrire le test Settings dans la console**

Ouvrir `Split/index.html` dans le navigateur, ouvrir la console et coller :

```js
(function testSettings() {
  localStorage.removeItem('jgg_ai_settings');
  const s1 = aiSettingsLoad();
  console.assert(s1.provider === 'claude', 'FAIL default provider');
  console.assert(s1.claudeKey === '', 'FAIL default key empty');
  aiSettingsSave({ claudeKey: 'test-123', provider: 'openai' });
  const s2 = aiSettingsLoad();
  console.assert(s2.claudeKey === 'test-123', 'FAIL key saved');
  console.assert(s2.provider === 'openai', 'FAIL provider saved');
  console.assert(s2.claudeModel === 'claude-sonnet-4-6', 'FAIL unchanged field');
  localStorage.removeItem('jgg_ai_settings');
  console.log('Settings tests: OK');
})();
```

Expected: `Settings tests: OK` sans aucune assertion failed.

- [ ] **Step 3 : Commit**

```bash
cd Jazz_grid_generator
git add Split/js/ai.js
git commit -m "feat(ai): réécriture ai.js — module settings"
```

---

## Task 2 : Providers — abstraction Claude + OpenAI

**Files:**
- Modify: `Split/js/ai.js` (append)

- [ ] **Step 1 : Ajouter la section Providers à la suite de ai.js**

```js
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
```

- [ ] **Step 2 : Tester le parsing de réponse Claude (mock)**

Dans la console du navigateur :

```js
(function testProviderParsing() {
  // Simule la logique de parsing sans vrai appel réseau
  const fakeClaudeContent = [
    { type: 'text', text: 'Je vais ajouter une section B.' },
    { type: 'tool_use', id: 'tu_1', name: 'add_section', input: { label: 'B' } }
  ];
  let message = '';
  const toolCalls = [];
  for (const block of fakeClaudeContent) {
    if (block.type === 'text') message += block.text;
    else if (block.type === 'tool_use') toolCalls.push({ id: block.id, name: block.name, args: block.input });
  }
  console.assert(message === 'Je vais ajouter une section B.', 'FAIL Claude message parsing');
  console.assert(toolCalls.length === 1, 'FAIL Claude toolCalls count');
  console.assert(toolCalls[0].name === 'add_section', 'FAIL Claude tool name');
  console.assert(toolCalls[0].args.label === 'B', 'FAIL Claude tool args');

  const fakeOpenAIMsg = {
    content: 'Je vais transposer.',
    tool_calls: [{ id: 'tc_1', function: { name: 'transpose_chart', arguments: '{"semitones":2}' } }]
  };
  const oaiToolCalls = (fakeOpenAIMsg.tool_calls || []).map(tc => ({
    id: tc.id, name: tc.function.name, args: JSON.parse(tc.function.arguments || '{}')
  }));
  console.assert(oaiToolCalls[0].args.semitones === 2, 'FAIL OpenAI args parsing');
  console.log('Provider parsing tests: OK');
})();
```

Expected: `Provider parsing tests: OK`

- [ ] **Step 3 : Commit**

```bash
git add Split/js/ai.js
git commit -m "feat(ai): module providers — Claude + OpenAI abstraction"
```

---

## Task 3 : Tools — schémas JSON + exécuteurs

**Files:**
- Modify: `Split/js/ai.js` (append)

- [ ] **Step 1 : Ajouter AI_TOOLS (schémas) à la suite de ai.js**

```js
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
```

- [ ] **Step 2 : Ajouter les exécuteurs _AI_TOOL_EXECUTORS**

```js
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
    if (a.altSymbol) chord.altChord = a.altSymbol;
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
```

- [ ] **Step 3 : Tester les exécuteurs dans la console**

```js
(function testExecutors() {
  // Draft minimal simulé
  const d = {
    title: 'Test', key: 'C', tempo: 120, timeSig: '4/4', style: 'Swing',
    sections: [{
      label: 'A', annotation: '',
      measures: [{ chords: [{ symbol: 'Cmaj7', beats: 4, annot: null }], barlineLeft: 'normal', barlineRight: 'normal', repeatStart: false, repeatEnd: false, volta: null, navSymbol: null }]
    }]
  };
  const exec = _AI_TOOL_EXECUTORS;

  exec.set_chart_metadata(d, { title: 'New Title', tempo: 140 });
  console.assert(d.title === 'New Title', 'FAIL set_chart_metadata title');
  console.assert(d.tempo === 140, 'FAIL set_chart_metadata tempo');

  exec.add_section(d, { label: 'B', barCount: 2 });
  console.assert(d.sections.length === 2, 'FAIL add_section count');
  console.assert(d.sections[1].label === 'B', 'FAIL add_section label');
  console.assert(d.sections[1].measures.length === 2, 'FAIL add_section barCount');

  exec.rename_section(d, { sectionIndex: 1, label: 'C', suffix: "'" });
  console.assert(d.sections[1].label === "C'", "FAIL rename_section");

  exec.add_bar(d, { sectionIndex: 0 });
  console.assert(d.sections[0].measures.length === 2, 'FAIL add_bar');

  exec.add_chord(d, { sectionIndex: 0, barIndex: 0, symbol: 'Dm7', beats: 2 });
  console.assert(d.sections[0].measures[0].chords.length === 2, 'FAIL add_chord');
  console.assert(d.sections[0].measures[0].chords[1].symbol === 'Dm7', 'FAIL add_chord symbol');

  exec.edit_chord(d, { sectionIndex: 0, barIndex: 0, chordIndex: 1, symbol: 'G7', beats: 2 });
  console.assert(d.sections[0].measures[0].chords[1].symbol === 'G7', 'FAIL edit_chord');

  exec.remove_chord(d, { sectionIndex: 0, barIndex: 0, chordIndex: 1 });
  console.assert(d.sections[0].measures[0].chords.length === 1, 'FAIL remove_chord');

  exec.set_barline(d, { sectionIndex: 0, barIndex: 0, side: 'right', type: 'repeat-end' });
  console.assert(d.sections[0].measures[0].barlineRight === 'repeat-end', 'FAIL set_barline');

  exec.set_chord_alt(d, { sectionIndex: 0, barIndex: 0, chordIndex: 0, altSymbol: 'Db7' });
  console.assert(d.sections[0].measures[0].chords[0].altChord === 'Db7', 'FAIL set_chord_alt');

  // Test remove_section protection
  try { exec.remove_section({ sections: [{}] }, { sectionIndex: 0 }); console.assert(false, 'FAIL should have thrown'); }
  catch (e) { console.assert(e.message === 'Cannot remove the last section', 'FAIL remove_section protection'); }

  console.log('Tool executor tests: OK');
})();
```

Expected: `Tool executor tests: OK`

- [ ] **Step 4 : Commit**

```bash
git add Split/js/ai.js
git commit -m "feat(ai): module tools — schémas JSON + exécuteurs"
```

---

## Task 4 : Draft — état + diff + apply/discard

**Files:**
- Modify: `Split/js/ai.js` (append)

- [ ] **Step 1 : Ajouter la section Draft**

```js
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
    if (sel) { sel.value = _aiDraft._uiColumns; } delete _aiDraft._uiColumns;
  }
  chartData = _aiDraft;
  _aiDraft = null;
  render();
}

function aiDraftDiscard() { _aiDraft = null; }
```

- [ ] **Step 2 : Tester le draft dans la console**

```js
(function testDraft() {
  // Nécessite un chartData existant dans l'app (charger un fichier ou créer un nouveau chart d'abord)
  aiDraftCreate();
  console.assert(_aiDraft !== chartData, 'FAIL draft must be a separate object');
  console.assert(_aiDraft !== null, 'FAIL draft must not be null after create');

  const origSections = chartData.sections.length;
  aiDraftApplyTool('add_section', { label: 'TEST' });
  console.assert(_aiDraft.sections.length === origSections + 1, 'FAIL add_section in draft');
  console.assert(chartData.sections.length === origSections, 'FAIL original chartData must be untouched');

  const diff = aiDraftDiff();
  console.assert(diff.some(l => l.includes('Sections')), 'FAIL diff must mention sections change');

  aiDraftDiscard();
  console.assert(_aiDraft === null, 'FAIL draft must be null after discard');
  console.log('Draft tests: OK');
})();
```

Expected: `Draft tests: OK` (charger un chart avant de tester)

- [ ] **Step 3 : Commit**

```bash
git add Split/js/ai.js
git commit -m "feat(ai): module draft — create/apply/discard + diff"
```

---

## Task 5 : Chat — orchestration + UI config

**Files:**
- Modify: `Split/js/ai.js` (append)

- [ ] **Step 1 : Ajouter la section Chat**

```js
/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   JS — AI : CHAT
   Orchestration, historique, rendu messages + preview
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

let _aiHistory = [];
const _AI_MAX_HISTORY = 20; // 10 paires user/assistant

function aiChatToggle() {
  document.getElementById('ai-panel').classList.toggle('ai-open');
  if (document.getElementById('ai-panel').classList.contains('ai-open'))
    document.getElementById('ai-input').focus();
}

function _aiSystemPrompt() {
  const lang = (typeof currentLang !== 'undefined' ? currentLang : null)
    || document.getElementById('lang-select')?.value || 'fr';
  const prompts = {
    fr: "Tu es un assistant musical intégré à Jazz Grid Generator. Aide l'utilisateur à construire et modifier des grilles jazz en utilisant les outils disponibles. Avant d'agir, résume en 1-2 phrases ce que tu vas faire. Si une demande est ambiguë, pose une question de clarification. Réponds en français.\n\nÉtat actuel de la grille :\n",
    en: "You are a musical assistant integrated into Jazz Grid Generator. Help the user build and modify jazz chord charts using the available tools. Before acting, summarize in 1-2 sentences what you will do. If a request is ambiguous, ask for clarification. Respond in English.\n\nCurrent chart state:\n",
    es: "Eres un asistente musical integrado en Jazz Grid Generator. Ayuda al usuario con sus grillas jazz usando las herramientas disponibles. Antes de actuar, resume en 1-2 frases lo que harás. Si algo es ambiguo, pregunta. Responde en español.\n\nEstado actual:\n",
    it: "Sei un assistente musicale in Jazz Grid Generator. Aiuta l'utente con griglie jazz usando gli strumenti disponibili. Prima di agire, riassumi in 1-2 frasi. Se ambiguo, chiedi. Rispondi in italiano.\n\nGriglia attuale:\n"
  };
  return (prompts[lang] || prompts.en) + JSON.stringify(chartData);
}

async function aiChatSend(text) {
  text = (text || '').trim();
  if (!text) return;
  const settings = aiSettingsLoad();
  const key = settings.provider === 'openai' ? settings.openaiKey : settings.claudeKey;
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
    loadEl.remove();
    _aiHistory.push({ role: 'assistant', content: resp.message });
    if (_aiHistory.length > _AI_MAX_HISTORY) _aiHistory.splice(0, _aiHistory.length - _AI_MAX_HISTORY);

    if (resp.toolCalls && resp.toolCalls.length > 0) {
      aiDraftCreate();
      const errors = [];
      for (const tc of resp.toolCalls) {
        try { aiDraftApplyTool(tc.name, tc.args); }
        catch (e) { errors.push(tc.name + ': ' + e.message); }
      }
      _aiRenderPreview(resp.message, aiDraftDiff(), errors);
    } else {
      _aiMsg('assistant', resp.message);
    }
  } catch (err) {
    loadEl.remove();
    _aiMsg('error', 'Erreur : ' + err.message);
  } finally {
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

// ── Config panel ──
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
```

- [ ] **Step 2 : Vérifier la console du navigateur**

Ouvrir `Split/index.html`, ouvrir la console. Vérifier qu'aucune erreur n'est affichée au chargement. Taper `typeof aiChatSend` → doit retourner `"function"`.

- [ ] **Step 3 : Commit**

```bash
git add Split/js/ai.js
git commit -m "feat(ai): module chat — orchestration, historique, preview"
```

---

## Task 6 : HTML — Mise à jour du tiroir dans index.html

**Files:**
- Modify: `Split/index.html`

- [ ] **Step 1 : Remplacer le HTML du tiroir**

Dans `Split/index.html`, localiser la balise `<!-- Barre d'impression -->` et, juste **avant** elle, insérer le HTML suivant (si un ancien `<div id="ai-panel">` existe en dehors des scripts, le supprimer d'abord) :

```html
<!-- AI Drawer -->
<div id="ai-panel">
  <div id="ai-tab" onclick="aiChatToggle()" title="Assistant IA">✦ IA</div>
  <div id="ai-body">
    <div id="ai-header">
      <span>✦ Jazz AI</span>
      <div style="display:flex;gap:4px;align-items:center;">
        <button class="ai-icon-btn" onclick="aiConfigToggle()" title="Configurer">⚙</button>
        <button class="ai-icon-btn" onclick="aiChatToggle()" title="Fermer">✕</button>
      </div>
    </div>
    <div id="ai-config">
      <div class="ai-cfg-row">
        <label>Provider</label>
        <select id="ai-cfg-provider" onchange="aiConfigUpdateRows(this.value)">
          <option value="claude">Claude (Anthropic)</option>
          <option value="openai">OpenAI</option>
        </select>
      </div>
      <div id="ai-cfg-row-claude" class="ai-cfg-row">
        <label>Modèle Claude</label>
        <select id="ai-cfg-claude-model">
          <option value="claude-sonnet-4-6">claude-sonnet-4-6</option>
          <option value="claude-opus-4-7">claude-opus-4-7</option>
          <option value="claude-haiku-4-5-20251001">claude-haiku-4-5</option>
        </select>
        <label style="margin-top:6px;">Clé API</label>
        <input type="password" id="ai-cfg-claude-key" placeholder="sk-ant-…">
      </div>
      <div id="ai-cfg-row-openai" class="ai-cfg-row" style="display:none">
        <label>Modèle OpenAI</label>
        <select id="ai-cfg-openai-model">
          <option value="gpt-4o">gpt-4o</option>
          <option value="gpt-4o-mini">gpt-4o-mini</option>
        </select>
        <label style="margin-top:6px;">Clé API</label>
        <input type="password" id="ai-cfg-openai-key" placeholder="sk-…">
      </div>
      <button class="ai-cfg-save-btn" onclick="aiConfigSave()">💾 Enregistrer</button>
    </div>
    <div id="ai-log"></div>
    <div id="ai-input-row">
      <textarea id="ai-input" rows="2"
        placeholder="Ex : ajoute une section B de 8 mesures de Dm7…"
        onkeydown="aiChatHandleKey(event)"></textarea>
      <button id="ai-send" onclick="aiChatSend(document.getElementById('ai-input').value)" title="Envoyer (Entrée)">↵</button>
    </div>
  </div>
</div>
```

Note : l'ancienne injection JS (`initAiPanel()`, `document.body.appendChild`) est **supprimée** — ce HTML est maintenant statique dans index.html.

- [ ] **Step 2 : Vérifier que le HTML s'affiche**

Ouvrir `Split/index.html` dans le navigateur. L'onglet `✦ IA` doit être visible sur le côté droit (le CSS n'est pas encore à jour — il sera corrigé en Task 7). Aucune erreur console.

- [ ] **Step 3 : Commit**

```bash
git add Split/index.html
git commit -m "feat(ai): HTML tiroir statique dans index.html"
```

---

## Task 7 : CSS — Tiroir coulissant + styles chat

**Files:**
- Modify: `Split/css/app.css`

- [ ] **Step 1 : Remplacer les règles AI (lignes 205-225 de app.css)**

Localiser le bloc `/* ── AI ──` (ou le `#ai-panel` jusqu'à `@media print { #ai-panel`) dans `app.css` et le remplacer par :

```css
/* ── AI Drawer ── */
#ai-panel {
  position: fixed;
  top: 0; right: 0; bottom: 0;
  width: 380px;
  z-index: 500;
  display: flex;
  flex-direction: row;
  align-items: stretch;
  pointer-events: none;
}
#ai-tab {
  background: #f0a500;
  color: #1a1a2e;
  font-weight: bold;
  font-size: 0.82rem;
  writing-mode: vertical-rl;
  text-orientation: mixed;
  padding: 14px 6px;
  cursor: pointer;
  user-select: none;
  border-radius: 8px 0 0 8px;
  align-self: center;
  pointer-events: all;
  transition: background 0.2s;
  letter-spacing: 1px;
}
#ai-tab:hover { background: #ffc107; }
#ai-body {
  display: none;
  flex-direction: column;
  width: 100%;
  background: #16213e;
  border-left: 2px solid #f0a500;
  pointer-events: all;
  overflow: hidden;
}
#ai-panel.ai-open #ai-tab { border-radius: 0; }
#ai-panel.ai-open #ai-body { display: flex; }
#ai-header {
  background: #0f3460;
  padding: 8px 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #f0a500;
  font-weight: bold;
  font-size: 0.85rem;
  border-bottom: 1px solid #f0a50044;
  flex-shrink: 0;
}
.ai-icon-btn { background: none; border: none; cursor: pointer; font-size: 0.85rem; color: #aaa; padding: 2px 6px; border-radius: 3px; }
.ai-icon-btn:hover { color: #f0a500; }
#ai-config {
  display: none;
  flex-direction: column;
  gap: 8px;
  padding: 10px 12px;
  background: #0a1628;
  border-bottom: 1px solid #f0a50066;
  flex-shrink: 0;
}
#ai-config.ai-config-open { display: flex; }
.ai-cfg-row { display: flex; flex-direction: column; gap: 3px; }
.ai-cfg-row label { color: #f0a500; font-size: 0.75rem; font-weight: bold; }
.ai-cfg-row select, .ai-cfg-row input[type="password"] {
  background: #0f3460; border: 1px solid #2a4a8a; color: #fff;
  border-radius: 4px; padding: 4px 8px; font-size: 0.8rem;
}
.ai-cfg-save-btn {
  background: #f0a500; color: #1a1a2e; border: none;
  border-radius: 4px; padding: 6px; cursor: pointer;
  font-weight: bold; font-size: 0.8rem; margin-top: 2px;
}
#ai-log {
  flex: 1; overflow-y: auto; padding: 10px;
  display: flex; flex-direction: column; gap: 8px; min-height: 0;
}
.ai-msg { font-size: 0.82rem; line-height: 1.45; padding: 7px 10px; border-radius: 6px; max-width: 94%; word-break: break-word; }
.ai-msg-user { background: #1e3a5f; border: 1px solid #2d5a8a; align-self: flex-end; color: #eee; }
.ai-msg-assistant { background: #0a2a14; border: 1px solid #1a5a2a; align-self: flex-start; color: #86efac; }
.ai-msg-error { background: #2a0f0f; border-color: #5a1a1a; color: #fca5a5; align-self: center; }
.ai-msg-loading { background: #1a2f4e; color: #888; align-self: flex-start; font-style: italic; }
.ai-preview-card { background: #0f2040; border: 1px solid #f0a500; border-radius: 8px; padding: 10px; font-size: 0.82rem; }
.ai-preview-msg { color: #e0e0e0; margin-bottom: 6px; line-height: 1.5; }
.ai-preview-diff { list-style: disc; padding-left: 16px; color: #aed6f1; margin-bottom: 8px; }
.ai-preview-diff li { margin-bottom: 2px; }
.ai-preview-err { color: #e74c3c; margin-bottom: 6px; font-size: 0.8rem; }
.ai-preview-btns { display: flex; gap: 6px; margin-top: 8px; }
.ai-btn-apply { background: #27ae60; color: white; border: none; border-radius: 4px; padding: 5px 12px; cursor: pointer; font-size: 0.8rem; font-weight: bold; }
.ai-btn-cancel { background: #c0392b; color: white; border: none; border-radius: 4px; padding: 5px 12px; cursor: pointer; font-size: 0.8rem; }
.ai-preview-status { color: #888; font-size: 0.78rem; }
#ai-input-row { display: flex; gap: 6px; padding: 8px; border-top: 1px solid #2d4a7a; background: #0f1a30; flex-shrink: 0; }
#ai-input { flex: 1; background: #1e3a5f; border: 1px solid #2d5a8a; color: #eee; border-radius: 4px; padding: 6px 8px; font-size: 0.82rem; resize: none; font-family: Georgia, serif; line-height: 1.4; }
#ai-input:focus { outline: none; border-color: #f0a500; }
#ai-input::placeholder { color: #4a6a8a; }
#ai-send { background: #f0a500; color: #1a1a2e; border: none; border-radius: 4px; padding: 6px 12px; font-size: 1.1rem; font-weight: bold; cursor: pointer; align-self: flex-end; }
#ai-send:hover { background: #ffc107; }
#ai-send:disabled { opacity: 0.5; cursor: default; }
@media (max-width: 600px) { #ai-panel { width: 100%; } }
@media print { #ai-panel { display: none; } }
```

- [ ] **Step 2 : Test manuel dans le navigateur — golden path**

1. Ouvrir `Split/index.html`
2. Vérifier : onglet `✦ IA` visible sur la droite, en mode vertical
3. Cliquer sur l'onglet → le tiroir s'ouvre sur 380px
4. Cliquer ⚙ → le panneau config s'ouvre avec les champs Provider / Modèle / Clé
5. Changer Provider → OpenAI → les champs Claude se cachent, champs OpenAI apparaissent
6. Renseigner une clé API, cliquer "Enregistrer" → panneau se ferme
7. Ouvrir à nouveau ⚙ → la clé est mémorisée
8. Cliquer ✕ → le tiroir se ferme
9. Vérifier que la grille sous-jacente n'est pas masquée par le tiroir (le tiroir est en overlay)

- [ ] **Step 3 : Test manuel — envoi de message (avec vraie clé API)**

1. Charger un fichier MusicXML (ex: `Mack The Knife.musicxml` présent dans le repo)
2. Ouvrir le tiroir IA
3. Taper : `Ajoute une section B avec 4 mesures de Dm7`
4. Vérifier : le message utilisateur apparaît, puis un indicateur de chargement
5. Vérifier : la carte preview apparaît avec le message IA + la liste des changements (ex: "Sections : 3 → 4")
6. Cliquer "Appliquer" → la grille se met à jour, le bouton devient "✅ Appliqué"
7. Ctrl+Z → la grille revient à l'état précédent (undo fonctionne)
8. Envoyer un nouveau message conversationnel : `Quelle est la tonalité de ce morceau ?`
9. Vérifier : réponse textuelle sans carte preview

- [ ] **Step 4 : Commit final**

```bash
git add Split/css/app.css
git commit -m "feat(ai): CSS tiroir coulissant + styles chat/preview"
```

---

## Self-Review — vérification spec

| Exigence spec | Task qui l'implémente |
|---------------|----------------------|
| Provider configurable (Claude / OpenAI) | Task 2 + Task 5 (config UI) |
| Function calling natif | Task 2 (adapters) + Task 3 (AI_TOOLS) |
| Tiroir coulissant (côté droit) | Task 6 (HTML) + Task 7 (CSS) |
| Preview + Appliquer / Annuler | Task 4 (draft) + Task 5 (render preview) |
| Historique 10 tours | Task 5 (`_aiHistory`, `_AI_MAX_HISTORY = 20`) |
| Contexte = chartData actuel injecté | Task 5 (`_aiSystemPrompt`) |
| set_chart_metadata | Task 3 executor |
| transpose_chart | Task 3 executor (utilise `transposeChordSymbol`) |
| set_columns | Task 3 executor (`_uiColumns`) + Task 4 apply |
| set_bass_strings (EADG/BEADG) | Task 3 executor (`_uiBassStrings`) + Task 4 apply |
| add/remove/rename_section | Task 3 executors |
| add/remove_bar | Task 3 executors |
| set_barline | Task 3 executor |
| add/edit/remove_chord | Task 3 executors |
| set_chord_alt | Task 3 executor |
| set_annotation | Task 3 executor |
| Clé API en localStorage | Task 1 (settings) |
| Langue = langue active de l'app | Task 5 (`currentLang`) |
| Responsive mobile | Task 7 (media query) |
| Intégration undo/redo existant | Task 4 (`snapshotUndo()` dans `aiDraftApply`) |

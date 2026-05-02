/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   JS — AI PANEL
   Interface langage naturel via Claude API (Anthropic)
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
(function () {

// ── Clé API ─────────────────────────────────────────────────────────
function getApiKey() { return localStorage.getItem('jgg_anthropic_key') || ''; }
function saveApiKey(k) { localStorage.setItem('jgg_anthropic_key', k.trim()); }

// ── Prompt système ───────────────────────────────────────────────────
function buildSystemPrompt() {
  return `You are an assistant for Jazz Grid Generator, a jazz chord chart editor.
Help users modify their chart through natural language instructions.

The chart state (chartData) has this structure:
{
  title, key, tempo, timeSig, style,
  sections: [
    {
      index: number,
      label: string,        // e.g. "A", "B", "Intro", "Verse"
      annotation: string,
      measures: [
        {
          index: number,
          barlineLeft: "normal"|"repeat-start"|"double"|"final",
          barlineRight: "normal"|"repeat-end"|"double"|"final",
          volta: null|"1"|"2"|"3",
          chords: [ { index, symbol, beats } ]
        }
      ]
    }
  ]
}

Respond ONLY with valid JSON (no markdown), this exact shape:
{ "actions": [ ...commands... ], "message": "brief explanation in user's language" }

AVAILABLE COMMANDS:

Chart metadata:
{ "type": "set_title", "value": string }
{ "type": "set_key", "value": string }
{ "type": "set_tempo", "value": number }
{ "type": "set_style", "value": string }
{ "type": "set_time_sig", "value": string }

Sections (si = 0-based index):
{ "type": "add_section" }
{ "type": "delete_section", "si": number }
{ "type": "duplicate_section", "si": number }
{ "type": "move_section", "si": number, "dir": 1|-1 }
{ "type": "set_section_label", "si": number, "label": string }
{ "type": "set_section_annotation", "si": number, "annotation": string }
{ "type": "reorder_sections", "indices": number[] }
  // Rebuilds sections array from given indices (may repeat).
  // Use for form descriptions: AABA = [0,0,1,0], AAB = [0,0,1]

Repeat barlines:
{ "type": "set_section_repeat", "si": number }   // adds |: ... :| around section
{ "type": "clear_section_repeat", "si": number } // removes repeat barlines

Measures (si, mi = 0-based):
{ "type": "add_measure", "si": number }
{ "type": "delete_measure", "si": number, "mi": number }
{ "type": "duplicate_measure", "si": number, "mi": number }
{ "type": "set_barline", "si": number, "mi": number, "side": "left"|"right", "barline": string }
{ "type": "set_volta", "si": number, "mi": number, "volta": null|"1"|"2"|"3" }

Chords (si, mi, ci = 0-based):
{ "type": "set_chord", "si": number, "mi": number, "ci": number, "symbol": string, "beats": number }
{ "type": "replace_chord_all", "from": string, "to": string }

Transposition:
{ "type": "transpose", "semitones": number }
{ "type": "transpose_to_key", "key": string }

DECISION GUIDE:
- "section A played 2 times" → use set_section_repeat on that section
- "play A twice then B once" with PHYSICAL sections → use reorder_sections [0,0,1]
- "AABA form" → reorder_sections [0,0,1,0]
- "replace all Dm7 with Fm7" → replace_chord_all
- "transpose to Bb" → transpose_to_key
- Chord symbols: use jazz notation, e.g. "Cmaj7", "F7", "Gm7", "Bb7", "Ebmaj7", "Am7b5"

All indices are 0-based. Keep message concise and in the user's language.`;
}

// ── Message utilisateur avec état courant ────────────────────────────
function buildUserMessage(instruction) {
  const state = {
    title: chartData.title,
    key: chartData.key,
    tempo: chartData.tempo,
    timeSig: chartData.timeSig,
    style: chartData.style,
    sections: chartData.sections.map((s, si) => ({
      index: si,
      label: s.label,
      annotation: s.annotation || '',
      measures: s.measures.map((m, mi) => ({
        index: mi,
        barlineLeft: m.barlineLeft || 'normal',
        barlineRight: m.barlineRight || 'normal',
        volta: m.volta || null,
        chords: m.chords.map((c, ci) => ({
          index: ci,
          symbol: c.symbol,
          beats: c.beats
        }))
      }))
    }))
  };
  return `Current chart:\n${JSON.stringify(state, null, 2)}\n\nInstruction: ${instruction}`;
}

// ── Exécution des commandes ──────────────────────────────────────────
function executeCommands(actions) {
  let needsRender = false;

  for (const a of actions) {
    switch (a.type) {

      // ── Métadonnées ──
      case 'set_title':
        document.getElementById('chart-title').value = a.value;
        chartData.title = a.value;
        needsRender = true; break;
      case 'set_key':
        document.getElementById('meta-key').value = a.value;
        chartData.key = a.value;
        needsRender = true; break;
      case 'set_tempo':
        document.getElementById('meta-tempo').value = a.value;
        chartData.tempo = Number(a.value);
        needsRender = true; break;
      case 'set_style':
        document.getElementById('meta-style').value = a.value;
        chartData.style = a.value;
        needsRender = true; break;
      case 'set_time_sig':
        document.getElementById('meta-time').value = a.value;
        chartData.timeSig = a.value;
        needsRender = true; break;

      // ── Sections ──
      case 'add_section':
        snapshotUndo(); addSection(); break;
      case 'delete_section':
        snapshotUndo(); deleteSection(a.si); break;
      case 'duplicate_section':
        snapshotUndo(); duplicateSection(a.si); break;
      case 'move_section':
        snapshotUndo(); moveSection(a.si, a.dir); break;
      case 'set_section_label':
        if (chartData.sections[a.si]) {
          snapshotUndo();
          chartData.sections[a.si].label = a.label;
          needsRender = true;
        } break;
      case 'set_section_annotation':
        if (chartData.sections[a.si]) {
          snapshotUndo();
          chartData.sections[a.si].annotation = a.annotation;
          needsRender = true;
        } break;
      case 'reorder_sections': {
        snapshotUndo();
        const orig = chartData.sections;
        const valid = a.indices.filter(i => i >= 0 && i < orig.length);
        if (valid.length > 0) {
          chartData.sections = valid.map(i => JSON.parse(JSON.stringify(orig[i])));
          needsRender = true;
        } break;
      }

      // ── Barlines de reprise ──
      case 'set_section_repeat': {
        snapshotUndo();
        const sec = chartData.sections[a.si];
        if (sec && sec.measures.length > 0) {
          sec.measures[0].barlineLeft = 'repeat-start';
          sec.measures[sec.measures.length - 1].barlineRight = 'repeat-end';
          needsRender = true;
        } break;
      }
      case 'clear_section_repeat': {
        snapshotUndo();
        const sec = chartData.sections[a.si];
        if (sec && sec.measures.length > 0) {
          sec.measures[0].barlineLeft = 'normal';
          sec.measures[sec.measures.length - 1].barlineRight = 'normal';
          needsRender = true;
        } break;
      }

      // ── Mesures ──
      case 'add_measure':
        snapshotUndo(); addMeasure(a.si); break;
      case 'delete_measure':
        snapshotUndo(); deleteMeasure(a.si, a.mi); break;
      case 'duplicate_measure':
        snapshotUndo(); duplicateMeasure(a.si, a.mi); break;
      case 'set_barline': {
        snapshotUndo();
        const m = chartData.sections[a.si]?.measures[a.mi];
        if (m) {
          if (a.side === 'left') m.barlineLeft = a.barline;
          else m.barlineRight = a.barline;
          needsRender = true;
        } break;
      }
      case 'set_volta': {
        snapshotUndo();
        const m = chartData.sections[a.si]?.measures[a.mi];
        if (m) { m.volta = a.volta; needsRender = true; }
        break;
      }

      // ── Accords ──
      case 'set_chord': {
        snapshotUndo();
        const ch = chartData.sections[a.si]?.measures[a.mi]?.chords[a.ci];
        if (ch) {
          if (a.symbol !== undefined) ch.symbol = a.symbol;
          if (a.beats !== undefined) ch.beats = Number(a.beats);
          needsRender = true;
        } break;
      }
      case 'replace_chord_all': {
        snapshotUndo();
        chartData.sections.forEach(sec =>
          sec.measures.forEach(meas =>
            meas.chords.forEach(ch => { if (ch.symbol === a.from) ch.symbol = a.to; })
          )
        );
        needsRender = true; break;
      }

      // ── Transposition ──
      case 'transpose':
        snapshotUndo(); transposeBySemitone(Number(a.semitones)); break;
      case 'transpose_to_key':
        snapshotUndo(); transposeToKey(a.key); break;
    }
  }

  if (needsRender) render();
}

// ── Appel à l'API Claude ─────────────────────────────────────────────
async function callClaude(instruction) {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error('Clé API non configurée — clique sur 🔑');

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-calls': 'true'
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: buildSystemPrompt(),
      messages: [{ role: 'user', content: buildUserMessage(instruction) }]
    })
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `HTTP ${res.status}`);
  }

  const data = await res.json();
  const text = data.content?.[0]?.text || '';
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('Réponse invalide du modèle');
  return JSON.parse(match[0]);
}

// ── UI ───────────────────────────────────────────────────────────────
function appendMessage(role, text, isError) {
  const log = document.getElementById('ai-log');
  const div = document.createElement('div');
  div.className = 'ai-msg ai-msg-' + role + (isError ? ' ai-msg-error' : '');
  div.textContent = text;
  log.appendChild(div);
  log.scrollTop = log.scrollHeight;
}

async function sendAiInstruction() {
  const input = document.getElementById('ai-input');
  const btn = document.getElementById('ai-send');
  const instruction = input.value.trim();
  if (!instruction) return;

  input.value = '';
  appendMessage('user', instruction);
  btn.disabled = true;
  btn.textContent = '…';

  try {
    const result = await callClaude(instruction);
    executeCommands(result.actions || []);
    appendMessage('assistant', result.message || 'Fait.');
  } catch (err) {
    appendMessage('assistant', 'Erreur : ' + err.message, true);
  } finally {
    btn.disabled = false;
    btn.textContent = '↵';
  }
}

function toggleAiPanel() {
  const panel = document.getElementById('ai-panel');
  panel.classList.toggle('ai-open');
  if (panel.classList.contains('ai-open'))
    document.getElementById('ai-input').focus();
}

function openApiKeyPrompt() {
  const key = prompt('Clé API Anthropic (stockée dans localStorage) :', getApiKey());
  if (key !== null) saveApiKey(key);
}

function handleAiKeydown(e) {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendAiInstruction(); }
}

// ── Initialisation ───────────────────────────────────────────────────
function initAiPanel() {
  const panel = document.createElement('div');
  panel.id = 'ai-panel';
  panel.innerHTML = `
    <div id="ai-tab" onclick="toggleAiPanel()" title="Assistant IA">✦ AI</div>
    <div id="ai-body">
      <div id="ai-header">
        <span>✦ Jazz AI</span>
        <div style="display:flex;gap:4px;align-items:center;">
          <button class="ai-icon-btn" onclick="openApiKeyPrompt()" title="Configurer la clé API">🔑</button>
          <button class="ai-icon-btn" onclick="toggleAiPanel()" title="Fermer">✕</button>
        </div>
      </div>
      <div id="ai-log"></div>
      <div id="ai-input-row">
        <textarea id="ai-input" rows="2"
          placeholder="Ex : la partie A est jouée 2 fois, puis B…"
          onkeydown="handleAiKeydown(event)"></textarea>
        <button id="ai-send" onclick="sendAiInstruction()" title="Envoyer (Entrée)">↵</button>
      </div>
    </div>`;
  document.body.appendChild(panel);
}

// Exposition globale
window.toggleAiPanel = toggleAiPanel;
window.openApiKeyPrompt = openApiKeyPrompt;
window.sendAiInstruction = sendAiInstruction;
window.handleAiKeydown = handleAiKeydown;

document.addEventListener('DOMContentLoaded', initAiPanel);

})();

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   JS — ASSISTANT LANGAGE NATUREL (pattern matching local)
   Pas de dépendance externe, fonctionne hors ligne.
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
(function () {
'use strict';

// ──────────────────────────────────────────────────────────────────
//  HELPERS
// ──────────────────────────────────────────────────────────────────

function sectionByLabel(label) {
  const l = (label || '').trim().toLowerCase();
  return chartData.sections.findIndex(s => s.label.toLowerCase() === l);
}

// Noms de tonalités FR/IT/EN → notation standard
const KEY_MAP = {
  do:'C', ré:'D', re:'D', mi:'E', fa:'F', sol:'G', la:'A', si:'B',
  'do#':'C#', 'réb':'Db', 'reb':'Db', 'dob':'Cb',
  'ré#':'D#', 'mib':'Eb', 'fa#':'F#', 'solb':'Gb',
  'lab':'Ab', 'la#':'A#', 'sib':'Bb',
  c:'C', d:'D', e:'E', f:'F', g:'G', a:'A', b:'B',
  'c#':'C#', 'db':'Db', 'd#':'D#', 'eb':'Eb', 'f#':'F#',
  'gb':'Gb', 'g#':'G#', 'ab':'Ab', 'a#':'A#', 'bb':'Bb',
};

function normalizeKey(str) {
  if (!str) return null;
  const k = str.toLowerCase().trim().replace(/♭/g,'b').replace(/♯/g,'#');
  if (KEY_MAP[k]) return KEY_MAP[k];
  // Maj + dièse/bémol explicite
  const m = k.match(/^([a-gsdo]{1,3})\s*(?:dièse|diese|#)$/);
  if (m && KEY_MAP[m[1]]) return KEY_MAP[m[1]] + '#';
  const m2 = k.match(/^([a-gsdo]{1,3})\s*(?:bémol|bemol|b)$/);
  if (m2 && KEY_MAP[m2[1]]) return KEY_MAP[m2[1]] + 'b';
  return null;
}

// ──────────────────────────────────────────────────────────────────
//  PARSEUR DE SÉQUENCE DE SECTIONS
//  Entrées acceptées :
//    "AABA"                         → [{A,1},{A,1},{B,1},{A,1}]
//    "A puis A puis B puis A"        → idem
//    "A 2 fois avec B"               → [{A,2},{B,1}]
//    "A × 2 | B | A"                 → [{A,2},{B,1},{A,1}]
//    "jouer A deux fois puis B"      → [{A,2},{B,1}]
// ──────────────────────────────────────────────────────────────────
function parseFormSequence(input) {
  let s = input
    .replace(/[,;]/g, ' ')
    // Chiffres de répétition en mots → notation ×N
    .replace(/\b(?:quatre|4)\s*fois\b/gi,  '×4')
    .replace(/\b(?:trois|3)\s*fois\b/gi,   '×3')
    .replace(/\b(?:deux|2)\s*fois\b/gi,    '×2')
    .replace(/\b(?:une|1)\s*fois\b/gi,     '×1')
    .replace(/\b[×x]\s*(\d)\b/gi,          '×$1')
    // Supprimer verbes et articles parasites
    .replace(/\b(?:est\s+)?(?:jou[eé]e?|répét[eé]e?|play(?:ed)?)\s*/gi, '')
    .replace(/\b(?:la\s+)?(?:section|partie|part)\s+/gi, '')
    .replace(/\b(?:puis|then|ensuite|après|after|et|and|avec|with|followed\s+by)\b/gi, '|')
    .trim();

  // Cas compact : "AABA", "A'BA", "AAB" (pas d'espace, que des lettres + ' ou '')
  const compact = s.replace(/\s/g, '');
  if (/^[A-H](?:'|'')?(?:[A-H](?:'|'')?){1,}$/.test(compact)) {
    const letters = compact.match(/[A-H](?:''|')?/gi) || [];
    if (letters.length >= 2) return letters.map(l => ({ label: l.toUpperCase(), count: 1 }));
  }

  // Cas segmenté par "|" (après normalisation)
  const parts = s.split('|').map(p => p.trim()).filter(Boolean);
  if (parts.length < 2) return null;

  const result = [];
  for (const part of parts) {
    const m = part.match(/([A-H](?:''|')?)\s*(?:×\s*(\d+))?/i);
    if (!m) return null;
    result.push({ label: m[1].toUpperCase(), count: parseInt(m[2] || '1') });
  }
  return result;
}

// ──────────────────────────────────────────────────────────────────
//  RÈGLES (traitées dans l'ordre, s'arrête à la 1ère correspondance)
// ──────────────────────────────────────────────────────────────────

const RULES = [

  // ── 0. Aide ────────────────────────────────────────────────────
  s => {
    if (!/^\?$|^aide$|^help$/i.test(s.trim()) && !/\b(?:aide|help|commandes?)\b/i.test(s)) return null;
    return { help: true, message:
`Commandes disponibles :
• AABA  /  A puis A puis B  /  A 2 fois avec B  → forme
• transpose en Bb  /  +2 demi-tons
• tempo 140  /  140 bpm
• style Bossa Nova
• remplace Dm7 par Fm7
• annote A : play twice
• reprise sur A  (barlines |: A :|)
• duplique la section A
• supprime la section A
• titre : Mon Thème
• ajoute une section` };
  },

  // ── 1. Forme / séquence de sections ───────────────────────────
  s => {
    // Garde : ressemble à une description de forme ?
    const looksLikeForm =
      /(?:form|ordre|order|jouer?|joue|play|puis|then|avec|with)/i.test(s) ||
      /^[A-H](?:'?[A-H])+$/i.test(s.trim()) ||
      /[A-H]\s*[×x]\s*\d/i.test(s) ||
      /[A-H](?:'|'')?\s+[A-H](?:'|'')?/i.test(s);
    if (!looksLikeForm) return null;

    const seq = parseFormSequence(s);
    if (!seq) return null;

    const missing = [...new Set(seq.filter(({ label }) => sectionByLabel(label) === -1).map(x => x.label))];
    if (missing.length) return { error: `Section(s) introuvable(s) : ${missing.join(', ')}` };

    // Construire le tableau d'indices (en répétant si count > 1)
    const indices = [];
    for (const { label, count } of seq)
      for (let i = 0; i < count; i++) indices.push(sectionByLabel(label));

    const form = seq.map(({ label, count }) => count > 1 ? `${label}×${count}` : label).join(' ');
    return { actions: [{ type: 'reorder_sections', indices }], message: `Forme appliquée : ${form}.` };
  },

  // ── 2. Répétition seule : "la partie A est jouée 2 fois" ───────
  s => {
    const m =
      s.match(/(?:la\s+)?(?:section|partie|part)\s+([A-H](?:'|'')?)\s+(?:(?:est\s+)?(?:jou[eé]e?|répét[eé]e?|play(?:ed)?))\s+(\d+|deux|two|trois|three)\s+fois/i) ||
      s.match(/(?:jouer?|play|repeat)\s+([A-H](?:'|'')?)\s+(\d+|deux|two)\s+(?:fois|times)/i) ||
      s.match(/([A-H](?:'|'')?)\s*[×x]\s*(\d+)/i);
    if (!m) return null;
    const label = m[1].toUpperCase();
    const si = sectionByLabel(label);
    if (si === -1) return { error: `Section "${label}" introuvable.` };
    const countStr = m[2].toLowerCase();
    const count = { deux:2, two:2, trois:3, three:3 }[countStr] ?? parseInt(countStr);
    if (count === 2) {
      return { actions: [{ type: 'set_section_repeat', si }], message: `Barlines de reprise sur la section ${label} (joué 2 fois).` };
    }
    // >2 : duplication physique dans la séquence existante
    const indices = [];
    chartData.sections.forEach((_, i) => { if (i === si) for (let j = 0; j < count; j++) indices.push(i); else indices.push(i); });
    return { actions: [{ type: 'reorder_sections', indices }], message: `Section ${label} répétée ${count} fois.` };
  },

  // ── 3. Transposition vers une tonalité ────────────────────────
  s => {
    // Garde : doit mentionner une intention de transposition ou tonalité
    if (!/(?:transpos|tonalité|tonalite|clé\s+de|key\s+of|en\s+[A-Gdo]|to\s+[A-G])/i.test(s)) return null;
    const m = s.match(/(?:transpos[ae]r?\s+)?(?:en|to|in|vers?)\s+([A-Gsdo][b#♭♯]?(?:\s*(?:bémol|bemol|dièse|diese))?)/i) ||
              s.match(/(?:tonalité|clé)\s+(?:de\s+)?([A-Gsdo][b#♭♯]?)/i);
    if (!m) return null;
    const key = normalizeKey(m[1]);
    if (!key) return null;
    return { actions: [{ type: 'transpose_to_key', key }], message: `Transposé en ${key}.` };
  },

  // ── 4. Transposition par demi-tons ────────────────────────────
  s => {
    const m = s.match(/([+-]?\d+)\s*(?:demi[- ]?ton|semitone|half[- ]?step)/i) ||
              s.match(/(?:monte[rz]?|hausse[rz]?|raise|up)\s+(?:de\s+)?(\d+)\s*(?:demi[- ]?ton|semitone)/i) ||
              s.match(/(?:baisse[rz]?|descend[rz]?|lower|down)\s+(?:de\s+)?(\d+)\s*(?:demi[- ]?ton|semitone)/i);
    if (!m) return null;
    let n = parseInt(m[1] ?? m[2] ?? '0');
    if (/baisse|descend|lower|down/i.test(s)) n = -Math.abs(n);
    return { actions: [{ type: 'transpose', semitones: n }], message: `Transposé de ${n >= 0 ? '+' : ''}${n} demi-ton(s).` };
  },

  // ── 5. Tempo ──────────────────────────────────────────────────
  s => {
    const m = s.match(/(?:tempo|bpm)\s*[=:àa]?\s*(\d+)/i) ||
              s.match(/(\d{2,3})\s*(?:bpm|tempo)/i) ||
              s.match(/(?:mettre?|régler?|set|mets?)\s+(?:le\s+)?tempo\s+(?:à|a|to|at|=)\s*(\d+)/i);
    if (!m) return null;
    const bpm = parseInt(m[1]);
    if (bpm < 20 || bpm > 400) return { error: `Tempo ${bpm} invalide (20–400 BPM).` };
    return { actions: [{ type: 'set_tempo', value: bpm }], message: `Tempo : ${bpm} BPM.` };
  },

  // ── 6. Style ──────────────────────────────────────────────────
  s => {
    const m = s.match(/(?:style|feel)\s*[=:àa]?\s*([^,.!?]+)/i) ||
              s.match(/(?:jouer?\s+en\s+style|jouer?\s+en|playing?\s+in)\s+(.+)/i);
    if (!m) return null;
    const style = m[1].trim();
    if (/^[A-G][b#]?$/.test(style)) return null; // évite de capturer une tonalité
    return { actions: [{ type: 'set_style', value: style }], message: `Style : ${style}.` };
  },

  // ── 7. Remplacement d'accord ──────────────────────────────────
  s => {
    const m = s.match(/(?:remplace[rz]?|change[rz]?|replace)\s+(?:tous\s+les\s+)?([A-G][b#]?\S*)\s+(?:par|by|avec|with|→|->|en)\s+([A-G][b#]?\S*)/i);
    if (!m) return null;
    return { actions: [{ type: 'replace_chord_all', from: m[1], to: m[2] }], message: `Tous les ${m[1]} → ${m[2]}.` };
  },

  // ── 8. Annotation de section ──────────────────────────────────
  s => {
    const m = s.match(/(?:annot[ae]r?|note[rz]?|comment[ae]r?)\s+(?:la\s+)?(?:section|partie)?\s*([A-H](?:'|'')?)\s*[=:]\s*(.+)/i);
    if (!m) return null;
    const si = sectionByLabel(m[1]);
    if (si === -1) return { error: `Section "${m[1].toUpperCase()}" introuvable.` };
    return { actions: [{ type: 'set_section_annotation', si, annotation: m[2].trim() }], message: `Annotation sur ${m[1].toUpperCase()} : "${m[2].trim()}".` };
  },

  // ── 9. Titre ──────────────────────────────────────────────────
  s => {
    const m = s.match(/(?:titre?|title)\s*[=:]\s*(.+)/i);
    if (!m) return null;
    const title = m[1].trim().replace(/^["']|["']$/g, '');
    return { actions: [{ type: 'set_title', value: title }], message: `Titre : "${title}".` };
  },

  // ── 10. Dupliquer une section ─────────────────────────────────
  s => {
    const m = s.match(/(?:dupliqu[ae]r?|copier?|clone[rz]?)\s+(?:la\s+)?(?:section|partie)?\s*([A-H](?:'|'')?)/i);
    if (!m) return null;
    const si = sectionByLabel(m[1]);
    if (si === -1) return { error: `Section "${m[1].toUpperCase()}" introuvable.` };
    return { actions: [{ type: 'duplicate_section', si }], message: `Section ${m[1].toUpperCase()} dupliquée.` };
  },

  // ── 11. Barlines de reprise ───────────────────────────────────
  s => {
    const m = s.match(/(?:ajouter?\s+)?(?:barlines?\s+de\s+)?reprise\s+(?:sur\s+|à\s+)?(?:la\s+)?(?:section|partie)?\s*([A-H](?:'|'')?)/i) ||
              s.match(/(?:la\s+)?(?:section|partie)\s+([A-H](?:'|'')?)\s+en\s+répétition/i) ||
              s.match(/repeat\s+(?:bars?\s+)?(?:on\s+)?(?:section\s+)?([A-H](?:'|'')?)/i);
    if (!m) return null;
    const si = sectionByLabel(m[1]);
    if (si === -1) return { error: `Section "${m[1].toUpperCase()}" introuvable.` };
    return { actions: [{ type: 'set_section_repeat', si }], message: `Barlines de reprise sur la section ${m[1].toUpperCase()}.` };
  },

  // ── 12. Supprimer une section ─────────────────────────────────
  s => {
    const m = s.match(/(?:supprim[ae]r?|efface[rz]?|delete|remove)\s+(?:la\s+)?(?:section|partie)?\s*([A-H](?:'|'')?)/i);
    if (!m) return null;
    const si = sectionByLabel(m[1]);
    if (si === -1) return { error: `Section "${m[1].toUpperCase()}" introuvable.` };
    if (chartData.sections.length <= 1) return { error: 'Impossible : c\'est la dernière section.' };
    return { actions: [{ type: 'delete_section', si }], message: `Section ${m[1].toUpperCase()} supprimée.` };
  },

  // ── 13. Ajouter une section ───────────────────────────────────
  s => {
    if (!/(?:ajoute[rz]?|add|crée[rz]?|create|new)\s+(?:une\s+)?(?:nouvelle\s+)?(?:section|partie)/i.test(s)) return null;
    return { actions: [{ type: 'add_section' }], message: 'Nouvelle section ajoutée.' };
  },
];

// ──────────────────────────────────────────────────────────────────
//  EXÉCUTION DES COMMANDES
// ──────────────────────────────────────────────────────────────────
function executeCommands(actions) {
  let needsRender = false;
  for (const a of actions) {
    switch (a.type) {
      case 'set_title':
        document.getElementById('chart-title').value = a.value;
        chartData.title = a.value; needsRender = true; break;
      case 'set_key':
        document.getElementById('meta-key').value = a.value;
        chartData.key = a.value; needsRender = true; break;
      case 'set_tempo':
        document.getElementById('meta-tempo').value = a.value;
        chartData.tempo = Number(a.value); needsRender = true; break;
      case 'set_style':
        document.getElementById('meta-style').value = a.value;
        chartData.style = a.value; needsRender = true; break;
      case 'set_time_sig':
        document.getElementById('meta-time').value = a.value;
        chartData.timeSig = a.value; needsRender = true; break;

      case 'add_section':        snapshotUndo(); addSection(); break;
      case 'delete_section':     snapshotUndo(); deleteSection(a.si); break;
      case 'duplicate_section':  snapshotUndo(); duplicateSection(a.si); break;
      case 'move_section':       snapshotUndo(); moveSection(a.si, a.dir); break;

      case 'set_section_label':
        if (chartData.sections[a.si]) { snapshotUndo(); chartData.sections[a.si].label = a.label; needsRender = true; } break;
      case 'set_section_annotation':
        if (chartData.sections[a.si]) { snapshotUndo(); chartData.sections[a.si].annotation = a.annotation; needsRender = true; } break;

      case 'reorder_sections': {
        snapshotUndo();
        const orig = chartData.sections;
        const valid = a.indices.filter(i => i >= 0 && i < orig.length);
        if (valid.length) { chartData.sections = valid.map(i => JSON.parse(JSON.stringify(orig[i]))); needsRender = true; }
        break;
      }

      case 'set_section_repeat': {
        snapshotUndo();
        const sec = chartData.sections[a.si];
        if (sec?.measures.length) {
          sec.measures[0].barlineLeft = 'repeat-start';
          sec.measures[sec.measures.length - 1].barlineRight = 'repeat-end';
          needsRender = true;
        } break;
      }
      case 'clear_section_repeat': {
        snapshotUndo();
        const sec = chartData.sections[a.si];
        if (sec?.measures.length) {
          sec.measures[0].barlineLeft = 'normal';
          sec.measures[sec.measures.length - 1].barlineRight = 'normal';
          needsRender = true;
        } break;
      }

      case 'add_measure':       snapshotUndo(); addMeasure(a.si); break;
      case 'delete_measure':    snapshotUndo(); deleteMeasure(a.si, a.mi); break;
      case 'duplicate_measure': snapshotUndo(); duplicateMeasure(a.si, a.mi); break;

      case 'set_barline': {
        snapshotUndo();
        const m = chartData.sections[a.si]?.measures[a.mi];
        if (m) { m[a.side === 'left' ? 'barlineLeft' : 'barlineRight'] = a.barline; needsRender = true; }
        break;
      }
      case 'set_chord': {
        snapshotUndo();
        const ch = chartData.sections[a.si]?.measures[a.mi]?.chords[a.ci];
        if (ch) {
          if (a.symbol !== undefined) ch.symbol = a.symbol;
          if (a.beats  !== undefined) ch.beats  = Number(a.beats);
          needsRender = true;
        } break;
      }
      case 'replace_chord_all': {
        snapshotUndo();
        chartData.sections.forEach(sec => sec.measures.forEach(m => m.chords.forEach(ch => { if (ch.symbol === a.from) ch.symbol = a.to; })));
        needsRender = true; break;
      }
      case 'transpose':         snapshotUndo(); transposeBySemitone(Number(a.semitones)); break;
      case 'transpose_to_key':  snapshotUndo(); transposeToKey(a.key); break;
    }
  }
  if (needsRender) render();
}

// ──────────────────────────────────────────────────────────────────
//  POINT D'ENTRÉE DU PARSEUR
// ──────────────────────────────────────────────────────────────────
function processInstruction(instruction) {
  const s = instruction.trim();
  for (const rule of RULES) {
    try {
      const result = rule(s);
      if (result !== null) return result;
    } catch (e) {
      console.warn('[AI] Rule error:', e);
    }
  }
  return { error: 'Instruction non reconnue. Tape "aide" pour la liste des commandes.' };
}

// ──────────────────────────────────────────────────────────────────
//  UI
// ──────────────────────────────────────────────────────────────────
function appendMessage(role, text, isError) {
  const log = document.getElementById('ai-log');
  const div = document.createElement('div');
  div.className = 'ai-msg ai-msg-' + role + (isError ? ' ai-msg-error' : '');
  div.textContent = text;
  log.appendChild(div);
  log.scrollTop = log.scrollHeight;
}

function sendAiInstruction() {
  const input = document.getElementById('ai-input');
  const instruction = input.value.trim();
  if (!instruction) return;
  input.value = '';
  appendMessage('user', instruction);
  const result = processInstruction(instruction);
  if (result.error) {
    appendMessage('assistant', result.error, true);
  } else if (result.help) {
    appendMessage('assistant', result.message);
  } else {
    try {
      executeCommands(result.actions || []);
      appendMessage('assistant', '✓ ' + result.message);
    } catch (e) {
      appendMessage('assistant', 'Erreur : ' + e.message, true);
    }
  }
}

function toggleAiPanel() {
  const panel = document.getElementById('ai-panel');
  panel.classList.toggle('ai-open');
  if (panel.classList.contains('ai-open'))
    document.getElementById('ai-input').focus();
}

function handleAiKeydown(e) {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendAiInstruction(); }
}

// ──────────────────────────────────────────────────────────────────
//  INIT
// ──────────────────────────────────────────────────────────────────
function initAiPanel() {
  const panel = document.createElement('div');
  panel.id = 'ai-panel';
  panel.innerHTML = `
    <div id="ai-tab" onclick="toggleAiPanel()" title="Assistant langage naturel">✦ AI</div>
    <div id="ai-body">
      <div id="ai-header">
        <span>✦ Assistant</span>
        <button class="ai-icon-btn" onclick="appendMessage('assistant',processInstruction('aide').message)" title="Aide">?</button>
        <button class="ai-icon-btn" onclick="toggleAiPanel()" title="Fermer">✕</button>
      </div>
      <div id="ai-log"></div>
      <div id="ai-input-row">
        <textarea id="ai-input" rows="2"
          placeholder='Ex : "A puis A puis B" ou "transpose en Bb"'
          onkeydown="handleAiKeydown(event)"></textarea>
        <button id="ai-send" onclick="sendAiInstruction()" title="Envoyer (Entrée)">↵</button>
      </div>
    </div>`;
  document.body.appendChild(panel);
}

window.toggleAiPanel      = toggleAiPanel;
window.sendAiInstruction  = sendAiInstruction;
window.handleAiKeydown    = handleAiKeydown;
window.appendMessage      = appendMessage;
window.processInstruction = processInstruction;

document.addEventListener('DOMContentLoaded', initAiPanel);

})();

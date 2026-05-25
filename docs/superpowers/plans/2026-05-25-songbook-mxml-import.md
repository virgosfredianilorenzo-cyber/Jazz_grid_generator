# Songbook MusicXML Import — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permettre l'import de fichiers `.musicxml`, `.xml` et `.mxl` dans le Jazz Songbook, au même titre que les `.json` JGG déjà supportés.

**Architecture:** Nouveau fichier `songbook/js/mxml.js` contenant les fonctions de parsing copiées du JGG. `songbook/index.html` charge JSZip (CDN) et `mxml.js`. Le handler d'import dans `ui.js` est étendu pour détecter le type de fichier et brancher sur le parsing approprié.

**Tech Stack:** Vanilla JS, DOMParser (natif), JSZip 3.10.1 (CDN pour `.mxl`)

---

## Fichiers touchés

| Fichier | Action |
|---|---|
| `songbook/js/mxml.js` | Créer — `_newSectionId`, `parseMusicXML`, `loadFileAsXML` |
| `songbook/index.html` | Modifier — JSZip CDN, `<script mxml.js>`, label + accept modal |
| `songbook/js/ui.js` | Modifier — handler `import-json-file` (async, branching JSON/MXL) |

---

## Task 1 — Créer `songbook/js/mxml.js`

**Files:**
- Create: `songbook/js/mxml.js`

- [ ] **Créer le fichier avec les trois fonctions**

```javascript
/* ── Helpers ── */
function _newSectionId() {
  const c = 'BCDFGHJKMNPQRSTVWXZ23456789';
  let id = '';
  for (let i = 0; i < 4; i++) id += c[Math.floor(Math.random() * c.length)];
  return id;
}

/* ── Parse MusicXML string → chartData (format JGG) ── */
function parseMusicXML(xmlStr) {
  const doc = new DOMParser().parseFromString(xmlStr, 'application/xml');
  const te = doc.querySelector('work-title,movement-title');
  const title = te ? te.textContent.trim() : 'Thème';
  let tempo = 120;
  const se = doc.querySelector('sound[tempo]');
  if (se) tempo = parseInt(se.getAttribute('tempo'));
  let ts = '4/4';
  const b = doc.querySelector('beats'), bt = doc.querySelector('beat-type');
  if (b && bt) ts = `${b.textContent}/${bt.textContent}`;
  const bpm = parseInt(ts.split('/')[0]) || 4;
  let key = 'C';
  const fi = doc.querySelector('fifths');
  if (fi) {
    const f = parseInt(fi.textContent);
    const km = { 0:'C',1:'G',2:'D',3:'A',4:'E',5:'B',6:'F#','-1':'F','-2':'Bb','-3':'Eb','-4':'Ab','-5':'Db','-6':'Gb' };
    key = km[f] || 'C';
  }
  const measures = doc.querySelectorAll('measure'), pm = [];
  measures.forEach((m, idx) => {
    const md = { number: idx + 1, chords: [], repeatStart: false, repeatEnd: false,
                 barlineLeft: 'normal', barlineRight: 'normal', volta: null, navSymbol: null };
    m.querySelectorAll('barline').forEach(bl => {
      const loc = bl.getAttribute('location');
      const style = bl.querySelector('bar-style');
      const rep = bl.querySelector('repeat');
      const ending = bl.querySelector('ending');
      const styleMap = { 'light-light':'double','light-heavy':'final','heavy-light':'repeat-start' };
      if (loc === 'left' || loc === null) {
        if (rep && rep.getAttribute('direction') === 'forward') { md.barlineLeft = 'repeat-start'; md.repeatStart = true; }
        else if (style) { const s = styleMap[style.textContent]; if (s) md.barlineLeft = s; }
        if (ending && ending.getAttribute('type') === 'start') md.volta = ending.getAttribute('number') || '1';
      }
      if (loc === 'right') {
        if (rep && rep.getAttribute('direction') === 'backward') { md.barlineRight = 'repeat-end'; md.repeatEnd = true; }
        else if (style) { const map2 = { 'light-light':'double','light-heavy':'final' }; const s = map2[style.textContent]; if (s) md.barlineRight = s; }
      }
    });
    m.querySelectorAll('direction').forEach(dir => {
      if (dir.querySelector('segno')) md.navSymbol = 'segno';
      else if (dir.querySelector('coda')) md.navSymbol = 'coda';
      else if (dir.querySelector('fermata')) md.navSymbol = 'fermata';
      else {
        const w = dir.querySelector('words');
        if (w) {
          const txt = w.textContent.trim();
          if (/D\.C\..*Coda/i.test(txt)) md.navSymbol = 'dc-coda';
          else if (/D\.S\..*Coda/i.test(txt)) md.navSymbol = 'ds-coda';
          else if (/D\.C\..*Fine/i.test(txt)) md.navSymbol = 'dc-fine';
          else if (/^Fine$/i.test(txt)) md.navSymbol = 'fine';
        }
      }
    });
    const harmonyEls = [...m.querySelectorAll('harmony')];
    const harmByOffset = new Map();
    harmonyEls.forEach(h => {
      const off = parseInt(h.querySelector('offset')?.textContent || '0');
      const isAlt = h.querySelector('footnote')?.textContent === 'alt';
      const re = h.querySelector('root-step'), ae = h.querySelector('root-alter'),
            ke = h.querySelector('kind'), be = h.querySelector('bass-step'), bae = h.querySelector('bass-alter');
      if (!re) return;
      let root = re.textContent.trim();
      if (ae) { const a = parseFloat(ae.textContent); if (a === 1) root += '#'; if (a === -1) root += 'b'; }
      let kind = ke ? ke.getAttribute('text') || ke.textContent.trim() : '';
      if (kind === 'N.C.' || kind === 'none' || (ke && ke.textContent.trim() === 'none')) {
        const entry = { symbol: 'N.C.', beats: 0, annot: null, altChord: null };
        harmByOffset.set(off, entry); md.chords.push(entry); return;
      }
      const km2 = { 'major':'','minor':'m','dominant':'7','major-seventh':'maj7','minor-seventh':'m7',
                    'diminished':'dim','augmented':'aug','half-diminished':'m7b5','diminished-seventh':'dim7',
                    'major-ninth':'maj9','dominant-ninth':'9','minor-ninth':'m9','dominant-11th':'11',
                    'major-13th':'maj13','dominant-13th':'13','suspended-second':'sus2',
                    'suspended-fourth':'sus4','minor-major':'mM7' };
      if (km2[kind] !== undefined) kind = km2[kind];
      let bass = '';
      if (be) { bass = be.textContent.trim(); if (bae) { const a = parseFloat(bae.textContent); if (a === 1) bass += '#'; if (a === -1) bass += 'b'; } }
      const sym = root + kind + (bass ? '/' + bass : '');
      if (isAlt) { const existing = harmByOffset.get(off); if (existing) existing.altChord = sym; }
      else { const entry = { symbol: sym, beats: 0, annot: null, altChord: null }; harmByOffset.set(off, entry); md.chords.push(entry); }
    });
    if (md.chords.length > 0) {
      md.chords.forEach(c => { c.beats = Math.round(bpm / md.chords.length); });
      const s = md.chords.slice(0, -1).reduce((a, c) => a + c.beats, 0);
      md.chords[md.chords.length - 1].beats = bpm - s;
    } else md.chords.push({ symbol: '%', beats: bpm, annot: null });
    pm.push(md);
  });
  const sections = []; let cur = { id: _newSectionId(), label: 'A', annotation: '', measures: [] };
  measures.forEach((m, idx) => {
    const r = m.querySelector('rehearsal');
    if (r && idx > 0) { if (cur.measures.length > 0) sections.push(cur); cur = { id: _newSectionId(), label: r.textContent.trim(), annotation: '', measures: [] }; }
    cur.measures.push(pm[idx]);
  });
  if (cur.measures.length > 0) sections.push(cur);
  return { title, key, tempo, timeSig: ts, style: 'Swing', sections };
}

/* ── Charger un fichier en chaîne XML (supporte .mxl compressé via JSZip) ── */
async function loadFileAsXML(file) {
  return new Promise((resolve, reject) => {
    const ext = file.name.split('.').pop().toLowerCase();
    if (ext === 'mxl') {
      if (typeof JSZip === 'undefined') { reject(new Error('JSZip not loaded')); return; }
      const r = new FileReader();
      r.onload = async ev => {
        try {
          const zip = await JSZip.loadAsync(ev.target.result);
          let xmlPath = null;
          const containerFile = zip.file('META-INF/container.xml');
          if (containerFile) {
            const containerXml = await containerFile.async('string');
            const m = containerXml.match(/full-path="([^"]+)"/);
            if (m) xmlPath = m[1];
          }
          if (!xmlPath) {
            zip.forEach((p) => { if (!xmlPath && (p.endsWith('.xml') || p.endsWith('.musicxml')) && !p.startsWith('META-INF')) xmlPath = p; });
          }
          if (!xmlPath) { reject(new Error('No MusicXML found in MXL')); return; }
          const xmlStr = await zip.file(xmlPath).async('string');
          resolve(xmlStr);
        } catch (e) { reject(e); }
      };
      r.onerror = () => reject(new Error('Read failed'));
      r.readAsArrayBuffer(file);
    } else {
      const r = new FileReader();
      r.onload = ev => resolve(ev.target.result);
      r.onerror = () => reject(new Error('Read failed'));
      r.readAsText(file);
    }
  });
}
```

- [ ] **Vérifier manuellement** — ouvrir la console JS dans `songbook/index.html`, taper `typeof parseMusicXML` → doit retourner `"function"`. (Après l'étape suivante qui charge le script.)

- [ ] **Commit**

```bash
git add songbook/js/mxml.js
git commit -m "feat(songbook): ajouter mxml.js — parseMusicXML + loadFileAsXML"
```

---

## Task 2 — Mettre à jour `songbook/index.html`

**Files:**
- Modify: `songbook/index.html`

- [ ] **Ajouter JSZip CDN avant les autres scripts** (ligne ~136, avant `<script src="js/db.js">`)

Remplacer :
```html
  <!-- Scripts -->
  <script src="js/db.js"></script>
```
Par :
```html
  <!-- Scripts -->
  <script src="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js"></script>
  <script src="js/mxml.js"></script>
  <script src="js/db.js"></script>
```

- [ ] **Mettre à jour le label et l'`accept` du champ fichier dans la modal d'import** (lignes ~88-90)

Remplacer :
```html
        <label for="import-json-file">Fichier JGG (.json) *</label>
        <input type="file" id="import-json-file" accept=".json">
```
Par :
```html
        <label for="import-json-file">Fichier JGG (.json) ou MusicXML (.musicxml, .xml, .mxl) *</label>
        <input type="file" id="import-json-file" accept=".json,.musicxml,.xml,.mxl">
```

- [ ] **Commit**

```bash
git add songbook/index.html
git commit -m "feat(songbook): charger JSZip + mxml.js, étendre accept modal import"
```

---

## Task 3 — Étendre le handler d'import dans `songbook/js/ui.js`

**Files:**
- Modify: `songbook/js/ui.js:101-116`

- [ ] **Remplacer le handler `import-json-file`** (actuellement synchrone, JSON uniquement)

Remplacer le bloc existant :
```javascript
document.getElementById('import-json-file').addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    try {
      _pendingJson = JSON.parse(ev.target.result);
      document.getElementById('import-title').value = _pendingJson.title || file.name.replace(/\.json$/i,'');
      document.getElementById('import-key').value = _pendingJson.key || '';
      document.getElementById('import-tempo').value = _pendingJson.tempo || 120;
    } catch {
      alert('Fichier JSON invalide.'); _pendingJson = null;
    }
  };
  reader.readAsText(file);
});
```

Par :
```javascript
document.getElementById('import-json-file').addEventListener('change', async e => {
  const file = e.target.files[0];
  if (!file) return;
  const ext = file.name.split('.').pop().toLowerCase();
  try {
    if (ext === 'json') {
      const text = await file.text();
      _pendingJson = JSON.parse(text);
    } else {
      const xmlStr = await loadFileAsXML(file);
      _pendingJson = parseMusicXML(xmlStr);
    }
    document.getElementById('import-title').value =
      _pendingJson.title || file.name.replace(/\.[^.]+$/, '');
    document.getElementById('import-key').value = _pendingJson.key || '';
    document.getElementById('import-tempo').value = _pendingJson.tempo || 120;
  } catch (err) {
    console.error(err);
    if (ext === 'json') {
      alert('Fichier JSON invalide.');
    } else if (err.message === 'JSZip not loaded') {
      alert('JSZip non disponible. Connexion internet requise pour les fichiers .mxl.');
    } else if (err.message === 'No MusicXML found in MXL') {
      alert('Aucun MusicXML trouvé dans le fichier .mxl.');
    } else {
      alert('Fichier MusicXML invalide.');
    }
    _pendingJson = null;
  }
});
```

- [ ] **Tester manuellement dans le navigateur**

  1. Ouvrir `songbook/index.html` dans Chrome
  2. Cliquer `+` → sélectionner un fichier `.json` JGG → vérifier que titre/tonalité/tempo se remplissent → sauver → morceau apparaît en library ✓
  3. Cliquer `+` → sélectionner un fichier `.musicxml` → vérifier que titre/tonalité/tempo se remplissent → sauver → morceau apparaît ✓
  4. Cliquer `+` → sélectionner un fichier `.mxl` → même vérification ✓
  5. Ouvrir le morceau importé depuis MusicXML → la grille JGG s'affiche correctement dans l'iframe ✓

- [ ] **Commit**

```bash
git add songbook/js/ui.js
git commit -m "feat(songbook): import MusicXML (.musicxml, .xml, .mxl) dans la modal"
```

---

## Task 4 — Push et vérification finale

- [ ] **Push**

```bash
git push
```

- [ ] **Vérifier** que les 3 commits précédents sont bien sur `origin/main` via `git log --oneline -5`

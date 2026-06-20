# Print options · Concert mode · Métronome — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ajouter trois features au Jazz Grid Generator : options d'impression (1-page + masquage symboles nav), mode concert (UI masquée pendant le play), et métronome audio (intégré au player + bouton indépendant).

**Architecture:** Pas de build, pas de framework de test. Les tests sont manuels (ouvrir `index.html` dans un navigateur). Chaque tâche se valide dans le navigateur avant commit. Les 7 tâches sont ordonnées par dépendances : i18n en premier (avec `?.` pour tolérer les éléments manquants), HTML avant JS.

**Tech Stack:** HTML · JS vanilla · CSS · Web Audio API (oscillateur pour le métronome) · soundfont-player CDN (déjà présent)

---

## Fichiers modifiés

| Fichier | Tâches | Rôle |
|---------|--------|------|
| `js/i18n.js` | 1 | Nouvelles clés de traduction + bindings `applyTranslations()` |
| `index.html` | 2, 4, 6 | Checkboxes impression, `#concert-bar`, dialog metro + bouton toolbar |
| `js/print.js` | 3 | Logique CSS 1-page et masquage nav |
| `css/app.css` | 4 | Règles CSS mode concert |
| `js/player.js` | 5, 7 | Concert mode JS + METRO objet + audio |
| `js/init.js` | 6 | Restauration localStorage metro |

---

## Task 1 — i18n : nouvelles clés de traduction

**Files:**
- Modify: `js/i18n.js`

- [ ] **Step 1 : Ajouter les clés à la langue FR** (après `symNone:'— (aucun)',`)

Chercher dans `js/i18n.js` la ligne FR contenant `symNone:'— (aucun)',` et ajouter avant le `}` de cet objet :

```
printOnepage:'1 page',printShowNav:'Repères nav.',metroLabel:'Métronome',metroVolume:'Volume :',
```

Résultat — fin de l'objet `fr` :
```
symNone:'— (aucun)',printOnepage:'1 page',printShowNav:'Repères nav.',metroLabel:'Métronome',metroVolume:'Volume :',
  },
```

- [ ] **Step 2 : Ajouter les clés à la langue ES** (après `symNone:'— (ninguno)',`)

```
printOnepage:'1 página',printShowNav:'Signos nav.',metroLabel:'Metrónomo',metroVolume:'Volumen :',
```

- [ ] **Step 3 : Ajouter les clés à la langue IT** (après `symNone:'— (nessuno)',`)

```
printOnepage:'1 pagina',printShowNav:'Segni nav.',metroLabel:'Metronomo',metroVolume:'Volume :',
```

- [ ] **Step 4 : Ajouter les clés à la langue EN** (après `symNone:'— (none)',`)

```
printOnepage:'1 page',printShowNav:'Nav marks',metroLabel:'Metronome',metroVolume:'Volume :',
```

- [ ] **Step 5 : Ajouter les bindings dans `applyTranslations()`**

Dans `js/i18n.js`, après la ligne :
```js
  document.getElementById('btn-do-print').textContent=t('btnDoPrint');
```
Ajouter (avec `?.` pour tolérer les éléments absents si une tâche HTML n'est pas encore faite) :
```js
  document.getElementById('lbl-onepage')?.textContent=t('printOnepage');
  document.getElementById('lbl-show-nav')?.textContent=t('printShowNav');
  document.getElementById('lbl-metro')?.textContent=t('metroLabel');
  document.getElementById('lbl-metro-vol')?.textContent=t('metroVolume');
```

- [ ] **Step 6 : Test manuel**

Ouvrir `index.html` dans le navigateur. Ouvrir la console DevTools.
Attendu : zéro erreur JavaScript. `t('printOnepage')` dans la console renvoie `'1 page'`.

- [ ] **Step 7 : Commit**

```bash
git add js/i18n.js
git commit -m "feat(i18n): add translation keys for print options and metronome"
```

---

## Task 2 — Print : HTML (checkboxes dans le panneau d'impression)

**Files:**
- Modify: `index.html` (lignes autour de `#print-contrast-bar`, ~264-277)

- [ ] **Step 1 : Ajouter les deux checkboxes**

Dans `index.html`, repérer la ligne :
```html
  <button class="btn" id="btn-do-print" onclick="doPrint()" style="padding:5px 14px;"></button>
```

La remplacer par :
```html
  <label style="display:flex;align-items:center;gap:4px;white-space:nowrap;">
    <input type="checkbox" id="cb-onepage" onchange="setOnepage(this.checked)">
    <span id="lbl-onepage"></span>
  </label>
  <label style="display:flex;align-items:center;gap:4px;white-space:nowrap;">
    <input type="checkbox" id="cb-show-nav" onchange="setShowNav(this.checked)">
    <span id="lbl-show-nav"></span>
  </label>
  <button class="btn" id="btn-do-print" onclick="doPrint()" style="padding:5px 14px;"></button>
```

- [ ] **Step 2 : Test manuel**

Ouvrir `index.html`, cliquer sur "Imprimer" (ouvre le panneau d'impression).
Attendu : deux checkboxes "1 page" et "Repères nav." apparaissent dans la barre, avec leur label traduit.

- [ ] **Step 3 : Commit**

```bash
git add index.html
git commit -m "feat(print): add 1-page and nav symbols checkboxes to print panel"
```

---

## Task 3 — Print : logique JS

**Files:**
- Modify: `js/print.js`

- [ ] **Step 1 : Ajouter les variables et setters**

En haut de `js/print.js`, après `let printTheme='light';` (ligne 7), ajouter :

```js
let printOnepage = false;
let printShowNav = false;
function setOnepage(v) { printOnepage = v; }
function setShowNav(v) { printShowNav = v; }
```

- [ ] **Step 2 : Ajouter `buildOnepageCSS()`**

Après `function removePrintStyle()` (ligne 18), ajouter :

```js
function buildOnepageCSS() {
  return '@page{size:A4;margin:8mm;}.section{gap:2px!important;margin:2px 0!important;}' +
    '.measures-grid{gap:2px!important;}.chord-symbol{font-size:0.38rem!important;}' +
    '.theory-info{font-size:0.32rem!important;}.measure{min-height:1.4em!important;padding:1px!important;}' +
    '.section-header{padding:2px 4px!important;font-size:0.6rem!important;}';
}
function buildNavHideCSS() {
  return '.nav-symbol{display:none!important;}.volta-bracket{display:none!important;}' +
    '.barline-repeat-start{border-left:none!important;}.barline-repeat-end{border-right:none!important;}';
}
```

- [ ] **Step 3 : Modifier `injectPrintStyle(v)` pour inclure les nouveaux CSS**

Remplacer la fonction existante :
```js
function injectPrintStyle(v){removePrintStyle();const el=document.createElement('style');el.id='dps';el.media='print';el.textContent=buildSectionColorCSS(v);document.head.appendChild(el);}
```

Par :
```js
function injectPrintStyle(v) {
  removePrintStyle();
  let css = buildSectionColorCSS(v);
  if (printOnepage) css += buildOnepageCSS();
  if (!printShowNav) css += buildNavHideCSS();
  const el = document.createElement('style');
  el.id = 'dps';
  el.media = 'print';
  el.textContent = css;
  document.head.appendChild(el);
}
```

- [ ] **Step 4 : Test manuel**

1. Ouvrir `index.html`, ajouter quelques mesures avec des symboles (segno, coda, barres de reprise).
2. Cliquer Imprimer → panneau d'impression.
3. Cocher "Repères nav." → ouvrir l'aperçu avant impression → les symboles nav apparaissent.
4. Décocher "Repères nav." → aperçu → les symboles disparaissent, les barres de reprise n'ont plus d'épaisseur double.
5. Cocher "1 page" → aperçu → toute la grille tient sur une page avec des fontes réduites.

- [ ] **Step 5 : Commit**

```bash
git add js/print.js
git commit -m "feat(print): add 1-page scaling and nav symbol toggle"
```

---

## Task 4 — Concert mode : CSS + HTML

**Files:**
- Modify: `css/app.css`
- Modify: `index.html`

- [ ] **Step 1 : Ajouter les règles CSS du mode concert**

À la fin de `css/app.css`, ajouter :

```css
/* ── Concert mode (play avec UI masquée) ── */
#concert-bar {
  display: none;
  position: fixed;
  bottom: 0; left: 0; right: 0;
  background: rgba(0,0,0,0.78);
  color: #fff;
  align-items: center;
  justify-content: space-between;
  padding: 8px 18px;
  z-index: 9999;
  font-size: 0.92rem;
  gap: 12px;
}
body.concert-mode #concert-bar { display: flex; }
body.concert-mode > *:not(#chart-editor):not(#concert-bar) { display: none !important; }
body.concert-mode #chart-editor { cursor: pointer; }
```

- [ ] **Step 2 : Ajouter `#concert-bar` dans `index.html`**

Dans `index.html`, juste avant la première balise `<script` (ligne ~314), ajouter :

```html
<!-- Concert mode bar -->
<div id="concert-bar">
  <span id="concert-progress"></span>
  <button onclick="stopPlayback()"
          style="background:transparent;border:1px solid #fff;color:#fff;padding:4px 14px;border-radius:4px;cursor:pointer;font-size:1rem;">⏹</button>
</div>
```

- [ ] **Step 3 : Test manuel (CSS uniquement)**

Ouvrir `index.html`. Dans la console DevTools :
```js
document.body.classList.add('concert-mode')
```
Attendu : toolbar, dropzone et tous les panneaux disparaissent. La grille reste visible. La barre noire `#concert-bar` apparaît en bas de l'écran avec un bouton ⏹.
```js
document.body.classList.remove('concert-mode')
```
Attendu : tout réapparaît normalement.

- [ ] **Step 4 : Commit**

```bash
git add css/app.css index.html
git commit -m "feat(concert): add concert mode CSS and #concert-bar HTML"
```

---

## Task 5 — Concert mode : JS dans `player.js`

**Files:**
- Modify: `js/player.js`

- [ ] **Step 1 : Ajouter les fonctions `_enterConcertMode` et `_exitConcertMode`**

Dans `js/player.js`, après la fonction `_highlight()` (ligne ~201), ajouter :

```js
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
```

- [ ] **Step 2 : Modifier `startPlayback()` pour activer le mode concert et suivre la progression**

Remplacer le bloc `let t = PLAYER.ctx.currentTime + 0.1;` et la boucle `events.forEach` existante par :

```js
  // Concert mode
  const totalMeas = playOrder.length * loops;
  _enterConcertMode(totalMeas);

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
```

- [ ] **Step 3 : Modifier `stopPlayback()` pour quitter le mode concert**

Dans `stopPlayback()`, après la ligne `if (btn) { btn.textContent = '▶'; btn.classList.remove('playing'); }`, ajouter :

```js
  _exitConcertMode();
```

- [ ] **Step 4 : Test manuel**

1. Ouvrir `index.html` avec une grille de 2+ mesures.
2. Appuyer sur ▶ → configurer 1 boucle → cliquer Lire.
3. Attendu : l'interface disparaît, seule la grille reste. La barre noire en bas affiche "1 / N". Le numéro de mesure s'incrémente à chaque nouvelle mesure.
4. Cliquer sur la grille → l'interface réapparaît normalement.
5. Relancer le play → cette fois cliquer ⏹ dans la barre noire → même résultat.

- [ ] **Step 5 : Commit**

```bash
git add js/player.js
git commit -m "feat(concert): enter/exit concert mode on play start/stop"
```

---

## Task 6 — Métronome : HTML + init.js

**Files:**
- Modify: `index.html`
- Modify: `js/init.js`

- [ ] **Step 1 : Ajouter les contrôles métronome dans le player dialog**

Dans `index.html`, dans `#player-dialog`, après le `<label>` contenant `player-dialog-label` et `player-loops`, ajouter juste avant `<div style="display:flex;gap:8px;margin-top:12px;justify-content:flex-end;">` :

```html
    <label style="display:flex;align-items:center;gap:8px;margin-top:10px;">
      <input type="checkbox" id="cb-metro" onchange="localStorage.setItem('jgg_metro_on',this.checked)">
      <span id="lbl-metro"></span>
    </label>
    <label style="display:flex;align-items:center;gap:8px;margin-top:6px;">
      <span id="lbl-metro-vol"></span>
      <input type="range" id="metro-vol-slider" min="0" max="100" value="50" style="flex:1;accent-color:#f0a500;"
             oninput="METRO.volume=this.value/100;localStorage.setItem('jgg_metro_vol',METRO.volume)">
    </label>
```

- [ ] **Step 2 : Ajouter le bouton métronome indépendant dans la toolbar**

Dans `index.html`, après :
```html
  <button class="btn secondary" id="btn-play" onclick="openPlayerDialog()">▶</button>
```
Ajouter :
```html
  <button class="btn secondary" id="btn-metro" onclick="toggleMetro()" title="Métronome">♩</button>
```

- [ ] **Step 3 : Restaurer les préférences métronome dans `init.js`**

À la fin de `js/init.js`, ajouter :

```js
(function(){
  const metroOn  = localStorage.getItem('jgg_metro_on') === 'true';
  const metroVol = parseFloat(localStorage.getItem('jgg_metro_vol') || '0.5');
  METRO.volume = metroVol;
  const cbMetro = document.getElementById('cb-metro');
  if (cbMetro) cbMetro.checked = metroOn;
  const slider  = document.getElementById('metro-vol-slider');
  if (slider)   slider.value  = Math.round(metroVol * 100);
})();
```

- [ ] **Step 4 : Test manuel**

1. Ouvrir `index.html`, cliquer ▶ pour ouvrir le player dialog.
2. Attendu : une case à cocher "Métronome" et un slider "Volume :" apparaissent sous les boucles.
3. Cocher la case, fermer la dialog, rouvrir → la case est toujours cochée (localStorage).
4. Slider à 0 → recharger → slider reste à 0 (localStorage).
5. Bouton ♩ visible dans la toolbar à côté de ▶.

- [ ] **Step 5 : Commit**

```bash
git add index.html js/init.js
git commit -m "feat(metro): add metronome controls to player dialog and toolbar"
```

---

## Task 7 — Métronome : audio JS dans `player.js`

**Files:**
- Modify: `js/player.js`

- [ ] **Step 1 : Ajouter l'objet `METRO` et les fonctions audio**

Au début de `js/player.js`, après la ligne `const PLAYER = { ... };` (ligne 6), ajouter :

```js
const METRO = { timers: [], running: false, volume: 0.5, nextBeat: 0, beat: 0 };

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
  const bpm = chartData.tempo || 120;
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
  METRO.timers  = [];
  METRO.running = false;
  METRO.beat    = 0;
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
```

- [ ] **Step 2 : Intégrer le métronome dans `startPlayback()`**

Dans `startPlayback()`, juste après `_enterConcertMode(totalMeas);`, ajouter :

```js
  // Métronome synchronisé avec le play
  if (METRO.running) stopMetro();
  if (document.getElementById('cb-metro')?.checked) startMetro(PLAYER.ctx.currentTime + 0.1);
```

- [ ] **Step 3 : Intégrer `stopMetro()` dans `stopPlayback()`**

Dans `stopPlayback()`, après `_exitConcertMode();`, ajouter :

```js
  stopMetro();
```

- [ ] **Step 4 : Test manuel — métronome indépendant**

1. Ouvrir `index.html`.
2. Cliquer ♩ dans la toolbar.
3. Attendu : des clicks réguliers (tempo du chart, ex: 120 BPM). Le bouton ♩ est mis en évidence (classe `active`).
4. Cliquer ♩ à nouveau → les clicks s'arrêtent.
5. Changer le tempo dans les métadonnées (ex: 80 BPM), cliquer ♩ → tempo ralenti.
6. Tester avec `3/4` dans la signature rythmique → 1 click fort + 2 faibles en boucle.

- [ ] **Step 5 : Test manuel — métronome avec play**

1. Ouvrir `index.html`, cliquer ▶ → cocher "Métronome" → cliquer Lire.
2. Attendu : les chords démarrent et les clicks métronome démarrent en même temps, synchronisés avec le BPM.
3. Le mode concert s'active (UI masquée).
4. Attendre la fin du play → clicks et chords s'arrêtent ensemble.
5. Recommencer sans cocher "Métronome" → pas de clicks.

- [ ] **Step 6 : Test manuel — cohérence volume**

1. Déplacer le slider volume à 10% dans le player dialog.
2. Lancer ♩ → les clicks sont très faibles.
3. Recharger la page → le volume reste à 10% (localStorage).

- [ ] **Step 7 : Commit**

```bash
git add js/player.js
git commit -m "feat(metro): add METRO audio engine, startMetro/stopMetro, integrate with play"
```

---

## Vérification finale

- [ ] Tester les 4 langues (FR/ES/IT/EN) → les labels "1 page", "Repères nav.", "Métronome", "Volume :" s'affichent dans la bonne langue.
- [ ] Vérifier qu'en concert mode, toucher l'écran sur mobile quitte le mode (le `click` event se déclenche au touch).
- [ ] Vérifier qu'avec une grille très longue (20+ mesures, `6/8`), le métronome reste synchronisé avec les chords pendant toute la durée.
- [ ] Vérifier que stopper la lecture en cours de play ne laisse pas de clicks orphelins pendant plus de 0.5 secondes.

```bash
git push
```

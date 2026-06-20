# Design — Print options · Concert mode · Métronome

Date : 2026-06-20

## Périmètre

Trois features indépendantes ajoutées en une seule itération :

1. **Impression : option 1-page + masquage symboles iReal**
2. **Mode concert : masquer l'UI pendant le play**
3. **Métronome : intégré au player + bouton indépendant**

---

## Feature 1 — Options d'impression

### Nouvelles options dans `#print-contrast-bar`

**1. Case à cocher "Tenir sur 1 page"** (décochée par défaut)

Quand active, `injectPrintStyle()` ajoute une couche CSS supplémentaire :
```css
@page { size: A4; margin: 8mm; }
.section { gap: 2px !important; margin: 2px 0 !important; }
.measures-grid { gap: 2px !important; }
.chord-symbol { font-size: 0.38rem !important; }
.theory-info  { font-size: 0.32rem !important; }
.measure      { min-height: 1.4em !important; padding: 1px !important; }
.section-header { padding: 2px 4px !important; font-size: 0.6rem !important; }
```

**2. Case à cocher "Afficher repères de navigation"** (décochée par défaut)

Quand décochée, le CSS masque :
```css
.nav-symbol         { display: none !important; }
.volta-bracket      { display: none !important; }
.barline-repeat-start::before { display: none !important; }
.barline-repeat-end::after    { display: none !important; }
```
Quand cochée, ces règles ne sont pas injectées → affichage normal.

### Fichiers concernés

- `js/print.js` — `injectPrintStyle()`, `doPrint()`, nouvelles fonctions `buildOnepageCSS()`, `buildNavHideCSS()`
- `index.html` — ajout des deux cases à cocher dans `#print-contrast-bar`
- `js/i18n.js` — clés de traduction : `printOnepage`, `printShowNav`

---

## Feature 2 — Mode concert

### Comportement

Au démarrage de `startPlayback()` :
1. Ajouter classe `concert-mode` sur `<body>`
2. Afficher `#concert-bar` (créé une fois dans `index.html`, caché par défaut)

À chaque `_highlight(si, mi)` :
- Mettre à jour le compteur de mesure dans `#concert-bar`

À l'arrêt (`stopPlayback()`) :
- Retirer `concert-mode` de `<body>`
- Masquer `#concert-bar`

### `#concert-bar`

```html
<div id="concert-bar">
  <span id="concert-progress">Mesure 1 / N</span>
  <button id="concert-stop" onclick="stopPlayback()">⏹</button>
</div>
```

CSS : `position:fixed; bottom:0; left:0; right:0; background:rgba(0,0,0,0.75); color:#fff; display:flex; align-items:center; justify-content:space-between; padding:8px 16px; z-index:9999`

### CSS mode concert (`app.css`)

```css
body.concert-mode > *:not(#chart-container):not(#concert-bar) {
  display: none !important;
}
body.concert-mode #chart-container {
  cursor: pointer;
}
```

### Retour à l'interface normale

- Clic sur la grille (`#chart-container`) → `stopPlayback()`
- Toucher l'écran sur la grille → `stopPlayback()` (via `touch.js` ou listener dans `player.js`)
- Bouton ⏹ dans `#concert-bar` → `stopPlayback()`

### Fichiers concernés

- `js/player.js` — `startPlayback()`, `stopPlayback()`, `_highlight()`
- `index.html` — ajout `#concert-bar`
- `css/app.css` — règles `body.concert-mode`

---

## Feature 3 — Métronome

### Audio

Web Audio API pure, via `PLAYER.ctx` (déjà initialisé). Génération par oscillateur :

| Beat | Fréquence | Durée | Gain |
|------|-----------|-------|------|
| Temps fort (beat 1) | 1000 Hz | 0.06 s | 0.7 |
| Temps faible | 800 Hz | 0.05 s | 0.5 |

Calage sur `chartData.timeSig` : `"4/4"` → 4 clicks/mesure, `"3/4"` → 3, `"6/8"` → 6.
BPM = `chartData.tempo || 120`.

Les clicks sont schedulés via `AudioContext.currentTime` (même technique que les accords — pas de `setInterval`).

### Objet `METRO`

```js
const METRO = { timers: [], running: false, gainNode: null };
```

Séparé de `PLAYER` pour permettre le fonctionnement indépendant.

### Mode A — Dans le player dialog

- Case à cocher "Métronome" (état persisté en `localStorage['jgg_metro_on']`)
- Slider volume 0–100% (persisté en `localStorage['jgg_metro_vol']`, défaut 50%)
- Quand play démarre et case cochée → `startMetro()` lancé en parallèle
- `stopPlayback()` appelle toujours `stopMetro()` (no-op si non actif)

### Mode B — Bouton indépendant

- Bouton `♩` dans la toolbar (zone transport, à côté de ▶)
- Appelle `toggleMetro()` : lance ou arrête le métronome seul
- Utilise le même volume que le mode A
- Indicateur visuel : classe `active` sur le bouton quand actif
- Arrêté automatiquement si `startPlayback()` est appelé (le play reprend le contrôle du METRO)

### Fichiers concernés

- `js/player.js` — `startMetro()`, `stopMetro()`, `toggleMetro()`, intégration dans `startPlayback()` / `stopPlayback()`
- `index.html` — bouton ♩ toolbar, cases + slider dans `#player-dialog`
- `js/i18n.js` — clés : `metroLabel`, `metroVolume`
- `js/init.js` — restauration `localStorage` pour `jgg_metro_on` et `jgg_metro_vol`

---

## Résumé des fichiers modifiés

| Fichier | Features |
|---------|----------|
| `js/print.js` | F1 |
| `js/player.js` | F2, F3 |
| `css/app.css` | F2 |
| `index.html` | F1, F2, F3 |
| `js/i18n.js` | F1, F3 |
| `js/init.js` | F3 |

# Jazz Grid Generator — CLAUDE.md

## Présentation

Éditeur de grilles jazz en ligne, 100% HTML/JS/CSS, sans build. JSZip et soundfont-player chargés depuis CDN (MXL et lecteur audio nécessitent internet).  
Déployé sur : https://www.virgos.fr/JazzGridGenerator/

## Architecture

```
/
├── index.html
├── css/
│   ├── app.css        ← styles généraux, toggle 4/5 cordes, mode concert
│   ├── modals.css
│   └── print.css      ← réduction police auto, option 1 page, symboles nav
├── js/
│   ├── i18n.js        ← internationalisation (FR, ES, IT, EN)
│   ├── diagrams.js    ← diagrammes SVG basse 4 et 5 cordes, transposeModesvg, getModesvg
│   ├── theory.js      ← moteur de théorie musicale (modes, arpèges, tensions), escHtml
│   ├── state.js       ← état global, window.bassStrings, setBassStrings(), _isDirty
│   ├── render.js      ← rendu de la grille
│   ├── modals.js      ← gestion des modales
│   ├── actions.js     ← actions utilisateur
│   ├── print.js       ← logique d'impression/PDF
│   ├── touch.js       ← gestion tactile
│   ├── midi.js        ← export Standard MIDI File (Type 0)
│   ├── player.js      ← lecteur intégré (soundfont), navigation, métronome, mode concert, plein écran + wake lock
│   ├── ai.js          ← chat IA (Claude)
│   └── init.js        ← initialisation, restauration localStorage
├── songbook/          ← application compagnon Jazz Songbook (setlists, IndexedDB, BLE-MIDI HX Stomp)
│   ├── index.html
│   ├── css/           ← app.css, song-view.css
│   └── js/            ← db.js, init.js, midi.js (BLE), mxml.js, player.js, scroll.js, ui.js
├── docs/superpowers/  ← specs et plans d'implémentation (workflow brainstorming → plan)
├── CHANGELOG.md       ← historique complet des versions
└── OLD/               ← archives (versions monolithiques précédentes)
```

## Fonctionnalités clés

- **Import/Export MusicXML** — parse accords, sections, barres de reprise, tonalité, tempo
- **Édition accords** — 17 fondamentales, 24 qualités, basse en slash, durée par accord
- **Théorie musicale** — modes, arpèges, tensions, notes libres par accord
- **Diagrammes basse** — toggle 4 cordes (GDAE) / 5 cordes (BEADG), persisté en localStorage
- **Transposition** — par demi-ton ou sélection directe de tonalité
- **Sections** — labels, dupliquer, réordonner, annoter
- **Impression/PDF** — thème clair/sombre, contraste ajustable, réduction police auto
- **Sauvegarde JSON**
- **Lecture audio** — lecteur intégré (piano + basse soundfont, voicings jazz), navigation reprises/voltas/coda, métronome, mode concert
- **Export MIDI** — SMF Type 0, sélecteur de répétitions
- **Plein écran + wake lock** — l'écran ne se met pas en veille en plein écran
- **Assistant IA** — Claude, flux draft-preview-apply
- **Jazz Songbook** — app compagnon (`songbook/`), intègre JGG en iframe `?mode=view`
- **4 langues** — FR, ES, IT, EN
- **Sans build** — ouvrir `index.html` directement ; cœur fonctionnel hors ligne, MXL, soundfonts du lecteur et IA nécessitent internet

## Points techniques importants

### Toggle basse 4 / 5 cordes
- Géré dans `state.js` via `window.bassStrings` et `setBassStrings()`
- Persisté en `localStorage` (clé : `bassStrings`)
- Restauré au démarrage dans `init.js`
- Les clés de diagrammes 5 cordes ont le suffixe `_5` (ex: `Ionien_5`, `Dorien_5`)

### Impression multi-accords (`print.css`)
| Nombre d'accords | Symbole | Théorie | Hauteur max |
|-----------------|---------|---------|-------------|
| 2 accords       | 0.72rem | 0.52rem | 2.6em       |
| 3+ accords      | 0.62rem | 0.44rem | 2.2em       |

### Qualités d'accords supportées (24)
`maj7`, `7`, `m7`, `m7b5`, `dim7`, `mM7`, `aug`, et leurs variantes.

### Transposition (`diagrams.js`)
- Fonction `transposeModesvg` — gère les degrés altérés (b2, #4, b7…)

### Sécurité (XSS)
- `escHtml()` définie dans `theory.js:107` — à utiliser sur **tout** `innerHTML` avec données utilisateur
- `fmtChord()` ne fait PAS d'échappement HTML — toujours wrapper : `escHtml(fmtChord(...))`
- Clés API stockées en clair dans `localStorage['jgg_ai_settings']` — cible prioritaire en cas de XSS
- Données importées (JSON, MusicXML, réponses IA) sont non fiables — ne jamais les injecter sans `escHtml`

## Développement

Pas de build, pas de bundler. Ouvrir directement `index.html` dans un navigateur.

## Checklist release (à chaque version)
- Mettre à jour `<title>` dans `index.html` ligne 6 → `Jazz Grid Generator vX.X`
- Mettre à jour les badges `version-X.X` dans `README.md` et `README.en.md`
- Ajouter une section `### vX.X` dans `README.md`, `README.en.md` et `CHANGELOG.md`
- Créer un tag git et une release GitHub avec notes de version

## Version en cours (v5.0)
- Plein écran (bouton `⛶`) + wake lock — dans `player.js` (`_wakeLock`, re-demandé sur `visibilitychange`)
- Historique complet des versions dans `CHANGELOG.md` à la racine (v1.0–v5.0)

## Prochaines pistes
- Aide contextuelle BLE desktop dans le Songbook — spec prête : `docs/superpowers/specs/2026-05-25-ble-desktop-help-design.md` (pas encore de plan ni de code)
- Feuille de route README : couleur par section, import iReal Pro® `.irealbook`

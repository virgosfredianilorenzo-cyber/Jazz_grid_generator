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
│   ├── diagrams.js    ← diagrammes SVG basse 4 et 5 cordes, transposeModesvg, getModesvg, tablature d'arpège (arpTabNotes, arpTabSvg)
│   ├── theory.js      ← moteur de théorie musicale (modes, arpèges, tensions), escHtml
│   ├── state.js       ← état global, window.bassStrings, setBassStrings(), _isDirty
│   ├── render.js      ← rendu de la grille
│   ├── modals.js      ← gestion des modales
│   ├── actions.js     ← actions utilisateur
│   ├── print.js       ← logique d'impression/PDF
│   ├── touch.js       ← gestion tactile
│   ├── midi.js        ← export Standard MIDI File (Type 0)
│   ├── player.js      ← lecteur intégré (soundfont), navigation, métronome, mode concert, plein écran + wake lock
│   ├── ai.js          ← chat IA (Claude), recherche web optionnelle
│   ├── ireal.js       ← décodeur de liens iReal Pro (`irealb://`, `irealbook://`)
│   ├── gridsearch.js  ← fenêtre « Trouver une grille » (recherche, import iReal / MusicXML)
│   ├── listen.js      ← « Créer une grille à l'écoute » : capture (onglet / fichier), mesures en direct, correction à l'arrêt
│   ├── listen-dsp.js  ← moteur d'analyse audio (FFT, chroma, tétrades, tempo), chargé paresseusement à la première utilisation
│   └── init.js        ← initialisation, restauration localStorage
├── tests/             ← tests Node (`ai`, `arptab`, `gridsearch`, `ireal`, `listen-dsp`, `listen`, `uncertain`…), fixtures et helpers
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
- **Assistant IA** — Claude uniquement, flux draft-preview-apply ; recherche web optionnelle (« 🌐 Chercher sur le web », facturée par Anthropic en plus de l'usage Claude habituel)
- **Trouver une grille** — fenêtre « 🔎 Trouver une grille » : recherche DuckDuckGo, import iReal Pro (`irealb://`) ou MusicXML
- **Grille à l'écoute** — « 🎧 Créer une grille à l'écoute » : onglet (Chrome/Edge, `getDisplayMedia` audio) ou fichier audio, analyse locale sans bibliothèque (`listen-dsp.js` chargé à la demande), tétrades uniquement, accords incertains marqués `?` (retirés à l'export JSON, masqués à l'impression), annotation « à vérifier à l'oreille » ; rien n'est enregistré ni envoyé
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

Tests (Node requis uniquement pour eux) : `node --test tests/*.test.js`

## Checklist release (à chaque version)
- Mettre à jour `<title>` dans `index.html` ligne 6 → `Jazz Grid Generator vX.X`
- Mettre à jour les badges `version-X.X` dans `README.md` et `README.en.md`
- Ajouter une section `### vX.X` dans `README.md`, `README.en.md` et `CHANGELOG.md`
- Créer un tag git et une release GitHub avec notes de version

## Version en cours (v5.2)
- Tablature d'arpège : `getArpDegrees` (`theory.js`), `arpTabNotes` / `arpTabSvg` (`diagrams.js`), choix stocké dans `annot.diagram` (`'arp'` ou absent)
- Trouver une grille + import iReal Pro (`gridsearch.js`, `ireal.js`), IA sur Claude uniquement avec recherche web, grille à l'écoute (`listen.js`, `listen-dsp.js`)
- Historique complet des versions dans `CHANGELOG.md` à la racine (v1.0–v5.2)

## Prochaines pistes
- Aide contextuelle BLE desktop dans le Songbook — spec prête : `docs/superpowers/specs/2026-05-25-ble-desktop-help-design.md` (pas encore de plan ni de code)
- Feuille de route README : couleur par section

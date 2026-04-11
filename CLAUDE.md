# Jazz Grid Generator — CLAUDE.md

## Présentation

Éditeur de grilles jazz en ligne, 100% HTML/JS/CSS, sans dépendances, sans build.  
Déployé sur : https://www.virgos.fr/JazzGridGenerator/

## Architecture

### Fichier monolithique
- `Jazz_grid_generator.html` — version tout-en-un (HTML + CSS + JS inline)

### Version splittée (répertoire `Split/`)
```
Split/
├── index.html
├── css/
│   ├── app.css        ← styles généraux + toggle 4/5 cordes basse
│   ├── modals.css
│   └── print.css      ← réduction police automatique mesures multi-accords
└── js/
    ├── i18n.js        ← internationalisation (FR, ES, IT, EN)
    ├── diagrams.js    ← diagrammes SVG basse 4 et 5 cordes, transposeModesvg, getModesvg
    ├── theory.js      ← moteur de théorie musicale (modes, arpèges, tensions)
    ├── state.js       ← état global, window.bassStrings, setBassStrings()
    ├── render.js      ← rendu de la grille
    ├── modals.js      ← gestion des modales
    ├── actions.js     ← actions utilisateur
    ├── print.js       ← logique d'impression/PDF
    └── init.js        ← initialisation, restauration localStorage
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
- **4 langues** — FR, ES, IT, EN
- **Zéro dépendance** — fonctionne hors ligne, aucun build requis

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

## Développement

Pas de build, pas de bundler. Ouvrir directement `Jazz_grid_generator.html` ou `Split/index.html` dans un navigateur.

Pour tester les modifications de la version splittée, ouvrir `Split/index.html`.

## Version en cours (v3.0)
- Diagrammes 5 cordes pour les 17 modes
- Toggle 4/5 cordes (localStorage)
- Correction `transposeModesvg` — degrés altérés
- Réduction police automatique en PDF
- Auto-annotation à l'import MusicXML

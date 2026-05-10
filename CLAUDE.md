# Jazz Grid Generator — CLAUDE.md

## Présentation

Éditeur de grilles jazz en ligne, 100% HTML/JS/CSS, sans dépendances, sans build.  
Déployé sur : https://www.virgos.fr/JazzGridGenerator/

## Architecture

```
/
├── index.html
├── css/
│   ├── app.css        ← styles généraux + toggle 4/5 cordes basse
│   ├── modals.css
│   └── print.css      ← réduction police automatique mesures multi-accords
├── js/
│   ├── i18n.js        ← internationalisation (FR, ES, IT, EN)
│   ├── diagrams.js    ← diagrammes SVG basse 4 et 5 cordes, transposeModesvg, getModesvg
│   ├── theory.js      ← moteur de théorie musicale (modes, arpèges, tensions)
│   ├── state.js       ← état global, window.bassStrings, setBassStrings()
│   ├── render.js      ← rendu de la grille
│   ├── modals.js      ← gestion des modales
│   ├── actions.js     ← actions utilisateur
│   ├── print.js       ← logique d'impression/PDF
│   ├── touch.js       ← gestion tactile
│   ├── ai.js          ← chat AI (Claude, OpenAI)
│   └── init.js        ← initialisation, restauration localStorage
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

Pas de build, pas de bundler. Ouvrir directement `index.html` dans un navigateur.

## Version en cours (v4.2)
- Suppression du provider Infomaniak
- Rendu Markdown dans les bulles de réponse IA (`_aiMdToHtml`)

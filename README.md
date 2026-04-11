# 𝄢 Jazz Grid Generator

> Éditeur de grilles jazz en ligne avec annotations de théorie musicale, diagrammes de manche basse 4 et 5 cordes, import/export MusicXML et sortie PDF optimisée.

![Version](https://img.shields.io/badge/version-3.0-f0a500?style=flat-square)
![Licence](https://img.shields.io/badge/licence-Apache%202.0-86efac?style=flat-square)
![HTML](https://img.shields.io/badge/built%20with-HTML%2FJS-c4b5fd?style=flat-square)
![Langues](https://img.shields.io/badge/langues-FR%20%7C%20ES%20%7C%20IT%20%7C%20EN-7dd3fc?style=flat-square)
![Sans dépendances](https://img.shields.io/badge/dépendances-aucune-fca5a5?style=flat-square)

**Déployé sur** : https://www.virgos.fr/JazzGridGenerator/

---

Cette application permet de créer des grilles à partir d'un document vierge. L'import de fichiers au format MusicXML issus de iReal Pro, Musescore ou tout autre logiciel supportant ce format est fonctionnel. Les grilles une fois importées sont modifiables. L'impression au format PDF de la grille finalisée peut être par exemple uploadée dans une application de type SongBook Pro et utilisée sur tablette lors de jam sessions ou de concerts.

---

## ✨ Fonctionnalités

- 📂 **Import MusicXML** — drag & drop ou sélecteur de fichier, parse les accords, sections, barres de reprise, tonalité, tempo
- 📦 **Import / Export MXL** — format MusicXML compressé (JSZip)
- ✏️ **Édition complète des accords** — 17 fondamentales, 24 qualités, basse en slash, saisie libre, durée par accord
- 🔄 **Accord alternatif** — substitution tritoniée, suggestion automatique, export/import MusicXML
- 🎼 **Annotations de théorie musicale** par accord :
  - Modes compatibles (Ionien, Dorien, Mixolydien, Altéré, etc.)
  - Arpèges à 4 sons avec toutes les inversions
  - Tensions disponibles & notes à éviter
  - Notes libres avec couleur et mise en forme gras/italique
- 🎸 **Diagrammes de manche basse 4 et 5 cordes** :
  - Toggle **🎸 4 / 5** dans la toolbar, choix persisté en `localStorage`
  - **17 modes disponibles en version 5 cordes** (accordage BEADG)
  - Transposition automatique des diagrammes selon la fondamentale de l'accord
  - Couleurs : 🔴 fondamentale · 🟡 notes d'arpège · 🔵 autres degrés
- 🎵 **Transposition** — par demi-ton (±) ou sélection directe de tonalité, avec gestion enharmonique
- 🗂️ **Gestion des sections** — labels (A–I, Intro, Verse, Chorus, Bridge, Coda…), suffixes chiffrés (0–9), dupliquer, réordonner par drag & drop, annoter
- 🔀 **Drag & drop** — réordonner les sections et les mesures à la souris et au toucher (tablette)
- 🎵 **Symboles de mesure** — `%` (répétition), `𝄎` (double répétition), `N.C.` (no chord), `/` (slash), `(w)` (basse seule sans harmonie)
- 🔢 **Barres de mesure enrichies** — normale, double, finale, début/fin de reprise, export/import MusicXML
- 🎼 **Voltas et symboles de navigation** — 1ère / 2ème / 3ème fois, Segno, Coda, D.C., D.S., Fine, export/import MusicXML
- ↩️ **Annuler / Rétablir (Undo/Redo)** :
  - Pile de 10 snapshots JSON
  - Raccourcis Ctrl+Z / Ctrl+Y (⌘Z / ⌘Y sur Mac)
  - Boutons ↩ ↪ dans la toolbar
  - Couverture complète : accords, annotations, sections, mesures, barlines, voltas, navigation, accord alternatif, drag & drop
- 📱 **Support tactile tablette** :
  - Drag & drop sections et mesures via Touch Events
  - MutationObserver pour patcher dynamiquement les éléments post-render
  - Pinch-to-zoom sur la grille
  - Cibles agrandies via `@media (pointer: coarse)`
- 🖨️ **Impression / PDF avancée** :
  - Thème clair ☀️ / sombre 🌙, contraste ajustable (5 niveaux)
  - Colorisation automatique par section
  - Police réduite automatiquement sur les mesures multi-accords (lisibilité sur 2 lignes max)
  - Menus barline / navigation positionnés intelligemment (ne débordent plus en bord d'écran)
- 💾 **Sauvegarde / chargement JSON** — fidélité complète incluant toutes les annotations
- 🎼 **Export MusicXML** — compatible MuseScore, Sibelius, Finale, iReal Pro
- 🌐 **4 langues** — Français 🇫🇷, Espagnol 🇪🇸, Italien 🇮🇹, Anglais 🇬🇧
- 📱 **Zéro dépendance** — fichier HTML unique, fonctionne hors ligne, aucun build requis

---

## 🚀 Démarrage rapide

### Option 1 — Directement dans le navigateur

Ouvrir `Jazz_grid_generator.html` dans n'importe quel navigateur moderne. Aucun serveur requis.

### Option 2 — Version splittée (développement)

```
split/
├── index.html
├── css/
│   ├── app.css          ← styles UI + toggle 4/5 cordes + undo/redo
│   ├── modals.css       ← styles des modales
│   └── print.css        ← styles impression, réduction police multi-accords
└── js/
    ├── i18n.js          ← dictionnaire de traductions (FR/ES/IT/EN)
    ├── diagrams.js      ← SVG 4 et 5 cordes, transposeModesvg(), getModesvg()
    ├── theory.js        ← moteur de théorie (gammes, arpèges, tensions)
    ├── state.js         ← variables globales, window.bassStrings, setBassStrings()
    ├── render.js        ← rendu DOM de la grille
    ├── modals.js        ← modales accord et annotation
    ├── actions.js       ← mutations de la grille, auto-annotation à l'import
    ├── print.js         ← thème impression et système de couleurs par section
    └── init.js          ← initialisation, restauration localStorage
```

### Option 3 — Hébergement statique

Uploader les fichiers sur n'importe quel hébergeur statique (Apache, Nginx, Netlify, Vercel, Cloudflare Pages…). Aucune configuration requise.

---

## 🎸 Toggle Basse 4 / 5 cordes

Le bouton **🎸 4 / 5** dans la toolbar permet de basculer entre les diagrammes **4 cordes (GDAE)** et **5 cordes (BEADG)**.

- Le choix est persisté en **`localStorage`** et restauré automatiquement au rechargement
- La variable `window.bassStrings` (valeur `4` ou `5`) est partagée entre tous les modules JS
- Si un mode n'a pas de diagramme 5 cordes, le diagramme 4 cordes est utilisé en fallback

### Modes disponibles en 5 cordes (17 / 17)

| Mode | Clé `diagrams.js` | Mode | Clé `diagrams.js` |
|------|-------------------|------|-------------------|
| Ionien | `Ionien_5` | Lydien b7 | `LydienB7_5` |
| Dorien | `Dorien_5` | Altéré | `Altere_5` |
| Phrygien | `Phrygien_5` | Mélodie mineure | `MelodieMineure_5` |
| Lydien | `Lydien_5` | Min. harmonique | `MinHarmonique_5` |
| Mixolydien | `Mixolydien_5` | Mixolydien b9b13 | `MixolydienB9B13_5` |
| Éolien | `Aeolien_5` | Lydien augmenté | `LydienAugmente_5` |
| Locrien | `Locrien_5` | Locrien #2 | `LocrienDiese2_5` |
| Dim. demi-ton | `DimDemiTon_5` | Dim. ton-demi | `DimTonDemi_5` |
| Tons entiers | `TonsEntiers_5` | | |

---

## ↩️ Annuler / Rétablir

L'historique couvre **toutes les mutations** de la grille :

| Action | Couverte |
|--------|----------|
| Ajout / suppression / duplication d'accord | ✅ |
| Modification d'annotation | ✅ |
| Ajout / suppression / duplication de mesure | ✅ |
| Ajout / suppression de section | ✅ |
| Drag & drop section ou mesure | ✅ |
| Modification de barline | ✅ |
| Volta (1ère / 2ème / 3ème) | ✅ |
| Symbole de navigation | ✅ |
| Accord alternatif | ✅ |

La profondeur est de **10 niveaux**. Au-delà, le snapshot le plus ancien est supprimé.

---

## 📱 Support tablette

- **Drag & drop tactile** — sections et mesures déplaçables au doigt
- **Pinch-to-zoom** — pincer la grille pour zoomer (0.5× à 2×)
- **Cibles agrandies** — `@media (pointer: coarse)` augmente la taille des boutons barline, nav, accord
- **MutationObserver** — les éléments ajoutés dynamiquement après un render sont automatiquement patchés

---

## 🖨️ Impression / PDF

### Mesures multi-accords

| Nombre d'accords | Symbole | Zone théorie | Hauteur max |
|-----------------|---------|--------------|-------------|
| 2 accords | 0.72rem | 0.52rem | 2.6em (≈ 2 lignes) |
| 3+ accords | 0.62rem | 0.44rem | 2.2em (≈ 2 lignes) |

### Menus popup

Les menus de sélection de barres de mesure, de voltas et de symboles de navigation se positionnent automatiquement pour rester dans l'écran, même en bord droit ou en bas de page.

---

## 🎼 Moteur de théorie musicale

### Modes suggérés par qualité

| Qualité | Modes suggérés |
|---------|---------------|
| `maj7` | Ionien, Lydien, Lydien augmenté |
| `7` | Mixolydien, Lydien b7, Altéré, Mixolydien b9b13 |
| `m7` | Dorien, Éolien, Phrygien, Min. harmonique |
| `m7b5` | Locrien, Locrien #2 |
| `dim7` | Dim. ton-demi, Dim. demi-ton |
| `mM7` | Mélodie mineure, Lydien augmenté, Min. harmonique |
| `aug` | Tons entiers |

---

## 📋 Changelog

### v3.0 (avril 2026)
- ✅ Diagrammes 5 cordes (BEADG) pour les 17 modes
- ✅ Toggle 🎸 4/5 cordes dans la toolbar, persisté en `localStorage`
- ✅ Correction `transposeModesvg()` — support des degrés altérés (`b2`, `#4`, `b6`, `b7`…)
- ✅ Réduction automatique de police en PDF pour les mesures multi-accords
- ✅ Auto-annotation à l'import MusicXML
- ✅ Menus popup (barlines, navigation) repositionnés en bord d'écran

### v2.0
- ✅ Historique Annuler / Rétablir (10 niveaux, Ctrl+Z/Y, boutons toolbar)
- ✅ Support tactile tablette — drag & drop Touch Events, pinch-to-zoom, MutationObserver
- ✅ Symbole `(w)` basse seule
- ✅ Accord alternatif (substitution tritoniée)
- ✅ Barres de mesure enrichies, Voltas, Symboles de navigation
- ✅ Symboles iReal Pro (`%`, `𝄎`, `N.C.`, `/`)
- ✅ Drag & drop sections et mesures
- ✅ Import/Export MXL (JSZip)
- ✅ 4 langues (FR, ES, IT, EN)

### v1.0
- ✅ Éditeur de grilles basique
- ✅ Annotations de théorie musicale
- ✅ Import MusicXML
- ✅ Transposition chromatique
- ✅ Import/export JSON
- ✅ Impression PDF thème clair/sombre

---

## 📋 Feuille de route

- [ ] Lecture MIDI des notes fondamentales
- [ ] Sélecteur de couleur personnalisé par section
- [ ] Import iReal Pro `.irealbook`

---

## 📄 Licence

Apache 2.0 — *𝄢 Made with love for musicians, by a bass player.*

# 🎷 Jazz Grid Generator

> Éditeur de grilles jazz en ligne avec annotations de théorie musicale, import/export MusicXML, transposition, diagrammes de manche basse 4 et 5 cordes, et export PDF.

![Version](https://img.shields.io/badge/version-3.0-f0a500?style=flat-square)
![License](https://img.shields.io/badge/license-MIT-86efac?style=flat-square)
![HTML](https://img.shields.io/badge/built%20with-HTML%2FJS-c4b5fd?style=flat-square)
![Languages](https://img.shields.io/badge/languages-FR%20%7C%20ES%20%7C%20IT%20%7C%20EN-7dd3fc?style=flat-square)
![No dependencies](https://img.shields.io/badge/dependencies-none-fca5a5?style=flat-square)

**Déployé sur** : https://www.virgos.fr/JazzGridGenerator/

---

## ✨ Fonctionnalités

- 📂 **Import MusicXML** — drag & drop ou sélecteur, parse accords, sections, barres de reprise, tonalité, tempo
- ✏️ **Édition complète des accords** — 17 fondamentales, 24 qualités, basse en slash, saisie libre, durée par accord
- 🎼 **Annotations de théorie musicale** par accord : modes, arpèges, tensions, notes libres
- 🎸 **Diagrammes de manche basse 4 et 5 cordes** — toggle 🎸 4/5 dans la toolbar, persisté en localStorage
- 🎵 **Transposition** — par demi-ton (±) ou sélection directe de tonalité
- 🗂️ **Gestion des sections** — labels, dupliquer, réordonner, annoter
- 🖨️ **Impression/PDF avancée** — thème clair/sombre, contraste ajustable, police réduite automatiquement sur mesures multi-accords
- 💾 **Sauvegarde/chargement JSON**
- 🎼 **Export MusicXML** — compatible MuseScore, Sibelius, Finale, iReal Pro
- 🌐 **4 langues** — Français 🇫🇷, Espagnol 🇪🇸, Italien 🇮🇹, Anglais 🇬🇧
- 📱 **Zéro dépendance** — fonctionne hors ligne, aucun build requis

---

## 🎸 Toggle Basse 4 / 5 cordes

Le bouton **🎸 4 / 5** dans la toolbar bascule entre les diagrammes 4 cordes (GDAE) et 5 cordes (BEADG). Le choix est persisté en `localStorage`.

### Modes avec diagramme 5 cordes (17/17)

| Mode | Clé | Mode | Clé |
|------|-----|------|-----|
| Ionien | `Ionien_5` | Lydien b7 | `LydienB7_5` |
| Dorien | `Dorien_5` | Altéré | `Altere_5` |
| Phrygien | `Phrygien_5` | Mélodie mineure | `MelodieMineure_5` |
| Lydien | `Lydien_5` | Min. harmonique | `MinHarmonique_5` |
| Mixolydien | `Mixolydien_5` | Mixolydien b9b13 | `MixolydienB9B13_5` |
| Éolien | `Aeolien_5` | Lydien augmenté | `LydienAugmente_5` |
| Locrien | `Locrien_5` | Locrien #2 | `LocrienDiese2_5` |
| — | — | Dim. demi-ton | `DimDemiTon_5` |
| — | — | Dim. ton-demi | `DimTonDemi_5` |
| — | — | Tons entiers | `TonsEntiers_5` |

---

## 🗂️ Architecture (version splittée)

```
split/
├── index.html
├── css/
│   ├── app.css          ← styles généraux + toggle 4/5 cordes
│   ├── modals.css
│   └── print.css        ← réduction police multi-accords
└── js/
    ├── i18n.js
    ├── diagrams.js      ← SVG 4 et 5 cordes, transposeModesvg, getModesvg
    ├── theory.js
    ├── state.js         ← window.bassStrings, setBassStrings()
    ├── render.js
    ├── modals.js
    ├── actions.js
    ├── print.js
    └── init.js          ← restauration localStorage bassStrings
```

---

## 🖨️ Impression multi-accords

Les mesures avec plusieurs accords bénéficient d'une réduction automatique de police :

| Nombre d'accords | Symbole | Théorie | Hauteur max |
|-----------------|---------|---------|-------------|
| 2 accords | 0.72rem | 0.52rem | 2.6em |
| 3+ accords | 0.62rem | 0.44rem | 2.2em |

---

## 🎼 Moteur de théorie musicale

### Qualités supportées (24) — Modes suggérés

| Qualité | Modes |
|---------|-------|
| `maj7` | Ionien, Lydien, Lydien augmenté |
| `7` | Mixolydien, Lydien b7, Altéré, Mixo b9b13 |
| `m7` | Dorien, Éolien, Phrygien, Min. harmonique |
| `m7b5` | Locrien, Locrien #2 |
| `dim7` | Dim. ton-demi, Dim. demi-ton |
| `mM7` | Mélodie mineure, Lydien augmenté, Min. harmonique |
| `aug` | Tons entiers |

---

## 📋 Changelog

### v3.0 (en cours)
- ✅ Diagrammes 5 cordes pour les 17 modes (BEADG)
- ✅ Toggle 4/5 cordes dans la toolbar (localStorage)
- ✅ Correction transposeModesvg — degrés altérés (b2, #4, b7…)
- ✅ Réduction police automatique en PDF pour mesures multi-accords
- ✅ Auto-annotation à l'import MusicXML

### v2.0
- Annotations de théorie musicale par accord
- Import MusicXML avec auto-annotation
- Export MusicXML et MXL
- 4 langues
- Version splittée (multi-fichiers)

---

## 📄 Licence

MIT — *Made with 🎸 for jazz bass players.*

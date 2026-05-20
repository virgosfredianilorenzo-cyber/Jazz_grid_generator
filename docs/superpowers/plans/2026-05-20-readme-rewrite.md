# README Rewrite v4.3 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Réécrire README.md et README.en.md pour refléter l'état v4.3 du projet, supprimer toute trace de Split/ et de la version autonome, adopter une structure musicien+développeur avec `<details>` pour les tables techniques.

**Architecture:** Quatre fichiers touchés — README.md (réécriture), README.en.md (réécriture EN synchronisée), CHANGELOG.md (création, historique v1.0–v3.0), Split/ (suppression git). Aucun JS ni CSS modifié.

**Tech Stack:** Markdown, HTML inline (`<details>`/`<summary>`), git

---

## Task 1 : Supprimer Split/ du repo

**Files:**
- Delete: `Split/` (dossier vide suivi par git)

- [ ] **Step 1 : Vérifier que Split/ est bien vide et suivi par git**

```bash
git ls-files Split/
```

Expected : aucune sortie (dossier vide non suivi) **ou** une liste de fichiers.  
Si aucune sortie → le dossier n'est pas suivi, passer à Step 3.

- [ ] **Step 2 : Supprimer les fichiers trackés (si Step 1 a retourné des fichiers)**

```bash
git rm -r Split/
```

Expected : `rm 'Split/...'` pour chaque fichier listé.

- [ ] **Step 3 : Supprimer le dossier physique s'il existe encore**

```bash
rm -rf Split/
```

- [ ] **Step 4 : Vérifier qu'il n'existe plus**

```bash
ls Split/ 2>&1
```

Expected : `ls: cannot access 'Split/': No such file or directory`

- [ ] **Step 5 : Commit**

```bash
git add -A
git commit -m "chore: supprimer dossier Split/ vide (architecture promue à la racine)"
```

---

## Task 2 : Créer CHANGELOG.md

**Files:**
- Create: `CHANGELOG.md`

- [ ] **Step 1 : Créer CHANGELOG.md avec l'historique v1.0–v3.0**

Contenu exact du fichier :

```markdown
# Changelog

## v3.0 (avril 2026)
- ✅ Diagrammes 5 cordes (BEADG) pour les 17 modes
- ✅ Toggle 🎸 4/5 cordes dans la toolbar, persisté en localStorage
- ✅ Correction `transposeModesvg()` — support des degrés altérés (`b2`, `#4`, `b6`, `b7`…)
- ✅ Réduction automatique de police en PDF pour les mesures multi-accords
- ✅ Auto-annotation à l'import MusicXML
- ✅ Menus popup (barlines, navigation) repositionnés en bord d'écran

## v2.0
- ✅ Historique Annuler / Rétablir (10 niveaux, Ctrl+Z/Y, boutons toolbar)
- ✅ Support tactile tablette — drag & drop Touch Events, pinch-to-zoom, MutationObserver
- ✅ Symbole `(w)` basse seule
- ✅ Accord alternatif (substitution tritoniée)
- ✅ Barres de mesure enrichies, Voltas, Symboles de navigation
- ✅ Symboles iReal Pro® (`%`, `𝄎`, `N.C.`, `/`)
- ✅ Drag & drop sections et mesures
- ✅ Import/Export MXL (JSZip)
- ✅ 4 langues (FR, ES, IT, EN)

## v1.0
- ✅ Éditeur de grilles basique
- ✅ Annotations de théorie musicale
- ✅ Import MusicXML
- ✅ Transposition chromatique
- ✅ Import/export JSON
- ✅ Impression PDF thème clair/sombre
```

- [ ] **Step 2 : Vérifier le fichier créé**

```bash
grep -c "^## v" CHANGELOG.md
```

Expected : `3`

- [ ] **Step 3 : Commit**

```bash
git add CHANGELOG.md
git commit -m "docs: créer CHANGELOG.md avec historique v1.0–v3.0"
```

---

## Task 3 : Réécrire README.md (FR)

**Files:**
- Modify: `README.md` (réécriture complète)

- [ ] **Step 1 : Remplacer entièrement README.md avec le contenu suivant**

````markdown
# 𝄢 Jazz Grid Generator

> Éditeur de grilles jazz en ligne — assistant IA, théorie musicale, diagrammes de manche basse, import/export MusicXML, sortie PDF.

![Version](https://img.shields.io/badge/version-4.3-f0a500?style=flat-square)
![Licence](https://img.shields.io/badge/licence-Apache%202.0-86efac?style=flat-square)
![HTML](https://img.shields.io/badge/built%20with-HTML%2FJS-c4b5fd?style=flat-square)
![Langues](https://img.shields.io/badge/langues-FR%20%7C%20ES%20%7C%20IT%20%7C%20EN-7dd3fc?style=flat-square)
![Sans dépendances](https://img.shields.io/badge/dépendances-aucune-fca5a5?style=flat-square)

**🌐 Démo live** : https://www.virgos.fr/JazzGridGenerator/

![Aperçu de l'application](Screenshots/capt1.png)

Crée des grilles jazz à partir d'un document vierge ou depuis un fichier MusicXML (iReal Pro®, MuseScore®…). Édite, transpose, annote, puis exporte en PDF — prêt à utiliser sur ta tablette lors de concerts ou jam sessions.

---

## ✨ Fonctionnalités

- 🤖 **Assistant IA conversationnel** — panneau en bas de page, piloté en langage naturel : crée, modifie et supprime sections, mesures, accords et annotations ; transpose tout le chart ; aperçu avant application avec boutons Appliquer / Annuler
- 📂 **Import MusicXML** — drag & drop ou sélecteur de fichier ; parse les accords, sections, barres de reprise, tonalité, tempo (iReal Pro®, MuseScore®, Sibelius, Finale…)
- 📦 **Import / Export MXL** — format MusicXML compressé
- ✏️ **Édition complète des accords** — 17 fondamentales, 24 qualités, basse en slash, saisie libre, durée par accord
- 🔄 **Accord alternatif** — substitution tritoniée avec suggestion automatique
- 🎼 **Annotations de théorie musicale** par accord : modes compatibles, arpèges à 4 sons avec inversions, tensions disponibles, notes à éviter, notes libres
- 🎸 **Diagrammes de manche basse 4 et 5 cordes** — toggle 🎸 4/5 dans la toolbar ; 17 modes en 5 cordes (BEADG) ; transposition automatique selon la fondamentale ; 🔴 fondamentale · 🟡 arpège · 🔵 autres degrés
- 🎵 **Transposition** — par demi-ton (±) ou sélection directe de tonalité, avec gestion enharmonique
- 🗂️ **Gestion des sections** — labels (A–I, Intro, Verse, Chorus, Bridge, Coda…), suffixes chiffrés, dupliquer, réordonner, annoter ; ID unique `#xxxx` dans l'en-tête
- 🔀 **Drag & drop** — sections et mesures déplaçables à la souris et au toucher
- 🎵 **Symboles de mesure** — `%`, `𝄎`, `N.C.`, `/`, `(w)` basse seule
- 🔢 **Barres de mesure enrichies** — normale, double, finale, reprise début/fin ; export/import MusicXML
- 🎼 **Voltas et symboles de navigation** — 1ère/2ème/3ème fois, Segno, Coda, D.C., D.S., Fine
- ↩️ **Annuler / Rétablir** — 10 niveaux, raccourcis Ctrl+Z / Ctrl+Y, couverture complète de toutes les actions
- 📱 **Support tactile tablette** — drag & drop au doigt, pinch-to-zoom, cibles agrandies
- 🖨️ **Impression / PDF avancée** — thème clair/sombre, contraste ajustable, colorisation par section, réduction de police automatique sur mesures multi-accords
- 💾 **Sauvegarde du travail en cours (JSON)** — reprise exacte à l'identique, accords, annotations et sections inclus
- 🎼 **Export MusicXML** — compatible MuseScore®, Sibelius, Finale, iReal Pro®
- 🌐 **4 langues** — Français 🇫🇷, Espagnol 🇪🇸, Italien 🇮🇹, Anglais 🇬🇧
- ⚡ **Zéro dépendance** — fonctionne hors ligne, aucun build requis

---

## 🤖 Assistant IA

Le panneau IA s'ouvre via l'onglet **✦ IA** en bas à droite de la page.

### Configuration

Cliquer **⚙** dans l'en-tête du panneau :

| Paramètre | Valeurs |
|-----------|---------|
| Provider | Claude (Anthropic) · OpenAI® |
| Modèle Claude | `claude-sonnet-4-6`, `claude-opus-4-7` |
| Modèle OpenAI® | `gpt-4o`, `gpt-4o-mini` |
| Clé API | Saisie dans l'app, stockée localement, jamais transmise ailleurs |

<details>
<summary>Outils disponibles</summary>

| Catégorie | Outils |
|-----------|--------|
| Chart | `set_chart_metadata`, `transpose_chart`, `set_columns`, `set_bass_strings` |
| Sections | `add_section`, `duplicate_section`, `rename_section`, `remove_section` |
| Mesures | `add_bar`, `duplicate_bar`, `remove_bar`, `set_barline` |
| Accords | `add_chord`, `edit_chord`, `remove_chord`, `set_chord_alt` |
| Annotations | `set_annotation` (avec `showSvg`), `toggle_all_diagrams` |

</details>

### Flux de travail

1. Écris une instruction en langage naturel
2. L'IA résume ce qu'elle va faire, puis appelle les outils nécessaires
3. Un aperçu liste les changements (*"Section B ajoutée"*, *"Dm7 → D7 mes. 3"*…)
4. **Appliquer** → modifications appliquées, snapshot undo créé
5. **Annuler** → rien ne change

---

## 🚀 Démarrage

**En ligne** — ouvre directement https://www.virgos.fr/JazzGridGenerator/

**En local** — clone le repo et ouvre `index.html` dans un navigateur. Aucun build, aucune dépendance, aucun serveur requis.

**Sur ton hébergeur** — dépose les fichiers sur n'importe quel hébergeur statique (Netlify, Vercel, Cloudflare Pages, Apache, Nginx…).

<details>
<summary>Architecture du projet</summary>

```
index.html
css/
├── app.css          ← styles UI, toolbar, toggle 4/5 cordes, panneau IA
├── modals.css       ← styles des modales
└── print.css        ← styles impression, réduction police multi-accords
js/
├── i18n.js          ← dictionnaire de traductions (FR/ES/IT/EN)
├── diagrams.js      ← SVG basse 4 et 5 cordes, transposition des diagrammes
├── theory.js        ← moteur de théorie (gammes, arpèges, tensions)
├── state.js         ← état global partagé entre les modules
├── render.js        ← rendu DOM de la grille
├── modals.js        ← modales accord et annotation
├── actions.js       ← mutations de la grille, auto-annotation à l'import
├── print.js         ← thème impression et colorisation par section
├── touch.js         ← support tactile (Touch Events, pinch-to-zoom)
├── ai.js            ← assistant IA (providers, outils, draft, chat, settings)
└── init.js          ← initialisation, restauration de la session
doc/
└── doc.html         ← documentation complète en ligne
```

</details>

---

## 🎸 Diagrammes basse

<details>
<summary>Modes disponibles en 5 cordes (17/17)</summary>

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

</details>

---

## ↩️ Annuler / Rétablir

<details>
<summary>Couverture complète</summary>

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
| Application d'un draft IA | ✅ |

Profondeur : **10 niveaux**.

</details>

---

## 🎼 Théorie musicale

<details>
<summary>Modes suggérés par qualité d'accord</summary>

| Qualité | Modes suggérés |
|---------|---------------|
| `maj7` | Ionien, Lydien, Lydien augmenté |
| `7` | Mixolydien, Lydien b7, Altéré, Mixolydien b9b13 |
| `m7` | Dorien, Éolien, Phrygien, Min. harmonique |
| `m7b5` | Locrien, Locrien #2 |
| `dim7` | Dim. ton-demi, Dim. demi-ton |
| `mM7` | Mélodie mineure, Lydien augmenté, Min. harmonique |
| `aug` | Tons entiers |

</details>

---

## 📱 Support tablette

<details>
<summary>Détails techniques</summary>

- **Drag & drop tactile** — Touch Events sur sections et mesures
- **Pinch-to-zoom** — pincer la grille pour zoomer (0.5× à 2×)
- **Cibles agrandies** — `@media (pointer: coarse)` augmente les boutons barline, nav, accord
- **MutationObserver** — les éléments ajoutés après un render sont automatiquement patchés

</details>

---

## 🖨️ Impression / PDF

<details>
<summary>Réglages fins</summary>

**Mesures multi-accords**

| Nombre d'accords | Symbole | Zone théorie | Hauteur max |
|-----------------|---------|--------------|-------------|
| 2 accords | 0.72rem | 0.52rem | 2.6em |
| 3+ accords | 0.62rem | 0.44rem | 2.2em |

**Menus popup** — barlines, voltas et navigation se repositionnent automatiquement pour rester dans l'écran.

</details>

---

## 📋 Changelog

### v4.3 (mai 2026)
- ✅ ID unique par section (`#xxxx`), persisté en JSON, masqué à l'impression ; migration automatique des fichiers anciens
- ✅ Nouvel outil IA `toggle_all_diagrams`
- ✅ `set_annotation` expose `showSvg` pour contrôler la visibilité du diagramme
- ✅ Fix : export/import MXL restauré ; champs méta lisibles à l'impression

### v4.2 (mai 2026)
- ✅ Rendu Markdown dans les réponses IA — paragraphes, listes, **gras**, *italique*, `code`

### v4.0 (mai 2026)
- ✅ Assistant IA conversationnel — Claude et OpenAI®
- ✅ 15 outils IA : sections, mesures, accords, annotations, métadonnées, transposition
- ✅ Flux draft-preview-apply avec liste des changements et undo intégré
- ✅ Panneau IA en barre du bas, pleine largeur

→ [Historique complet](CHANGELOG.md)

---

## 📋 Feuille de route

- [ ] Lecture MIDI des notes fondamentales
- [ ] Sélecteur de couleur personnalisé par section
- [ ] Import iReal Pro® `.irealbook`

---

## 📄 Licence

Apache 2.0 — *𝄢 Made with love for musicians, by a bass player.*
````

- [ ] **Step 2 : Vérifier l'absence de contenu interdit**

```bash
grep -n "Split/\|version autonome\|monolithique\|Option 1\|Option 2\|4\.2-f0a500" README.md
```

Expected : aucune sortie.

- [ ] **Step 3 : Vérifier la présence des symboles ®**

```bash
grep -c "®" README.md
```

Expected : `≥ 8` (MuseScore® ×4, iReal Pro® ×3, OpenAI® ×2 minimum).

- [ ] **Step 4 : Commit**

```bash
git add README.md
git commit -m "docs: réécrire README.md v4.3 — structure musicien+développeur, details repliés"
```

---

## Task 4 : Réécrire README.en.md (EN)

**Files:**
- Modify: `README.en.md` (réécriture complète, traduction EN synchronisée)

- [ ] **Step 1 : Remplacer entièrement README.en.md avec le contenu suivant**

````markdown
# 𝄢 Jazz Grid Generator

> A web-based jazz chord chart editor — AI assistant, music theory, bass fretboard diagrams, MusicXML import/export, optimized PDF output.

![Version](https://img.shields.io/badge/version-4.3-f0a500?style=flat-square)
![License](https://img.shields.io/badge/license-Apache%202.0-86efac?style=flat-square)
![HTML](https://img.shields.io/badge/built%20with-HTML%2FJS-c4b5fd?style=flat-square)
![Languages](https://img.shields.io/badge/languages-FR%20%7C%20ES%20%7C%20IT%20%7C%20EN-7dd3fc?style=flat-square)
![No dependencies](https://img.shields.io/badge/dependencies-none-fca5a5?style=flat-square)

**🌐 Live demo** : https://www.virgos.fr/JazzGridGenerator/

![App preview](Screenshots/capt1.png)

Build jazz chord charts from scratch or by importing MusicXML files (iReal Pro®, MuseScore®…). Edit, transpose, annotate, then export to PDF — ready to use on your tablet at gigs or jam sessions.

---

## ✨ Features

- 🤖 **Conversational AI assistant** — bottom panel, driven by natural language: creates, edits and deletes sections, measures, chords and annotations; transposes the entire chart; preview before applying with Apply / Cancel buttons
- 📂 **MusicXML import** — drag & drop or file picker; parses chords, sections, repeat barlines, key signature, tempo (iReal Pro®, MuseScore®, Sibelius, Finale…)
- 📦 **MXL import/export** — compressed MusicXML format
- ✏️ **Full chord editing** — 17 roots, 24 qualities, slash bass, free-form input, per-chord duration
- 🔄 **Alternate chord** — tritone substitution with automatic suggestion
- 🎼 **Music theory annotations** per chord: compatible modes, 4-note arpeggios with inversions, available tensions, avoid notes, free text notes
- 🎸 **4- and 5-string bass fretboard diagrams** — 🎸 4/5 toggle in toolbar; 17 modes in 5-string (BEADG); automatic transposition per chord root; 🔴 root · 🟡 arpeggio · 🔵 other degrees
- 🎵 **Transposition** — by semitone (±) or direct key selection, with enharmonic awareness
- 🗂️ **Section management** — labels (A–I, Intro, Verse, Chorus, Bridge, Coda…), numeric suffixes, duplicate, reorder, annotate; unique ID `#xxxx` in section header
- 🔀 **Drag & drop** — sections and measures moveable with mouse or touch
- 🎵 **Measure symbols** — `%`, `𝄎`, `N.C.`, `/`, `(w)` bass only
- 🔢 **Enhanced barlines** — normal, double, final, repeat start/end; MusicXML export/import
- 🎼 **Voltas and navigation symbols** — 1st/2nd/3rd endings, Segno, Coda, D.C., D.S., Fine
- ↩️ **Undo / Redo** — 10 levels, Ctrl+Z / Ctrl+Y shortcuts, full coverage of all actions
- 📱 **Tablet touch support** — finger drag & drop, pinch-to-zoom, enlarged touch targets
- 🖨️ **Advanced print/PDF** — light/dark theme, adjustable contrast, per-section colors, automatic font scaling on multi-chord measures
- 💾 **Save work in progress (JSON)** — exact restore of chords, annotations and sections
- 🎼 **MusicXML export** — compatible with MuseScore®, Sibelius, Finale, iReal Pro®
- 🌐 **4 languages** — French 🇫🇷, Spanish 🇪🇸, Italian 🇮🇹, English 🇬🇧
- ⚡ **Zero dependencies** — works offline, no build step

---

## 🤖 AI Assistant

The AI panel opens via the **✦ AI** tab at the bottom right of the page.

### Configuration

Click **⚙** in the panel header:

| Setting | Values |
|---------|--------|
| Provider | Claude (Anthropic) · OpenAI® |
| Claude model | `claude-sonnet-4-6`, `claude-opus-4-7` |
| OpenAI® model | `gpt-4o`, `gpt-4o-mini` |
| API key | Entered in the app, stored locally, never sent anywhere else |

<details>
<summary>Available tools</summary>

| Category | Tools |
|----------|-------|
| Chart | `set_chart_metadata`, `transpose_chart`, `set_columns`, `set_bass_strings` |
| Sections | `add_section`, `duplicate_section`, `rename_section`, `remove_section` |
| Measures | `add_bar`, `duplicate_bar`, `remove_bar`, `set_barline` |
| Chords | `add_chord`, `edit_chord`, `remove_chord`, `set_chord_alt` |
| Annotations | `set_annotation` (with `showSvg`), `toggle_all_diagrams` |

</details>

### Workflow

1. Type a natural-language instruction
2. The AI summarizes what it will do, then calls the necessary tools
3. A preview lists the changes (*"Section B added"*, *"Dm7 → D7 bar 3"*…)
4. **Apply** → changes applied, undo snapshot pushed
5. **Cancel** → nothing changes

---

## 🚀 Getting Started

**Online** — open https://www.virgos.fr/JazzGridGenerator/ directly.

**Local** — clone the repo and open `index.html` in a browser. No build, no dependencies, no server required.

**Static host** — drop the files on any static hosting service (Netlify, Vercel, Cloudflare Pages, Apache, Nginx…).

<details>
<summary>Project architecture</summary>

```
index.html
css/
├── app.css          ← UI styles, toolbar, 4/5-string toggle, AI panel
├── modals.css       ← modal styles
└── print.css        ← print styles, multi-chord font scaling
js/
├── i18n.js          ← translation dictionary (FR/ES/IT/EN)
├── diagrams.js      ← 4 and 5-string SVGs, diagram transposition
├── theory.js        ← music theory engine (scales, arpeggios, tensions)
├── state.js         ← global state shared across modules
├── render.js        ← DOM rendering
├── modals.js        ← chord and annotation dialogs
├── actions.js       ← chart mutations, auto-annotation on import
├── print.js         ← print theming and per-section color system
├── touch.js         ← touch support (Touch Events, pinch-to-zoom)
├── ai.js            ← AI assistant (providers, tools, draft, chat, settings)
└── init.js          ← initialization, session restore
doc/
└── doc.html         ← full documentation
```

</details>

---

## 🎸 Bass Diagrams

<details>
<summary>Modes with 5-string diagrams (17/17)</summary>

| Mode | Key in `diagrams.js` | Mode | Key in `diagrams.js` |
|------|---------------------|------|---------------------|
| Ionian | `Ionien_5` | Lydian b7 | `LydienB7_5` |
| Dorian | `Dorien_5` | Altered | `Altere_5` |
| Phrygian | `Phrygien_5` | Melodic minor | `MelodieMineure_5` |
| Lydian | `Lydien_5` | Harmonic minor | `MinHarmonique_5` |
| Mixolydian | `Mixolydien_5` | Mixolydian b9b13 | `MixolydienB9B13_5` |
| Aeolian | `Aeolien_5` | Lydian augmented | `LydienAugmente_5` |
| Locrian | `Locrien_5` | Locrian #2 | `LocrienDiese2_5` |
| Half-whole dim. | `DimDemiTon_5` | Whole-half dim. | `DimTonDemi_5` |
| Whole tone | `TonsEntiers_5` | | |

</details>

---

## ↩️ Undo / Redo

<details>
<summary>Full coverage</summary>

| Action | Covered |
|--------|---------|
| Add / delete / duplicate chord | ✅ |
| Annotation edit | ✅ |
| Add / delete / duplicate measure | ✅ |
| Add / delete section | ✅ |
| Drag & drop section or measure | ✅ |
| Barline change | ✅ |
| Volta (1st / 2nd / 3rd ending) | ✅ |
| Navigation symbol | ✅ |
| Alternate chord | ✅ |
| Apply AI draft | ✅ |

Depth: **10 levels**.

</details>

---

## 🎼 Music Theory

<details>
<summary>Suggested modes per chord quality</summary>

| Quality | Suggested modes |
|---------|----------------|
| `maj7` | Ionian, Lydian, Lydian augmented |
| `7` | Mixolydian, Lydian b7, Altered, Mixolydian b9b13 |
| `m7` | Dorian, Aeolian, Phrygian, Harmonic minor |
| `m7b5` | Locrian, Locrian #2 |
| `dim7` | Whole-half diminished, Half-whole diminished |
| `mM7` | Melodic minor, Lydian augmented, Harmonic minor |
| `aug` | Whole tone |

</details>

---

## 📱 Tablet Support

<details>
<summary>Technical details</summary>

- **Touch drag & drop** — Touch Events on sections and measures
- **Pinch-to-zoom** — pinch the chart grid to zoom (0.5× to 2×)
- **Enlarged targets** — `@media (pointer: coarse)` increases barline, nav, and chord button sizes
- **MutationObserver** — elements added after a render are automatically patched for touch

</details>

---

## 🖨️ Print / PDF

<details>
<summary>Fine-tuning options</summary>

**Multi-chord measures**

| Number of chords | Chord symbol | Theory area | Max height |
|-----------------|-------------|-------------|------------|
| 2 chords | 0.72rem | 0.52rem | 2.6em |
| 3+ chords | 0.62rem | 0.44rem | 2.2em |

**Popup menus** — barline, volta and navigation menus automatically reposition to stay within the screen.

</details>

---

## 📋 Changelog

### v4.3 (May 2026)
- ✅ Unique section IDs (`#xxxx`), persisted in JSON, hidden when printing; automatic migration for legacy files
- ✅ New AI tool `toggle_all_diagrams`
- ✅ `set_annotation` exposes `showSvg` to control diagram visibility per chord
- ✅ Fix: MXL export/import restored; metadata fields readable when printing

### v4.2 (May 2026)
- ✅ Markdown rendering in AI responses — paragraphs, lists, **bold**, *italic*, `code`

### v4.0 (May 2026)
- ✅ Conversational AI assistant — Claude and OpenAI®
- ✅ 15 AI tools: sections, measures, chords, annotations, metadata, transposition
- ✅ Draft-preview-apply workflow with change list and integrated undo
- ✅ AI panel as full-width bottom bar, slide-up animation

→ [Full changelog](CHANGELOG.md)

---

## 📋 Roadmap

- [ ] MIDI playback of root notes
- [ ] Custom color picker per section
- [ ] Import iReal Pro® `.irealbook`

---

## 📄 License

Apache 2.0 — *𝄢 Made with love for musicians, by a bass player.*
````

- [ ] **Step 2 : Vérifier l'absence de contenu interdit**

```bash
grep -n "Split/\|standalone\|monolith\|Option 1\|Option 2\|4\.2-f0a500" README.en.md
```

Expected : aucune sortie.

- [ ] **Step 3 : Vérifier la présence des symboles ®**

```bash
grep -c "®" README.en.md
```

Expected : `≥ 8`.

- [ ] **Step 4 : Commit**

```bash
git add README.en.md
git commit -m "docs: réécrire README.en.md v4.3 — structure musician+developer, collapsible details"
```

---

## Task 5 : Vérification finale

- [ ] **Step 1 : Vérifier qu'il ne reste aucune trace de Split/ dans le repo**

```bash
grep -r "Split/" --include="*.md" --include="*.html" . | grep -v "OLD/" | grep -v "docs/superpowers/"
```

Expected : aucune sortie.

- [ ] **Step 2 : Vérifier les badges version dans les deux README**

```bash
grep "version-4\." README.md README.en.md
```

Expected : deux lignes contenant `version-4.3`.

- [ ] **Step 3 : Vérifier que CHANGELOG.md est bien à la racine**

```bash
ls -la CHANGELOG.md
```

Expected : fichier présent.

- [ ] **Step 4 : Vérifier les liens CHANGELOG.md dans les deux README**

```bash
grep "CHANGELOG.md" README.md README.en.md
```

Expected : deux lignes, une par fichier.

# 𝄢 Jazz Grid Generator

> A web-based jazz chord chart editor with music theory annotations, MusicXML import/export, transposition, 4- and 5-string bass fretboard diagrams, and PDF export.

![Version](https://img.shields.io/badge/version-3.0-f0a500?style=flat-square)
![License](https://img.shields.io/badge/license-Apache%202.0-86efac?style=flat-square)
![HTML](https://img.shields.io/badge/built%20with-HTML%2FJS-c4b5fd?style=flat-square)
![Languages](https://img.shields.io/badge/languages-FR%20%7C%20ES%20%7C%20IT%20%7C%20EN-7dd3fc?style=flat-square)
![No dependencies](https://img.shields.io/badge/dependencies-none-fca5a5?style=flat-square)

**Live at** : https://www.virgos.fr/JazzGridGenerator/

---

Cette application permet de créer des grilles à partir d'un document vierge. L'import de fichiers au format MusicXML issus de iReal Pro, Musescore ou tout autre logiciel supportant ce format est fonctionnel. Les grilles une fois importées sont modifiables. L'impression au format PDF de la grille finalisée peut être par exemple uploadée dans une application de type SongBook Pro et utilisée sur tablette lors de jam sessions ou de concerts.

---

## ✨ Features

- 📂 **MusicXML import** — drag & drop or file picker, parses chords, sections, repeat barlines, key signature, tempo
- ✏️ **Full chord editing** — 17 roots, 24 qualities, slash bass, free-form input, per-chord beat duration
- 🎼 **Music theory annotations** per chord:
  - Compatible modes (Ionian, Dorian, Mixolydian, Altered, etc.)
  - 4-note arpeggios with all inversions
  - Available tensions & avoid notes
  - Free text notes with color and bold/italic styling
- 🎸 **4- and 5-string bass fretboard diagrams**:
  - **🎸 4 / 5 toggle** in the toolbar, choice persisted in `localStorage`
  - **17 modes available in 5-string version** (BEADG tuning)
  - Automatic diagram transposition based on chord root
  - Colors: 🔴 root · 🟡 arpeggio notes · 🔵 other scale degrees
- 🎵 **Transposition** — by semitone (±) or direct key selection, with enharmonic awareness
- 🗂️ **Section management** — labels (A–I, Intro, Verse, Chorus, Bridge, Coda…), duplicate, reorder, annotate
- 🖨️ **Advanced print/PDF**:
  - Light ☀️ / dark 🌙 theme, adjustable contrast (5 levels)
  - Automatic per-section color coding
  - Automatic font scaling on multi-chord measures (max 2 lines, no truncation)
- 💾 **JSON save/load** — full fidelity including all annotations
- 🎼 **MusicXML export** — compatible with MuseScore, Sibelius, Finale, iReal Pro
- 🌐 **4 languages** — French 🇫🇷, Spanish 🇪🇸, Italian 🇮🇹, English 🇬🇧
- 📱 **Zero dependencies** — single HTML file, works offline, no build step

---

## 🚀 Quick Start

### Option 1 — Directly in the browser

Open `Jazz_grid_generator.html` in any modern browser. No server required.

### Option 2 — Split version (development)

```
split/
├── index.html
├── css/
│   ├── app.css          ← UI styles + 4/5-string toggle button
│   ├── modals.css       ← modal styles
│   └── print.css        ← print styles, multi-chord font scaling
└── js/
    ├── i18n.js          ← translation dictionary (FR/ES/IT/EN)
    ├── diagrams.js      ← 4 and 5-string SVGs, transposeModesvg(), getModesvg()
    ├── theory.js        ← music engine (scales, arpeggios, tensions)
    ├── state.js         ← global state, window.bassStrings, setBassStrings()
    ├── render.js        ← DOM rendering
    ├── modals.js        ← chord and annotation dialogs
    ├── actions.js       ← chart mutations, auto-annotation on import
    ├── print.js         ← print theming and section color system
    └── init.js          ← initialization, localStorage bassStrings restore
```

### Option 3 — Any static host

Upload the files to any static hosting service (Apache, Nginx, Netlify, Vercel, Cloudflare Pages…). No configuration needed.

---

## 🎸 4 / 5-String Toggle

The **🎸 4 / 5** button in the toolbar switches between **4-string (GDAE)** and **5-string (BEADG)** fretboard diagrams.

- The choice is **persisted in `localStorage`** and automatically restored on page reload
- `window.bassStrings` (value `4` or `5`) is shared across all JS modules
- If a mode has no 5-string diagram, the 4-string diagram is used as fallback

### Modes with 5-string diagrams (17 / 17)

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

### Automatic diagram transposition

The `transposeModesvg()` function in `diagrams.js` replaces scale degree labels with actual note names based on the chord root. It supports all altered degrees: `b2`, `b3`, `#4`, `b5`, `b6`, `b7`, `7`, etc.

---

## 🖨️ Print / PDF — Multi-chord measures

Measures containing multiple chords benefit from automatic font size reduction (CSS `:has()`) to prevent truncation and maintain readability on a maximum of 2 lines:

| Number of chords | Chord symbol | Theory area | Max height |
|-----------------|-------------|-------------|------------|
| 2 chords | 0.72rem | 0.52rem | 2.6em (≈ 2 lines) |
| 3+ chords | 0.62rem | 0.44rem | 2.2em (≈ 2 lines) |

---

## 🎼 Music Theory Engine

### Supported chord qualities (24)

| Symbol | Quality | Symbol | Quality |
|--------|---------|--------|---------|
| `maj7` / `Δ7` | Major seventh | `sus2` | Suspended 2nd |
| `7` | Dominant seventh | `sus4` / `7sus4` | Suspended 4th |
| `m7` | Minor seventh | `6` | Sixth |
| `mM7` | Minor-major seventh | `6/9` | Six-nine |
| `dim` / `°` | Diminished triad | `9` | Dominant ninth |
| `dim7` / `°7` | Diminished seventh | `11` | Eleventh |
| `m7b5` / `ø7` | Half-diminished | `13` | Thirteenth |
| `aug` | Augmented | `maj9`, `maj13` | Extended major |
| — | — | `m9`, `m11`, `m13` | Extended minor |

### Suggested modes per chord quality

| Quality | Suggested modes |
|---------|----------------|
| `maj7` | Ionian, Lydian, Lydian augmented |
| `7` | Mixolydian, Lydian b7, Altered, Mixolydian b9b13 |
| `m7` | Dorian, Aeolian, Phrygian, Harmonic minor |
| `m7b5` | Locrian, Locrian #2 |
| `dim7` | Whole-half diminished, Half-whole diminished |
| `mM7` | Melodic minor, Lydian augmented, Harmonic minor |
| `aug` | Whole tone |

---

## 🎵 Usage

### Creating a chart

1. Click **✨ New** — a blank 8-measure chart in C major opens
2. Edit the **title**, **key**, **tempo**, **time signature** and **style** in the header
3. Click any chord to edit it, or click **+** inside a measure to add a chord
4. Click the **✏️** icon on a chord to add theory annotations

### Importing a MusicXML file

Drag & drop a `.musicxml` or `.xml` file onto the drop zone, or click **📂 Open MusicXML**.

On import, annotations are generated automatically:
- 1 chord per measure → mode with SVG fretboard diagram
- 2+ chords per measure → mode as text + tensions + arpeggio

### Transposing

| Control | Description |
|---------|-------------|
| **− / +** buttons | Transpose ±1 semitone |
| Key dropdown | Transpose directly to a target key |
| **↺** reset | Restore the original key |

Enharmonic spellings are automatically chosen based on the target key (e.g. F# in a flat key → G♭).

---

## 📋 Changelog

### v3.0 (April 2026)
- ✅ 5-string fretboard diagrams (BEADG) for all 17 modes
- ✅ 🎸 4/5-string toggle in toolbar, persisted in `localStorage`
- ✅ Fixed `transposeModesvg()` — support for altered degrees (`b2`, `#4`, `b6`, `b7`…)
- ✅ Automatic font scaling in PDF for multi-chord measures (CSS `:has()`)
- ✅ Auto-annotation on MusicXML import

### v2.0
- Music theory annotations per chord
- MusicXML import with section detection, repeat barlines, tempo
- MusicXML and MXL export
- 4 languages (FR, ES, IT, EN)
- Split multi-file JS/CSS architecture

### v1.0
- Basic chord chart editor
- Chromatic transposition
- JSON import/export
- Light/dark PDF print theme

---

## 🛠️ Customization

### Adding a 5-string fretboard diagram

1. Create the SVG (width=510, height=270, 5 frets, strings GDAEB from top)
2. Add it to `MODE_SVGS` in `diagrams.js` with the key `ModeName_5`
3. `getModesvg()` will automatically select it when `window.bassStrings === 5`

### Adding a chord quality

Add an entry to:
- `QUALITIES` array (chord modal buttons)
- `ARP_DEF` object (arpeggio definition)
- `MODES_DEF` object (compatible modes)
- `TENS_DEF` object (available tensions)

---

## 📄 License

Apache 2.0 — *Made with 🎸 for jazz bass players.*

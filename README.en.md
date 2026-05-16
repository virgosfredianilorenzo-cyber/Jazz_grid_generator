# 𝄢 Jazz Grid Generator

> A web-based jazz chord chart editor with a conversational AI assistant, music theory annotations, 4- and 5-string bass fretboard diagrams, MusicXML import/export, and optimized PDF output.

![Version](https://img.shields.io/badge/version-4.2-f0a500?style=flat-square)
![License](https://img.shields.io/badge/license-Apache%202.0-86efac?style=flat-square)
![HTML](https://img.shields.io/badge/built%20with-HTML%2FJS-c4b5fd?style=flat-square)
![Languages](https://img.shields.io/badge/languages-FR%20%7C%20ES%20%7C%20IT%20%7C%20EN-7dd3fc?style=flat-square)
![No dependencies](https://img.shields.io/badge/dependencies-none-fca5a5?style=flat-square)

**Live at** : https://www.virgos.fr/JazzGridGenerator/

---

This application lets you build chord charts from scratch or by importing MusicXML files exported from iReal Pro, MuseScore, or any other software that supports the format. Imported charts are fully editable. The finished chart can be printed to PDF and uploaded to an app such as SongBook Pro, ready to use on a tablet during jam sessions or live performances.

---

## ✨ Features

- 🤖 **Conversational AI assistant** — bottom panel, driven by natural language:
  - Creates, edits, and deletes sections, measures, chords, and annotations
  - Duplicates sections and measures with full content copy
  - Edits metadata (title, key, tempo, style)
  - Transposes the entire chart
  - Preview before applying: list of changes, Apply / Cancel buttons
  - Compatible with **Claude** (claude-sonnet-4-6, claude-opus-4-7) and **OpenAI** (gpt-4o, gpt-4o-mini)
  - API key entered in the app, stored in `localStorage`, never sent anywhere else
  - Responds in the active language of the application
- 📂 **MusicXML import** — drag & drop or file picker, parses chords, sections, repeat barlines, key signature, tempo
- 📦 **MXL import/export** — compressed MusicXML format (JSZip)
- ✏️ **Full chord editing** — 17 roots, 24 qualities, slash bass, free-form input, per-chord beat duration
- 🔄 **Alternate chord** — tritone substitution, automatic suggestion, MusicXML export/import
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
- 🗂️ **Section management** — labels (A–I, Intro, Verse, Chorus, Bridge, Coda…), numeric suffixes (0–9), duplicate, reorder via drag & drop, annotate ; **unique ID `#xxxx`** shown in the section header (persisted in JSON, hidden when printing)
- 🔀 **Drag & drop** — reorder sections and measures with mouse or touch (tablet)
- 🎵 **Measure symbols** — `%` (repeat), `𝄎` (double repeat), `N.C.` (no chord), `/` (slash), `(w)` (bass only, no written harmony)
- 🔢 **Enhanced barlines** — normal, double, final, repeat start/end, MusicXML export/import
- 🎼 **Voltas and navigation symbols** — 1st / 2nd / 3rd endings, Segno, Coda, D.C., D.S., Fine, MusicXML export/import
- ↩️ **Undo / Redo**:
  - 10-level JSON snapshot history
  - Ctrl+Z / Ctrl+Y shortcuts (⌘Z / ⌘Y on Mac)
  - ↩ ↪ buttons in the toolbar
  - Full coverage: chords, annotations, sections, measures, barlines, voltas, navigation, alternate chord, drag & drop
- 📱 **Tablet touch support**:
  - Touch Events drag & drop for sections and measures
  - MutationObserver to dynamically patch post-render elements
  - Pinch-to-zoom on the chart grid
  - Enlarged touch targets via `@media (pointer: coarse)`
- 🖨️ **Advanced print/PDF**:
  - Light ☀️ / dark 🌙 theme, adjustable contrast (5 levels)
  - Automatic per-section color coding
  - Automatic font scaling on multi-chord measures (max 2 lines, no truncation)
  - Popup menus (barlines, navigation) smart-positioned to stay within the screen
- 💾 **JSON save/load** — full fidelity including all annotations
- 🎼 **MusicXML export** — compatible with MuseScore, Sibelius, Finale, iReal Pro
- 🌐 **4 languages** — French 🇫🇷, Spanish 🇪🇸, Italian 🇮🇹, English 🇬🇧
- 📱 **Zero dependencies** — works offline, no build step

---

## 🚀 Quick Start

### Option 1 — Development version

```
Split/
├── index.html
├── css/
│   ├── app.css          ← UI styles + 4/5-string toggle + undo/redo + AI panel
│   ├── modals.css       ← modal styles
│   └── print.css        ← print styles, multi-chord font scaling
└── js/
    ├── i18n.js          ← translation dictionary (FR/ES/IT/EN)
    ├── diagrams.js      ← 4 and 5-string SVGs, transposeModesvg(), getModesvg()
    ├── theory.js        ← music theory engine (scales, arpeggios, tensions)
    ├── state.js         ← global state, window.bassStrings, setBassStrings()
    ├── render.js        ← DOM rendering
    ├── modals.js        ← chord and annotation dialogs
    ├── actions.js       ← chart mutations, auto-annotation on import
    ├── print.js         ← print theming and section color system
    ├── init.js          ← initialization, localStorage restore
    └── ai.js            ← AI assistant (providers, tools, draft, chat, settings)
```

### Option 2 — Any static host

Upload the files to any static hosting service (Apache, Nginx, Netlify, Vercel, Cloudflare Pages…). No configuration needed.

---

## 🤖 AI Assistant

The AI panel opens via the **✦ AI** tab at the bottom right of the page. It slides up across the full width of the screen.

### Configuration

Click **⚙** in the panel header:

| Setting | Values |
|---------|--------|
| Provider | Claude (Anthropic) · OpenAI |
| Claude model | `claude-sonnet-4-6`, `claude-opus-4-7` |
| OpenAI model | `gpt-4o`, `gpt-4o-mini` |
| API key | Entered in the app, stored in `localStorage` |

### Available tools

| Category | Tools |
|----------|-------|
| Chart | `set_chart_metadata`, `transpose_chart`, `set_columns`, `set_bass_strings` |
| Sections | `add_section`, `duplicate_section`, `rename_section`, `remove_section` |
| Measures | `add_bar`, `duplicate_bar`, `remove_bar`, `set_barline` |
| Chords | `add_chord`, `edit_chord`, `remove_chord`, `set_chord_alt` |
| Annotations | `set_annotation` (with `showSvg`), `toggle_all_diagrams` |

### Workflow

1. The user types a natural-language instruction
2. The AI summarizes what it is about to do, then calls the necessary tools
3. A preview lists the changes (e.g. *"Section B added"*, *"Dm7 → D7 bar 3"*)
4. **Apply** → `chartData` updated, undo snapshot pushed, re-render
5. **Cancel** → draft discarded, nothing changes

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

---

## ↩️ Undo / Redo

The history covers **all chart mutations**:

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

History depth: **10 levels**. When the limit is reached, the oldest snapshot is discarded.

---

## 📱 Tablet Support

- **Touch drag & drop** — sections and measures can be dragged with a finger
- **Pinch-to-zoom** — pinch the chart grid to zoom in/out (0.5× to 2×)
- **Enlarged targets** — `@media (pointer: coarse)` increases the size of barline, nav, and chord buttons
- **MutationObserver** — elements added dynamically after a render are automatically patched for touch support

---

## 🖨️ Print / PDF

### Multi-chord measures

| Number of chords | Chord symbol | Theory area | Max height |
|-----------------|-------------|-------------|------------|
| 2 chords | 0.72rem | 0.52rem | 2.6em (≈ 2 lines) |
| 3+ chords | 0.62rem | 0.44rem | 2.2em (≈ 2 lines) |

### Popup menus

Barline, volta, and navigation symbol popup menus automatically reposition to stay within the screen, even when triggered from the right edge or bottom of the page.

---

## 🎼 Music Theory Engine

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

## 📋 Changelog

### v4.3 (May 2026)
- ✅ **Unique section IDs** — `#xxxx` badge in section header, persisted in JSON, hidden when printing; automatic migration on import for legacy files
- ✅ **`toggle_all_diagrams`** — new AI tool to hide/show all bass diagrams in one call (reliable even with OpenAI)
- ✅ **`set_annotation`** now exposes `showSvg` to control diagram visibility per chord
- ✅ Fix: JSZip script tag restored (MXL export/import working again)
- ✅ Fix print: key/tempo/time signature/style fields now readable (white background, black text)

### v4.2 (May 2026)
- ✅ Markdown rendering in AI responses — paragraphs, lists, **bold**, *italic*, `code`

### v4.0 (May 2026)
- ✅ **Conversational AI assistant** — Claude (Sonnet / Opus) and OpenAI (GPT-4o)
- ✅ 15 AI tools: sections, measures, chords, annotations, metadata, transposition
- ✅ `duplicate_section` and `duplicate_bar` — full content copy (chords, annotations)
- ✅ Draft-preview-apply workflow with change list and integrated undo
- ✅ AI panel as full-width bottom bar, slide-up animation

### v3.0 (April 2026)
- ✅ 5-string fretboard diagrams (BEADG) for all 17 modes
- ✅ 🎸 4/5-string toggle in toolbar, persisted in `localStorage`
- ✅ Fixed `transposeModesvg()` — support for altered degrees (`b2`, `#4`, `b6`, `b7`…)
- ✅ Automatic font scaling in PDF for multi-chord measures
- ✅ Auto-annotation on MusicXML import
- ✅ Popup menus (barlines, navigation) smart-positioned to stay within the screen

### v2.0
- ✅ Undo / Redo history (10 levels, Ctrl+Z/Y, toolbar buttons)
- ✅ Tablet touch support — drag & drop Touch Events, pinch-to-zoom, MutationObserver
- ✅ `(w)` bass-only symbol
- ✅ Alternate chord (tritone substitution)
- ✅ Enhanced barlines, Voltas, Navigation symbols
- ✅ iReal Pro symbols (`%`, `𝄎`, `N.C.`, `/`)
- ✅ Drag & drop sections and measures
- ✅ MXL import/export (JSZip)
- ✅ 4 languages (FR, ES, IT, EN)

### v1.0
- ✅ Basic chord chart editor
- ✅ Music theory annotations
- ✅ MusicXML import
- ✅ Chromatic transposition
- ✅ JSON import/export
- ✅ Light/dark PDF print theme

---

## 📋 Roadmap

- [ ] MIDI playback of root notes
- [ ] Custom color picker per section
- [ ] iReal Pro `.irealbook` import

---

## 📄 License

Apache 2.0 — *𝄢 Made with love for musicians, by a bass player.*

# 𝄢 Jazz Grid Generator

> A web-based jazz chord chart editor — AI assistant, music theory, bass fretboard diagrams, MusicXML import/export, optimized PDF output.

![Version](https://img.shields.io/badge/version-4.4-f0a500?style=flat-square)
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
- ⚡ **No build step** — open `index.html` directly in a browser; the core app works offline (MXL and AI features require a connection)

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

**Local** — clone the repo and open `index.html` in a browser. No build, no server required. MXL and AI features require an internet connection.

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

### v4.4 (May 2026)
- ✅ Browser warns before closing the tab if unsaved changes are present (`_isDirty` flag, `beforeunload` listener)

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

# 𝄢 Jazz Grid Generator

> Online jazz chart editor with music theory annotations, bass fretboard diagrams, MusicXML import/export and optimized PDF output.

![License](https://img.shields.io/badge/license-Apache%202.0-86efac?style=flat-square)
![HTML](https://img.shields.io/badge/built%20with-HTML%2FJS-c4b5fd?style=flat-square)
![Languages](https://img.shields.io/badge/languages-FR%20%7C%20ES%20%7C%20IT%20%7C%20EN-7dd3fc?style=flat-square)
![Dependencies](https://img.shields.io/badge/dependencies-JSZip-fca5a5?style=flat-square)

[![Support on Ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/lorenzovirgosfrediani)

---

## ✨ Features

- 📂 **MusicXML Import** — drag-and-drop or file picker, parses chords, sections, repeat barlines, key, tempo — supports `.musicxml`, `.xml` and `.mxl` (compressed)
- ✏️ **Full chord editing** — 17 roots, 24 qualities, slash bass, free input, per-chord beat duration
- 🎵 **iReal Pro-style measure symbols** :
  - `%` — measure repeat
  - `𝄎` — 2-bar repeat
  - `N.C.` — No Chord
  - `/` — beat slash
- 🎼 **Rich barlines** — single, double `‖`, final `𝄂`, repeat start `|:` and end `:|`, accessible on hover at each measure edge
- 🔂 **Voltas (1st / 2nd / 3rd ending)** — visual bracket above measures
- 🧭 **Navigation symbols** — Segno `𝄋`, Coda `𝄌`, D.C. al Coda, D.S. al Coda, D.C. al Fine, Fine, Fermata `𝄐`
- 🔀 **Alternate chord** — small italic chord displayed above the main chord (tritone sub, anticipation…) with automatic suggestion for dominants
- 🎼 **Music theory annotations** per chord :
  - Compatible modes with dynamic SVG fretboard diagram (21 modes, 4-string EADG and 5-string BEADG bass)
  - 4-note arpeggios with all inversions
  - Available tensions and avoid notes
  - Free annotation with color, bold/italic
- 🎵 **Transposition** — by semitone (±) or direct key selection, automatic enharmonic handling
- 🗂️ **Section management** — labels (A–I, Intro, Verse, Chorus, Bridge, Coda…), drag-and-drop or ▲▼ buttons, duplication, free annotation
- 📐 **Measure reordering** — drag-and-drop including across sections, ◀▶ buttons on hover, duplication
- 🖨️ **Advanced print/PDF** — light/dark theme, adjustable contrast (5 levels), automatic per-section colors, sections never split across pages, SVG diagrams included in PDF
- 💾 **JSON save** — full fidelity including all annotations
- 🎼 **MusicXML / MXL export** — compatible with MuseScore, Sibelius, Finale, iReal Pro
- 🌐 **4 languages** — French 🇫🇷, Spanish 🇪🇸, Italian 🇮🇹, English 🇬🇧
- 📱 **Single structured file** — HTML + CSS + JS, no build step, works offline (JSZip 3.10.1 bundled)

---

## 📸 Screenshots

<div align="center">
  <img src="Screenshots/capt1.png" alt="Editor interface" width="80%">
  <br><em>Main interface — toolbar and MusicXML drop zone</em>
</div>

<br>

<div align="center">
  <img src="Screenshots/capt2.png" alt="Chart with mode diagram" width="80%">
  <br><em>Chart with Dorian mode annotation and bass fretboard diagram</em>
</div>

<br>

<div align="center">
  <img src="Screenshots/capt3.png" alt="PDF output" width="45%">
  <br><em>PDF output — light theme with automatic section colors</em>
</div>

---

## 🚀 Quick Start

### Option 1 — Directly in the browser

Open `index.html` in any modern browser. No server required.

```bash
git clone https://github.com/virgosfredianilorenzo-cyber/Jazz_grid_generator.git
cd Jazz_grid_generator
open index.html   # macOS
# or double-click index.html on Windows/Linux
```

### Option 2 — GitHub Pages

1. Fork this repository
2. Go to **Settings → Pages**
3. Set source to branch `main`, root folder `/`
4. The editor will be available at `https://virgosfredianilorenzo-cyber.github.io/Jazz_grid_generator/`

### Option 3 — Static hosting

Drop `index.html` on any static host (Netlify, Vercel, Cloudflare Pages…). No configuration needed.

---

## 🎵 User Guide

### Creating a chart

1. Click **✨ New** — a blank 8-measure chart in C major opens
2. Fill in **title**, **key**, **tempo**, **time signature** and **style** in the header
3. Click a chord to edit it, or **+** inside a measure to add one
4. In the chord modal, use the **QUICK SYMBOLS** panel (`%`, `𝄎`, `N.C.`, `/`) for special measures
5. Click the **✏️** icon on a chord to add theory annotations (mode, arpeggio, tensions, free note)

### Alternate chord

Hovering a chord reveals a **`♯±`** button at the top left of the slot. Click it to enter an alternate chord (tritone sub, anticipation, passing chord…).

- Displayed as a **small amber italic** above the main chord
- For dominants (e.g. `G7`), the **tritone substitution** is suggested automatically (`Db7`)
- Click the displayed alternate chord to edit or remove it
- Not transposed automatically — retranspose manually if needed

**MusicXML export:** exported as a second `<harmony>` with `print-frame="no"` and `<footnote>alt</footnote>` — compatible with MuseScore and Sibelius.

### Barlines and voltas

Hovering a measure reveals two buttons on the left `◧` and right `◨` edges. Click to choose the barline type:

| Type | Visual | MusicXML export |
|------|--------|-----------------|
| Normal | `\|` | *(default)* |
| Double | `‖` | `light-light` |
| Final | `𝄂` | `light-heavy` |
| Repeat start | `\|:` | `<repeat direction="forward"/>` |
| Repeat end | `:\|` | `<repeat direction="backward"/>` |

The same menu allows adding a **volta bracket** (1st / 2nd / 3rd ending), exported as `<ending>` in MusicXML.

### Navigation symbols

Hovering reveals a `𝄌` button at the top right of each measure. Click to place:

| Symbol | Display | MusicXML export |
|--------|---------|-----------------|
| Segno | `𝄋` | `<segno/>` |
| Coda | `𝄌` | `<coda/>` |
| D.C. al Coda | text | `<words>` + `<sound/>` |
| D.S. al Coda | text | `<words>` + `<sound/>` |
| D.C. al Fine | text | `<words>` + `<sound/>` |
| Fine | text | `<words>Fine</words>` |
| Fermata | `𝄐` | `<fermata/>` |

### Importing MusicXML

Drag-and-drop a `.musicxml`, `.xml` or `.mxl` file onto the drop zone, or click **📂 Open MusicXML**.

Imported data:
- Chord symbols, alternate chords (`<footnote>alt</footnote>`) and durations
- Key, tempo, time signature
- Repeat markers → sections
- Repeat barlines, double barlines, final barlines
- Voltas (`<ending>`)
- Navigation symbols (Segno, Coda, D.C., D.S., Fine, Fermata)

### Moving sections and measures

Each section and measure has a **⠿** handle at the top left. Grab it and drag to reposition — an orange highlight shows the insertion point. Measures can be moved **across sections**.

For precise one-step movement, use the **▲ ▼** (sections) or **◀ ▶** (measures) buttons that appear on hover.

### Save and export

| Action | Format | Notes |
|--------|--------|-------|
| **💾 Export JSON** | `.json` | Full fidelity — chords, alternate chords, annotations, barlines, navigation |
| **📥 Import JSON** | `.json` | Reload a previously saved session |
| **🎼 Export MusicXML** | `.musicxml` | Share with MuseScore, Sibelius, Finale, etc. |
| **🎼 Export MXL** | `.mxl` | Compressed format, ideal for file exchange |

> **Tip:** Always use JSON to save your work. MusicXML export does not preserve music theory annotations.

### Transposition

| Control | Description |
|---------|-------------|
| **− / +** buttons | Transpose ±1 semitone |
| Dropdown | Transpose directly to a target key |
| **↺** button | Restore the original key |

Enharmonics are chosen automatically based on the target key (e.g. F# in B♭ is written B♭, not A#). Alternate chords are not transposed automatically.

### Print / PDF

1. Click **🖨️ Print** to open the print panel
2. Choose the **theme** (light ☀️ / dark 🌙)
3. Adjust **contrast** (1–5) — controls border thickness and chord symbol size
4. Check **section colors** — each section label gets a distinct color automatically
5. Click **Print** → use **Save as PDF** in the browser dialog

> Sections are never split across pages (`break-inside: avoid`). Rich barlines, voltas, navigation symbols and alternate chords print in black/grey.

---

## 🎼 Music Theory Engine

### Supported chord qualities (24)

| Symbol | Quality |
|--------|---------|
| *(empty)* | Major chord |
| `maj7` / `Δ7` | Major seventh |
| `7` | Dominant seventh |
| `m` | Minor chord |
| `m7` | Minor seventh |
| `mM7` | Minor-major seventh |
| `dim` / `°` | Diminished |
| `dim7` / `°7` | Diminished seventh |
| `m7b5` / `ø7` | Half-diminished |
| `aug` | Augmented |
| `sus2`, `sus4`, `7sus4` | Suspended chords |
| `6`, `6/9` | Sixth chords |
| `9`, `11`, `13` | Extended dominants |
| `maj9`, `maj13` | Extended majors |
| `m9`, `m11`, `m13` | Extended minors |

### Modes by chord quality

| Quality | Compatible modes |
|---------|-----------------|
| `maj7` | Ionian, Lydian, Lydian augmented |
| `7` | Mixolydian, Lydian b7, Altered, Mixolydian b9b13 |
| `m7` | Dorian, Aeolian, Phrygian, Harmonic minor |
| `m7b5` | Locrian, Locrian #2 |
| `dim7` | Diminished whole-half, Diminished half-whole |
| `mM7` | Melodic minor, Lydian augmented, Harmonic minor |
| `aug` | Whole tone |

### Fretboard diagrams (4-string and 5-string bass)

21 SVG diagrams, available in **4-string EADG** and **5-string BEADG**, dynamically transposed to the chord root. Color code:

| Color | Meaning |
|-------|---------|
| 🔴 Red | Root |
| 🟠 Amber | Arpeggio notes |
| 🔵 Blue | Other scale degrees |

Full mode list with diagram availability:

| Mode | 4-string | 5-string | Main quality |
|------|----------|----------|--------------|
| Ionian | ✅ | — | `maj7` |
| Dorian | ✅ | — | `m7` |
| Phrygian | ✅ | — | `m7` |
| Lydian | ✅ | — | `maj7` |
| Mixolydian | ✅ | — | `7` |
| Aeolian | ✅ | — | `m7` |
| Locrian | ✅ | — | `m7b5` |
| Lydian b7 | ✅ | — | `7` |
| Altered | ✅ | — | `7` |
| Melodic minor | ✅ | — | `mM7` |
| Dim. whole-half | ✅ | — | `dim7` |
| Dim. half-whole | ✅ | — | `dim7` |
| Mixolydian b9b13 | ✅ | ✅ | `7` |
| Locrian #2 | ✅ | ✅ | `m7b5` |
| Whole tone | ✅ | ✅ | `aug` |
| Harmonic minor | ✅ | ✅ | `mM7`, `m7` |
| Lydian augmented | ✅ | ✅ | `maj7`, `mM7` |

---

## 🗂️ Project Structure

```
Jazz_grid_generator/
│
├── index.html          # Complete application (HTML + CSS + JS, single file)
│
├── README.md           # This file
├── LICENSE             # Apache 2.0 license
│
└── Screenshots/        # Screenshots
    ├── capt1.png       # Main interface
    ├── capt2.png       # Chart with mode diagram
    └── capt3.png       # PDF output
```

The file is organized in **blocks delimited by visual separators** `/* ━━━ */`. Search `/* ━━━ JS — NAME` to navigate directly to a section.

| Line | Block | Content |
|------|-------|---------|
| L10 | `CSS — APP` | Toolbar, layout, sections, measures, barlines, alternate chords |
| L208 | `CSS — MODALS` | Overlay, chord / annotation / section modals |
| L292 | `CSS — PRINT` | @media print: themes, colors, page-break |
| L348 | `HTML — STRUCTURE` | Toolbar, dropzone, editor, modals, print bar |
| L530 | `JS — I18N` | FR/ES/IT/EN dictionaries + `setLang()` |
| L672 | `JS — SVG DIAGRAMS` | Mode fretboard diagrams (4-string and 5-string bass) |
| L760 | `JS — THEORY ENGINE` | Scales, arpeggios, tensions, chromatic helpers |
| L780 | `JS — PARSER` | MusicXML import → `chartData` |
| L867 | `JS — STATE` | Global variables + barline/navigation constants |
| L893 | `JS — TRANSPOSE` | Semitone / key transposition |
| L906 | `JS — RENDER` | DOM rendering: sections, measures, chords, symbols |
| L1078 | `JS — MODALS` | Chord/annotation/section modals + barline/nav/altChord popups |
| L1299 | `JS — ACTIONS` | add / delete / duplicate / move |
| L1313 | `JS — I/O` | JSON + MusicXML + MXL import/export |
| L1329 | `JS — MUSICXML HELPERS` | MusicXML export utility functions |
| L1563 | `JS — PRINT` | Print themes, palettes, dynamic CSS |
| L1583 | `JS — INIT` | Global event listeners, first render |

> Line numbers are indicative and shift with each release.

---

## 🌐 Internationalization

The interface is fully translated into **4 languages**. Language switching is instant, no page reload.

To add a new language, add an entry to the `LANGS` object (`JS — I18N` section) and an `<option>` to the `#lang-select` dropdown.

---

## 🛠️ Customization

### Changing the default chart

Edit the `newChart()` function (`JS — ACTIONS` section) to change the default key, number of measures, or initial chord.

### Adding a chord quality

Add an entry to:
- The `QUALITIES` array (chord modal buttons)
- The `ARP_DEF` object (arpeggio definition)
- The `MODES_DEF` object (compatible modes)
- The `TENS_DEF` object (available tensions)

### Adding a mode with diagram

1. Add the mode to `MODES_DEF` (`JS — THEORY ENGINE` section)
2. Create the SVG diagram and add it to `MODE_SVGS` (`JS — SVG DIAGRAMS` section)
3. Add the name → SVG key mapping to `MODE_NAME_TO_SVG`
4. Optional: create a 5-string variant with key `ModeName_5`

### Adding a section label

Edit the `LETTERS` array (`JS — MODALS` section).

### Adding a measure symbol

1. Declare the internal value in `isSpecialSym()`, `getSymClass()`, `getSymLabel()`
2. Add the CSS style in `CSS — APP` (class `.sym-xxx`)
3. Add the button in `buildModal()` array `SYMS`
4. Make sure `transposeChordSymbol()` ignores this symbol

### Adding a barline type

1. Add the value to `BARLINE_TYPES` and `BARLINE_LABELS` (`JS — STATE` section)
2. Add the XML mapping to `BARLINE_XML`
3. Add the CSS style in `CSS — APP` (class `.bl-xxx-left` / `.bl-xxx-right`)
4. Add the entry to `blXML` / `brXML` maps in the export (`JS — MUSICXML HELPERS`)

### Adding a navigation symbol

1. Add the value to `NAV_TYPES` and `NAV_DISPLAY` (`JS — STATE` section)
2. Add the entry to `openNavPopup()` (`JS — MODALS` section)
3. Add the XML mapping in the export (`JS — MUSICXML HELPERS`)
4. Add detection in `parseMusicXML()` (`JS — PARSER` section)

---

## 🎸 Designed for Bass Players

The theory annotation panel is optimized for **bass guitar**:

- **Arpeggio inversions** show the exact note order for each voicing — useful for mapping positions on a 4- or 5-string bass
- **Tension notes** are displayed as actual pitch names (e.g. *b9 → D♭* on a C7) rather than intervals only
- **Fretboard diagrams** give instant visual reference at the music stand, in **4-string EADG** and **5-string BEADG** versions
- **Alternate chords** allow indicating a tritone sub or guide tone chord directly on the chart
- The **column layout** (1–4 measures per row) adapts for landscape printing on a tablet or music stand

---

## 🤝 Contributing

Contributions are welcome! Please open an issue before proposing major changes.

```bash
# Clone the repo
git clone https://github.com/virgosfredianilorenzo-cyber/Jazz_grid_generator.git

# Create a feature branch
git checkout -b feature/my-improvement

# Edit index.html
# Test in a browser (no build step needed)

# Commit and push
git commit -m "feat: describe your change"
git push origin feature/my-improvement

# Open a Pull Request
```

### Commit convention

This project uses a simplified [Conventional Commits](https://www.conventionalcommits.org/) style:

| Prefix | Use for |
|--------|---------|
| `feat:` | New feature |
| `fix:` | Bug fix |
| `style:` | CSS / UI changes |
| `refactor:` | Code restructure, no behavior change |
| `docs:` | Documentation only |
| `i18n:` | Translation updates |

---

## 📝 Changelog

### 4.7
- ✨ **5-string bass diagrams (BEADG)** — 5-string variants for 5 modes: Locrian #2, Whole tone, Mixolydian b9b13, Harmonic minor, Lydian augmented
- ✨ **New modes** — Locrian #2, Whole tone, Mixolydian b9b13, Harmonic minor and Lydian augmented added with 4- and 5-string diagrams
- ✨ **Harmonic minor** — added to `MODES_DEF` for `mM7` and `m7` qualities
- ✨ **Lydian augmented** — added to `MODES_DEF` for `maj7` and `mM7` qualities

### 4.6
- ✨ **Alternate chord** — small amber italic chord above the main chord (tritone sub, anticipation, passing chord); automatic tritone sub suggestion for dominants; MusicXML export as `<harmony print-frame="no"><footnote>alt</footnote>`; import from existing MusicXML files

### 4.5
- ✨ **Rich barlines** — double `‖`, final `𝄂`, repeat start `|:` and end `:|`; `◧` / `◨` hover buttons; MusicXML export/import
- ✨ **Voltas (1./2./3.)** — visual bracket; `<ending>` MusicXML export/import
- ✨ **Navigation symbols** — Segno `𝄋`, Coda `𝄌`, D.C. al Coda, D.S. al Coda, D.C. al Fine, Fine, Fermata `𝄐`; MusicXML export/import

### 4.4
- ✨ **iReal Pro measure symbols** — `%`, `𝄎`, `N.C.`, `/`; QUICK SYMBOLS panel in the chord modal
- 🔧 **File restructure** — CSS and JS blocks delimited by `/* ━━━ */` separators

### 4.3
- ✨ **Measure reordering** — ⠿ drag-and-drop across sections, ◀ ▶ hover buttons

### 4.2
- ✨ **Section reordering** — ⠿ drag-and-drop, ▲ ▼ buttons

### 4.1
- 🐛 **PDF print fix** — `break-inside: avoid` on `.section` and `.measure`

### 4.0
- ✨ **SVG mode diagrams** — 16 modes, 4-string EADG bass, dynamic transposition
- ✨ **MXL export/import** — compressed format via JSZip 3.10.1

### 3.0
- ✨ Language selector (FR / ES / IT / EN), JSON export/import, MusicXML export, transposition, advanced print panel

---

## 📋 Roadmap

- [x] Drag-and-drop section and measure reordering
- [x] SVG fretboard diagrams (4-string, 17 modes)
- [x] SVG fretboard diagrams 5-string BEADG (5 modes)
- [x] Compressed MXL import/export
- [x] iReal Pro measure symbols (`%`, `𝄎`, `N.C.`, `/`)
- [x] Rich barlines (double, final, repeats)
- [x] Voltas (1./2./3.) — MusicXML export/import
- [x] Navigation symbols (Coda, Segno, D.C., D.S., Fine, Fermata)
- [x] Alternate chord — MusicXML export/import
- [x] Sections never split across PDF pages
- [x] File structured in commented blocks
- [x] Harmonic minor in MODES_DEF
- [x] Lydian augmented in MODES_DEF
- [ ] 5-string diagrams for all remaining modes
- [ ] Invisible root `(w)` — visible bass without harmony
- [ ] Undo / Redo history
- [ ] iReal Pro `.irealbook` import
- [ ] MIDI playback of root notes
- [ ] Mobile touch gesture support
- [ ] Custom per-section color picker

---

## ☕ Support the Project

This tool is **free and open source**. If you find it useful for your sessions, lessons or rehearsals, you can support its development on Ko-fi:

[![Support on Ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/lorenzovirgosfrediani)

Every contribution, however small, helps fund time spent developing new features (full 5-string diagrams, undo/redo, iReal Pro import…).

---

## 📄 License

This project is distributed under the **Apache 2.0 license** — see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgements

- Built with vanilla HTML, CSS and JavaScript — no frameworks, no bundlers
- MusicXML format by [MakeMusic / W3C Music Notation Community Group](https://www.w3.org/2021/06/musicxml40/)
- MXL compression via [JSZip](https://stuk.github.io/jszip/) 3.10.1
- Chord symbol conventions inspired by jazz lead sheet standards (iReal Pro, Hal Leonard)

---

*𝄢 Made with love for musicians, by a bass player.*

# 🎷 Jazz Chart Editor v4

> A web-based jazz chord chart editor with music theory annotations, bass fretboard diagrams, MusicXML/MXL import/export, transposition, and print-ready output.

![Version](https://img.shields.io/badge/version-4.0-f0a500?style=flat-square)
![License](https://img.shields.io/badge/license-MIT-86efac?style=flat-square)
![HTML](https://img.shields.io/badge/built%20with-HTML%2FJS-c4b5fd?style=flat-square)
![Languages](https://img.shields.io/badge/languages-FR%20%7C%20ES%20%7C%20IT%20%7C%20EN-7dd3fc?style=flat-square)
![JSZip](https://img.shields.io/badge/uses-JSZip%203.10-fca5a5?style=flat-square)

---

## ✨ Features

- 📂 **MusicXML & MXL import** — drag & drop or file picker, supports `.musicxml`, `.xml` and compressed `.mxl` files; parses chords, sections, repeat barlines, key, tempo
- 🗜️ **MXL export** — export compressed MusicXML (`.mxl`) conformant with the MXL spec (META-INF/container.xml, mimetype uncompressed)
- ✏️ **Full chord editing** — 17 roots, 24 qualities, slash bass, free-form input, per-chord beat duration
- 🎸 **Bass fretboard diagrams** — when a mode is activated on a chord, the corresponding EADG neck diagram is displayed inline under the measure:
  - **16 modes** covered with dedicated diagrams: Ionien, Dorien, Phrygien, Lydien, Éolien, Locrien, Lydien b7, Mixolydien, Mixolydien b9b13, Altéré, Mélodie mineure, Lydien augmenté, Locrien #2, Dim. ton-demi, Dim. demi-ton, Tons entiers
  - **3-color system** — root in red, arpeggio notes in amber, other scale degrees in blue
  - Notes calculated dynamically from the chord root — auto-transposed with the chart
- 🎼 **Music theory annotations** per chord:
  - Compatible modes with selector (instantly updates fretboard diagram)
  - 4-note arpeggios with all inversions, labels A: and T:
  - Available tensions & avoid notes displayed as actual pitch names
  - **Alternative modes list** — all compatible modes shown below A: and T: rows
  - Free text notes with color, bold/italic styling
- 🎵 **Transposition** — by semitone (±) or direct key selection, with enharmonic awareness
- 🗂️ **Section management** — labels (A–I, Intro, Verse, Chorus, Bridge, Coda…), duplicate, reorder, annotate
- 🖨️ **Advanced print/PDF** — light/dark theme, adjustable contrast (5 levels), automatic per-section color coding; edit UI (pencil icons, input fields, measure numbers) hidden in print; SVG diagrams rendered in black & white with white note names on colored dots
- 💾 **JSON save/load** — full fidelity including all annotations and diagrams
- 🎼 **MusicXML 3.1 export** — conformant output with `harmony placement="above"`, correct `<attributes>` order, `standalone="no"`, compatible with MuseScore, Sibelius, Finale, iReal Pro
- 🌐 **4 languages** — French 🇫🇷, Spanish 🇪🇸, Italian 🇮🇹, English 🇬🇧
- 📱 **Single HTML file** — works offline in any modern browser, one CDN dependency (JSZip for MXL)

---

## 📸 Screenshots

> *(Add screenshots here — `docs/screenshot-dark.png`, `docs/screenshot-print.png`, etc.)*

---

## 🚀 Quick Start

### Option 1 — Use directly in browser

Just open `index.html` in any modern browser. No server required.

```bash
git clone https://github.com/your-username/jazz-chart-editor.git
cd jazz-chart-editor
open index.html   # macOS
# or double-click index.html on Windows/Linux
```

### Option 2 — GitHub Pages

1. Fork this repository
2. Go to **Settings → Pages**
3. Set source to `main` branch, root `/`
4. Your editor will be live at `https://your-username.github.io/jazz-chart-editor/`

### Option 3 — Any static host

Upload `index.html` to any static hosting service (Netlify, Vercel, Cloudflare Pages…). No configuration needed.

> **Note:** JSZip is loaded from the Cloudflare CDN (`cdnjs.cloudflare.com`) for MXL support. The app works fully offline for all other features; only MXL import/export requires network access on first load (or cache).

---

## 🎵 Usage

### Creating a chart from scratch

1. Click **✨ New** — a blank 8-measure chart in C major opens
2. Edit the **title**, **key**, **tempo**, **time signature** and **style** in the header
3. Click any chord to edit it, or click **+** inside a measure to add one
4. Click the **✏️** icon on a chord to add theory annotations (mode, arpeggio, tensions, notes)

### Importing a MusicXML file

Drag & drop a `.musicxml`, `.mxl` or `.xml` file onto the drop zone, or click **📂 Open MusicXML**.

Supported data on import: chord symbols and durations, key signature, tempo, time signature, rehearsal marks → sections, repeat barlines.

### Saving and loading

| Action | Format | Notes |
|--------|--------|-------|
| **💾 Export JSON** | `.json` | Full fidelity — all chords, annotations, fretboard states |
| **📥 Import JSON** | `.json` | Reload a previously saved session |
| **🎼 Export MusicXML** | `.musicxml` | MusicXML 3.1, compatible with MuseScore, Sibelius, Finale |
| **🗜️ Export MXL** | `.mxl` | Compressed MusicXML, spec-compliant ZIP archive |

> **Tip:** Always use JSON to save your work. MusicXML/MXL export does not include theory annotations or fretboard diagram state.

### Transposition

| Control | Description |
|---------|-------------|
| **− / +** buttons | Transpose ±1 semitone at a time |
| Key dropdown | Transpose directly to a target key |
| **↺** reset | Restore the original key |

Enharmonic spellings are automatically chosen based on the destination key (e.g. F# → B♭ is written as B♭, not A#). Fretboard diagram notes update automatically on transposition.

### Bass fretboard diagrams

1. Click the **✏️** icon on a chord to open the annotation panel
2. In the **🎼 Mode** block, activate **"Afficher dans la mesure"**
3. Select a mode from the grid — the diagram updates instantly
4. The diagram appears directly below the chord name in the measure, full-width
5. Colors: 🔴 root · 🟡 arpeggio notes · 🔵 other scale degrees

When multiple chords in a measure have a mode activated, each chord shows its own diagram stacked below.

### Printing / PDF

1. Click **🖨️ Print** to open the print panel
2. Choose **theme** (light ☀️ / dark 🌙)
3. Adjust **contrast** (1–5) — controls border weight and chord symbol size
4. Preview **section colors** — each section label gets a distinct color automatically
5. Click **Print** → use your browser's **Save as PDF**

In print mode: all edit controls are hidden (pencil icons, input fields, measure numbers, beat duration indicators). Mode names appear in black bold. SVG diagram notes are white on colored dots for maximum legibility.

---

## 🎼 Music Theory Engine

### Supported chord qualities (24)

| Symbol | Quality |
|--------|---------|
| *(blank)* | Major triad |
| `maj7` / `Δ7` | Major seventh |
| `7` | Dominant seventh |
| `m` | Minor triad |
| `m7` | Minor seventh |
| `mM7` | Minor-major seventh |
| `dim` / `°` | Diminished triad |
| `dim7` / `°7` | Diminished seventh |
| `m7b5` / `ø7` | Half-diminished |
| `aug` | Augmented triad |
| `sus2`, `sus4`, `7sus4` | Suspended |
| `6`, `6/9` | Sixth chords |
| `9`, `11`, `13` | Extended dominant |
| `maj9`, `maj13` | Extended major |
| `m9`, `m11`, `m13` | Extended minor |

### Fretboard diagrams — 16 modes

| Mode | Intervals | Typical use |
|------|-----------|-------------|
| Ionien | 1 2 3 4 5 6 7 | maj7, maj9 |
| Dorien | 1 2 b3 4 5 6 b7 | m7, m9, m11 |
| Phrygien | 1 b2 b3 4 5 b6 b7 | m7, m |
| Lydien | 1 2 3 #4 5 6 7 | maj7, maj9 |
| Lydien b7 | 1 2 3 #4 5 6 b7 | 7, 13 |
| Mixolydien | 1 2 3 4 5 6 b7 | 7, 9, 13 |
| Mixolydien b9b13 | 1 b2 3 4 5 b6 b7 | 7 |
| Éolien | 1 2 b3 4 5 b6 b7 | m, m7 |
| Locrien | 1 b2 b3 4 b5 b6 b7 | m7b5 |
| Locrien #2 | 1 2 b3 4 b5 b6 b7 | m7b5 |
| Altéré | 1 b2 #2 3 b5 b6 b7 | 7 |
| Mélodie mineure | 1 2 b3 4 5 6 7 | mM7, m6 |
| Lydien augmenté | 1 2 3 #4 #5 6 7 | aug |
| Dim. ton-demi | 1 2 b3 4 b5 b6 6 7 | dim |
| Dim. demi-ton | 1 b2 b3 3 b5 5 6 b7 | dim7 |
| Tons entiers | 1 2 3 #4 #5 b7 | aug |

### Mode suggestions per chord quality

| Quality | Suggested modes |
|---------|----------------|
| `maj7` | Ionien, Lydien |
| `7` | Mixolydien, Lydien b7, Mixolydien b9b13, Altéré |
| `m7` | Dorien, Éolien, Phrygien |
| `m7b5` | Locrien, Locrien #2 |
| `dim7` | Dim. demi-ton |
| `dim` | Dim. ton-demi |
| `mM7` | Mélodie mineure |
| `aug` | Lydien augmenté, Tons entiers |

---

## 🗂️ Project Structure

```
jazz-chart-editor/
│
├── index.html          # Single-file application (HTML + CSS + JS)
│
├── README.md           # This file
├── LICENSE             # MIT License
│
└── docs/               # Optional — screenshots, user manual PDF
    ├── screenshot-dark.png
    ├── screenshot-print.png
    └── manual-fr.pdf
```

The JavaScript is organized into logical sections via inline comments:

- `i18n` — translation dictionary & language switching (FR/ES/IT/EN)
- `MODE_SVGS` — 16 inline SVG bass fretboard diagrams
- `theory` — music engine (scales, arpeggios, tensions, transposition)
- `parser` — MusicXML parser
- `state` — application state
- `transpose` — transposition logic with enharmonic awareness
- `render` — DOM rendering (sections, measures, chord slots, diagrams)
- `modals` — chord & annotation dialogs
- `actions` — chart mutations (add/delete/duplicate)
- `io` — import/export (JSON, MusicXML 3.1, MXL)
- `print` — print theming, color system, dynamic CSS injection

---

## 🌐 Internationalization

The UI is fully translated into **4 languages**. Language switches instantly without page reload.

To add a new language, add an entry to the `LANGS` object and add an `<option>` to the `#lang-select` dropdown.

---

## 🛠️ Customization

### Adding chord qualities

Add an entry to: `QUALITIES` array, `ARP_DEF` object, `MODES_DEF` object, `TENS_DEF` object.

### Adding a fretboard diagram

Add an SVG entry to `MODE_SVGS` and a mapping entry to `MODE_NAME_TO_SVG`. The coordinate system uses root on A-string fret 2 (x=175, y=150); each fret step = 90px horizontally, strings at y = 70 (G), 110 (D), 150 (A), 190 (E).

### Adding section labels

Edit the `LETTERS` array in the `modals` section.

---

## 🎸 Designed for Bass Players

- **Fretboard diagrams** show the exact position of every scale degree on the EADG neck, with arpeggio notes highlighted in amber — map fingerings directly from the chart
- **Alternative modes list** under A: and T: gives instant recall of all available scales for the chord quality
- **Arpeggio inversions** show the exact note order for each voicing on a 4-string bass
- **Tension notes** displayed as actual pitch names (e.g. b9 → D♭ on C7)
- **Column layout** (1–4 measures per row) adapts for landscape printing on a tablet or music stand

---

## 🤝 Contributing

Contributions welcome! Please open an issue first.

```bash
git clone https://github.com/your-username/jazz-chart-editor.git
git checkout -b feature/my-improvement
# Edit index.html — no build step needed
git commit -m "feat: describe your change"
git push origin feature/my-improvement
# Open a Pull Request
```

### Commit convention

| Prefix | Use for |
|--------|---------|
| `feat:` | New feature |
| `fix:` | Bug fix |
| `style:` | CSS / UI changes |
| `refactor:` | Code restructure, no behavior change |
| `docs:` | Documentation only |
| `i18n:` | Translation updates |

---

## 📋 Roadmap

- [ ] Drag-and-drop measure reordering
- [ ] Undo / Redo history
- [ ] iReal Pro `.irealbook` import
- [ ] MIDI playback of chord root notes
- [ ] Mobile touch gesture support
- [ ] Dark/light theme toggle for the editor itself
- [ ] Custom section color picker
- [ ] 5-string bass fretboard option (low B string)
- [ ] Export fretboard diagrams as standalone SVG/PDF

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgements

- Built with vanilla HTML, CSS and JavaScript — no frameworks, no bundlers
- [JSZip](https://stuk.github.io/jszip/) for MXL compressed file support
- MusicXML format by [MakeMusic / W3C Music Notation Community Group](https://www.w3.org/2021/06/musicxml40/)
- Chord symbol rendering inspired by jazz lead sheet conventions (iReal Pro, Hal Leonard)

---

*Made with 🎷 for jazz musicians, by a jazz musician.*

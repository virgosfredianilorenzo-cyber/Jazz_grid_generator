# 🎷 Jazz Chart Editor v3

> A web-based jazz chord chart editor with music theory annotations, MusicXML import/export, transposition, multilingual UI, and print-ready output.

![Version](https://img.shields.io/badge/version-3.0-f0a500?style=flat-square)
![License](https://img.shields.io/badge/license-Apache%202.0-86efac?style=flat-square)
![HTML](https://img.shields.io/badge/built%20with-HTML%2FJS-c4b5fd?style=flat-square)
![Languages](https://img.shields.io/badge/languages-FR%20%7C%20ES%20%7C%20IT%20%7C%20EN-7dd3fc?style=flat-square)
![No dependencies](https://img.shields.io/badge/dependencies-none-fca5a5?style=flat-square)

---

## 🆕 What's new in v3

- 🌐 **Runtime language switching** — switch between French, Spanish, Italian and English instantly, without page reload. All UI labels, modal dialogs, tooltips and print controls update live.

---

## ✨ Features

- 📂 **MusicXML import** — drag & drop or file picker; parses chords, sections, repeat barlines, key and tempo
- ✏️ **Full chord editing** — 17 roots, 24 qualities, slash bass, free-form input, per-chord beat duration
- 🎼 **Music theory annotations** per chord:
  - Compatible modes (Ionian, Dorian, Mixolydian, Altered, …)
  - 4-note arpeggios with all inversions
  - Available tensions & avoid notes
  - Free text notes with color, bold/italic styling
- 🎵 **Transposition** — by semitone (±) or direct key selection, with enharmonic awareness
- 🗂️ **Section management** — labels (A–I, Intro, Verse, Chorus, Bridge, Coda…), duplicate, annotate, delete
- 🖨️ **Advanced print/PDF** — light/dark theme, adjustable contrast (5 levels), automatic per-section color coding
- 💾 **JSON save/load** — full fidelity including all annotations
- 🎼 **MusicXML export** — compatible with MuseScore, Sibelius, Finale
- 🌐 **4 languages** — French 🇫🇷, Spanish 🇪🇸, Italian 🇮🇹, English 🇬🇧
- 📱 **Zero dependencies** — single HTML file, works offline, no build step

---

## 🚀 Quick Start

### Option 1 — Use directly in browser

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

---

## 🎵 Usage

### Creating a chart from scratch

1. Click **✨ New** — a blank 8-measure chart in C major opens
2. Edit the **title**, **key**, **tempo**, **time signature** and **style** in the header
3. Click any chord to edit it, or click **+** inside a measure to add one
4. Click the **✏️** icon on a chord to add theory annotations

### Importing a MusicXML file

Drag & drop a `.musicxml` or `.xml` file onto the drop zone, or click **📂 Open MusicXML**.

Supported data on import: chord symbols and durations, key signature, tempo, time signature, rehearsal marks → sections, repeat barlines.

### Saving and loading

| Action | Format | Notes |
|--------|--------|-------|
| **💾 Export JSON** | `.json` | Full fidelity — all chords, annotations, colors |
| **📥 Import JSON** | `.json` | Reload a previously saved session |
| **🎼 Export MusicXML** | `.musicxml` | Share with MuseScore, Sibelius, Finale, etc. |

> **Tip:** Always use JSON for saving your work. MusicXML export does not include theory annotations.

### Transposition

| Control | Description |
|---------|-------------|
| **− / +** buttons | Transpose ±1 semitone at a time |
| Key dropdown | Transpose directly to a target key |
| **↺** reset | Restore the original key |

Enharmonic spellings are automatically chosen based on the destination key.

### Language switching

Use the **🌐 language selector** (fixed, top-right corner) to switch between FR / ES / IT / EN at any time. The entire UI updates instantly — no reload, no data loss.

### Printing / PDF

1. Click **🖨️ Print** to open the print panel
2. Choose **theme** (light ☀️ / dark 🌙)
3. Adjust **contrast** (1–5)
4. Click **Print** → use your browser's **Save as PDF** to generate a PDF

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

### Mode suggestions per chord quality (examples)

| Quality | Suggested modes |
|---------|----------------|
| `maj7` | Ionian, Lydian |
| `7` | Mixolydian, Lydian b7, Altered, Mixo b9b13 |
| `m7` | Dorian, Aeolian, Phrygian |
| `m7b5` | Locrian, Locrian #2 |
| `dim7` | Diminished (half-whole) |
| `mM7` | Melodic minor |

---

## 🗂️ Project Structure

```
jazz-chart-editor/
│
├── index.html      # Single-file application (HTML + CSS + JS)
├── README.md       # This file
├── LICENSE         # Apache 2.0
│
└── docs/           # Optional — screenshots, user manual PDF
    ├── screenshot-dark.png
    └── manual.pdf
```

The JavaScript is organized into logical modules via inline section comments:

| Module | Responsibility |
|--------|---------------|
| `i18n.js` | Translation dictionary (FR/ES/IT/EN) & live language switching |
| `theory.js` | Music engine — scales, arpeggios, tensions, transposition |
| `parser.js` | MusicXML parser |
| `state.js` | Application state |
| `transpose.js` | Transposition logic |
| `render.js` | DOM rendering |
| `modals.js` | Chord & annotation dialogs |
| `actions.js` | Chart mutations (add / delete / duplicate) |
| `io.js` | Import/export (JSON, MusicXML) |
| `print.js` | Print theming & color system |
| `app.js` | Initialization & global events |

---

## 🌐 Internationalization

The UI is fully translated into **4 languages**. Switching is instant and non-destructive — chart data is never affected.

To add a new language:
1. Add an entry to the `LANGS` object in `index.html`, mirroring the keys of an existing language
2. Add an `<option>` to the `#lang-select` dropdown
3. Call `setLang('xx')` to test it

---

## 🎸 Designed for Bass Players

- **Arpeggio inversions** show the exact note order for each voicing — useful for mapping positions on a 4 or 5-string bass
- **Tension notes** are displayed as actual pitch names (e.g. b9 → D♭ on a C7) rather than intervals only
- **Mode display** in the chart gives instant scale reference at the music stand
- The **column layout** (1–4 measures per row) adapts for landscape printing on a tablet

---

## 🤝 Contributing

Contributions are welcome. Please open an issue first to discuss what you'd like to change.

```bash
git clone https://github.com/your-username/jazz-chart-editor.git
git checkout -b feature/my-improvement
# edit index.html — no build step needed
git commit -m "feat: describe your change"
git push origin feature/my-improvement
# open a Pull Request
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

## 📄 License

Licensed under the **Apache License 2.0** — see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgements

- Built with vanilla HTML, CSS and JavaScript — no frameworks, no bundlers
- MusicXML format by the [W3C Music Notation Community Group](https://www.w3.org/2021/06/musicxml40/)
- Chord symbol conventions inspired by jazz lead sheet standards (iReal Pro, Hal Leonard)

---

*Made with 🎷 for jazz musicians, by a jazz musician.*

# 🎷 Jazz Chart Editor

> A web-based jazz chord chart editor with music theory annotations, MusicXML import/export, transposition, and print-ready output.

![Version](https://img.shields.io/badge/version-2.0-f0a500?style=flat-square)
![License](https://img.shields.io/badge/license-MIT-86efac?style=flat-square)
![HTML](https://img.shields.io/badge/built%20with-HTML%2FJS-c4b5fd?style=flat-square)
![Languages](https://img.shields.io/badge/languages-FR%20%7C%20ES%20%7C%20IT%20%7C%20EN-7dd3fc?style=flat-square)
![No dependencies](https://img.shields.io/badge/dependencies-none-fca5a5?style=flat-square)

---

## ✨ Features

- 📂 **MusicXML import** — drag & drop ou sélecteur de fichier, parse accords, sections, barres de reprise, tonalité, tempo — formats `.musicxml`, `.xml` et `.mxl` (compressé)
- ✏️ **Édition complète des accords** — 17 fondamentales, 24 qualités, basse slash, saisie libre, durée par accord
- 🎼 **Annotations théoriques** par accord :
  - Modes compatibles avec diagramme de manche SVG dynamique (16 modes, basse 4 cordes EADG)
  - Arpèges 4 sons avec tous les renversements
  - Tensions disponibles & notes à éviter
  - Notes libres avec couleur, gras/italique
- 🎵 **Transposition** — par demi-ton (±) ou sélection directe de tonalité, avec gestion des enharmoniques
- 🗂️ **Gestion des sections** — labels (A–I, Intro, Verse, Chorus, Bridge, Coda…), déplacement par drag & drop ou boutons ▲▼, duplication, annotation
- 📐 **Déplacement des mesures** — drag & drop inter-sections ou boutons ◀▶, duplication
- 🖨️ **Impression/PDF avancée** — thème clair/sombre, contraste ajustable (5 niveaux), couleurs automatiques par section, diagrammes SVG inclus
- 💾 **Sauvegarde JSON** — fidélité totale incluant toutes les annotations
- 🎼 **Export MusicXML / MXL** — compatible MuseScore, Sibelius, Finale, iReal Pro
- 🌐 **4 langues** — Français 🇫🇷, Espagnol 🇪🇸, Italien 🇮🇹, Anglais 🇬🇧
- 📱 **Zéro dépendance** — fichier HTML unique, fonctionne hors ligne (JSZip inclus pour le format MXL)

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

---

## 🎵 Usage

### Creating a chart from scratch

1. Click **✨ New** — a blank 8-measure chart in C major opens
2. Edit the **title**, **key**, **tempo**, **time signature** and **style** in the header
3. Click any chord to edit it, or click **+** inside a measure to add one
4. Click the **✏️** icon on a chord to add theory annotations (mode, arpeggio, tensions, notes)

### Importing a MusicXML file

Drag & drop a `.musicxml` or `.xml` file onto the drop zone, or click **📂 Open MusicXML**.

Supported data on import:
- Chord symbols and durations
- Key signature, tempo, time signature
- Rehearsal marks → sections
- Repeat barlines

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

Enharmonic spellings are automatically chosen based on the destination key (e.g. F# → B♭ is written as B♭, not A#).

### Printing / PDF

1. Click **🖨️ Print** to open the print panel
2. Choose **theme** (light ☀️ / dark 🌙)
3. Adjust **contrast** (1–5) — controls border weight and chord symbol size
4. Preview **section colors** — each section label gets a distinct color automatically
5. Click **Print** → use your browser's **Save as PDF** to generate a PDF file

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

> The entire application lives in `index.html`. The JavaScript is organized into logical modules via inline comments:
> - `i18n.js` — translation dictionary & language switching
> - `theory.js` — music engine (scales, arpeggios, tensions, transposition)
> - `parser.js` — MusicXML parser
> - `state.js` — application state
> - `transpose.js` — transposition logic
> - `render.js` — DOM rendering
> - `modals.js` — chord & annotation dialogs
> - `actions.js` — chart mutations (add/delete/duplicate)
> - `io.js` — import/export (JSON, MusicXML)
> - `print.js` — print theming & color system
> - `app.js` — initialization & global events

---

## 🌐 Internationalization

The UI is fully translated into **4 languages**. Language is switched instantly without page reload.

To add a new language, add an entry to the `LANGS` object in `index.html` and add an `<option>` to the `#lang-select` dropdown.

---

## 🛠️ Customization

### Changing the default chart

Edit the `newChart()` function in the `actions.js` section to change the default key, number of measures, or initial chord.

### Adding chord qualities

Add an entry to:
- `QUALITIES` array (chord modal buttons)
- `ARP_DEF` object (arpeggio definition)
- `MODES_DEF` object (compatible modes)
- `TENS_DEF` object (available tensions)

### Adding section labels

Edit the `LETTERS` array in the `modals.js` section.

---

## 🎸 Designed for Bass Players

The theory annotation panel is optimized for **bass guitar players**:

- **Arpeggio inversions** show the exact note order for each voicing — useful for mapping positions on a 4- or 5-string bass
- **Tension notes** are displayed as actual pitch names (e.g. *b9 → D♭* on a C7) rather than intervals only
- **Mode display** in the chart gives instant scale reference at the music stand
- The **column layout** (1–4 measures per row) can be adapted for landscape printing on a tablet or music stand

---

## 🤝 Contributing

Contributions are welcome! Please open an issue first to discuss what you'd like to change.

```bash
# Clone the repo
git clone https://github.com/your-username/jazz-chart-editor.git

# Create a feature branch
git checkout -b feature/my-improvement

# Make your changes in index.html
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

### v4.3
- ✨ **Déplacement des mesures** — poignée ⠿ drag & drop sur chaque mesure (y compris entre sections), boutons ◀ ▶ au survol pour déplacer d'un cran dans la même section

### v4.2
- ✨ **Déplacement des sections** — poignée ⠿ drag & drop avec indicateur visuel orange, boutons ▲ ▼ pour monter/descendre d'un cran

### v4.1
- 🐛 **Fix impression PDF** — la grille ne commence plus en page 2 : suppression du `min-height:100vh` à l'impression, `page-break-inside:avoid` déplacé au niveau `.measure` (plus `.section`), header compacté, `#chart-editor` forcé visible

### v4.0
- ✨ **Diagrammes SVG de modes** — 16 diagrammes de manche basse 4 cordes (EADG) affichés dans les cases d'accord quand le mode est activé : Ionien, Dorien, Phrygien, Lydien, Mixolydien, Éolien, Locrien, Lydien b7, Mixolydien b9b13, Altéré, Mélodie mineure, Lydien augmenté, Locrien #2, Dim. ton-demi, Dim. demi-ton, Tons entiers
- ✨ **Transposition des diagrammes** — les notes dans les dots SVG sont recalculées dynamiquement selon la fondamentale de l'accord (rouge = fondamentale, amber = notes d'arpège, bleu = degrés de gamme)
- ✨ **Export MXL** — export au format `.mxl` (MusicXML compressé) via JSZip 3.10.1
- ✨ **Import MXL** — import de fichiers `.mxl` compressés en plus du `.musicxml`
- ✨ **Système de labels compact** — `A:` arpège, `T:` tensions, liste des modes alternatifs sous chaque accord
- 🐛 Fix CSS print : textes SVG noirs/gras, notes dans les dots blanches, lignes fretboard sombres

---

## 📋 Roadmap

- [x] Drag-and-drop section reordering
- [x] Drag-and-drop measure reordering (inter-sections)
- [x] Bass fretboard diagrams (SVG, 4-string, 16 modes)
- [x] MXL compressed import/export
- [ ] Basse 5 cordes (BEADG) — variantes des diagrammes
- [ ] Undo / Redo history
- [ ] iReal Pro `.irealbook` import
- [ ] MIDI playback of chord root notes
- [ ] Mobile touch gesture support
- [ ] Dark/light theme toggle for the editor itself
- [ ] Custom section color picker

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgements

- Built with vanilla HTML, CSS and JavaScript — no frameworks, no bundlers
- MusicXML format by [MakeMusic / W3C Music Notation Community Group](https://www.w3.org/2021/06/musicxml40/)
- Chord symbol rendering inspired by jazz lead sheet conventions (iReal Pro, Hal Leonard)

---

*Made with 🎷 for jazz musicians, by a jazz musician.*

# 𝄢 Jazz Grid Generator

> Éditeur de grilles jazz en ligne avec annotations de théorie musicale, diagrammes de manche basse 4 et 5 cordes, import/export MusicXML et sortie PDF optimisée.

![Licence](https://img.shields.io/badge/licence-Apache%202.0-86efac?style=flat-square)
![HTML](https://img.shields.io/badge/fait%20avec-HTML%2FJS-c4b5fd?style=flat-square)
![Langues](https://img.shields.io/badge/langues-FR%20%7C%20ES%20%7C%20IT%20%7C%20EN-7dd3fc?style=flat-square)
![Dépendances](https://img.shields.io/badge/d%C3%A9pendances-JSZip-fca5a5?style=flat-square)

[![Soutenir sur Ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/lorenzovirgosfrediani)

> 🇬🇧 [English version → README.en.md](README.en.md)

---

## ✨ Fonctionnalités

- 📂 **Import MusicXML** — glisser-déposer ou sélecteur de fichier ; formats `.musicxml`, `.xml`, `.mxl` (compressé)
- ✏️ **Édition complète des accords** — 17 fondamentales, 24 qualités, basse slash, saisie libre, durée par accord
- 🎵 **Symboles de mesure iReal Pro** — `%`, `𝄎`, `N.C.`, `/`, `(w)` (invisible root — basse seule)
- 🎼 **Barres de mesure enrichies** — simple, double `‖`, finale `𝄂`, répétition `|:` `:|`
- 🔂 **Voltas** (1ère / 2ème / 3ème fois) — bracket visuel + export MusicXML
- 🧭 **Symboles de navigation** — Segno `𝄋`, Coda `𝄌`, D.C./D.S. al Coda, Fine, Fermata `𝄐`
- 🔀 **Accord alternatif** — substitution tritoniée avec suggestion automatique pour les dominantes
- 🎼 **Annotations de théorie musicale** — modes + diagramme SVG basse 4/5 cordes, arpèges 4 sons, tensions, notes libres
- 🎸 **Toggle 4🎸 / 5🎸** — bascule dans la barre d'outils entre diagrammes 4 cordes (EADG) et 5 cordes (BEADG)
- 🎵 **Transposition** — par demi-ton (±) ou tonalité cible, enharmoniques automatiques
- 🗂️ **Labels de section personnalisables** — lettres A–I, mots-clés (Intro, Chorus…) + suffixes `'` `''` `1`–`9` `0`
- 📐 **Déplacement** sections et mesures — drag & drop + boutons ▲▼ ◀▶
- ↩️ **Annuler / Rétablir** — 10 niveaux, Ctrl+Z / Ctrl+Y, boutons ↩ ↪
- 📱 **Support tactile tablette** — drag & drop au doigt, pinch-to-zoom
- 🖨️ **Impression / PDF** — thème clair/sombre, contraste (5 niveaux), couleurs par section ; mise en page adaptative selon la densité des mesures
- 💾 **Sauvegarde JSON** — fidélité totale
- 🎼 **Export MusicXML / MXL** — compatible MuseScore, Sibelius, Finale
- 🌐 **4 langues** — FR 🇫🇷 ES 🇪🇸 IT 🇮🇹 EN 🇬🇧

---

## 📸 Captures d'écran

<div align="center">
  <img src="Screenshots/capt1.png" alt="Interface principale" width="80%">
  <br><em>Interface principale — barre d'outils et zone de dépôt MusicXML</em>
</div>
<br>
<div align="center">
  <img src="Screenshots/capt2.png" alt="Grille avec diagramme de mode" width="80%">
  <br><em>Grille avec annotation de mode Dorien et diagramme de manche basse</em>
</div>
<br>
<div align="center">
  <img src="Screenshots/capt3.png" alt="Sortie PDF" width="45%">
  <br><em>Sortie PDF — thème clair avec couleurs de sections automatiques</em>
</div>

---

## 🚀 Démarrage rapide

```bash
git clone https://github.com/virgosfredianilorenzo-cyber/Jazz_grid_generator.git
cd Jazz_grid_generator
open index.html   # macOS — ou double-cliquer sous Windows/Linux
```

Ou héberger sur **GitHub Pages**, **Netlify**, **Vercel** — aucune configuration requise.

---

## 🎵 Guide d'utilisation

### Labels de section

Cliquer sur la lettre en haut à gauche d'une section pour ouvrir la modale de label :

- **Lettre principale** : `A` `B` `C` `D` `E` `F` `G` `H` `I` · `Intro` `Verse` `Chorus` `Bridge` `Outro` `Coda` `Tag` `Vamp` `Head`
- **Suffixe** : `(aucun)` · `'` · `''` · `1` `2` `3` `4` `5` `6` `7` `8` `9` `0`

Exemples : `A`, `A'`, `A1`, `B3`, `Chorus2`, `Verse7`, `Head0`…

### Annuler / Rétablir

| Action | Raccourci | Bouton |
|--------|-----------|--------|
| Annuler | Ctrl+Z (⌘Z) | ↩ |
| Rétablir | Ctrl+Y / Ctrl+Shift+Z (⌘Y) | ↪ |

10 niveaux d'historique. Couverture complète : accords, annotations, sections, mesures, barlines, voltas, navigation, altChord, drag & drop. **✨ Nouveau** réinitialise l'historique.

### Support tactile (iPad / Android)

| Geste | Action |
|-------|--------|
| Tap | Ouvrir la modale |
| Maintenir + glisser ⠿ | Déplacer section ou mesure |
| Pinch | Zoomer / dézoomer (0.5× – 2×) |

### Symboles de mesure iReal Pro

| Symbole | Signification |
|---------|---------------|
| `%` | Répéter la mesure précédente |
| `𝄎` | Répéter les 2 mesures précédentes |
| `N.C.` | No Chord |
| `/` | Beat slash |
| `(w)` | Invisible root — basse seule |

### Accord alternatif

Au survol → bouton **`♯±`** → saisir → **✓**. Suggestion tritoniée automatique pour les dominantes. Export MusicXML : `<harmony print-frame="no"><footnote>alt</footnote>`.

### Barres, voltas, navigation

**◧ ◨** au survol pour barlines et voltas. **𝄌** en haut à droite pour les symboles de navigation. Tout exporté/importé en MusicXML.

### Sauvegarde et export

| Format | Usage |
|--------|-------|
| **JSON** | Sauvegarde complète (annotations incluses) — toujours privilégier |
| **MusicXML** | Partage avec MuseScore, Sibelius, Finale |
| **MXL** | Format compressé |

---

## 🎼 Moteur de théorie musicale

**24 qualités d'accords** · **16 modes** avec diagrammes SVG dynamiques · Arpèges 4 sons · Tensions

| Qualité | Modes compatibles |
|---------|------------------|
| `maj7` | Ionien, Lydien |
| `7` | Mixolydien, Lydien b7, Altéré, Mixo b9b13 |
| `m7` | Dorien, Éolien, Phrygien |
| `m7b5` | Locrien, Locrien #2 |
| `dim7` | Diminué demi-ton |
| `mM7` | Mélodie mineure |

Code couleur diagrammes : 🔴 Fondamentale · 🟠 Arpège · 🔵 Gamme

---

## 🗂️ Structure du projet

```
Jazz_grid_generator/
├── index.html      # Application complète (fichier unique)
├── README.md       # Ce fichier (FR)
├── README.en.md    # Version anglaise
├── LICENSE         # Apache 2.0
└── Screenshots/
```

| Bloc JS/CSS | Contenu |
|-------------|---------|
| `CSS — APP` | Layout, mesures, symboles, touch |
| `CSS — MODALS` | Modales |
| `CSS — PRINT` | @media print |
| `JS — I18N` | Traductions FR/ES/IT/EN |
| `JS — SVG DIAGRAMS` | Diagrammes de manche |
| `JS — THEORY ENGINE` | Gammes, arpèges, tensions |
| `JS — PARSER` | Import MusicXML |
| `JS — RENDER` | DOM rendering |
| `JS — MODALS` | Modales + popups |
| `JS — ACTIONS` | add / delete / duplicate / move |
| `JS — I/O` | JSON + MusicXML + MXL |
| `JS — UNDO/REDO` | Pile 10 snapshots |
| `JS — TOUCH SUPPORT` | Drag tactile + pinch-to-zoom |

---

## 🛠️ Personnalisation rapide

| Quoi | Où |
|------|-----|
| Profondeur undo | Constante `UNDO_MAX` dans `JS — UNDO/REDO` |
| Ajouter un suffixe de section | `suffixVals[]` (×2) + `suffixLabels[]` (×4 langues) |
| Ajouter un symbole de mesure | `isSpecialSym()` · `getSymClass()` · `getSymLabel()` · CSS · `SYMS[]` · `harmonyToXML()` |
| Ajouter une qualité d'accord | `QUALITIES[]` · `ARP_DEF` · `MODES_DEF` · `TENS_DEF` |
| Ajouter une langue | Entrée dans `LANGS` + `<option>` dans `#lang-select` |

---

## 🎸 Conçu pour les bassistes

- Renversements d'arpèges pour le mapping sur 4 cordes EADG
- **Diagrammes 5 cordes BEADG** — 7 modes diatoniques, doigtés validés, toggle 4🎸/5🎸 dans la barre d'outils
- Tensions en noms de notes réels (*b9 → Ré♭* sur C7)
- Diagrammes SVG dynamiques — référence immédiate au pupitre
- `(w)` pour les lignes de basse solo
- **PDF adaptatif** — police et mise en page réduites automatiquement pour les mesures chargées
- Pinch-to-zoom pour adapter la grille sur tablette
- Undo/Redo pour expérimenter sans risque

---

## 🤝 Contribuer

```bash
git checkout -b feature/mon-amelioration
# Modifier index.html — tester dans le navigateur (pas de build)
git commit -m "feat: décrire la modification"
git push origin feature/mon-amelioration
```

Préfixes commits : `feat:` `fix:` `style:` `refactor:` `docs:` `i18n:`

---

## 📝 Changelog

### 4.10
- 🖨️ **PDF adaptatif** — à partir de 2 accords par mesure : réduction automatique de la police, arpèges affichés en grille 2 colonnes (toutes les notes lisibles), tensions condensées sur une ligne, noms de modes empilés verticalement ; réduction progressive pour 3 et 4 accords par mesure
- 🧭 **Menus contextuels intelligents** — les popups (barlines, symboles de navigation, accord alternatif) restent toujours dans l'écran : décalage automatique vers la gauche et remontée si le bas est tronqué
- 🖨️ **Éléments masqués à l'impression** — poignées de déplacement (sections et mesures) et bouton de couleur de section cachés dans le PDF

### 4.9
- 🤖 **Auto-annotation à l'import MusicXML** — mode principal (SVG basse) + premier arpège 4 sons + toutes les tensions affichés automatiquement sur chaque accord ; mesures à 1 accord : SVG + théorie ; mesures à plusieurs accords : noms de modes + arpège + tensions (sans SVG)
- 🎸 **Diagrammes basse 5 cordes BEADG** — 7 modes diatoniques (Ionien→Locrien) validés manuellement, doigtés cohérents sur toutes les cordes
- 🔀 **Toggle 4🎸 / 5🎸** — dans le bloc Mode de la modale annotation ; bascule instantanée entre diagrammes 4 et 5 cordes ; état global persistant

### 4.8.2
- 🎨 **Sélecteur de couleur par section** — bouton 🎨 dans chaque header de section ; popup avec 15 teintes prédéfinies + sélecteur de couleur libre ; indicateur live (bordure gauche colorée dans l'éditeur) ; couleur utilisée à l'impression et dans le panneau d'aperçu ; bouton de réinitialisation vers la palette automatique ; intégré à l'historique Annuler/Rétablir

### 4.8.1
- ✨ **Suffixes de section étendus** — chiffres `3` à `9` et `0` ajoutés au sélecteur de suffixe ; labels possibles : `A3`, `Chorus7`, `Head0`…

### 4.8
- ↩️ **Annuler / Rétablir** — pile 10 snapshots, Ctrl+Z/Y, couverture complète de toutes les mutations
- 📱 **Support tactile tablette** — drag & drop Touch Events, MutationObserver, pinch-to-zoom, `@media (pointer: coarse)`

### 4.7
- ✨ **`(w)` Invisible root** — basse seule sans harmonie écrite

### 4.6
- ✨ **Accord alternatif** — suggestion tritoniée auto, export/import MusicXML

### 4.5
- ✨ **Barres enrichies**, **Voltas**, **Symboles de navigation** — export/import MusicXML

### 4.4
- ✨ **Symboles iReal Pro** `%` `𝄎` `N.C.` `/` — panneau SYMBOLES RAPIDES

### 4.3 / 4.2
- ✨ Drag & drop sections et mesures

### 4.1 · 4.0 · 3.0
- 🐛 Fix PDF · ✨ Diagrammes SVG + MXL · ✨ 4 langues + JSON + MusicXML + Transposition

---

## 📋 Feuille de route

- [x] Drag & drop sections et mesures
- [x] Diagrammes SVG basse 4 et 5 cordes BEADG (7 modes diatoniques validés + modes avancés)
- [x] Import/Export MXL
- [x] Tous les symboles iReal Pro (`%` `𝄎` `N.C.` `/` `(w)`)
- [x] Barres enrichies, Voltas, Navigation
- [x] Accord alternatif
- [x] Annuler / Rétablir (10 niveaux)
- [x] Support tactile tablette
- [x] Suffixes de section 0–9
- [x] Basse 5 cordes (BEADG) — toggle 4🎸/5🎸
- [x] PDF adaptatif selon la densité des mesures
- [ ] Lecture MIDI des fondamentales
- [x] Sélecteur de couleur personnalisé par section

---

## ☕ Soutenir le projet

[![Soutenir sur Ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/lorenzovirgosfrediani)

---

## 📄 Licence · 🙏 Remerciements

**Apache 2.0** · HTML/CSS/JS vanilla · [MusicXML W3C](https://www.w3.org/2021/06/musicxml40/) · [JSZip 3.10.1](https://stuk.github.io/jszip/)

---

*𝄢 Made with love for musicians, by a bass player.*

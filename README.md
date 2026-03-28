# 𝄢 Jazz Grid Generator

> Éditeur de grilles jazz en ligne avec annotations de théorie musicale, diagrammes de manche basse, import/export MusicXML et sortie PDF optimisée.

![Licence](https://img.shields.io/badge/licence-Apache%202.0-86efac?style=flat-square)
![HTML](https://img.shields.io/badge/fait%20avec-HTML%2FJS-c4b5fd?style=flat-square)
![Langues](https://img.shields.io/badge/langues-FR%20%7C%20ES%20%7C%20IT%20%7C%20EN-7dd3fc?style=flat-square)
![Dépendances](https://img.shields.io/badge/d%C3%A9pendances-JSZip-fca5a5?style=flat-square)

[![Soutenir sur Ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/lorenzovirgosfrediani)

---

## ✨ Fonctionnalités

- 📂 **Import MusicXML** — glisser-déposer ou sélecteur de fichier, parse les accords, sections, barres de reprise, tonalité, tempo — formats `.musicxml`, `.xml` et `.mxl` (compressé)
- ✏️ **Édition complète des accords** — 17 fondamentales, 24 qualités, basse slash, saisie libre, durée par accord en temps
- 🎵 **Symboles de mesure** inspirés d'iReal Pro :
  - `%` — répétition de mesure
  - `𝄎` — répétition de 2 mesures
  - `N.C.` — No Chord (silence harmonique)
  - `/` — beat slash (pulsation sans accord précisé)
- 🎼 **Barres de mesure enrichies** — simple, double `‖`, finale `𝄂`, répétition début `|:` et fin `:|`, accessibles au survol sur le bord de chaque mesure
- 🔂 **Voltas (1ère / 2ème / 3ème fois)** — bracket visuel au-dessus des mesures
- 🧭 **Symboles de navigation** — Segno `𝄋`, Coda `𝄌`, D.C. al Coda, D.S. al Coda, D.C. al Fine, Fine, Fermata `𝄐`
- 🔀 **Accord alternatif** — petit accord en italique affiché au-dessus de l'accord principal (substitution tritoniée, anticipation…) avec suggestion automatique pour les dominantes
- 🎼 **Annotations de théorie musicale** par accord :
  - Modes compatibles avec diagramme de manche SVG dynamique (16 modes, basse 4 cordes EADG)
  - Arpèges 4 sons avec tous les renversements
  - Tensions disponibles et notes à éviter
  - Notes libres avec couleur, gras/italique
- 🎵 **Transposition** — par demi-ton (±) ou sélection directe de tonalité, gestion automatique des enharmoniques
- 🗂️ **Gestion des sections** — labels (A–I, Intro, Verse, Chorus, Bridge, Coda…), déplacement par glisser-déposer ou boutons ▲▼, duplication, annotation libre
- 📐 **Déplacement des mesures** — glisser-déposer y compris entre sections, boutons ◀▶ au survol, duplication
- 🖨️ **Impression/PDF avancée** — thème clair/sombre, contraste ajustable (5 niveaux), couleurs automatiques par section, sections jamais coupées entre deux pages, diagrammes SVG inclus dans le PDF
- 💾 **Sauvegarde JSON** — fidélité totale incluant toutes les annotations
- 🎼 **Export MusicXML / MXL** — compatible MuseScore, Sibelius, Finale, iReal Pro
- 🌐 **4 langues** — Français 🇫🇷, Espagnol 🇪🇸, Italien 🇮🇹, Anglais 🇬🇧
- 📱 **Fichier unique structuré** — HTML + CSS + JS sans build, fonctionne hors ligne (JSZip 3.10.1 intégré)

---

## 📸 Captures d'écran

<div align="center">
  <img src="Screenshots/capt1.png" alt="Interface de l'éditeur" width="80%">
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

### Option 1 — Directement dans le navigateur

Ouvrir `index.html` dans n'importe quel navigateur moderne. Aucun serveur requis.

```bash
git clone https://github.com/virgosfredianilorenzo-cyber/Jazz_grid_generator.git
cd Jazz_grid_generator
open index.html   # macOS
# ou double-cliquer sur index.html sous Windows/Linux
```

### Option 2 — GitHub Pages

1. Forker ce dépôt
2. Aller dans **Settings → Pages**
3. Définir la source sur la branche `main`, dossier racine `/`
4. L'éditeur sera accessible à `https://virgosfredianilorenzo-cyber.github.io/Jazz_grid_generator/`

### Option 3 — Hébergement statique

Déposer `index.html` sur n'importe quel hébergeur statique (Netlify, Vercel, Cloudflare Pages…). Aucune configuration nécessaire.

---

## 🎵 Guide d'utilisation

### Créer une grille

1. Cliquer sur **✨ Nouveau** — une grille vierge de 8 mesures en Do majeur s'ouvre
2. Renseigner le **titre**, la **tonalité**, le **tempo**, la **mesure** et le **style** dans l'en-tête
3. Cliquer sur un accord pour l'éditer, ou sur **+** dans une mesure pour en ajouter un
4. Dans la modale d'accord, utiliser la section **SYMBOLES RAPIDES** (`%`, `𝄎`, `N.C.`, `/`) pour les mesures spéciales
5. Cliquer sur l'icône **✏️** d'un accord pour ajouter des annotations théoriques (mode, arpège, tensions, note libre)

### Accord alternatif

Au survol d'un accord, un bouton **`♯±`** apparaît en haut à gauche du slot. Un clic ouvre un popup permettant de saisir un accord alternatif (substitution tritoniée, anticipation, accord de passage…).

- L'accord s'affiche en **petit italique ambré** au-dessus de l'accord principal
- Pour les dominantes (ex. `G7`), la **substitution tritoniée** est proposée automatiquement (`Db7`)
- Cliquer sur l'accord alternatif affiché pour le modifier ou le supprimer
- Ignoré par la transposition automatique (à retransposer manuellement si besoin)

**Export MusicXML :** exporté comme seconde `<harmony>` avec `print-frame="no"` et `<footnote>alt</footnote>` — compatible MuseScore et Sibelius.

### Barres de mesure et voltas

Au survol d'une mesure, deux boutons apparaissent sur les bords gauche `◧` et droit `◨`. Un clic ouvre un menu permettant de choisir le type de barre :

| Type | Visuel | Export MusicXML |
|------|--------|-----------------|
| Normal | `\|` | *(par défaut)* |
| Double | `‖` | `light-light` |
| Finale | `𝄂` | `light-heavy` |
| Répétition début | `\|:` | `<repeat direction="forward"/>` |
| Répétition fin | `:\|` | `<repeat direction="backward"/>` |

Le même menu permet d'ajouter un **bracket de volta** (1ère / 2ème / 3ème fois), exporté en `<ending>` MusicXML.

### Symboles de navigation

Au survol, un bouton `𝄌` apparaît en haut à droite de chaque mesure. Il ouvre un menu pour placer :

| Symbole | Affiché | Export MusicXML |
|---------|---------|-----------------|
| Segno | `𝄋` | `<segno/>` |
| Coda | `𝄌` | `<coda/>` |
| D.C. al Coda | texte | `<words>` + `<sound/>` |
| D.S. al Coda | texte | `<words>` + `<sound/>` |
| D.C. al Fine | texte | `<words>` + `<sound/>` |
| Fine | texte | `<words>Fine</words>` |
| Fermata | `𝄐` | `<fermata/>` |

### Importer un fichier MusicXML

Glisser-déposer un fichier `.musicxml`, `.xml` ou `.mxl` sur la zone de dépôt, ou cliquer sur **📂 Ouvrir MusicXML**.

Données importées :
- Symboles d'accords, accords alternatifs (`<footnote>alt</footnote>`) et durées
- Tonalité, tempo, chiffrage de mesure
- Marques de répétition → sections
- Barres de reprise, double barres, barres finales
- Voltas (`<ending>`)
- Symboles de navigation (Segno, Coda, D.C., D.S., Fine, Fermata)

### Déplacer les sections et les mesures

Chaque section et chaque mesure dispose d'une poignée **⠿** en haut à gauche. Il suffit de la saisir et de glisser l'élément à sa nouvelle position — un liseré orange indique l'emplacement d'insertion. Les mesures peuvent être déplacées **d'une section à l'autre**.

Pour un déplacement précis d'un cran, utiliser les boutons **▲ ▼** (sections) ou **◀ ▶** (mesures) qui apparaissent au survol.

### Sauvegarde et export

| Action | Format | Notes |
|--------|--------|-------|
| **💾 Export JSON** | `.json` | Fidélité totale — accords, accords alternatifs, annotations, barres, navigation |
| **📥 Import JSON** | `.json` | Recharger une session précédemment sauvegardée |
| **🎼 Export MusicXML** | `.musicxml` | Partager avec MuseScore, Sibelius, Finale, etc. |
| **🎼 Export MXL** | `.mxl` | Format compressé, idéal pour l'échange de fichiers |

> **Conseil :** Toujours utiliser le JSON pour sauvegarder son travail. L'export MusicXML ne conserve pas les annotations de théorie musicale.

### Transposition

| Contrôle | Description |
|----------|-------------|
| Boutons **− / +** | Transposer ±1 demi-ton |
| Liste déroulante | Transposer directement vers une tonalité cible |
| Bouton **↺** | Restaurer la tonalité d'origine |

Les enharmoniques sont choisis automatiquement selon la tonalité de destination (ex. F# → B♭ s'écrit B♭, pas A#). Les accords alternatifs ne sont pas transposés automatiquement.

### Impression / PDF

1. Cliquer sur **🖨️ Imprimer** pour ouvrir le panneau d'impression
2. Choisir le **thème** (clair ☀️ / sombre 🌙)
3. Régler le **contraste** (1–5) — contrôle l'épaisseur des bordures et la taille des symboles d'accords
4. Vérifier les **couleurs de sections** — chaque label de section reçoit une couleur distincte automatiquement
5. Cliquer sur **Imprimer** → utiliser **Enregistrer en PDF** dans la boîte de dialogue du navigateur

> Les sections ne sont jamais coupées à cheval sur deux pages (`break-inside: avoid`). Les barres enrichies, voltas, symboles de navigation et accords alternatifs s'impriment en noir/gris.

---

## 🎼 Moteur de théorie musicale

### Qualités d'accords prises en charge (24)

| Symbole | Qualité |
|---------|---------|
| *(vide)* | Accord majeur |
| `maj7` / `Δ7` | Majeur septième |
| `7` | Dominante septième |
| `m` | Accord mineur |
| `m7` | Mineur septième |
| `mM7` | Mineur majeur septième |
| `dim` / `°` | Accord diminué |
| `dim7` / `°7` | Septième diminuée |
| `m7b5` / `ø7` | Semi-diminué |
| `aug` | Accord augmenté |
| `sus2`, `sus4`, `7sus4` | Accords suspendus |
| `6`, `6/9` | Accords de sixte |
| `9`, `11`, `13` | Dominantes étendues |
| `maj9`, `maj13` | Majeurs étendus |
| `m9`, `m11`, `m13` | Mineurs étendus |

### Modes proposés par qualité d'accord (exemples)

| Qualité | Modes compatibles |
|---------|------------------|
| `maj7` | Ionien, Lydien |
| `7` | Mixolydien, Lydien b7, Altéré, Mixolydien b9b13 |
| `m7` | Dorien, Éolien, Phrygien |
| `m7b5` | Locrien, Locrien #2 |
| `dim7` | Diminué demi-ton |
| `mM7` | Mélodie mineure |

### Diagrammes de manche (basse 4 cordes EADG)

16 diagrammes SVG intégrés, transposés dynamiquement selon la fondamentale de l'accord. Code couleur des points :

| Couleur | Signification |
|---------|---------------|
| 🔴 Rouge | Fondamentale |
| 🟠 Ambre | Notes de l'arpège |
| 🔵 Bleu | Autres degrés de la gamme |

---

## 🗂️ Structure du projet

```
Jazz_grid_generator/
│
├── index.html          # Application complète (HTML + CSS + JS, fichier unique)
│
├── README.md           # Ce fichier
├── LICENSE             # Licence Apache 2.0
│
└── Screenshots/        # Captures d'écran
    ├── capt1.png       # Interface principale
    ├── capt2.png       # Grille avec diagramme de mode
    └── capt3.png       # Sortie PDF
```

Le fichier est organisé en **blocs délimités par des séparateurs visuels** `/* ━━━ */`. Chercher `/* ━━━ JS — NOM` dans le fichier pour naviguer directement vers une section.

| Ligne | Bloc | Contenu |
|-------|------|---------|
| L10 | `CSS — APP` | Toolbar, layout, sections, mesures, barlines, accords alternatifs |
| L208 | `CSS — MODALS` | Overlay, modales accord / annotation / section |
| L292 | `CSS — PRINT` | @media print : thèmes, couleurs, page-break |
| L348 | `HTML — STRUCTURE` | Toolbar, dropzone, éditeur, modales, barre impression |
| L530 | `JS — I18N` | Dictionnaires FR/ES/IT/EN + `setLang()` |
| L672 | `JS — SVG DIAGRAMS` | Diagrammes de modes (manche de basse) |
| L760 | `JS — THEORY ENGINE` | Gammes, arpèges, tensions, helpers chromatiques |
| L780 | `JS — PARSER` | Import MusicXML → `chartData` |
| L867 | `JS — STATE` | Variables globales + constantes barlines/navigation |
| L893 | `JS — TRANSPOSE` | Transposition demi-ton / tonalité |
| L906 | `JS — RENDER` | DOM rendering : sections, mesures, accords, symboles |
| L1078 | `JS — MODALS` | Modales accord/annotation/section + popups barline/nav/altChord |
| L1299 | `JS — ACTIONS` | add / delete / duplicate / move |
| L1313 | `JS — I/O` | Import/export JSON + MusicXML + MXL |
| L1329 | `JS — MUSICXML HELPERS` | Fonctions utilitaires export MusicXML |
| L1563 | `JS — PRINT` | Thèmes impression, palettes, CSS dynamique |
| L1583 | `JS — INIT` | Event listeners globaux, premier render |

> Les numéros de ligne sont indicatifs et évoluent à chaque release.

---

## 🌐 Internationalisation

L'interface est entièrement traduite en **4 langues**. Le changement de langue est instantané, sans rechargement de la page.

Pour ajouter une nouvelle langue, ajouter une entrée dans l'objet `LANGS` (section `JS — I18N`) et une `<option>` dans la liste déroulante `#lang-select`.

---

## 🛠️ Personnalisation

### Modifier la grille par défaut

Éditer la fonction `newChart()` (section `JS — ACTIONS`) pour changer la tonalité, le nombre de mesures ou l'accord initial.

### Ajouter une qualité d'accord

Ajouter une entrée dans :
- Le tableau `QUALITIES` (boutons de la modale)
- L'objet `ARP_DEF` (définition de l'arpège)
- L'objet `MODES_DEF` (modes compatibles)
- L'objet `TENS_DEF` (tensions disponibles)

### Ajouter un label de section

Éditer le tableau `LETTERS` (section `JS — MODALS`).

### Ajouter un symbole de mesure

1. Déclarer la valeur interne dans `isSpecialSym()`, `getSymClass()`, `getSymLabel()`
2. Ajouter le style CSS dans `CSS — APP` (classe `.sym-xxx`)
3. Ajouter le bouton dans `buildModal()` tableau `SYMS`
4. S'assurer que `transposeChordSymbol()` ignore ce symbole

### Ajouter un type de barre de mesure

1. Ajouter la valeur dans `BARLINE_TYPES` et `BARLINE_LABELS` (section `JS — STATE`)
2. Ajouter le mapping XML dans `BARLINE_XML`
3. Ajouter le style CSS dans `CSS — APP` (classe `.bl-xxx-left` / `.bl-xxx-right`)
4. Ajouter l'entrée dans les maps `blXML` / `brXML` de l'export (section `JS — MUSICXML HELPERS`)

### Ajouter un symbole de navigation

1. Ajouter la valeur dans `NAV_TYPES` et `NAV_DISPLAY` (section `JS — STATE`)
2. Ajouter l'entrée dans `openNavPopup()` (section `JS — MODALS`)
3. Ajouter le mapping XML dans l'export (section `JS — MUSICXML HELPERS`)
4. Ajouter la détection dans `parseMusicXML()` (section `JS — PARSER`)

---

## 🎸 Conçu pour les bassistes

Le panneau d'annotations est optimisé pour la **basse guitare** :

- Les **renversements d'arpèges** indiquent l'ordre exact des notes pour chaque position — utile pour mapper les positions sur une basse 4 ou 5 cordes
- Les **tensions** sont affichées en noms de notes réels (ex. *b9 → Ré♭* sur un C7) plutôt qu'en intervalles seuls
- Les **diagrammes de manche** donnent une référence visuelle immédiate au pupitre
- Les **accords alternatifs** permettent d'indiquer une substitution tritoniée ou un accord de guide tone directement sur la grille
- La **mise en page en colonnes** (1–4 mesures par ligne) s'adapte à l'impression paysage sur tablette ou pupitre

---

## 🤝 Contribuer

Les contributions sont les bienvenues ! Merci d'ouvrir une issue avant de proposer des changements importants.

```bash
# Cloner le dépôt
git clone https://github.com/virgosfredianilorenzo-cyber/Jazz_grid_generator.git

# Créer une branche de feature
git checkout -b feature/mon-amelioration

# Modifier index.html
# Tester dans un navigateur (pas de build nécessaire)

# Committer et pousser
git commit -m "feat: décrire la modification"
git push origin feature/mon-amelioration

# Ouvrir une Pull Request
```

### Convention de commits

Ce projet utilise une version simplifiée de [Conventional Commits](https://www.conventionalcommits.org/) :

| Préfixe | Usage |
|---------|-------|
| `feat:` | Nouvelle fonctionnalité |
| `fix:` | Correction de bug |
| `style:` | Modifications CSS / UI |
| `refactor:` | Restructuration sans changement de comportement |
| `docs:` | Documentation uniquement |
| `i18n:` | Mises à jour des traductions |

---

## 📝 Changelog

### 4.6
- ✨ **Accord alternatif** — petit accord en italique ambré affiché au-dessus de l'accord principal (substitution tritoniée, anticipation, accord de passage) ; suggestion automatique de la sub tritoniée pour les dominantes ; export en `<harmony print-frame="no"><footnote>alt</footnote>` MusicXML ; import depuis les fichiers MusicXML existants

### 4.5
- ✨ **Barres de mesure enrichies** — double `‖`, finale `𝄂`, répétition début `|:` et fin `:|` ; boutons `◧` / `◨` au survol ; export/import MusicXML
- ✨ **Voltas (1./2./3.)** — bracket visuel ; export/import `<ending>` MusicXML
- ✨ **Symboles de navigation** — Segno `𝄋`, Coda `𝄌`, D.C. al Coda, D.S. al Coda, D.C. al Fine, Fine, Fermata `𝄐` ; export/import MusicXML

### 4.4
- ✨ **Symboles de mesure iReal Pro** — `%`, `𝄎`, `N.C.`, `/` ; panneau SYMBOLES RAPIDES dans la modale d'accord
- 🔧 **Restructuration du fichier** — blocs CSS et JS délimités par des séparateurs `/* ━━━ */`

### 4.3
- ✨ **Déplacement des mesures** — poignée ⠿ drag & drop inter-sections, boutons ◀ ▶ au survol

### 4.2
- ✨ **Déplacement des sections** — poignée ⠿ drag & drop, boutons ▲ ▼

### 4.1
- 🐛 **Fix impression PDF** — `break-inside: avoid` sur `.section` et `.measure`

### 4.0
- ✨ **Diagrammes SVG de modes** — 16 modes, basse 4 cordes EADG, transposition dynamique
- ✨ **Export / Import MXL** — format compressé via JSZip 3.10.1

### 3.0
- ✨ Sélecteur de langue (FR / ES / IT / EN), Export/Import JSON, Export MusicXML, Transposition, Panneau d'impression avancé

---

## 📋 Feuille de route

- [x] Déplacement des sections et mesures par glisser-déposer
- [x] Diagrammes de manche SVG (basse 4 cordes, 16 modes)
- [x] Import/Export MXL compressé
- [x] Symboles de mesure iReal Pro (`%`, `𝄎`, `N.C.`, `/`)
- [x] Barres de mesure enrichies (double, finale, répétitions)
- [x] Voltas (1./2./3.) — export/import MusicXML
- [x] Symboles de navigation (Coda, Segno, D.C., D.S., Fine, Fermata)
- [x] Accord alternatif (small chord) — export/import MusicXML
- [x] Sections non coupées à l'impression PDF
- [x] Fichier structuré en blocs commentés
- [ ] Invisible root `(w)` — basse visible sans harmonie
- [ ] Basse 5 cordes (BEADG) — variantes des diagrammes
- [ ] Historique Annuler / Rétablir
- [ ] Import iReal Pro `.irealbook`
- [ ] Lecture MIDI des notes de fondamentale
- [ ] Support des gestes tactiles (mobile)
- [ ] Sélecteur de couleur personnalisé par section

---

## ☕ Soutenir le projet

Cet outil est **gratuit et open source**. Si tu le trouves utile pour tes sessions, tes cours ou tes répètes, tu peux soutenir son développement sur Ko-fi :

[![Soutenir sur Ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/lorenzovirgosfrediani)

Chaque contribution, même modeste, aide à financer le temps passé à développer de nouvelles fonctionnalités (basse 5 cordes, undo/redo, import iReal Pro…).

---

## 📄 Licence

Ce projet est distribué sous licence **Apache 2.0** — voir le fichier [LICENSE](LICENSE) pour les détails.

---

## 🙏 Remerciements

- Développé en HTML, CSS et JavaScript vanilla — sans framework ni bundler
- Format MusicXML par [MakeMusic / W3C Music Notation Community Group](https://www.w3.org/2021/06/musicxml40/)
- Compression MXL via [JSZip](https://stuk.github.io/jszip/) 3.10.1
- Conventions de symboles d'accords inspirées des lead sheets jazz (iReal Pro, Hal Leonard)

---

*𝄢 Made with love for musicians, by a bass player.*

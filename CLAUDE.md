# CLAUDE.md — Jazz Grid Generator

This file provides guidance for AI assistants (Claude Code and similar tools) working in this repository.

## Project Overview

**Jazz Grid Generator** est un éditeur de grilles d'accords jazz (lead sheets / chord charts) fonctionnant entièrement dans le navigateur. Il permet d'importer des fichiers `.musicxml`, d'éditer les accords, d'annoter les mesures avec des informations de théorie musicale (modes, arpèges, tensions), puis d'exporter en MusicXML, JSON ou d'imprimer directement.

- **Technologie :** HTML/CSS/JavaScript vanilla — application mono-fichier, aucune dépendance externe
- **Licence :** Apache 2.0
- **Auteur :** virgosfredianilorenzo-cyber
- **Statut :** Application fonctionnelle, développée dans `LV_JazzGrid_Editor.html`

## Repository Structure

```
Jazz_grid_generator/
├── CLAUDE.md                  # Ce fichier
├── LICENSE                    # Apache License 2.0
├── README.md                  # Description du projet (en français)
└── LV_JazzGrid_Editor.html    # Application complète (source unique)
```

> **Important :** Toute la logique de l'application réside dans `LV_JazzGrid_Editor.html`. Il n'y a pas de build system, pas de bundler, pas de framework — un seul fichier HTML autonome.

## Architecture du fichier HTML

Le fichier est organisé en trois blocs principaux :

### 1. `<style>` — CSS

Thème sombre avec accent doré (`#f0a500`). Sections notables :
- **Toolbar** : barre d'outils collante en haut
- **Dropzone** : zone de dépôt de fichier MusicXML
- **Chart editor** : en-tête du thème + conteneur de sections
- **`.section` / `.section-header`** : blocs par section (A, B, chorus…)
- **`.measure` / `.measure-beats` / `.beat`** : cellules de grille
- **`.measure-theory`** : zone d'annotation théorique en bas de mesure
- **`#modal-overlay` / `#modal`** : modal d'édition d'accord
- **`#annot-overlay` / `#annot-modal`** : modal d'annotation musicale
- **`@media print`** : styles d'impression (fond blanc, éléments UI masqués)

### 2. `<body>` — HTML

Structure principale :
```
#toolbar              ← boutons d'action globaux
#dropzone             ← écran d'accueil (masqué après import)
#chart-editor
  #chart-header       ← titre, tonalité, tempo, mesure, style
  #sections-container ← généré dynamiquement par render()
#modal-overlay        ← modal chord editor (caché par défaut)
#annot-overlay        ← modal annotation (caché par défaut)
```

### 3. `<script>` — JavaScript

Organisé en sections commentées :

| Section | Rôle |
|---------|------|
| **MUSIC THEORY ENGINE** | Calcul des notes (transposition, arpèges, modes, tensions) |
| **DATA MODEL** | Structure `chartData` + constantes (roots, qualities, extensions) |
| **MUSICXML PARSER** | Import `.musicxml` → `chartData` |
| **RENDER** | `chartData` → DOM |
| **ANNOTATION MODAL** | Logique du modal d'annotation par mesure |
| **CHORD MODAL** | Logique du modal d'édition d'accord |
| **CHART ACTIONS** | Ajout/suppression de sections et mesures |
| **Export / Import** | MusicXML export, JSON export/import |
| **Event listeners** | Fichiers, drag & drop, clavier, méta-champs |

## Modèle de données (`chartData`)

```javascript
chartData = {
  title:   string,      // Titre du thème
  key:     string,      // Tonalité ex: "C", "Bb", "F#"
  tempo:   number,      // BPM
  timeSig: string,      // ex: "4/4", "3/4"
  style:   string,      // ex: "Swing", "Bossa"
  sections: [
    {
      label:      string,       // Nom de section ex: "A", "B", "Chorus"
      annotation: string|null,  // Annotation libre de section
      measures: [
        {
          number:      number,
          repeatStart: boolean,
          repeatEnd:   boolean,
          chords: [
            { symbol: string, beats: number }
            // symbol ex: "Cmaj7", "Bb7/F", "Am7b5"
          ],
          annotation: {          // null si aucune annotation
            showMode:  boolean,
            showArp:   boolean,
            showTens:  boolean,
            showFree:  boolean,
            modeIdx:   number,   // index dans MODES_DEF[quality]
            invIdx:    number,   // index du renversement (0–3)
            selTens:   string[], // tensions sélectionnées ex: ["b9","#11"]
            freeText:  string,
            freeColor: string,   // couleur CSS hex
            freeBold:  boolean,
            freeItalic: boolean,
          } | null
        }
      ]
    }
  ]
}
```

## Moteur de théorie musicale

### Constantes
- **`CHROMATIC`** : échelle chromatique à 12 notes (`['C','C#','D',…,'B']`)
- **`ENH`** : enharmoniques (`'C#'↔'Db'`, `'F#'↔'Gb'`, etc.)
- **`ROOTS`** : 17 fondamentales possibles dans l'interface
- **`QUALITIES`** : 24 qualités d'accords (de `''` majeur à `'7sus4'`)
- **`EXTS`** : 9 altérations/extensions (`b5`, `#5`, `b9`, `#9`, `#11`, `b13`, `add9`, `add11`, `omit3`)

### Fonctions utilitaires
- **`noteIdx(n)`** : index chromatique d'une note (gère les enharmoniques)
- **`tr(root, semitones)`** : transposition d'une note de N demi-tons (respecte les bémols)
- **`parseChordSym(sym)`** : extrait `{root, quality}` d'un symbole d'accord

### `ARP_DEF` — Arpèges 4 sons
Dictionnaire indexé par qualité. Chaque entrée contient :
- `i` : intervalles en demi-tons depuis la fondamentale
- `n` : noms de degrés (`'1'`, `'b3'`, `'5'`, `'b7'`, etc.)

### `MODES_DEF` — Modes compatibles
Dictionnaire indexé par qualité. Chaque entrée est un tableau de modes :
```javascript
{ name: 'Dorien', desc: '1 2 b3 4 5 6 b7', i: [0,2,3,5,7,9,10] }
```
Exemples : `'7'` → [Mixolydien, Lydien b7, Mixt. b9b13, Altéré] ; `'m7'` → [Dorien, Éolien, Phrygien]

### `TENS_DEF` — Tensions disponibles / à éviter
Dictionnaire indexé par qualité :
```javascript
{ a: ['b9','9','#9','#11','b13','13'],  // available
  av: [] }                               // avoid
```

### `TENSION_IV` — Intervalles des tensions
Associe chaque tension à son intervalle en demi-tons (`'b9':1`, `'9':2`, `'#11':6`, etc.)

## Fonctions clés à connaître

| Fonction | Description |
|----------|-------------|
| `parseMusicXML(xmlStr)` | Parse un fichier MusicXML → `chartData` complet |
| `render()` | Reconstruit tout le DOM à partir de `chartData` |
| `renderSection(section, si)` | Génère le bloc HTML d'une section |
| `renderMeasure(measure, si, mi)` | Génère le bloc HTML d'une mesure |
| `fmtChord(sym)` | Formate un symbole pour l'affichage (`maj7→Δ7`, `m7b5→ø7`, `dim7→°7`) |
| `getArpNotes(root, quality)` | Retourne les 4 notes de l'arpège |
| `getInversions(root, quality)` | Retourne les 4 renversements avec notes et degrés |
| `buildModal()` | Initialise les boutons du chord modal (appelé une seule fois au démarrage) |
| `openModal(si, mi, ci, chord)` | Ouvre le modal d'édition d'accord |
| `applyChord()` | Applique les modifications d'accord → `chartData` → `render()` |
| `deleteChord()` | Supprime un accord de la mesure |
| `openAnnotModal(si, mi)` | Ouvre le modal d'annotation musicale |
| `applyAnnotation()` | Applique l'annotation → `chartData` → `render()` |
| `clearAnnotation()` | Efface toutes les annotations d'une mesure |
| `toggleSection(key)` | Bascule l'affichage d'un bloc (mode/arp/tens/free) dans le modal annotation |
| `exportMusicXML()` | Génère et télécharge un fichier `.musicxml` MusicXML 3.1 |
| `exportJSON()` | Génère et télécharge `chartData` en JSON |
| `newChart()` | Crée un thème vierge (8 mesures, section A, Cmaj7) |
| `addSection()` / `duplicateSection(si)` / `deleteSection(si)` | Gestion des sections |
| `addMeasure(si)` / `deleteMeasure(si, mi)` | Gestion des mesures |

## Variables d'état globales

```javascript
chartData         // modèle de données principal
editingTarget     // { si, mi, ci } — cible du chord modal
selectedRoot      // fondamentale sélectionnée dans le chord modal
selectedQuality   // qualité sélectionnée dans le chord modal
selectedExts      // extensions sélectionnées (tableau)
annotTarget       // { si, mi } — cible de l'annotation modal
selectedAnnotColor // couleur hex de l'annotation libre
aShow             // { mode, arp, tens, free } — toggles d'affichage
aState            // { modeIdx, invIdx, selTens } — état courant dans le modal
```

## Conventions de code

- **Indices** : `si` = section index, `mi` = measure index, `ci` = chord index
- **DOM** : manipulation vanilla (`createElement`, `appendChild`, `classList`)
- **Événements** : mix de `onclick` inline et `addEventListener`
- **Pas de framework** : aucun React, Vue, jQuery — JS natif uniquement
- **Rendu** : entièrement impératif, `render()` reconstruit tout le DOM à chaque modification
- **Symboles jazz** : `Δ7` (maj7), `ø7` (m7b5), `°7` (dim7), `°` (dim) dans l'affichage
- **MusicXML 3.1** : format cible pour l'export (DTD Recordare)
- **`DIVISIONS = 2`** : valeur de `<divisions>` dans l'export MusicXML (noire = 2 divisions)

## Fonctionnalités UI

| Fonctionnalité | Implémentation |
|----------------|----------------|
| Importation MusicXML | `<input type="file">` + `FileReader` + `parseMusicXML()` |
| Drag & drop | Events `dragover`/`drop` sur `#dropzone` |
| Édition d'accord | Clic sur un beat → `openModal()` |
| Annotation de mesure | Clic sur icône ✏️ → `openAnnotModal()` |
| Annotation de section | `<input>` inline dans le header de section |
| Suppression de mesure | Bouton ✕ visible au survol (haut-droit de la mesure) |
| Colonnes de grille | `<select id="global-cols">` → CSS grid `repeat(N, 1fr)` |
| Impression | `window.print()` + `@media print` CSS |
| Export JSON | `Blob` + URL temporaire + `<a>.click()` |
| Export MusicXML | Génération XML string + `Blob` + téléchargement |
| Fermeture modals | Touche `Escape` + clic sur l'overlay |

## Flux de données

```
Fichier .musicxml
      ↓ parseMusicXML()
   chartData
      ↓ render()
      DOM
      ↓ (édition utilisateur)
   chartData  →  exportJSON() / exportMusicXML()
```

## Git Conventions

### Branches

- `master` — branche stable ; n'y fusionner que du code testé
- `claude/<session-id>` — branches de travail AI (ex: `claude/claude-md-mm5ry2hoearvctix-KlTay`)
- `feature/<description>` — nouvelles fonctionnalités
- `fix/<description>` — corrections de bugs

### Messages de commit

Impératif, ligne courte (≤72 cars), corps optionnel :

```
Add export MusicXML 3.1 with harmony elements

Generate <harmony> elements for each chord with root, kind, and optional
bass note. Include <rehearsal> marks for section labels.
```

### Pull Requests

- Un PR = une fonctionnalité ou correction
- Décrire *ce qui change* et *pourquoi*
- Ne jamais pousser directement sur `master`

## Concepts clés du domaine

| Terme | Signification |
|-------|---------------|
| **Jazz grid** | Grille d'accords : symboles d'accords sur une grille bars × temps |
| **MusicXML** | Format XML ouvert pour la notation musicale (`.musicxml` / `.xml`) |
| **`<harmony>`** | Élément MusicXML portant le symbole d'accord |
| **`<measure>`** | Élément MusicXML représentant une mesure |
| **Qualité d'accord** | Majeur, mineur, dominant 7e, diminué, etc. |
| **Renversement** | Disposition des notes d'un accord (position fondamentale, 1er, 2ème, 3ème) |
| **Tension** | Extension d'accord (9, 11, 13 et leurs altérations) |
| **Mode** | Gamme associée à un accord (Dorien, Mixolydien, Altéré, etc.) |
| **Lead sheet** | Partition simplifiée : mélodie + symboles d'accords |

## Fichiers importants

| Fichier | Rôle |
|---------|------|
| `LV_JazzGrid_Editor.html` | Application complète — source unique |
| `README.md` | Description publique du projet (en français) |
| `LICENSE` | Apache 2.0 |
| `CLAUDE.md` | Ce fichier — guide pour assistants AI |

## Directives pour les assistants AI

1. **Lire avant de modifier.** Toujours lire le fichier HTML avant d'y toucher ; ne jamais supposer son contenu.
2. **Modifications minimales.** Ne changer que ce qui est demandé ; éviter les refactorisations non sollicitées.
3. **Pas de nouvelle structure inventée.** Ne pas créer de fichiers ou répertoires qui n'ont pas été demandés.
4. **Respecter la licence.** Tout code ou dépendance ajouté doit être compatible Apache 2.0.
5. **Pas de dépendances externes.** L'application est intentionnellement sans dépendance — ne pas introduire de CDN, npm, ou bibliothèques sans accord explicite.
6. **Préserver le pattern de rendu.** Le rendu est impératif et reconstruit le DOM entier via `render()` ; respecter ce pattern.
7. **Discipline de branches.** Travailler sur la branche `claude/` désignée ; ne jamais pousser sur `master`.
8. **README en français.** Le README est en français — le conserver ainsi.
9. **Tester dans le navigateur.** Toute modification de la logique JS doit être vérifiable en ouvrant le fichier HTML dans un navigateur.
10. **Demander avant de refactoriser.** Si une restructuration importante semble nécessaire (diviser en plusieurs fichiers, introduire un bundler), confirmer avec l'auteur d'abord.

## État actuel (au 2026-03-01)

- L'application est **fonctionnelle et complète** dans `LV_JazzGrid_Editor.html`.
- Stack : HTML/CSS/JS vanilla, aucune dépendance externe, aucun build system.
- Fonctionnalités implémentées : import MusicXML, édition complète de grille, annotations musicales (modes/arpèges/tensions/texte libre), export MusicXML 3.1, export/import JSON, impression.
- Le moteur de théorie musicale couvre 24 qualités d'accords, modes compatibles, arpèges avec renversements, et tensions disponibles/à éviter.
- Aucun framework de test n'est configuré.
- Aucune CI/CD n'est en place.

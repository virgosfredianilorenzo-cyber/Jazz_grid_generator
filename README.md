# 𝄢 Jazz Grid Generator

> Éditeur de grilles jazz en ligne — assistant IA, théorie musicale, diagrammes de manche basse, import/export MusicXML, sortie PDF.

![Version](https://img.shields.io/badge/version-5.0-f0a500?style=flat-square)
![Licence](https://img.shields.io/badge/licence-Apache%202.0-86efac?style=flat-square)
![HTML](https://img.shields.io/badge/built%20with-HTML%2FJS-c4b5fd?style=flat-square)
![Langues](https://img.shields.io/badge/langues-FR%20%7C%20ES%20%7C%20IT%20%7C%20EN-7dd3fc?style=flat-square)
![Sans dépendances](https://img.shields.io/badge/dépendances-aucune-fca5a5?style=flat-square)

**🌐 Démo live** : https://www.virgos.fr/JazzGridGenerator/

![Aperçu de l'application](Screenshots/capt1.png)

Crée des grilles jazz à partir d'un document vierge ou depuis un fichier MusicXML (iReal Pro®, MuseScore®…). Édite, transpose, annote, puis exporte en PDF — prêt à utiliser sur ta tablette lors de concerts ou jam sessions.

---

## ✨ Fonctionnalités

- 🤖 **Assistant IA conversationnel** — panneau en bas de page, piloté en langage naturel : crée, modifie et supprime sections, mesures, accords et annotations ; transpose tout le chart ; aperçu avant application avec boutons Appliquer / Annuler
- 📂 **Import MusicXML** — drag & drop ou sélecteur de fichier ; parse les accords, sections, barres de reprise, tonalité, tempo (iReal Pro®, MuseScore®, Sibelius, Finale…)
- 📦 **Import / Export MXL** — format MusicXML compressé
- ✏️ **Édition complète des accords** — 17 fondamentales, 24 qualités, basse en slash, saisie libre, durée par accord
- 🔄 **Accord alternatif** — substitution tritoniée avec suggestion automatique
- 🎼 **Annotations de théorie musicale** par accord : modes compatibles, arpèges à 4 sons avec inversions, tensions disponibles, notes à éviter, notes libres
- 🎸 **Diagrammes de manche basse 4 et 5 cordes** — toggle 🎸 4/5 dans la toolbar ; 17 modes en 5 cordes (BEADG) ; transposition automatique selon la fondamentale ; 🔴 fondamentale · 🟡 arpège · 🔵 autres degrés
- 🎵 **Transposition** — par demi-ton (±) ou sélection directe de tonalité, avec gestion enharmonique
- 🗂️ **Gestion des sections** — labels (A–I, Intro, Verse, Chorus, Bridge, Coda…), suffixes chiffrés, dupliquer, réordonner, annoter ; ID unique `#xxxx` dans l'en-tête
- 🔀 **Drag & drop** — sections et mesures déplaçables à la souris et au toucher
- 🎵 **Symboles de mesure** — `%`, `𝄎`, `N.C.`, `/`, `(w)` basse seule
- 🔢 **Barres de mesure enrichies** — normale, double, finale, reprise début/fin ; export/import MusicXML
- 🎼 **Voltas et symboles de navigation** — 1ère/2ème/3ème fois, Segno, Coda, D.C., D.S., Fine
- ↩️ **Annuler / Rétablir** — 10 niveaux, raccourcis Ctrl+Z / Ctrl+Y, couverture complète de toutes les actions
- 📱 **Support tactile tablette** — drag & drop au doigt, pinch-to-zoom, cibles agrandies
- 🖨️ **Impression / PDF avancée** — thème clair/sombre, contraste ajustable, colorisation par section, réduction de police automatique sur mesures multi-accords ; option 1-page (fonte réduite pour tenir sur A4) ; masquage optionnel des symboles de navigation (barres de reprise, voltas, segno/coda/fine)
- 🎭 **Mode concert** — au démarrage du play, l'interface se masque entièrement (sauf la grille) ; barre flottante en bas avec compteur de mesure et bouton stop ; clic sur la grille pour revenir
- 🥁 **Métronome** — bouton ♩ indépendant dans la toolbar (calé sur le tempo et la métrique du chart) ; activable aussi depuis la dialog de lecture pour jouer synchronisé avec les accords ; volume ajustable, persisté entre sessions
- 🖥️ **Plein écran** — bouton `⛶` dans la toolbar ; masque le chrome du navigateur (barre d'adresse, onglets) ; second clic ou `Échap` pour sortir
- 💡 **Wake lock** — désactive la mise en veille de l'écran en plein écran ; re-demandé automatiquement si l'onglet reprend le focus
- 💾 **Sauvegarde du travail en cours (JSON)** — reprise exacte à l'identique, accords, annotations et sections inclus
- 🎼 **Export MusicXML** — compatible MuseScore®, Sibelius, Finale, iReal Pro®
- 🎹 **Export MIDI** — Standard MIDI File (Type 0) : voicings d'accords piano (ch 0) + basse (ch 1) ; choix du nombre de répétitions
- ▶ **Lecteur intégré** — écoute la grille dans le navigateur via SoundFont (piano acoustique + basse, CDN) ; suit barres de reprise, voltas, D.C./D.S. al Coda, Fine ; mesure surlignée en temps réel ; barre d'espace pour play/stop ; choix du nombre de boucles ; voicings jazz étalés sur 2 octaves (extensions 9/11/13 incluses) ; accords slash (ex. `C/E`) respectés à la basse
- 🗂️ **Toolbar rationalisée** — menu 📁 Fichier (Nouveau, Ouvrir, Importer, Sauvegarder) et menu ⬆ Exporter (MusicXML, MXL, MIDI, Imprimer)
- 🌐 **4 langues** — Français 🇫🇷, Espagnol 🇪🇸, Italien 🇮🇹, Anglais 🇬🇧
- ⚡ **Sans build** — ouvre `index.html` directement dans un navigateur ; le cœur de l'app fonctionne hors ligne (MXL, IA et SoundFont nécessitent une connexion)

---

## 🚀 Démarrage

> Ce projet est une application web statique : **aucune installation, aucun serveur, aucune dépendance**. Il suffit d'un navigateur.

### Option A — Utiliser la version en ligne (le plus simple)

Ouvre directement **https://www.virgos.fr/JazzGridGenerator/** dans ton navigateur.

Rien à installer. Fonctionne sur ordinateur, tablette et smartphone.

---

### Option B — Utiliser en local (fonctionne hors ligne)

Si tu veux utiliser l'application sans connexion internet (les fonctions IA et le lecteur audio nécessitent quand même une connexion), tu peux télécharger le projet et l'ouvrir localement.

#### Méthode 1 — Télécharger le ZIP (sans git)

1. Ouvre la page du repo : https://github.com/virgosfredianilorenzo-cyber/Jazz_grid_generator
2. Clique sur le bouton vert **`< > Code`**
3. Clique sur **Download ZIP**
4. Décompresse le fichier téléchargé où tu veux
5. Entre dans le dossier décompressé, puis double-clique sur **`index.html`**

> Le fichier s'ouvre dans ton navigateur par défaut. L'application est prête.

#### Méthode 2 — Cloner avec git

Si tu as `git` installé :

```bash
git clone https://github.com/virgosfredianilorenzo-cyber/Jazz_grid_generator.git
cd Jazz_grid_generator
```

Puis ouvre `index.html` dans ton navigateur. Tu peux le faire de deux façons :
- **Double-cliquer** sur le fichier `index.html` dans ton explorateur de fichiers
- Ou depuis le terminal :
  ```bash
  xdg-open index.html        # Linux
  open index.html            # macOS
  start index.html           # Windows
  ```

> Si tu n'as pas `git` : `sudo apt install git` (Ubuntu/Debian) ou `sudo dnf install git` (Fedora).

---

### Option C — Héberger sur son propre serveur

L'application est entièrement statique : dépose simplement les fichiers sur n'importe quel hébergeur web.

```
Netlify, Vercel, Cloudflare Pages, GitHub Pages, Apache, Nginx…
```

Il n'y a aucune configuration côté serveur. Aucun backend. Aucune base de données.

---

## 🤖 Configurer l'assistant IA

L'assistant IA est optionnel. Si tu veux l'utiliser, il te faut une clé API (Claude ou OpenAI®).

### Obtenir une clé API

- **Claude (Anthropic)** — crée un compte sur [console.anthropic.com](https://console.anthropic.com), puis génère une clé dans *API Keys*
- **OpenAI®** — crée un compte sur [platform.openai.com](https://platform.openai.com), puis génère une clé dans *API keys*

> Les clés API sont payantes à l'usage, mais les tarifs sont très faibles pour un usage personnel.

### Configurer dans l'application

1. Ouvre l'application
2. Clique sur l'onglet **✦ IA** en bas à droite
3. Clique sur **⚙** (icône engrenage) dans l'en-tête du panneau
4. Sélectionne ton provider (Claude ou OpenAI®) et le modèle souhaité
5. Colle ta clé API dans le champ prévu

> Ta clé est stockée **uniquement dans ton navigateur** (localStorage). Elle n'est jamais envoyée ailleurs que vers l'API du provider choisi.

| Paramètre | Valeurs disponibles |
|-----------|---------------------|
| Provider | Claude (Anthropic) · OpenAI® |
| Modèle Claude | `claude-sonnet-4-6`, `claude-opus-4-8` |
| Modèle OpenAI® | `gpt-4o`, `gpt-4o-mini` |

<details>
<summary>Outils disponibles</summary>

| Catégorie | Outils |
|-----------|--------|
| Chart | `set_chart_metadata`, `transpose_chart`, `set_columns`, `set_bass_strings` |
| Sections | `add_section`, `duplicate_section`, `rename_section`, `remove_section` |
| Mesures | `add_bar`, `duplicate_bar`, `remove_bar`, `set_barline` |
| Accords | `add_chord`, `edit_chord`, `remove_chord`, `set_chord_alt` |
| Annotations | `set_annotation` (avec `showSvg`), `toggle_all_diagrams` |

</details>

### Flux de travail IA

1. Écris une instruction en langage naturel
2. L'IA résume ce qu'elle va faire, puis appelle les outils nécessaires
3. Un aperçu liste les changements (*"Section B ajoutée"*, *"Dm7 → D7 mes. 3"*…)
4. **Appliquer** → modifications appliquées, snapshot undo créé
5. **Annuler** → rien ne change

---

## Architecture du projet

<details>
<summary>Voir l'arborescence</summary>

```
index.html
css/
├── app.css          ← styles UI, toolbar, toggle 4/5 cordes, panneau IA
├── modals.css       ← styles des modales
└── print.css        ← styles impression, réduction police multi-accords
js/
├── i18n.js          ← dictionnaire de traductions (FR/ES/IT/EN)
├── diagrams.js      ← SVG basse 4 et 5 cordes, transposition des diagrammes
├── theory.js        ← moteur de théorie (gammes, arpèges, tensions)
├── state.js         ← état global partagé entre les modules
├── render.js        ← rendu DOM de la grille
├── modals.js        ← modales accord et annotation
├── actions.js       ← mutations de la grille, auto-annotation à l'import
├── print.js         ← thème impression et colorisation par section
├── touch.js         ← support tactile (Touch Events, pinch-to-zoom)
├── ai.js            ← assistant IA (providers, outils, draft, chat, settings)
└── init.js          ← initialisation, restauration de la session
doc/
└── doc.html         ← documentation complète en ligne
```

</details>

---

## 🎸 Diagrammes basse

<details>
<summary>Modes disponibles en 5 cordes (17/17)</summary>

| Mode | Clé `diagrams.js` | Mode | Clé `diagrams.js` |
|------|-------------------|------|-------------------|
| Ionien | `Ionien_5` | Lydien b7 | `LydienB7_5` |
| Dorien | `Dorien_5` | Altéré | `Altere_5` |
| Phrygien | `Phrygien_5` | Mélodie mineure | `MelodieMineure_5` |
| Lydien | `Lydien_5` | Min. harmonique | `MinHarmonique_5` |
| Mixolydien | `Mixolydien_5` | Mixolydien b9b13 | `MixolydienB9B13_5` |
| Éolien | `Aeolien_5` | Lydien augmenté | `LydienAugmente_5` |
| Locrien | `Locrien_5` | Locrien #2 | `LocrienDiese2_5` |
| Dim. demi-ton | `DimDemiTon_5` | Dim. ton-demi | `DimTonDemi_5` |
| Tons entiers | `TonsEntiers_5` | | |

</details>

---

## ↩️ Annuler / Rétablir

<details>
<summary>Couverture complète</summary>

| Action | Couverte |
|--------|----------|
| Ajout / suppression / duplication d'accord | ✅ |
| Modification d'annotation | ✅ |
| Ajout / suppression / duplication de mesure | ✅ |
| Ajout / suppression de section | ✅ |
| Drag & drop section ou mesure | ✅ |
| Modification de barline | ✅ |
| Volta (1ère / 2ème / 3ème) | ✅ |
| Symbole de navigation | ✅ |
| Accord alternatif | ✅ |
| Application d'un draft IA | ✅ |

Profondeur : **10 niveaux**.

</details>

---

## 🎼 Théorie musicale

<details>
<summary>Modes suggérés par qualité d'accord</summary>

| Qualité | Modes suggérés |
|---------|---------------|
| `maj7` | Ionien, Lydien, Lydien augmenté |
| `7` | Mixolydien, Lydien b7, Altéré, Mixolydien b9b13 |
| `m7` | Dorien, Éolien, Phrygien, Min. harmonique |
| `m7b5` | Locrien, Locrien #2 |
| `dim7` | Dim. ton-demi, Dim. demi-ton |
| `mM7` | Mélodie mineure, Lydien augmenté, Min. harmonique |
| `aug` | Tons entiers |

</details>

---

## 📱 Support tablette

<details>
<summary>Détails techniques</summary>

- **Drag & drop tactile** — Touch Events sur sections et mesures
- **Pinch-to-zoom** — pincer la grille pour zoomer (0.5× à 2×)
- **Cibles agrandies** — `@media (pointer: coarse)` augmente les boutons barline, nav, accord
- **MutationObserver** — les éléments ajoutés après un render sont automatiquement patchés

</details>

---

## 🖨️ Impression / PDF

<details>
<summary>Réglages fins</summary>

**Mesures multi-accords**

| Nombre d'accords | Symbole | Zone théorie | Hauteur max |
|-----------------|---------|--------------|-------------|
| 2 accords | 0.72rem | 0.52rem | 2.6em |
| 3+ accords | 0.62rem | 0.44rem | 2.2em |

**Menus popup** — barlines, voltas et navigation se repositionnent automatiquement pour rester dans l'écran.

</details>

---

## 📋 Changelog

### v5.0 (juillet 2026)
- ✅ Plein écran — bouton `⛶` dans la toolbar ; masque le chrome du navigateur ; second clic ou `Échap` pour sortir ; synchronisé avec le bouton natif du navigateur via `fullscreenchange`
- ✅ Wake lock — désactive la mise en veille de l'écran en plein écran ; relâché à la sortie ; re-demandé si l'onglet reprend le focus ; échec silencieux sur Firefox

### v4.9 (juin 2026)
- ✅ Mode concert — au play, l'UI se masque (sauf la grille) ; barre flottante avec compteur de mesure et stop ; clic grille pour revenir
- ✅ Métronome — bouton ♩ dans la toolbar (indépendant) + option dans la dialog de lecture (synchronisé aux accords) ; calé sur tempo et métrique ; volume ajustable et persisté
- ✅ Impression 1-page — option pour réduire la fonte et faire tenir toute la grille sur une page A4
- ✅ Symboles nav à l'impression — masqués par défaut, affichables via option ; couleur d'impression forcée en noir pour visibilité optimale

### v4.8 (juin 2026)
- ✅ Voicings jazz dans le lecteur — étalement sur 2 octaves (chaque note strictement au-dessus de la précédente), toutes les extensions (9e, 11e, 13e) incluses, accords slash (`C/E`, `Dm7/F`…) respectés à la basse

### v4.7 (juin 2026)
- ✅ Export MIDI — Standard MIDI File (Type 0) avec voicings piano + basse, sélecteur de répétitions
- ✅ Lecteur intégré — Web Audio + SoundFont (piano acoustique + basse depuis CDN) ; navigation complète (repeats, voltas, D.C./D.S. al Coda, Fine) ; highlight mesure en cours ; barre d'espace play/stop
- ✅ Toolbar rationalisée — menus déroulants 📁 Fichier et ⬆ Exporter ; 7 zones distinctes au lieu de 17 boutons éparpillés

### v4.6 (mai 2026)
- ✅ Import MusicXML (`.musicxml`, `.xml`, `.mxl`) dans le Songbook, au même titre que les `.json` JGG
- ✅ Fix auto-scroll Songbook — la boucle rAF ne s'arrêtait plus immédiatement si l'iframe n'avait pas encore de contenu overflow

### v4.5 (mai 2026)
- ✅ Jazz Songbook — application compagnon (`songbook/`) : bibliothèque de morceaux, setlists, lecteur audio, auto-scroll réglable
- ✅ Intégration iframe JGG en mode view (`?mode=view`) depuis le Songbook
- ✅ BLE-MIDI — connexion HX Stomp, envoi Program Change + CC via Web Bluetooth
- ✅ IndexedDB — persistance locale songs/setlists/audioblobs
- ✅ Mode view JGG : masquage UI d'édition, navigation setlist précédent/suivant

### v4.4 (mai 2026)
- ✅ Avertissement avant fermeture de l'onglet si des modifications non sauvegardées sont en cours (flag `_isDirty`, listener `beforeunload`)

### v4.3 (mai 2026)
- ✅ ID unique par section (`#xxxx`), persisté en JSON, masqué à l'impression ; migration automatique des fichiers anciens
- ✅ Nouvel outil IA `toggle_all_diagrams`
- ✅ `set_annotation` expose `showSvg` pour contrôler la visibilité du diagramme
- ✅ Fix : export/import MXL restauré ; champs méta lisibles à l'impression

### v4.2 (mai 2026)
- ✅ Rendu Markdown dans les réponses IA — paragraphes, listes, **gras**, *italique*, `code`

### v4.0 (mai 2026)
- ✅ Assistant IA conversationnel — Claude et OpenAI®
- ✅ 15 outils IA : sections, mesures, accords, annotations, métadonnées, transposition
- ✅ Flux draft-preview-apply avec liste des changements et undo intégré
- ✅ Panneau IA en barre du bas, pleine largeur

→ [Historique complet](CHANGELOG.md)

---

## 📋 Feuille de route

- [ ] Sélecteur de couleur personnalisé par section
- [ ] Import iReal Pro® `.irealbook`
- [ ] Instrument de percussion / métronome dans le lecteur

---

## 📄 Licence

Apache 2.0 — *𝄢 Made with love for musicians, by a bass player.*

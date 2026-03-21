# 𝄢 Jazz Grid Generator

> Éditeur de grilles jazz en ligne avec annotations de théorie musicale, diagrammes de manche basse, import/export MusicXML et sortie PDF optimisée.

![Licence](https://img.shields.io/badge/licence-Apache%202.0-86efac?style=flat-square)
![HTML](https://img.shields.io/badge/fait%20avec-HTML%2FJS-c4b5fd?style=flat-square)
![Langues](https://img.shields.io/badge/langues-FR%20%7C%20ES%20%7C%20IT%20%7C%20EN-7dd3fc?style=flat-square)
![Dépendances](https://img.shields.io/badge/d%C3%A9pendances-JSZip-fca5a5?style=flat-square)

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/lorenzovirgosfrediani)

---

## ✨ Fonctionnalités

- 📂 **Import MusicXML** — glisser-déposer ou sélecteur de fichier, parse les accords, sections, barres de reprise, tonalité, tempo — formats `.musicxml`, `.xml` et `.mxl` (compressé)
- ✏️ **Édition complète des accords** — 17 fondamentales, 24 qualités, basse slash, saisie libre, durée par accord en temps
- 🎼 **Annotations de théorie musicale** par accord :
  - Modes compatibles avec diagramme de manche SVG dynamique (16 modes, basse 4 cordes EADG)
  - Arpèges 4 sons avec tous les renversements
  - Tensions disponibles et notes à éviter
  - Notes libres avec couleur, gras/italique
- 🎵 **Transposition** — par demi-ton (±) ou sélection directe de tonalité, gestion automatique des enharmoniques
- 🗂️ **Gestion des sections** — labels (A–I, Intro, Verse, Chorus, Bridge, Coda…), déplacement par glisser-déposer ou boutons ▲▼, duplication, annotation libre
- 📐 **Déplacement des mesures** — glisser-déposer y compris entre sections, boutons ◀▶ au survol, duplication
- 🖨️ **Impression/PDF avancée** — thème clair/sombre, contraste ajustable (5 niveaux), couleurs automatiques par section, diagrammes SVG inclus dans le PDF
- 💾 **Sauvegarde JSON** — fidélité totale incluant toutes les annotations
- 🎼 **Export MusicXML / MXL** — compatible MuseScore, Sibelius, Finale, iReal Pro
- 🌐 **4 langues** — Français 🇫🇷, Espagnol 🇪🇸, Italien 🇮🇹, Anglais 🇬🇧
- 📱 **Fichier unique** — HTML + CSS + JS sans build, fonctionne hors ligne (JSZip 3.10.1 intégré)

---

## 📸 Captures d'écran

> *(À compléter — `docs/capture-sombre.png`, `docs/capture-pdf.png`, etc.)*

---

## 🚀 Démarrage rapide

### Option 1 — Directement dans le navigateur

Ouvrir `index.html` dans n'importe quel navigateur moderne. Aucun serveur requis.

```bash
git clone https://github.com/your-username/jazz-chart-editor.git
cd jazz-chart-editor
open index.html   # macOS
# ou double-cliquer sur index.html sous Windows/Linux
```

### Option 2 — GitHub Pages

1. Forker ce dépôt
2. Aller dans **Settings → Pages**
3. Définir la source sur la branche `main`, dossier racine `/`
4. L'éditeur sera accessible à `https://your-username.github.io/jazz-chart-editor/`

### Option 3 — Hébergement statique

Déposer `index.html` sur n'importe quel hébergeur statique (Netlify, Vercel, Cloudflare Pages…). Aucune configuration nécessaire.

---

## 🎵 Guide d'utilisation

### Créer une grille

1. Cliquer sur **✨ Nouveau** — une grille vierge de 8 mesures en Do majeur s'ouvre
2. Renseigner le **titre**, la **tonalité**, le **tempo**, la **mesure** et le **style** dans l'en-tête
3. Cliquer sur un accord pour l'éditer, ou sur **+** dans une mesure pour en ajouter un
4. Cliquer sur l'icône **✏️** d'un accord pour ajouter des annotations théoriques (mode, arpège, tensions, note libre)

### Importer un fichier MusicXML

Glisser-déposer un fichier `.musicxml`, `.xml` ou `.mxl` sur la zone de dépôt, ou cliquer sur **📂 Ouvrir MusicXML**.

Données importées :
- Symboles d'accords et durées
- Tonalité, tempo, chiffrage de mesure
- Marques de répétition → sections
- Barres de reprise

### Déplacer les sections et les mesures

Chaque section et chaque mesure dispose d'une poignée **⠿** en haut à gauche. Il suffit de la saisir et de glisser l'élément à sa nouvelle position — un liseré orange indique l'emplacement d'insertion. Les mesures peuvent être déplacées **d'une section à l'autre**.

Pour un déplacement précis d'un cran, utiliser les boutons **▲ ▼** (sections) ou **◀ ▶** (mesures) qui apparaissent au survol.

### Sauvegarde et export

| Action | Format | Notes |
|--------|--------|-------|
| **💾 Export JSON** | `.json` | Fidélité totale — accords, annotations, couleurs |
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

Les enharmoniques sont choisis automatiquement selon la tonalité de destination (ex. F# → B♭ s'écrit B♭, pas A#).

### Impression / PDF

1. Cliquer sur **🖨️ Imprimer** pour ouvrir le panneau d'impression
2. Choisir le **thème** (clair ☀️ / sombre 🌙)
3. Régler le **contraste** (1–5) — contrôle l'épaisseur des bordures et la taille des symboles d'accords
4. Vérifier les **couleurs de sections** — chaque label de section reçoit une couleur distincte automatiquement
5. Cliquer sur **Imprimer** → utiliser **Enregistrer en PDF** dans la boîte de dialogue du navigateur

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
jazz-chart-editor/
│
├── index.html          # Application complète (HTML + CSS + JS, fichier unique)
│
├── README.md           # Ce fichier
├── LICENSE             # Licence Apache 2.0
│
└── docs/               # Optionnel — captures d'écran, manuel PDF
    ├── capture-sombre.png
    ├── capture-pdf.png
    └── manuel-fr.pdf
```

Le code JavaScript est organisé en modules logiques délimités par des commentaires :

- `i18n` — dictionnaire de traduction et changement de langue
- `theory` — moteur musical (gammes, arpèges, tensions, transposition)
- `parser` — parseur MusicXML / MXL
- `state` — état de l'application
- `transpose` — logique de transposition
- `render` — rendu DOM
- `modals` — dialogues d'édition d'accords et d'annotations
- `actions` — mutations de la grille (ajout, suppression, duplication, déplacement)
- `io` — import/export (JSON, MusicXML, MXL)
- `print` — thème et système de couleurs pour l'impression
- `app` — initialisation et événements globaux

---

## 🌐 Internationalisation

L'interface est entièrement traduite en **4 langues**. Le changement de langue est instantané, sans rechargement de la page.

Pour ajouter une nouvelle langue, ajouter une entrée dans l'objet `LANGS` dans `index.html` et une `<option>` dans la liste déroulante `#lang-select`.

---

## 🛠️ Personnalisation

### Modifier la grille par défaut

Éditer la fonction `newChart()` pour changer la tonalité, le nombre de mesures ou l'accord initial.

### Ajouter une qualité d'accord

Ajouter une entrée dans :
- Le tableau `QUALITIES` (boutons de la modale)
- L'objet `ARP_DEF` (définition de l'arpège)
- L'objet `MODES_DEF` (modes compatibles)
- L'objet `TENS_DEF` (tensions disponibles)

### Ajouter un label de section

Éditer le tableau `LETTERS`.

---

## 🎸 Conçu pour les bassistes

Le panneau d'annotations est optimisé pour la **basse guitare** :

- Les **renversements d'arpèges** indiquent l'ordre exact des notes pour chaque position — utile pour mapper les positions sur une basse 4 ou 5 cordes
- Les **tensions** sont affichées en noms de notes réels (ex. *b9 → Ré♭* sur un C7) plutôt qu'en intervalles seuls
- Les **diagrammes de manche** donnent une référence visuelle immédiate au pupitre
- La **mise en page en colonnes** (1–4 mesures par ligne) s'adapte à l'impression paysage sur tablette ou pupitre

---

## 🤝 Contribuer

Les contributions sont les bienvenues ! Merci d'ouvrir une issue avant de proposer des changements importants.

```bash
# Cloner le dépôt
git clone https://github.com/your-username/jazz-chart-editor.git

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

### 4.3
- ✨ **Déplacement des mesures** — poignée ⠿ drag & drop sur chaque mesure (y compris entre sections), boutons ◀ ▶ au survol pour déplacer d'un cran dans la même section

### 4.2
- ✨ **Déplacement des sections** — poignée ⠿ drag & drop avec indicateur visuel orange, boutons ▲ ▼ pour monter/descendre d'un cran

### 4.1
- 🐛 **Fix impression PDF** — la grille ne commence plus en page 2 : suppression du `min-height:100vh` à l'impression, `page-break-inside:avoid` déplacé au niveau `.measure`, header compacté, `#chart-editor` forcé visible

### 4.0
- ✨ **Diagrammes SVG de modes** — 16 diagrammes de manche basse 4 cordes (EADG) : Ionien, Dorien, Phrygien, Lydien, Mixolydien, Éolien, Locrien, Lydien b7, Mixolydien b9b13, Altéré, Mélodie mineure, Lydien augmenté, Locrien #2, Dim. ton-demi, Dim. demi-ton, Tons entiers
- ✨ **Transposition des diagrammes** — notes recalculées dynamiquement (rouge = fondamentale, ambre = arpège, bleu = gamme)
- ✨ **Export / Import MXL** — format MusicXML compressé via JSZip 3.10.1
- ✨ **Système de labels compact** — `A:` arpège, `T:` tensions, liste des modes alternatifs sous chaque accord
- 🐛 Fix CSS impression : textes SVG noirs/gras, notes dans les points blanches, lignes de manche sombres

### 3.0
- ✨ Sélecteur de langue intégré (FR / ES / IT / EN)
- ✨ Export/Import JSON
- ✨ Export MusicXML
- ✨ Transposition par demi-ton et par tonalité cible
- ✨ Annotations de section (texte libre)
- ✨ Panneau d'impression avancé (thème, contraste, couleurs par section)

---

## 📋 Feuille de route

- [x] Déplacement des sections par glisser-déposer
- [x] Déplacement des mesures par glisser-déposer (inter-sections)
- [x] Diagrammes de manche SVG (basse 4 cordes, 16 modes)
- [x] Import/Export MXL compressé
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
- Rendu des symboles d'accords inspiré des conventions des lead sheets jazz (iReal Pro, Hal Leonard)

---

*𝄢 Made with love for musicians, by a bass player.*

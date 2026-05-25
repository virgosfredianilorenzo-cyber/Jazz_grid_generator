# Jazz Songbook — Design Spec v4.5

**Date :** 2026-05-25
**Statut :** Approuvé
**Contexte :** Nouvelle app standalone complémentaire à Jazz Grid Generator (JGG v4.4)

---

## 1. Objectif

Construire une app de gestion de répertoire et de performance scénique ("Songbook") qui :
- centralise les morceaux du musicien (grilles JGG + backing tracks + presets MIDI)
- permet de créer des setlists ordonnées
- affiche la grille JGG scrollable en concert
- joue les backing tracks audio (MP3/WAV)
- envoie automatiquement les presets au HX Stomp via BLE-MIDI (Web Bluetooth)

**Cas d'usage dual :** répétition (pratique avec backing tracks) et concert (setlist + contrôle HX Stomp sur scène).

---

## 2. Périmètre

### Inclus (v4.5)
- Bibliothèque de morceaux (import JSON JGG, métadonnées, tags)
- Setlists ordonnées avec drag & drop
- Vue morceau : grille JGG scrollable + player audio + navigation setlist
- Lecteur audio MP3/WAV par morceau (stocké en IndexedDB)
- Connexion BLE-MIDI au HX Stomp (Web Bluetooth)
- Envoi automatique PC + CCs à chaque changement de morceau
- 100% offline après premier chargement

### Hors scope v4.5
- Sync cloud / backup
- Génération MIDI depuis la grille JGG
- Métronome
- Partage de setlists

---

## 3. Architecture

### Positionnement
Nouvelle app dans le même repo que JGG, dossier `/songbook/`. Même philosophie : HTML/CSS/JS, sans build, ouvrir directement dans Chrome. Déployée sur `virgos.fr/JazzGridGenerator/songbook/`.

JGG reste intact sur son URL actuelle. Le Songbook **réutilise les modules JS de JGG** (`render.js`, `theory.js`, `diagrams.js`) via des balises `<script src="../js/...">` — pas d'iframe, pas de duplication. Les modules JGG exposent des fonctions globales, pas d'ES modules.

### Structure de fichiers
```
/songbook/
  index.html
  css/
    app.css        ← styles Songbook (tablet-first)
    player.css     ← player audio
  js/
    db.js          ← IndexedDB (songs, setlists, audioblobs)
    player.js      ← lecteur audio (Web Audio API)
    midi.js        ← Web Bluetooth + BLE-MIDI
    ui.js          ← navigation, vues, routing
    init.js        ← initialisation, restauration état
```

### Plateforme cible
- **Primaire :** tablette Android, Chrome (pupitre répétition/concert)
- **Secondaire :** desktop Chrome
- iOS/Safari explicitement hors scope

---

## 4. Modèle de données (IndexedDB)

### Store `songs`
```js
{
  id: string,           // UUID
  title: string,
  key: string,          // ex: "Cm", "F#"
  tempo: number,        // BPM
  style: string,        // ex: "Swing", "Bossa"
  jggJson: object,      // contenu JSON JGG complet
  audioFileId: string,  // référence vers store audioblobs (nullable)
  scrollSpeed: number,  // px/s pour l'auto-scroll (défaut: 30)
  midiPreset: {
    channel: number,    // 1–16
    programChange: number | null,  // 0–127
    cc: [{ number: number, value: number }]  // tableau ordonné
  },
  tags: string[],
  createdAt: string,    // ISO 8601
  updatedAt: string
}
```

### Store `setlists`
```js
{
  id: string,
  name: string,
  date: string | null,  // ISO 8601, optionnel
  songIds: string[]     // ordre de la setlist
}
```

### Store `audioblobs`
```js
{
  id: string,
  songId: string,
  filename: string,
  mimeType: string,     // "audio/mpeg" | "audio/wav"
  data: ArrayBuffer
}
```

---

## 5. UI / Navigation

### Layout général (tablet landscape)
Navigation fixe en bas (3 onglets, accessibles au pouce) :
- **Bibliothèque** — liste morceaux, recherche, import
- **Setlists** — liste setlists, création, réordonnancement
- **Connexion** — état BLE-MIDI, configuration

### Vue morceau (vue principale sur scène)
```
┌─────────────────────────────────────┐
│  ← Setlist    TITRE      BPM   KEY  │  ← header fixe
│                              🔵 BLE │
├─────────────────────────────────────┤
│                                     │
│        GRILLE JGG (scrollable)      │
│                                     │
│                                     │
├─────────────────────────────────────┤
│  ▶  0:00  ══════════════  3:42  🔊  │  ← player fixe
│  [← Morceau précédent]  [Suivant →] │
└─────────────────────────────────────┘
```

- Header et player restent fixes, grille scrollable au centre
- Boutons Prev/Next larges (touch-friendly)
- Changement de morceau : grille + audio + envoi MIDI automatique
- Pastille BLE dans le header : verte (connecté) / rouge (déconnecté)
- Si le morceau est ouvert hors contexte setlist (depuis la bibliothèque) : Prev/Next masqués, header affiche "Bibliothèque" à la place

### Vue bibliothèque
- Liste avec titre, tonalité, BPM, tags
- Recherche par titre, tag, tonalité
- Tap → vue morceau ; tap long → édition
- Bouton "+" → import JSON JGG

### Vue setlist
- Liste des morceaux dans l'ordre
- Drag & drop pour réordonner
- Bouton ▶ → mode performance (vue morceau du premier)

---

## 6. BLE-MIDI

### Connexion
- `navigator.bluetooth.requestDevice()` filtré sur le service BLE-MIDI UUID : `03B80E5A-EDE8-4B33-A751-6CE34EC4C700`
- Reconnexion automatique au démarrage si un device est mémorisé en `localStorage`
- Indicateur visuel permanent dans le header

### Envoi des messages (par changement de morceau)
Séquence dans l'ordre :
1. Program Change : `[0xC{channel-1}, programChange]` (si défini)
2. Pour chaque CC dans le tableau : `[0xB{channel-1}, cc.number, cc.value]`

Limite : 128 presets par bank, pas de Bank Select nécessaire.

### Configuration par morceau
Formulaire dans l'écran d'édition :
```
Canal MIDI : [1 ▾]
Program Change : [12]    (laisser vide = pas de PC)
[+ Ajouter CC]
  CC [64]  Valeur [127]  [×]
  CC [69]  Valeur [0]    [×]
```

---

## 7. Audio Player

- Import MP3/WAV via file picker → stocké comme ArrayBuffer dans IndexedDB
- Lecture via balise `<audio>` avec blob URL créée depuis l'ArrayBuffer
- Contrôles : play/pause, seek (barre de progression), volume
- Le player continue lors du scroll de la grille
- Pas de sync tempo/grille en v4.5

### Auto-scroll de la grille
- Bouton ⏵ dans le header de la vue morceau pour activer/désactiver le défilement automatique
- Vitesse réglable par morceau (px/s), persistée dans le store `songs`
- Contrôle inline : curseur glissant accessible sans quitter la vue (tap long sur ⏵ ou panneau dédié)
- Pause automatique du scroll quand l'utilisateur touche la grille ; reprise au relâchement

---

## 8. Import d'un morceau

1. Tap "+" → file picker → sélectionner `.json` JGG
2. Extraction automatique : `title`, `key`, `tempo`, `style` depuis le JSON
3. Formulaire pré-rempli, compléter : tags, preset MIDI, fichier audio (optionnel)
4. Sauvegarder → morceau disponible en bibliothèque

Édition ultérieure : tap long → modifier métadonnées, remplacer audio, changer preset MIDI, re-importer un JSON JGG.

---

## 9. Offline & déploiement

- Fonctionne 100% offline après premier chargement (aucune dépendance CDN)
- Données stockées localement dans le navigateur (IndexedDB) — pas de sync cloud v4.5
- Déployé dans le même repo, dossier `/songbook/`
- BLE-MIDI requiert Chrome Android (contrainte navigateur, pas contournable)

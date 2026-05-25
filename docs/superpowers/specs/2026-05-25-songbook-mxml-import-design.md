# Design — Import MusicXML dans le Jazz Songbook

**Date :** 2026-05-25  
**Contexte :** Le Songbook accepte uniquement les fichiers `.json` JGG. Le JGG sait déjà parser les MusicXML (`.musicxml`, `.xml`, `.mxl`). On réutilise cette logique pour permettre l'import MusicXML dans le Songbook.  
**Objectif :** Étendre le modal d'import du Songbook pour accepter les formats `.json`, `.musicxml`, `.xml` et `.mxl`, sans modifier le JGG ni créer de couplage entre les deux apps.

---

## Architecture

**Approche retenue :** Copier les fonctions de parsing dans un fichier dédié au Songbook (autonomie totale, zéro risque de régression JGG).

| Fichier | Action |
|---|---|
| `songbook/js/mxml.js` | **Nouveau** — `parseMusicXML(xmlStr)` + `loadFileAsXML(file)` |
| `songbook/index.html` | Ajouter JSZip CDN + `<script src="js/mxml.js">` + mettre à jour le modal |
| `songbook/js/ui.js` | Étendre le handler `import-json-file` pour brancher JSON vs MusicXML |

---

## `songbook/js/mxml.js`

Deux fonctions copiées depuis le JGG, sans modification :

- **`parseMusicXML(xmlStr)`** — parsée depuis `js/theory.js`. Prend une chaîne XML, retourne un objet `chartData` au format JGG (sections, accords, titre, tonalité, tempo, time signature).
- **`loadFileAsXML(file)`** — copiée depuis `js/actions.js`. Prend un objet `File`. Retourne une `Promise<string>` (chaîne XML) :
  - `.mxl` → décompresse via JSZip, lit le fichier XML racine depuis `META-INF/container.xml` (ou premier `.xml`/`.musicxml` en fallback)
  - `.musicxml` / `.xml` → lecture directe via `FileReader`

---

## `songbook/index.html`

**JSZip CDN** (nécessaire pour `.mxl`) ajouté avant les scripts Songbook :
```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js"></script>
```

**`<script src="js/mxml.js">`** ajouté avant `js/ui.js`.

**Modal d'import** — deux changements :
- Label : `Fichier JGG (.json) ou MusicXML (.musicxml, .xml, .mxl) *`
- Input : `accept=".json,.musicxml,.xml,.mxl"`

---

## Data flow import

```
Fichier sélectionné
    ├── .json           → JSON.parse(text)     → _pendingJson = chartData
    └── .musicxml       →
        .xml            → loadFileAsXML(file)  → parseMusicXML(xmlStr) → _pendingJson = chartData
        .mxl (JSZip)   →
```

Dans les deux cas, après parsing :
- `document.getElementById('import-title').value` ← `chartData.title || nom_fichier`
- `document.getElementById('import-key').value` ← `chartData.key || ''`
- `document.getElementById('import-tempo').value` ← `chartData.tempo || 120`

À la sauvegarde (`btn-import-save`) : `song.jggJson = _pendingJson` — aucun changement nécessaire dans le code de sauvegarde.

---

## Gestion des erreurs

| Cas | Message |
|---|---|
| Fichier MusicXML malformé | `alert('Fichier MusicXML invalide.')` |
| `.mxl` sans XML à l'intérieur | `alert('Aucun MusicXML trouvé dans le fichier .mxl.')` |
| `.mxl` et JSZip non chargé (hors ligne) | `alert('JSZip non disponible. Connexion internet requise pour les fichiers .mxl.')` |
| Extension non reconnue | Ignoré silencieusement (le input `accept` filtre en amont) |

---

## Hors scope

- Export MusicXML depuis le Songbook
- Modification du JGG ou de ses fichiers partagés
- Support drag & drop MusicXML (le Songbook n'a pas de dropzone)
- Validation approfondie du MusicXML (la fonction copiée gère les cas courants)

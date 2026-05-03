# Design : Intégration IA conversationnelle — Jazz Grid Generator

**Date :** 2026-05-03
**Statut :** Approuvé

---

## Objectif

Ajouter un assistant IA conversationnel au sein de la version Split de Jazz Grid Generator. L'utilisateur peut dialoguer en langage naturel pour créer, modifier et supprimer tous les éléments de la grille (sections, mesures, accords, annotations, métadonnées). L'IA agit via du function calling natif sur un état draft, que l'utilisateur valide avant application.

---

## Architecture globale

5 nouveaux fichiers dans `Split/js/`, sans modification des fichiers existants sauf `init.js` (branchement) et `index.html` (tiroir + bouton) :

```
Split/js/
├── ai-provider.js    ← abstraction multi-provider (Claude / OpenAI)
├── ai-tools.js       ← définition + exécuteurs des outils IA
├── ai-draft.js       ← gestion de l'état draft + diff + preview
├── ai-chat.js        ← interface tiroir, historique, orchestration
└── ai-settings.js    ← config provider/clé API (localStorage)
```

### Flux de données

```
Message utilisateur
  → ai-chat.js construit le contexte (system prompt + chartData JSON + historique)
  → ai-provider.js envoie à l'API (Claude ou OpenAI) avec la liste des outils
  → L'IA répond : texte + tool calls
  → ai-draft.js applique les tool calls sur une copie du chartData
  → Le tiroir affiche le message + aperçu visuel des changements
  → Utilisateur clique "Appliquer" → chartData mis à jour, undo snapshot, re-render
                         "Annuler" → draft abandonné
```

**Contrainte :** les fichiers existants (`state.js`, `actions.js`, `render.js`) ne sont pas modifiés. Les outils IA manipulent le draft JSON directement (mêmes transformations de données que l'UI, mais sur la copie). Une fois validé, c'est `renderAll()` qui prend en charge l'affichage.

---

## Outils IA (Tool Registry)

### Chart global
| Outil | Paramètres | Description |
|-------|-----------|-------------|
| `set_chart_metadata` | `title, key, tempo, timeSignature, style` | Modifier les métadonnées du chart |
| `transpose_chart` | `semitones` | Transposer tout le chart |
| `set_columns` | `count` (1-4) | Changer le nombre de colonnes par ligne |
| `set_bass_strings` | `count` (4 ou 5) | Basculer EADG ↔ BEADG, met à jour les SVG |

### Sections
| Outil | Paramètres | Description |
|-------|-----------|-------------|
| `add_section` | `label, suffix, position` | Ajouter une section (A, B, Intro…) |
| `remove_section` | `sectionIndex` | Supprimer une section |
| `rename_section` | `sectionIndex, label, suffix` | Renommer une section |

### Mesures & accords
| Outil | Paramètres | Description |
|-------|-----------|-------------|
| `add_bar` | `sectionIndex, position` | Ajouter une mesure vide |
| `remove_bar` | `sectionIndex, barIndex` | Supprimer une mesure |
| `set_barline` | `sectionIndex, barIndex, type` | Type de barre (normal, double, repeat, final…) |
| `add_chord` | `sectionIndex, barIndex, root, quality, extensions, beats` | Ajouter un accord |
| `edit_chord` | `sectionIndex, barIndex, chordIndex, root, quality, extensions, beats` | Modifier un accord |
| `remove_chord` | `sectionIndex, barIndex, chordIndex` | Supprimer un accord |
| `set_chord_alt` | `sectionIndex, barIndex, chordIndex, altSymbol` | Définir l'accord alternatif |

### Annotations
| Outil | Paramètres | Description |
|-------|-----------|-------------|
| `set_annotation` | `sectionIndex, barIndex, chordIndex, mode, arpeggio, tensions, freeText` | Annoter un accord |

---

## Mécanisme de Preview (état draft)

1. **Draft** — `JSON.parse(JSON.stringify(chartData))` → copie profonde indépendante
2. **Application** — chaque tool call s'exécute sur le draft uniquement
3. **Diff** — comparaison draft vs état actuel → liste de changements lisibles :
   - *"Section B ajoutée"*
   - *"Mesure 3 : Dm7 → D7"*
   - *"Tempo : 120 → 140"*
4. **Affichage** — tiroir affiche message IA + encadré coloré listant les changements
5. **Validation** :
   - **"Appliquer"** → `chartData = draft`, `pushUndo()`, `renderAll()`
   - **"Annuler"** → draft supprimé, rien ne change

**Cas sans tool call** (question théorique, conseil d'impro) → seul le message s'affiche, pas de preview.

---

## Interface utilisateur

### Bouton d'ouverture
Icône IA ajoutée dans la toolbar existante, à côté des boutons d'action.

### Tiroir coulissant (~380px, côté droit)
```
┌─────────────────────────────┐
│ ✕  Assistant IA    ⚙ Config │
├─────────────────────────────┤
│                             │
│  [historique des messages]  │
│                             │
│  ┌─ Preview ──────────────┐ │
│  │ • Section B ajoutée    │ │
│  │ • Dm7 → D7 (mes. 3)   │ │
│  │  [Appliquer] [Annuler] │ │
│  └────────────────────────┘ │
├─────────────────────────────┤
│ [Tapez votre message...] ➤  │
└─────────────────────────────┘
```

### Panneau config (⚙)
- **Provider** : menu déroulant Claude / OpenAI
- **Modèle** : selon provider (`claude-sonnet-4-6`, `gpt-4o`, etc.)
- **Clé API** : champ texte, stockée en `localStorage`, jamais transmise ailleurs
- **Langue** : suit automatiquement la langue active de l'app

### Responsive
Sur mobile/tablette : tiroir en overlay plein écran (cohérent avec le support tactile existant).

---

## Contexte envoyé à l'IA

### System prompt
```
Tu es un assistant musical intégré à Jazz Grid Generator.
Tu aides l'utilisateur à construire et modifier des grilles jazz.
Tu as accès à des outils pour modifier la grille.
Avant d'agir, résume ce que tu vas faire.
Si une demande est ambiguë, pose une question de clarification plutôt que d'agir.
Réponds dans la langue : {langue active}.
```

### Contexte dynamique (à chaque tour)
```json
{
  "chart": { ...chartData actuel... },
  "bassStrings": 4,
  "language": "fr"
}
```

### Historique
10 derniers tours conservés en mémoire, pour maintenir la cohérence des échanges.

### Taille estimée
Chart standard (~20 mesures) : ~3-5 Ko de JSON. Très raisonnable pour tous les providers.

---

## Providers supportés

| Provider | Modèles suggérés | API Function Calling |
|----------|-----------------|---------------------|
| Anthropic (Claude) | `claude-sonnet-4-6`, `claude-opus-4-7` | Tool use natif |
| OpenAI | `gpt-4o`, `gpt-4o-mini` | Function calling natif |

La couche `ai-provider.js` abstrait les différences de format entre les deux APIs.

---

## Ce qui n'est pas dans ce scope

- Import/export (MusicXML, JSON, PDF) — l'IA ne déclenche pas ces actions
- Modification des thèmes d'impression
- Undo/redo manuel via l'IA (on s'appuie sur le système existant)

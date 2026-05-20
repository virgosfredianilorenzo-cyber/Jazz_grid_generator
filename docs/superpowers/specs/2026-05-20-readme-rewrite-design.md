# Design : Réécriture des README — v4.3

**Date :** 2026-05-20  
**Approche retenue :** Option B — Restructuration équilibrée (musicien + développeur)

---

## Objectif

Réécrire `README.md` (FR) et `README.en.md` (EN) pour qu'ils reflètent l'état réel du projet v4.3 :
- Supprimer toutes les références à `Split/` (dossier vide, architecture périmée)
- Adopter un ton accessible pour les musiciens en haut, technique pour les développeurs en bas
- Replier les grandes tables dans des blocs `<details>`
- Alléger le changelog (3 versions dans le README, historique complet dans `CHANGELOG.md`)
- Corriger le badge version (4.2 → 4.3)
- Ajouter le symbole ® sur MuseScore®, iReal Pro®, OpenAI®
- Supprimer le dossier `Split/` du repo

---

## Structure des deux README

Les deux fichiers (FR + EN) partagent exactement les mêmes sections dans le même ordre.

```
1. Hero
2. Fonctionnalités
3. Assistant IA
4. Démarrage
5. Sections techniques (<details>)
6. Changelog
7. Feuille de route
8. Licence
```

---

## Section 1 — Hero

- Titre `# 𝄢 Jazz Grid Generator`
- Tagline (1 ligne, orientée usage musicien)
- Badges : version 4.3 · Apache 2.0 · HTML/JS · FR|ES|IT|EN · sans dépendances
- **🌐 Démo live** : lien vers virgos.fr/JazzGridGenerator/
- Screenshot : `Screenshots/capt1.png` immédiatement sous le lien
- Description : 3 lignes max, orientée usage (créer, importer, exporter PDF pour concerts)

---

## Section 2 — Fonctionnalités

- Bullet points avec emojis, même ordre que l'actuel
- Langage orienté musicien : pas de noms de variables JS, pas de noms de fonctions
- Code technique (`localStorage`, noms de fichiers, clés de dictionnaire) retiré de cette section — migre dans les `<details>` développeur
- Sauvegarde JSON **mise en valeur explicitement** : *"Sauvegarde du travail en cours (JSON) et reprise exacte à l'identique — accords, annotations, sections, tout est conservé."*
- Mentions MuseScore® et iReal Pro® avec symbole ®

---

## Section 3 — Assistant IA

- Intro courte sur l'ouverture du panneau
- **Tableau de configuration visible** (providers, modèles, clé API) — utile à l'utilisateur
- **Tableau des outils dans un `<details>`** (trop technique pour la lecture courante)
- **Flux de travail visible** (5 étapes) — explique concrètement comment ça marche
- Mention OpenAI®

---

## Section 4 — Démarrage

Une seule section, trois cas d'usage (plus de "Option 1 / Option 2") :

1. **En ligne** — lien direct
2. **En local** — clone + ouvrir `index.html`, aucun build
3. **Sur hébergeur** — déposer les fichiers, liste d'exemples (Netlify, Vercel, Cloudflare Pages, Apache…)

Suivi d'un `<details>` **Architecture du projet** (pour les développeurs) :
- Liste des fichiers à la racine : `index.html`, `css/`, `js/`, `doc/`
- Contenu de `js/` listé avec rôle de chaque fichier
- **Aucune mention de `Split/`**

---

## Section 5 — Sections techniques (`<details>`)

Cinq blocs repliés, contenu des tables conservé à l'identique :

| Bloc | Contenu |
|------|---------|
| `🎸 Modes disponibles en 5 cordes (17/17)` | Tableau 2 colonnes mode / clé diagrams.js |
| `↩️ Couverture Annuler / Rétablir` | Tableau actions / ✅ |
| `🎼 Modes suggérés par qualité d'accord` | Tableau qualité / modes |
| `📱 Support tablette — détails techniques` | Touch Events, MutationObserver, pinch-to-zoom |
| `🖨️ Impression / PDF — réglages fins` | Tailles de police multi-accords, menus popup |

---

## Section 6 — Changelog

Trois versions dans le README, lien vers `CHANGELOG.md` pour le reste :

- **v4.3** (mai 2026) — ID section, toggle_all_diagrams, fix MXL, fix impression
- **v4.2** (mai 2026) — Rendu Markdown IA
- **v4.0** (mai 2026) — Assistant IA conversationnel, 15 outils, panneau pleine largeur

`→ [Historique complet](CHANGELOG.md)`

**`CHANGELOG.md`** (créé à la racine) contient v3.0, v2.0, v1.0 avec le même niveau de détail qu'aujourd'hui.

---

## Section 7 — Feuille de route

Conservée à l'identique :
- Lecture MIDI des notes fondamentales
- Sélecteur de couleur personnalisé par section
- Import iReal Pro® `.irealbook`

---

## Section 8 — Licence

Conservée à l'identique : `Apache 2.0 — 𝄢 Made with love for musicians, by a bass player.`

---

## Fichiers à modifier / créer / supprimer

| Fichier | Action |
|---------|--------|
| `README.md` | Réécriture complète |
| `README.en.md` | Réécriture complète (traduction EN synchronisée) |
| `CHANGELOG.md` | Créer à la racine (v3.0 + v2.0 + v1.0) |
| `Split/` | Supprimer du repo (`git rm -r Split/`) |

---

## Règles transversales

- Symbole ® sur : **MuseScore®**, **iReal Pro®**, **OpenAI®** — à chaque mention dans les deux fichiers
- Aucune mention de `Split/`, de "version autonome", de "fichier HTML monolithique"
- Badge version : `4.3` dans les deux fichiers
- Les deux README restent synchronisés structurellement (même sections, même ordre)

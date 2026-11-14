# Tablature d'arpège — design (court)

Date : 2026-11-14 · Taille : petit chantier

## Intention

Pour chaque accord, pouvoir basculer le schéma de manche du mode vers une **tablature basse de l'arpège** : les notes à jouer, avec leurs numéros de cases, dans l'ordre, et le degré sous chaque note. On lit directement quoi jouer, au lieu de chercher les notes de l'arpège dans la forme du mode. Référence visuelle fournie par Lorenzo : tablature avec cordes nommées à gauche, cases sur les cordes, degrés dessous, fondamentale en rouge — l'idée, pas le design.

## Objectifs

- Interrupteur par accord « Schéma : Mode / Arpège », dans la fenêtre d'annotation.
- Vue Arpège = tablature générée par le code, dans le même cadre que le schéma de mode.
- Notes : l'arpège de l'accord **avec les extensions de son nom** (9, 11, 13, 6/9).
- Suit le réglage 4 cordes (EADG) / 5 cordes (BEADG).

## Non-objectifs

- Pas de gamme du mode dans la tablature (seulement l'arpège).
- Pas de tensions cochées dans l'annotation (♭9, ♯11…) : la tablature suit seulement le nom de l'accord.
- Pas de renversements dans la tablature : elle part toujours de la fondamentale (le renversement choisi reste sur la ligne texte « A: »).
- La ligne texte « A: » et la fenêtre d'annotation (pastilles, renversements) restent à 4 sons, inchangées.
- Pas de nouvel outil pour l'assistant IA.

## Anti-objectifs

- Les grilles existantes ne doivent pas changer d'aspect : défaut = « Mode ».
- La tablature ne doit pas avoir l'air d'un autre programme que les schémas de mode.

## Approches

- **A. Réutiliser le schéma du mode**, en ne gardant que les ronds de l'arpège (2 → 9, 4 → 11, 6 → 13). Très peu de code, même style, mais ce n'est pas une tablature : pas de cases, pas d'ordre de jeu.
- **B. Tablature dessinée par le code** — **retenue** : c'est ce qui correspond à la référence (cases réelles, notes dans l'ordre de jeu, degrés dessous). Plus de travail : dessin à créer, position sur le manche à calculer.
- *Écartée* : SVG à la main par qualité d'accord (les cases changent avec la fondamentale, il faudrait les recalculer de toute façon) ; tablature en HTML/CSS (impression et mise à l'échelle moins fiables, style différent des SVG existants).

## Ce qui est décidé

- **Stockage** : `annot.diagram = 'arp'` ; absent ou `'mode'` = schéma du mode. Sauvegardé dans le JSON avec le reste de l'annotation.
- **Interrupteur** : dans la section Mode de la fenêtre d'annotation, deux boutons « Mode | Arpège ». La vue s'affiche dans les mêmes conditions que le schéma aujourd'hui (Mode coché, et pas masqué pour une mesure à plusieurs accords).
- **Arpèges étendus** (nouvelle table à côté de `ARP_DEF`, `theory.js`) :

  | Qualité | Degrés |
  |---|---|
  | maj7, m7, 7, m7b5, dim7, mM7, 6, m6, 7sus4 | 4 sons, comme `ARP_DEF` |
  | triades ('', m, dim, aug, sus2, sus4) | comme `ARP_DEF` (avec l'octave) |
  | maj9 | 1 3 5 7 9 |
  | maj13 | 1 3 5 7 9 13 |
  | 6/9 | 1 3 5 6 9 |
  | m9 | 1 ♭3 5 ♭7 9 |
  | m11 | 1 ♭3 5 ♭7 9 11 |
  | m13 | 1 ♭3 5 ♭7 9 11 13 |
  | 9 | 1 3 5 ♭7 9 |
  | 11 | 1 5 ♭7 9 11 (sans tierce, usage jazz) — *mon choix* |
  | 13 | 1 3 5 ♭7 9 13 (sans 11, usage jazz) |

  Qualité inconnue : repli sur `ARP_DEF['maj7']`, comme ailleurs.
- **Position sur le manche** : notes jouées en montant, dans une seule position. Fondamentale sur la corde la plus grave où elle tombe entre les cases 1 et 12 (corde de Si en 5 cordes, de Mi en 4 cordes, sinon la suivante). Pas de cordes à vide (forme transposable). Chaque note suivante va sur la corde la plus grave possible qui la garde dans une fenêtre d'environ 4–5 cases autour de la position de départ.
- **Dessin** (`diagrams.js`, nouvelle fonction pure, ex. `arpTabSvg(root, quality, strings)` → chaîne SVG) : cordes nommées à gauche, mention « TAB », numéros de cases sur les cordes, degrés sous chaque colonne. Couleurs des schémas actuels : fondamentale `#e63946`, autres notes de l'arpège `#f0a500` (ou couleur de texte neutre si plus lisible — au constructeur de juger sur le rendu). Largeur selon le nombre de notes (4 à 7). Inséré dans un `.mode-diagram-wrap`, pour hériter des règles d'écran et d'impression (`modals.css`, `print.css`).
- **Libellés** nouveaux dans `i18n.js` (FR, ES, IT, EN) : « Mode », « Arpège », titre de l'interrupteur.

## Laissé au constructeur

- Détails exacts du placement des cases quand plusieurs cordes conviennent ; tester au moins C, F, Bb, E, A en 4 et 5 cordes pour vérifier que les positions restent jouables.
- Mise en page fine du SVG (tailles, espacement), à vérifier à l'écran, à l'impression, en thème clair et sombre, et dans une mesure étroite.
- Tests Node : table des arpèges étendus, positions calculées (ordre montant, pas de case 0, écart de cases borné), SVG produit (nombre de notes, degrés), 4 et 5 cordes.

## Remarque hors périmètre

`applyAnnotation` (`modals.js`) reconstruit l'annotation sans `showSvg` : après une modification dans la fenêtre, un schéma masqué dans une mesure à plusieurs accords réapparaît. À garder en tête ; `diagram` devra, lui, être bien conservé.

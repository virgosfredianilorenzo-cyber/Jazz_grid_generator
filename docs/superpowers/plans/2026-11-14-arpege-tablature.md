# Tablature d'arpège — plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal :** pour chaque accord, un interrupteur « Mode | Arpège » qui remplace le schéma SVG du mode par une tablature basse (4 ou 5 cordes) de l'arpège, extensions du nom de l'accord comprises.

**Architecture :** une table d'arpèges étendus dans `theory.js` ; deux fonctions pures dans `diagrams.js` (placement des notes sur le manche, puis dessin SVG) ; `render.js` choisit la vue selon `annot.diagram` ; la fenêtre d'annotation porte l'interrupteur.

**Tech Stack :** JS navigateur sans build, SVG en chaîne, tests `node:test` (+ `node:vm` pour les fichiers sans `module.exports`).

**Spec :** `docs/superpowers/specs/2026-11-14-arpege-tablature-design.md`

## Global Constraints

- Pas de build, pas de dépendance nouvelle.
- `annot.diagram === 'arp'` → tablature ; absent ou `'mode'` → schéma du mode (grilles existantes inchangées).
- Pas de tensions cochées, pas de renversements, pas de gamme dans la tablature.
- Ligne texte « A: », pastilles et renversements de la fenêtre d'annotation : inchangés (restent sur `ARP_DEF`).
- Accordages : 4 cordes E A D G (MIDI 28 33 38 43) ; 5 cordes B E A D G (MIDI 23 28 33 38 43). `window.bassStrings` vaut 4 ou 5.
- Couleurs : fondamentale `#e63946`, notes d'arpège `#f0a500`.
- Toute donnée utilisateur dans `innerHTML` passe par `escHtml` (CLAUDE.md) ; le SVG ne contient que des valeurs calculées (cases, degrés, noms de cordes).
- Libellés dans les 4 langues (FR, ES, IT, EN).
- Branche de travail : `feat/arpege-tab` depuis `main`.

## Review Focus

1. Fondamentale sur corde à vide (E en 4 cordes, B en 5 cordes) : doit aller en case 12, jamais 0 → test Task 2.
2. Accord à 7 notes (m13) en 4 cordes : notes toujours montantes, cases ≥ 1, et pas de case absurde (> 24) → test Task 2.
3. Accord slash ou qualité inconnue (`C7/E`, `Cadd9`) : fondamentale = celle du symbole, repli `maj7` → tests Task 1 et Task 2.
4. Impression thème clair : fondamentale rouge et cases lisibles (pas blanches — `print.css` met en blanc les `svg g text`) → la tablature n'utilise pas de `<g>` ; vérification manuelle Task 3.
5. Basculer 4 ↔ 5 cordes avec une tablature affichée : la tablature est redessinée → vérification manuelle Task 3.

---

### Task 1 : arpèges étendus (`theory.js`)

**Files :**
- Modify : `js/theory.js` (après `ARP_DEF`, ligne 20 ; `module.exports` ligne 114)
- Create : `tests/arptab.test.js`

**Interfaces :**
- Produces : `getArpDegrees(quality: string) → {i: number[], n: string[]}` — intervalles en demi-tons croissants depuis la fondamentale, et degrés correspondants (notation `b3`, `#5`, comme `ARP_DEF`). Exporté par `module.exports`.

- [ ] **Step 0 : branche** — `git checkout -b feat/arpege-tab main`, puis `git add` du spec et de ce plan, commit `docs: spec et plan tablature d'arpège`.

- [ ] **Step 1 : test qui échoue** — `tests/arptab.test.js` :

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const { getArpDegrees } = require('../js/theory.js');

test('getArpDegrees : extensions du nom de l\'accord', () => {
  const n = q => getArpDegrees(q).n.join(' ');
  assert.equal(n('maj9'), '1 3 5 7 9');
  assert.equal(n('maj13'), '1 3 5 7 9 13');
  assert.equal(n('6/9'), '1 3 5 6 9');
  assert.equal(n('m9'), '1 b3 5 b7 9');
  assert.equal(n('m11'), '1 b3 5 b7 9 11');
  assert.equal(n('m13'), '1 b3 5 b7 9 11 13');
  assert.equal(n('9'), '1 3 5 b7 9');
  assert.equal(n('11'), '1 5 b7 9 11');
  assert.equal(n('13'), '1 3 5 b7 9 13');
  assert.deepEqual(getArpDegrees('13').i, [0, 4, 7, 10, 14, 21]);
});
test('getArpDegrees : 4 sons et triades comme ARP_DEF, repli maj7', () => {
  assert.equal(getArpDegrees('m7').n.join(' '), '1 b3 5 b7');
  assert.deepEqual(getArpDegrees('m7').i, [0, 3, 7, 10]);
  assert.equal(getArpDegrees('').n.join(' '), '1 3 5 8');
  assert.equal(getArpDegrees('add9').n.join(' '), '1 3 5 7');
});
```

- [ ] **Step 2 :** `node --test tests/arptab.test.js` → FAIL (`getArpDegrees is not a function`).
- [ ] **Step 3 :** dans `theory.js`, `const ARP_EXT_DEF` (maj9, maj13, 6/9, m9, m11, m13, 9, 11, 13 ; intervalles : 9 = 14, 11 = 17, 13 = 21) et `function getArpDegrees(quality)` → `ARP_EXT_DEF[q] || ARP_DEF[q] || ARP_DEF['maj7']`. Ajouter `getArpDegrees` à `module.exports`.
- [ ] **Step 4 :** `node --test tests/*.test.js` → tout passe.
- [ ] **Step 5 :** commit `feat(arp): arpèges étendus selon le nom de l'accord`.

### Task 2 : placement et dessin de la tablature (`diagrams.js`)

**Files :**
- Modify : `js/diagrams.js` (nouvelles fonctions en fin de fichier + `if(typeof module!=='undefined') module.exports={arpTabNotes,arpTabSvg};`)
- Test : `tests/arptab.test.js`

**Interfaces :**
- Consumes : `getArpDegrees`, `noteIdx`, `tr` (globaux de `theory.js`).
- Produces :
  - `arpTabNotes(root: string, quality: string, strings: 4|5) → Array<{string: number, name: string, fret: number, degree: string, isRoot: boolean}>` — `string` = index depuis la corde la plus grave (0), `name` = 'B'|'E'|'A'|'D'|'G'. `isRoot` vrai pour degrés `1` et `8`.
  - `arpTabSvg(root: string, quality: string, strings: 4|5) → string` — SVG complet, classe `arp-tab` sur `<svg>`.

- [ ] **Step 1 : tests qui échouent** — charger `theory.js` puis `diagrams.js` dans un contexte `vm` (comme `tests/uncertain.test.js`, avec `window: {}` et `console`), puis :

```js
const pos = (r, q, s) => ctx.arpTabNotes(r, q, s).map(x => x.name + x.fret).join(' ');

test('arpTabNotes : Bb9 en 4 cordes (référence)', () => {
  assert.equal(pos('Bb', '9', 4), 'E6 A5 A8 D6 G5');
  assert.deepEqual(ctx.arpTabNotes('Bb', '9', 4).map(x => x.degree), ['1', '3', '5', 'b7', '9']);
});
test('arpTabNotes : 5 cordes, fondamentale sur Si', () => {
  assert.equal(pos('Bb', '9', 5), 'B11 E10 E13 A11 D10');
  assert.equal(pos('C', 'maj7', 4), 'E8 A7 A10 D9');
});
test('arpTabNotes : pas de corde à vide', () => {
  assert.equal(ctx.arpTabNotes('E', 'm7', 4)[0].fret, 12);
  assert.equal(ctx.arpTabNotes('B', '7', 5)[0].fret, 12);
});
test('arpTabNotes : m13 en 4 cordes reste montant et jouable', () => {
  const ns = ctx.arpTabNotes('A', 'm13', 4);
  const open = [28, 33, 38, 43];
  const midi = ns.map(x => open[x.string] + x.fret);
  assert.equal(ns.length, 7);
  for (let k = 1; k < midi.length; k++) assert.ok(midi[k] > midi[k - 1]);
  assert.ok(ns.every(x => x.fret >= 1 && x.fret <= 24));
});
test('arpTabNotes : slash et qualité inconnue', () => {
  assert.equal(pos('C', 'add9', 4), pos('C', 'maj7', 4));
});
test('arpTabSvg : cordes, cases, degrés, fondamentale marquée', () => {
  const s4 = ctx.arpTabSvg('Bb', '9', 4), s5 = ctx.arpTabSvg('Bb', '9', 5);
  assert.match(s4, /^<svg[^>]*class="arp-tab"/);
  assert.equal((s4.match(/class="arp-root"/g) || []).length, 2); // case + degré de la fondamentale
  assert.ok(s4.includes('>♭7<') && s4.includes('>9<'));
  assert.ok(!s4.includes('<g'));
  assert.ok(s5.includes('>B<') && !s4.includes('>B<'));
});
```

(Pour l'appel slash, `render.js` passe déjà `parsed.root` / `parsed.quality` issus de `parseChordSym`, qui retire la basse : `C7/E` → root `C`, quality `7`. Pas de test supplémentaire côté `diagrams.js`.)

- [ ] **Step 2 :** `node --test tests/arptab.test.js` → FAIL.
- [ ] **Step 3 : `arpTabNotes`** — algorithme (les tests ne le déterminent pas entièrement) :

```
open = strings===5 ? [23,28,33,38,43] : [28,33,38,43]
rootFret = (noteIdx(root) - open[0]) mod 12, 0 → 12        // corde la plus grave, jamais à vide
base = open[0] + rootFret ; pos = rootFret ; cur = 0
pour chaque intervalle iv de getArpDegrees(quality).i :
  cible = base + iv
  j = plus petite corde ≥ cur telle que fret = cible - open[j] ∈ [max(1,pos-1), pos+3]
  sinon j = plus petite corde ≥ cur avec fret ≥ 1 et fret minimal — en pratique la plus aiguë atteignable
  cur = j
```

  La fenêtre `[pos-1, pos+3]` reproduit la référence Bb9 (E6 A5 A8 D6 G5).
- [ ] **Step 4 : `arpTabSvg`** — une colonne par note (largeur ≈ 60 px par note + 60 px de marge gauche), cordes horizontales de la plus aiguë (haut) à la plus grave, noms de cordes à gauche, « TAB » en petit au début, numéro de case centré sur la corde (fond de la couleur du cadre pour couper la ligne, ou simple texte gras), degré sous la portée (`b` → `♭`, `#` → `♯`). Textes de la fondamentale (case et degré) : `class="arp-root"` + `fill="#e63946"` ; autres cases : `fill="#f0a500"`. Aucun `<g>` (voir Review Focus 4). Pas de titre dans le SVG (l'accord est déjà affiché au-dessus).
- [ ] **Step 5 :** `node --test tests/*.test.js` → tout passe.
- [ ] **Step 6 :** commit `feat(arp): placement et dessin de la tablature d'arpège`.

### Task 3 : interrupteur, rendu, styles, libellés

**Files :**
- Modify : `index.html` (section Mode de la fenêtre d'annotation, après `#annot-mode-hint`, ~ligne 158)
- Modify : `js/modals.js` (`openAnnotModal` l.75, `applyAnnotation` l.77)
- Modify : `js/render.js` (bloc `if(doSvg)` l.150–158)
- Modify : `js/i18n.js` (4 langues + application des libellés près de la l.154)
- Modify : `css/modals.css` (bloc `.mode-diagram-wrap`, l.58–77), `css/print.css` (l.71–79)

**Interfaces :**
- Consumes : `arpTabSvg(root, quality, strings)` (Task 2), `window.bassStrings`.
- Produces : champ d'annotation `annot.diagram: 'arp' | undefined`.

- [ ] **Step 1 : HTML** — sous `#annot-mode-hint` : `<div class="annot-diag-row"><span id="annot-diag-label"></span><button class="chord-btn" id="annot-diag-mode"></button><button class="chord-btn" id="annot-diag-arp"></button></div>`.
- [ ] **Step 2 : i18n** — clés `annotDiagLabel`, `annotDiagMode`, `annotDiagArp` :
  - FR : `Schéma :` / `Mode` / `Arpège (tab)`
  - ES : `Diagrama:` / `Modo` / `Arpegio (tab)`
  - IT : `Diagramma:` / `Modo` / `Arpeggio (tab)`
  - EN : `Diagram:` / `Mode` / `Arpeggio (tab)`
  Les appliquer dans la fonction qui remplit `annot-mode-hint`.
- [ ] **Step 3 : modals.js** — `aState.diagram = annot.diagram === 'arp' ? 'arp' : 'mode'` à l'ouverture ; les deux boutons basculent `aState.diagram` et la classe `active` ; `applyAnnotation` ajoute `diagram: aState.diagram === 'arp' ? 'arp' : undefined` à l'objet annotation.
- [ ] **Step 4 : render.js** — dans `if(doSvg)` : si `annot.diagram === 'arp'`, créer le même `.mode-diagram-wrap` et y mettre `arpTabSvg(parsed.root, parsed.quality, window.bassStrings === 5 ? 5 : 4)` ; sinon le code actuel. Le bouton 4/5 cordes appelle déjà `render()` (à vérifier dans `setBassStrings`).
- [ ] **Step 5 : CSS** — `modals.css` : `.annot-diag-row` (flex, gap 4px, marge 0 0 8px) ; `.mode-diagram-wrap svg text.arp-root { fill:#e63946 !important; }` et `.mode-diagram-wrap svg.arp-tab text.arp-fret { fill:#f0a500 !important; }` (classe `arp-fret` à poser en Task 2 sur les autres cases si l'écran les écrase — la règle `svg text { fill:#eee !important }` gagne sinon). `print.css` : `.mode-diagram-wrap svg text.arp-root { fill:#e63946 !important; }`, cases en noir.
- [ ] **Step 6 : vérification dans le navigateur** (serveur statique local, `preview_start`) :
  - Bb9 → annotation → Mode coché → « Arpège (tab) » → Appliquer : tablature `E6 A5 A8 D6 G5`, degrés `1 3 5 ♭7 9`, 1 en rouge.
  - Bascule 5 cordes : tablature redessinée avec la corde B.
  - Rouvrir l'annotation : « Arpège (tab) » toujours actif ; repasser à « Mode » : schéma du mode revient.
  - Sauvegarde JSON puis rechargement : `diagram: 'arp'` conservé ; une grille JSON ancienne s'affiche comme avant.
  - Aperçu d'impression thème clair et sombre : tablature lisible, fondamentale rouge.
  - Console sans erreur.
- [ ] **Step 7 :** `node --test tests/*.test.js` → tout passe.
- [ ] **Step 8 :** commit `feat(arp): interrupteur Mode / Arpège et tablature dans la grille`.

### Task 4 : documentation

**Files :** `README.md`, `README.en.md`, `CHANGELOG.md`, `CLAUDE.md`

- [ ] **Step 1 :** README FR/EN : ajouter la vue Arpège à la ligne « Diagrammes de manche basse » ; cocher la ligne de feuille de route « Diagrammes : choisir entre… » (`- [x] ~~…~~ (v5.2)`).
- [ ] **Step 2 :** `CHANGELOG.md` : section `## v5.2 (en cours)` en tête avec une ligne « Tablature d'arpège ». CLAUDE.md : mention de `arpTabNotes` / `arpTabSvg` dans la ligne `diagrams.js` de l'arborescence et de `tests/arptab` dans la ligne `tests/`.
- [ ] **Step 3 :** commit `docs: tablature d'arpège`.

# Recherche de grilles en ligne + import iReal Pro — Plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ajouter à JazzGrid une fenêtre « 🔎 Trouver une grille » (recherche web guidée + import de liens iReal Pro / fichiers MusicXML avec aperçu), une recherche web par l'assistant IA Claude activable à la demande, et retirer OpenAI de l'assistant.

**Architecture:** Toute la logique pure (décodage iReal, conversion vers `chartData`, URLs de recherche, aperçu texte, migration des réglages IA, extraction des sources) vit dans des fonctions sans DOM, testées sous Node avec `node --test`. Les fichiers restent des scripts classiques chargés par `index.html` (globals) ; en bas de chaque fichier testable, `if (typeof module !== 'undefined') module.exports = {...}` les expose à Node. L'interface reprend le style des dialogues existants (`.midi-dialog-overlay`).

**Tech Stack:** Vanilla JS, HTML, CSS ; Claude Messages API en `fetch` direct (comme `js/ai.js` aujourd'hui) ; Node 22 (`node --test`) pour les tests unitaires, Chrome headless pour les vérifications d'interface.

**Spec:** `docs/superpowers/specs/2026-11-11-recherche-grilles-design.md`

## Global Constraints

- Sans build ni bundler ; aucune dépendance ajoutée au runtime. Node ne sert qu'aux tests (`node --test tests/`), il n'est pas nécessaire pour utiliser l'appli.
- Tout libellé visible en 4 langues dans `js/i18n.js` (`LANGS.fr/es/it/en`), lu via `t(key)` et posé dans `applyTranslations()`.
- `escHtml()` (`js/theory.js`) sur **tout** `innerHTML` alimenté par une donnée importée (lien iReal, MusicXML, réponse IA, sources). Liens de sources cliquables seulement si l'URL commence par `http://` ou `https://`, avec `target="_blank" rel="noopener noreferrer"`.
- Format cible `chartData` : `{title, key, tempo, timeSig, style, composer?, sections:[{id, label, annotation, measures:[{number, chords:[{symbol, beats, annot:null, altChord}], repeatStart, repeatEnd, barlineLeft, barlineRight, volta, navSymbol}]}]}`. Valeurs de barres : `'normal' | 'repeat-start' | 'repeat-end' | 'double' | 'final'`. `volta` : `null | '1' | '2' | '3'`. `navSymbol` : `null` ou une clé de `NAV_DISPLAY` (`segno, coda, dc-coda, ds-coda, dc-fine, fine, fermata`).
- La conversion iReal se fait localement, sans réseau.
- Recherche web IA : Claude uniquement, **désactivée par défaut**, interrupteur qui se remet à « off » après chaque envoi.
- Ne pas étendre `NAV_DISPLAY` : les indications iReal sans équivalent deviennent une annotation de section.
- Confirmation avant écrasement (`_isDirty`) uniquement depuis la nouvelle fenêtre ; les imports existants ne changent pas.

## Review Focus

- **Lien iReal collé avec du texte autour ou mal encodé** (ex. copié depuis un message de forum, `%` isolé, retour à la ligne) → message d'erreur clair dans la fenêtre, jamais d'exception non rattrapée ni de grille vide importée. Test : Task 2, `decodeIRealLink rejette un lien tronqué`.
- **Playlist de plusieurs centaines de morceaux** (ex. « Jazz 1460 ») → la liste reste filtrable et réactive ; le nom de playlist (dernier segment) n'est pas pris pour un morceau. Test : Task 1, `splitSongs ignore le nom de playlist`.
- **Accords iReal hors des 24 qualités JazzGrid** (`C7#9b13`, `C7alt`, `C^7#11`) → conservés comme symbole libre lisible, jamais perdus ni remplacés par `C`. Test : Task 2, `convertit les qualités inconnues en symbole libre`.
- **Mesure avec plus d'accords que de temps, ou métrique impaire** (`T34` avec 2 accords, `T54`) → la somme des `beats` de la mesure égale le numérateur de la métrique. Test : Task 2, `répartit les temps en 3/4 et 5/4`.
- **Réponse Claude interrompue (`pause_turn`) ou sans aucun outil d'édition** → on relance jusqu'à la fin, puis on affiche le texte et les sources sans créer de brouillon vide. Test : Task 5, `aiRunClaudeTurn relance sur pause_turn`.

---

### Task 1 : Décodage des liens iReal Pro

**Files:**
- Create: `js/ireal.js`
- Create: `tests/ireal.test.js`
- Modify: `index.html` (ajouter `<script src="js/ireal.js"></script>` avant `js/actions.js`)

**Interfaces:**
- Produces:
  - `irealUnscramble(s: string) -> string` — inverse le brouillage du format `irealb` (blocs de 50 caractères, voir algorithme).
  - `splitSongs(link: string) -> Array<RawSong>` où `RawSong = {title, composer, style, key, tempo: number|null, music: string}` ; accepte `irealb://` et `irealbook://`, URL-encodés, un ou plusieurs morceaux.
  - Lève `Error('IREAL_INVALID')` si le lien ne commence pas par l'un des deux préfixes ou ne contient aucun morceau exploitable.

- [ ] **Step 1 : Écrire les tests qui échouent** (`tests/ireal.test.js`, `node:test` + `node:assert/strict`, `require('../js/ireal.js')`)
  - `irealUnscramble laisse intactes les chaînes courtes` : `irealUnscramble('C^7 D-7')` → `'C^7 D-7'` (52 caractères ou moins : pas de brouillage).
  - `irealUnscramble applique les substitutions` : `irealUnscramble('C^7LZD-7Kcl')` → `'C^7 |D-7| x'`.
  - `irealUnscramble remet en ordre un bloc de 50` : `s` = 60 caractères `'0123456789'.repeat(6)` → les 10 derniers caractères sont inchangés, et le 1er caractère de la sortie est `s[49]`.
  - `splitSongs lit un morceau irealbook` : `splitSongs('irealbook://Blue%20Bossa=Dorham%20Kenny=Bossa%20Nova=C-==' + encodeURIComponent('*A{T44C-7 |F-7 |Dh7 |G7b9 }'))` → un élément, `title === 'Blue Bossa'`, `composer === 'Dorham Kenny'`, `style === 'Bossa Nova'`, `key === 'C-'`, `music` commence par `*A{T44C-7`.
  - `splitSongs lit un morceau irealb` : fixture `tests/fixtures/ireal-one.txt` (un vrai lien `irealb://` d'un standard, récupéré sur le forum iReal Pro et collé dans le fichier) → un élément avec `title` attendu et `music` qui contient `T44` après désembrouillage.
  - `splitSongs ignore le nom de playlist` : fixture `tests/fixtures/ireal-playlist.txt` (lien de 3 morceaux + nom de playlist) → 3 éléments, aucun dont le `title` est le nom de la playlist.
  - `splitSongs rejette un lien invalide` : `assert.throws(() => splitSongs('https://example.com'), /IREAL_INVALID/)`.

- [ ] **Step 2 : Lancer les tests, constater l'échec**

Run: `node --test tests/`
Expected: FAIL (`Cannot find module '../js/ireal.js'`)

- [ ] **Step 3 : Implémenter `irealUnscramble` et `splitSongs` dans `js/ireal.js`**

Algorithme de désembrouillage (format `irealb`, la musique commence par le préfixe `1r34LbKcu7`, à retirer d'abord) :

```js
function _obfusc50(s){ const a=s.split('');
  for(let i=0;i<5;i++){ a[49-i]=s[i]; a[i]=s[49-i]; }
  for(let i=10;i<24;i++){ a[49-i]=s[i]; a[i]=s[49-i]; }
  return a.join(''); }
function irealUnscramble(s){ let r='';
  while(s.length>51){ r+=_obfusc50(s.substring(0,50)); s=s.substring(50); }
  r+=s;
  return r.replace(/Kcl/g,'| x').replace(/LZ/g,' |').replace(/XyQ/g,'   '); }
```

Découpage : `decodeURIComponent` sur ce qui suit le préfixe, morceaux séparés par `===`. En `irealb`, champs séparés par `=` : `[0]` titre, `[1]` compositeur, `[3]` style, `[4]` tonalité, `[6]` musique (préfixe `1r34LbKcu7`), `[8]` tempo (entier, `0` ou vide → `null`). En `irealbook` : `[0]` titre, `[1]` compositeur, `[2]` style, `[3]` tonalité, `[5]` musique en clair. Avec plusieurs morceaux, le dernier segment sans `=` est le nom de playlist : l'ignorer. Exporter `{irealUnscramble, splitSongs}` pour Node.

- [ ] **Step 4 : Lancer les tests, constater le succès**

Run: `node --test tests/`
Expected: PASS (5 tests)

- [ ] **Step 5 : Commit**

```bash
git add js/ireal.js tests/ireal.test.js tests/fixtures/ index.html
git commit -m "feat(ireal): décodage des liens irealb:// et irealbook://"
```

---

### Task 2 : Conversion d'un morceau iReal en `chartData`

**Files:**
- Modify: `js/ireal.js`
- Modify: `tests/ireal.test.js`

**Interfaces:**
- Consumes: `splitSongs`, `irealUnscramble` (Task 1).
- Produces:
  - `irealToChart(raw: RawSong) -> {chart: ChartData, warnings: string[]}` — `chart` au format `chartData` (sections avec `id` issus de `_newSectionId()` si défini, sinon `'sec' + n` sous Node) ; `warnings` liste les indications ignorées (texte court, une par élément).
  - `irealQualityToJgg(q: string) -> string` — qualité iReal → qualité JazzGrid, ou chaîne vide si inconnue (le symbole libre est alors gardé tel quel par `irealToChart`).
  - `decodeIRealLink(link: string) -> Array<{chart, warnings}>` — `splitSongs` puis `irealToChart` sur chaque morceau ; propage `IREAL_INVALID`.

- [ ] **Step 1 : Écrire les tests qui échouent**
  - `irealQualityToJgg` : `'^7'→'maj7'`, `'-7'→'m7'`, `'h7'→'m7b5'`, `'h'→'m7b5'`, `'o7'→'dim7'`, `'o'→'dim'`, `'-'→'m'`, `'+'→'aug'`, `'7sus'→'7sus4'`, `'sus'→'sus4'`, `'-^7'→'mM7'`, `'6'→'6'`, `'-6'→'m6'`, `'69'→'6/9'`, `'^9'→'maj9'`, `'-9'→'m9'`, `'-11'→'m11'`, `'13'→'13'`, `''→''`, `'7#9b13'→''`.
  - `convertit Blue Bossa` (le lien `irealbook` de la Task 1) : `chart.title === 'Blue Bossa'`, `chart.key === 'Cm'`, `chart.timeSig === '4/4'`, une section `label === 'A'`, 4 mesures de symboles `['Cm7','Fm7','Dm7b5','G7b9']`, mesure 1 `barlineLeft === 'repeat-start'`, mesure 4 `barlineRight === 'repeat-end'`.
  - `convertit les voltas et la coda` : musique `'*A{T44C^7 |A-7 |N1D-7 |G7 }|N2D-7 G7 |C^7 Z'` (+ un `Q` sur une mesure, un `S` sur une autre) → mesures portant `volta: '1'` et `volta: '2'`, `navSymbol: 'coda'` / `'segno'`, dernière mesure `barlineRight === 'final'`, mesure `D-7 G7` = deux accords de `beats: 2`.
  - `convertit N.C., % et slash` : `n` → symbole `'N.C.'`, `x` → `'%'`, `C^7/E` → `'Cmaj7/E'`, accord alternatif `C7(Db7)` → `symbol: 'C7'`, `altChord: 'Db7'`.
  - `convertit les qualités inconnues en symbole libre` : `C7#9b13` → `symbol === 'C7#9b13'`.
  - `répartit les temps en 3/4 et 5/4` : `T34C^7 D-7 |` → beats `[2,1]` ; `T54C^7 D-7 |` → `[3,2]` ; `T44C D E |` → `[2,1,1]` ; somme = numérateur dans tous les cas.
  - `annote les indications sans équivalent` : `<D.S. al Fine>` sur une mesure → aucune `navSymbol` inventée, `warnings` non vide, et le texte `D.S. al Fine` présent dans `annotation` de la section.
  - `decodeIRealLink rejette un lien tronqué` : `'irealb://%E0%A4%A'` → `throws /IREAL_INVALID/`.
  - `importe le tempo quand il existe` : fixture `ireal-one.txt` → `chart.tempo` = valeur du lien si non nulle, sinon `120`.

- [ ] **Step 2 : Lancer, constater l'échec**

Run: `node --test tests/`
Expected: FAIL (`irealToChart is not a function`)

- [ ] **Step 3 : Implémenter `irealQualityToJgg`, `irealToChart`, `decodeIRealLink`**

Lecture de la chaîne musicale, jeton par jeton :
- `*X` → nouvelle section de label `X` (`*i` → `Intro`, `*v` → `Verse`, sinon la lettre) ; une section vide n'est pas créée.
- `Tnm` → métrique `n/m` (`T44`→`4/4`, `T34`→`3/4`, `T54`→`5/4`, `T68`→`6/8`, `T12`→`12/8`) ; la première rencontrée donne `chart.timeSig`.
- `|` fin de mesure ; `[` `]` → `double` ; `{` → `repeat-start` sur la mesure qui commence ; `}` → `repeat-end` sur celle qui finit ; `Z` → `final`.
- `N1` / `N2` / `N3` → `volta` de la mesure courante.
- `S` → `segno`, `Q` → `coda`, `f` → `fermata` ; `<…>` → si le texte (insensible à la casse) vaut `D.C. al Coda` / `D.S. al Coda` / `D.C. al Fine` / `Fine` → `navSymbol` correspondant ; sinon texte ajouté à l'annotation de la section + `warnings`.
- `n` → `N.C.` ; `x` → `%` ; `r` (répète 2 mesures) → deux mesures `%` + warning ; `p` → répète l'accord précédent dans la mesure ; `W` → accord invisible, ignoré ; `l`, `s`, `Y`, `U`, `,` et espaces → ignorés.
- Accord : `^([A-G][b#]?)([^/(\s|,]*)(\/[A-G][b#]?)?(\([^)]*\))?` ; qualité via `irealQualityToJgg`, symbole libre `racine + qualité iReal` si inconnue ; slash conservé ; parenthèses → `altChord` (converti pareil).
- Temps par mesure : `beats = floor(n / k)` pour chacun des `k` accords, le reste distribué un par un en partant du premier (`[2,1,1]`, `[3,2]`).
- Tonalité : `X-` → `Xm` ; tempo `null` → `120` ; style = champ style ; `composer` renseigné.

- [ ] **Step 4 : Lancer, constater le succès**

Run: `node --test tests/`
Expected: PASS

- [ ] **Step 5 : Commit**

```bash
git add js/ireal.js tests/ireal.test.js
git commit -m "feat(ireal): conversion d'un morceau iReal en grille JazzGrid"
```

---

### Task 3 : Fenêtre « 🔎 Trouver une grille »

**Files:**
- Create: `js/gridsearch.js`
- Create: `tests/gridsearch.test.js`
- Modify: `index.html` (bouton toolbar après `#dd-file`, entrée dans le menu `#dd-file`, markup `#gridsearch-dialog` placé **avant** les `<script>`, `<script src="js/gridsearch.js">` après `js/ireal.js`)
- Modify: `css/modals.css` (styles du dialogue, de la liste de morceaux, de l'aperçu)
- Modify: `js/i18n.js` (clés ci-dessous, 4 langues, et lignes dans `applyTranslations()`)

**Interfaces:**
- Consumes: `decodeIRealLink` (Task 2), `loadFileAsXML(file)` (`js/actions.js:286`), `parseMusicXML(xmlStr)` (`js/theory.js`), `snapshotUndo()`, `_ensureSectionIds(data)`, `autoAnnotateOnImport()`, `render()`, `_isDirty`, `escHtml`.
- Produces:
  - `gridSearchUrls(title: string, composer: string) -> {forum: string, web: string, musicxml: string}` — URLs DuckDuckGo (`https://duckduckgo.com/?q=` + `encodeURIComponent`) : forum = `site:forums.irealpro.com "<titre>"` (+ compositeur si présent), web = `"<titre>" "<compositeur>" irealb`, musicxml = `"<titre>" musicxml`. *(Choix du moteur : DuckDuckGo, pour ne pas pister l'utilisateur.)*
  - `chartPreviewText(chart) -> string[]` — une ligne par section : `Label ‖: Fm7 | Fm7 :‖` (‖: et :‖ pour les reprises, `| A B |` pour deux accords dans une mesure, `[1.` / `[2.` avant une mesure à volta).
  - `openGridSearch()`, `closeGridSearch()`, `gridSearchImport()` (DOM).

- [ ] **Step 1 : Tests qui échouent** (`tests/gridsearch.test.js`)
  - `gridSearchUrls encode titre et compositeur` : `gridSearchUrls('Knucklehead', 'Grover Washington Jr.')` → `forum` commence par `https://duckduckgo.com/?q=` et, une fois décodé, contient `site:forums.irealpro.com "Knucklehead"` ; `web` décodé contient `"Knucklehead" "Grover Washington Jr." irealb`.
  - `gridSearchUrls sans compositeur` : `web` décodé ne contient pas `""`.
  - `chartPreviewText` sur le JSON Knucklehead (copie dans `tests/fixtures/knucklehead.json`) → 4 lignes, la première `Intro ‖: Fm7 | Fm7 | Fm7 | Fm7 :‖`.

- [ ] **Step 2 : Lancer, constater l'échec** — `node --test tests/` → FAIL.

- [ ] **Step 3 : Implémenter `gridSearchUrls` et `chartPreviewText`** (fonctions pures, exportées pour Node).

- [ ] **Step 4 : Lancer, constater le succès** — `node --test tests/` → PASS.

- [ ] **Step 5 : Implémenter le dialogue (DOM)**

Contenu de `#gridsearch-dialog` (classe `.midi-dialog-overlay`, boîte `.midi-dialog-box` élargie à ~520px) :
1. Champs `#gs-title` (pré-rempli `chartData.title`) et `#gs-composer` (pré-rempli `chartData.composer || ''`).
2. Trois boutons `#gs-btn-forum`, `#gs-btn-web`, `#gs-btn-musicxml` → `window.open(url, '_blank', 'noopener')` ; désactivés si le titre est vide.
3. `#gs-link` (textarea) + bouton `#gs-btn-decode` ; zone de dépôt `#gs-drop` + input fichier caché `accept=".musicxml,.xml,.mxl"`.
4. Si plusieurs morceaux : `#gs-filter` (input) + `#gs-songlist` (liste, un clic sélectionne) ; filtrage sur le titre, insensible à la casse et aux accents ; afficher au plus 200 lignes à la fois.
5. `#gs-preview` : métadonnées + lignes de `chartPreviewText`, chaque ligne via `escHtml` ; `warnings` listés sous l'aperçu.
6. `#gs-error` : message traduit (`gsErrInvalid`, `gsErrFile`).
7. Bouton `#gs-btn-import` (actif seulement quand un aperçu existe) → `gridSearchImport()` : si `_isDirty` et `!confirm(t('gsConfirmReplace'))` → stop ; `snapshotUndo()` ; `chartData = chart` ; même séquence que l'import MusicXML (`_ensureSectionIds`, `originalKey`, `currentSemitoneOffset=0`, `#semitone-display`, `#transpose-key-select`, masquer `#dropzone`, afficher `#chart-editor`, `_isDirty=false`, `render()`) ; fermer le dialogue. Pour un MusicXML, appeler aussi `autoAnnotateOnImport()`.

Clés i18n (FR ; traduire en ES / IT / EN) : `btnFindGrid:'🔎 Trouver une grille'`, `gsTitle:'Trouver une grille'`, `gsLblTitle:'Titre'`, `gsLblComposer:'Compositeur'`, `gsSearchOn:'① Chercher sur :'`, `gsBtnForum:'Forum iReal Pro ↗'`, `gsBtnWeb:'Web (grilles iReal) ↗'`, `gsBtnMusicXML:'MusicXML libres ↗'`, `gsPasteLabel:'② Colle le lien trouvé, ou dépose le fichier :'`, `gsBtnDecode:'Lire le lien'`, `gsFilter:'Filtrer les morceaux…'`, `gsPreview:'Aperçu'`, `gsBtnImport:'Importer dans la grille'`, `gsCancel:'Fermer'`, `gsErrInvalid:'Lien iReal Pro non reconnu. Copie le lien complet (il commence par irealb://).'`, `gsErrFile:'Fichier MusicXML illisible.'`, `gsConfirmReplace:'Remplacer la grille en cours ? Les modifications non sauvegardées seront perdues (Ctrl+Z pour annuler).'`, `gsWarnings:'Indications non reprises :'`.

- [ ] **Step 6 : Vérifier dans Chrome**

Ouvrir `index.html`, cliquer 🔎 : les trois boutons ouvrent un onglet DuckDuckGo avec la bonne requête ; coller la fixture `ireal-playlist.txt` → liste de 3 morceaux filtrable ; choisir un morceau → aperçu ; Importer → la grille s'affiche, Ctrl+Z revient à la précédente ; coller `n'importe quoi` → message `gsErrInvalid` ; déposer `Mack The Knife.musicxml` → aperçu puis import. Changer de langue : tous les libellés suivent.

- [ ] **Step 7 : Commit**

```bash
git add js/gridsearch.js tests/gridsearch.test.js tests/fixtures/knucklehead.json index.html css/modals.css js/i18n.js
git commit -m "feat(gridsearch): fenêtre Trouver une grille — recherche guidée + import iReal / MusicXML"
```

---

### Task 4 : Retrait d'OpenAI de l'assistant IA

**Files:**
- Modify: `js/ai.js` (supprimer `_aiCallOpenAI`, l'aiguillage dans `aiProviderChat`, `provider` / `openaiKey` / `openaiModel` de `_AI_DEFAULTS`, `aiConfigUpdateRows`, le contrôle de clé selon fournisseur dans `aiChatSend`)
- Modify: `index.html:226-253` (supprimer `#ai-cfg-provider` et `#ai-cfg-row-openai` ; mettre à jour la liste `#ai-cfg-claude-model`)
- Modify: `js/i18n.js` (retirer les libellés OpenAI devenus inutiles s'il y en a)
- Modify: `README.md`, `README.en.md` (section configuration IA et tableau des réglages : Claude uniquement), `CLAUDE.md` (`ai.js ← chat IA (Claude)`, « Assistant IA — Claude »)
- Create: `tests/ai.test.js`

**Interfaces:**
- Produces:
  - `aiSettingsMigrate(raw: object) -> object` — renvoie des réglages sans `provider`, `openaiKey`, `openaiModel` ; conserve `claudeKey` ; si `claudeModel` absent ou ne figure pas dans `AI_CLAUDE_MODELS`, le remplace par `AI_CLAUDE_MODELS[0]`.
  - `AI_CLAUDE_MODELS = ['claude-opus-5-5', 'claude-sonnet-5-5', 'claude-haiku-5-5']` — valeurs de la liste `#ai-cfg-claude-model`, dans cet ordre ; la première est le défaut. *(Liste de modèles actuelle de l'API Claude ; l'ancien défaut `claude-sonnet-4-6` est remplacé.)*
  - `aiSettingsLoad()` applique `aiSettingsMigrate` et réécrit `localStorage['jgg_ai_settings']` si le résultat diffère.

- [ ] **Step 1 : Tests qui échouent** (`tests/ai.test.js` ; `js/ai.js` doit être chargeable sous Node : garder le code DOM dans des fonctions, ne rien exécuter au chargement qui touche `document`)
  - `aiSettingsMigrate supprime la clé OpenAI` : `{provider:'openai', openaiKey:'sk-x', openaiModel:'gpt-4o', claudeKey:'', claudeModel:'claude-sonnet-4-6'}` → aucune des clés `provider/openaiKey/openaiModel`, `claudeKey === ''`, `claudeModel === 'claude-opus-5-5'`.
  - `aiSettingsMigrate garde un modèle Claude valide` : `{claudeKey:'k', claudeModel:'claude-haiku-5-5'}` → inchangé.

- [ ] **Step 2 : Lancer, constater l'échec** — `node --test tests/` → FAIL.

- [ ] **Step 3 : Implémenter** (suppression du code OpenAI, `AI_CLAUDE_MODELS`, `aiSettingsMigrate`, export Node).

- [ ] **Step 4 : Lancer, constater le succès** — `node --test tests/` → PASS.

- [ ] **Step 5 : Vérifier dans Chrome** : panneau ⚙ sans sélecteur de fournisseur ; avec, dans `localStorage`, `{"provider":"openai","openaiKey":"sk-test"}` avant chargement → après chargement, `localStorage['jgg_ai_settings']` ne contient plus `sk-test`, et un envoi affiche « Clé API non configurée ». `grep -ri openai js/ index.html` ne renvoie plus rien.

- [ ] **Step 6 : Commit**

```bash
git add js/ai.js index.html js/i18n.js README.md README.en.md CLAUDE.md tests/ai.test.js
git commit -m "refactor(ai): assistant IA sur Claude uniquement — retrait d'OpenAI"
```

---

### Task 5 : Recherche web par l'assistant IA

**Files:**
- Modify: `js/ai.js`
- Modify: `index.html` (interrupteur `#ai-websearch` dans `#ai-input-row`)
- Modify: `css/app.css` (style de l'interrupteur et des sources)
- Modify: `js/i18n.js`
- Modify: `tests/ai.test.js`

**Interfaces:**
- Consumes: `AI_TOOLS`, `_AI_TOOL_EXECUTORS`, `aiDraftCreate/aiDraftApplyTool/aiDraftDiff`, `_aiRenderPreview`, `_aiMsg`, `aiSettingsLoad` (Task 4).
- Produces:
  - `aiBuildClaudeBody({system, messages, tools, model, webSearch: boolean}) -> object` — corps JSON de la requête ; si `webSearch`, ajoute `{type:'web_search_20260209', name:'web_search', max_uses:5}` aux `tools`. `max_tokens: 16000`. Pour `claude-opus-5-5` et `claude-sonnet-5-5` seulement, inclut `fallbacks: 'default'` (avec l'en-tête `anthropic-beta: server-side-fallback-2026-07-01` côté `fetch`) ; jamais pour `claude-haiku-5-5`, qui n'a pas de repli côté serveur.
  - `aiParseClaudeContent(content: Array) -> {message: string, toolCalls: Array<{id,name,args}>, sources: Array<{url,title}>}` — texte concaténé des blocs `text` ; `tool_use` → `toolCalls` ; sources = URLs uniques tirées des `citations` des blocs `text` (champ `url`, `title`) et, à défaut, des `web_search_result` des blocs `web_search_tool_result` (ignorer un `content` qui est un objet d'erreur) ; blocs `thinking`, `server_tool_use` ignorés.
  - `aiRunClaudeTurn(body, doFetch) -> Promise<{message, toolCalls, sources, usage}>` — appelle `doFetch(body)` ; tant que `stop_reason === 'pause_turn'`, renvoie la même requête avec, en plus, un message `assistant` contenant le `content` reçu, au maximum 3 fois ; si `stop_reason === 'refusal'`, lève une erreur traduite (`aiErrRefusal`).
  - Nouvel outil IA `set_full_chart` dans `AI_TOOLS` + `_AI_TOOL_EXECUTORS` : `input_schema` = `{title, key, tempo, timeSig, style, composer, sections:[{label, annotation, measures:[{chords:[{symbol, beats}], barlineLeft, barlineRight, volta, navSymbol}]}]}` ; l'exécuteur remplace tout le brouillon (ids de section générés, champs manquants remplis comme `newChart()`), ce qui passe donc par l'aperçu existant.

- [ ] **Step 1 : Tests qui échouent** (`tests/ai.test.js`)
  - `aiBuildClaudeBody n'ajoute la recherche que sur demande` : `webSearch:false` → aucun outil de type `web_search_20260209` ; `webSearch:true` → exactement un, `max_uses === 5`.
  - `aiBuildClaudeBody n'envoie fallbacks qu'aux modèles qui l'acceptent` : `model:'claude-opus-5-5'` → `fallbacks === 'default'` ; `model:'claude-haiku-5-5'` → pas de clé `fallbacks`.
  - `aiParseClaudeContent extrait texte, outils et sources` : contenu `[{type:'server_tool_use',...}, {type:'web_search_tool_result', content:[{type:'web_search_result', url:'https://a.example', title:'A'}]}, {type:'text', text:'Voici', citations:[{url:'https://b.example', title:'B'}]}, {type:'tool_use', id:'t1', name:'set_full_chart', input:{}}]` → `message === 'Voici'`, `toolCalls.length === 1`, `sources` contient `https://b.example` (citation prioritaire), sans doublon.
  - `aiParseClaudeContent ignore une erreur de recherche` : `web_search_tool_result` avec `content: {type:'web_search_tool_result_error', error_code:'max_uses_exceeded'}` → pas d'exception, `sources` vide.
  - `aiRunClaudeTurn relance sur pause_turn` : `doFetch` simulé qui renvoie d'abord `{stop_reason:'pause_turn', content:[...]}` puis `{stop_reason:'end_turn', content:[{type:'text', text:'ok'}]}` → appelé 2 fois, le 2ᵉ corps contient un message `assistant` avec le premier `content` ; résultat `message === 'ok'`.
  - `aiRunClaudeTurn lève sur refusal` : `stop_reason:'refusal'` → `rejects`.
  - `set_full_chart remplit les champs manquants` : exécuteur appliqué à `{title:'X', sections:[{label:'A', measures:[{chords:[{symbol:'Fm7', beats:4}]}]}]}` → mesure avec `barlineLeft === 'normal'`, `volta === null`, `navSymbol === null`, section avec un `id`.

- [ ] **Step 2 : Lancer, constater l'échec** — `node --test tests/` → FAIL.

- [ ] **Step 3 : Implémenter** `aiBuildClaudeBody`, `aiParseClaudeContent`, `aiRunClaudeTurn`, `set_full_chart` ; `_aiCallClaude` devient `aiRunClaudeTurn(aiBuildClaudeBody(...), body => fetch(...))` avec les en-têtes existants + `anthropic-beta`.

- [ ] **Step 4 : Lancer, constater le succès** — `node --test tests/` → PASS.

- [ ] **Step 5 : Brancher l'interface**
  - Interrupteur `#ai-websearch` (case stylée « 🌐 Chercher sur le web », titre `aiWebSearchHint`) ; lu dans `aiChatSend` puis **remis à `false` après l'envoi**, quelle que soit l'issue.
  - Quand la recherche est active, ajouter au prompt système (4 langues) : chercher la grille du morceau demandé sur le web, citer les sources, préférer les grilles partagées (forum iReal Pro, partitions libres), construire la grille avec `set_full_chart`, mettre dans l'annotation de la première section `aiGridSourceNote` suivi des titres des sources, et dire clairement si rien de fiable n'a été trouvé plutôt qu'inventer. Si un lien `irealb://` est trouvé, le donner tel quel.
  - Sources affichées sous la réponse (`_aiMsg` / `_aiRenderPreview`) : liste de liens, texte via `escHtml`, `href` seulement si `http(s)://`.
  - i18n (FR, traduire ES / IT / EN) : `aiWebSearch:'🌐 Chercher sur le web'`, `aiWebSearchHint:'Une seule demande, facturée en plus par Anthropic. Se désactive après l\'envoi.'`, `aiSources:'Sources :'`, `aiGridSourceNote:'Grille proposée par l\'IA à partir de :'`, `aiErrRefusal:'Claude a refusé cette demande.'`.

- [ ] **Step 6 : Vérifier dans Chrome avec une vraie clé** (fournie par l'utilisateur dans ⚙, jamais écrite dans le dépôt) : sans l'interrupteur, « transpose en Bb » marche comme avant et la requête (onglet Réseau) ne contient pas `web_search` ; avec l'interrupteur, « Trouve-moi la grille de Blue Bossa de Kenny Dorham » → réponse avec sources cliquables, aperçu des changements, Appliquer remplace la grille, annotation présente ; l'interrupteur est revenu à off.

- [ ] **Step 7 : Commit**

```bash
git add js/ai.js index.html css/app.css js/i18n.js tests/ai.test.js
git commit -m "feat(ai): recherche web de grilles par Claude, sur demande"
```

---

### Task 6 : Documentation

**Files:**
- Modify: `README.md`, `README.en.md` (section fonctionnalités : « Trouver une grille » + import iReal Pro + recherche web IA ; feuille de route : cocher « Import iReal Pro® `.irealbook` » ; section Tests : `node --test tests/`)
- Modify: `CHANGELOG.md` (section `## v5.1 (en cours)` listant les trois briques)
- Modify: `CLAUDE.md` (arborescence : `js/ireal.js`, `js/gridsearch.js`, `tests/` ; section Développement : `node --test tests/`)

- [ ] **Step 1 : Rédiger les mises à jour ci-dessus.**
- [ ] **Step 2 : Vérifier** : `node --test tests/` → PASS ; `grep -n "irealb\|Trouver une grille" README.md CHANGELOG.md CLAUDE.md` renvoie au moins une ligne par fichier.
- [ ] **Step 3 : Commit**

```bash
git add README.md README.en.md CHANGELOG.md CLAUDE.md
git commit -m "docs: recherche de grilles, import iReal Pro, IA Claude uniquement"
```

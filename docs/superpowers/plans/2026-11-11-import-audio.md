# Grille à l'écoute (onglet + fichier audio) — Plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ajouter à JazzGrid « 🎧 Créer une grille à l'écoute » : l'appli écoute un onglet partagé (YouTube, streaming) ou joue un fichier audio, détecte tempo, mesures et un accord (tétrade) par mesure, et remplit la grille principale en direct, mesure par mesure.

**Architecture:** Un moteur d'analyse **maison, sans bibliothèque** (FFT radix-2, chroma, gabarits de tétrades, suivi de tempo par autocorrélation du flux spectral) dans `js/listen-dsp.js`, en fonctions pures testées sous Node avec des signaux synthétiques. La colle navigateur (capture d'onglet, lecture de fichier, bandeau, remplissage de la grille) est dans `js/listen.js`, qui charge `js/listen-dsp.js` à la première utilisation seulement. Le même code d'analyse sert à l'onglet et au fichier : on lit des trames temporelles (`AnalyserNode.getFloatTimeDomainData`) et on calcule notre propre FFT.

**Tech Stack:** Vanilla JS, Web Audio API (`AudioContext`, `AnalyserNode`, `AudioBufferSourceNode`, `decodeAudioData`), `navigator.mediaDevices.getDisplayMedia`, Node 22 `node:test` pour les tests (`node --test tests/*.test.js`).

**Spec:** `docs/superpowers/specs/2026-11-11-import-audio-design.md`

## Global Constraints

- Sans build ni bundler ; **aucune bibliothèque ajoutée** (ni CDN) : le moteur est maison, ce qui règle aussi la contrainte de licence (Apache 2.0) et le fonctionnement hors ligne pour un fichier.
- Le moteur (`js/listen-dsp.js`) n'est chargé qu'à la première ouverture de la fenêtre d'écoute (balise `<script>` injectée par `js/listen.js`).
- L'audio n'est **jamais stocké ni envoyé** ; seules les données dérivées (chroma par temps, positions des temps) restent en mémoire jusqu'à la prochaine écoute ou au rechargement.
- Vocabulaire d'accords écrit : **tétrades uniquement** — `maj7`, `m7`, `7`, `m7b5`, `dim7` ; racines en bémols `['C','Db','D','Eb','E','F','Gb','G','Ab','A','Bb','B']`.
- Accords par mesure : `1` (défaut) ou `2` = **jusqu'à 2** (second accord seulement si un changement est détecté au milieu) ; coupe 4/4 → 2+2, 3/4 → 2+1, 5/4 → 3+2, autres → `ceil(n/2)` + `floor(n/2)`.
- Silence **court** (< 2 mesures) à tempo stable → mesures `N.C.` ; silence **long** (≥ 2 mesures) → le compteur s'arrête, reprise avec le son.
- Accord incertain : champ interne `_uncertain: true` sur l'accord, affiché par un « ? » discret, absent à l'impression, **retiré à l'export JSON** (comme `_originalSymbol`), disparaît quand l'utilisateur modifie l'accord.
- Remplissage **en direct dans la grille principale** ; confirmation si `_isDirty` ; `snapshotUndo()` avant ; édition bloquée pendant l'écoute.
- Annotation de la première section : `listenAnnot` = « Grille détectée à l'écoute — à vérifier à l'oreille » (4 langues).
- Tout libellé en 4 langues (`js/i18n.js`) ; `escHtml()` sur tout `innerHTML` alimenté par des données (titre d'onglet, nom de fichier).
- Écoute d'onglet : Chrome / Edge sur ordinateur ; ailleurs (Firefox, mobile), seul le fichier est proposé.
- Commande de test : `node --test tests/*.test.js`.

## Review Focus

- **Partage d'onglet sans « Partager l'audio » coché** → message clair `listenErrNoAudio`, rien n'est modifié dans la grille. Test : Task 4, vérification manuelle + test de `listenStreamHasAudio`.
- **Morceau qui commence par un silence ou une intro sans batterie** → aucune mesure n'est écrite avant que le tempo soit établi ; les trames en attente sont analysées ensuite, sans trou. Test : Task 2, `assembleur : silence initial puis musique`.
- **Pause de la vidéo / pub au milieu** → pas de série de mesures `N.C.` parasites au-delà de 2 mesures ; reprise alignée. Test : Task 2, `silence long arrête le compteur`.
- **Tempo à deux valeurs possibles (87 / 174)** → le tempo saisi par l'utilisateur a priorité ; sinon le plus rapide des deux candidats proches est retenu. Test : Task 1, `estimateTempo 174`.
- **Barre d'espace pendant l'écoute** → ne déclenche pas la lecture du lecteur intégré ; « N » crée une nouvelle section seulement hors des champs texte. Test : Task 4, vérification headless.

---

### Task 1 : Moteur — FFT, chroma, gabarits de tétrades, tempo

**Files:**
- Create: `js/listen-dsp.js`
- Create: `tests/listen-dsp.test.js`
- Create: `tests/helpers/synth.js` (générateur de signaux de test : accords en sinus avec harmoniques, trains de clics, silence)

**Interfaces:**
- Produces (globals + `module.exports` sous Node) :
  - `fftMagnitudes(frame: Float32Array) -> Float32Array` — FFT radix-2 (fenêtre de Hann), longueur `frame.length/2` ; `frame.length` est une puissance de 2.
  - `chromaFromFrame(frame, sampleRate) -> {chroma: number[12], bass: number[12], rms: number}` — énergie par classe de hauteur sur 55–2000 Hz (`chroma`) et 40–220 Hz (`bass`), chacun normalisé à une somme de 1 (zéros si silence) ; `rms` du signal.
  - `CHORD_QUALITIES = ['maj7','m7','7','m7b5','dim7']`, `ROOT_NAMES = ['C','Db','D','Eb','E','F','Gb','G','Ab','A','Bb','B']`.
  - `matchChord(chroma: number[12], bass: number[12]) -> {symbol: string, score: number, margin: number}` — compare aux 60 gabarits (intervalles maj7 `[0,4,7,11]`, m7 `[0,3,7,10]`, 7 `[0,4,7,10]`, m7b5 `[0,3,6,10]`, dim7 `[0,3,6,9]` ; poids racine 1, tierce 1, quinte 0.8, septième 0.8 ; bonus basse sur la racine) par similarité cosinus ; `margin` = meilleur score − meilleur score d'une autre racine ou qualité.
  - `onsetStrength(prevMags, mags) -> number` — flux spectral positif sur le log des magnitudes.
  - `estimateTempo(onsets: number[], hopSec: number, minBpm=60, maxBpm=200) -> {bpm: number, period: number, phase: number}` — autocorrélation de l'enveloppe d'attaques ; parmi les pics ≥ 0.9 × le maximum, le plus petit délai (tempo le plus rapide) ; `phase` = décalage (en trames) du premier temps qui maximise la somme des attaques sur la grille.
  - Constantes : `FRAME_SIZE = 8192`, `HOP_SIZE = 2048`.

- [ ] **Step 1 : Tests qui échouent** (`tests/listen-dsp.test.js`, signaux de `tests/helpers/synth.js` à 44100 Hz)
  - `fftMagnitudes trouve la fréquence d'un sinus` : sinus 440 Hz, trame 8192 → indice du maximum = `round(440 * 8192 / 44100)` ± 1.
  - `chromaFromFrame : classe dominante` : sinus 440 Hz → `chroma` maximal à l'indice 9 (A) ; silence → `rms < 1e-4` et `chroma` tout à 0.
  - `matchChord reconnaît les tétrades` : pour chacun de `Fm7`, `Bbm7`, `Ebmaj7`, `G7`, `Bm7b5`, `Bdim7` synthétisés (4 notes, 3 harmoniques, basse sur la racine une octave en dessous) → `symbol` exact et `margin > 0`.
  - `matchChord écrit des tétrades même pour une triade` : triade Eb majeure → symbole `Ebmaj7` ou `Eb7` (jamais `Eb` seul).
  - `estimateTempo 120` : clics à 120 BPM pendant 12 s, trames HOP_SIZE → `bpm` dans [118, 122].
  - `estimateTempo 174` : clics à 174 BPM → `bpm` dans [171, 177] (pas 87).

- [ ] **Step 2 : Lancer, constater l'échec** — `node --test tests/*.test.js` → FAIL (`Cannot find module '../js/listen-dsp.js'`).
- [ ] **Step 3 : Implémenter** les fonctions ci-dessus dans `js/listen-dsp.js` (aucun accès au DOM au chargement).
- [ ] **Step 4 : Lancer, constater le succès** — `node --test tests/*.test.js` → PASS.
- [ ] **Step 5 : Commit** — `git add js/listen-dsp.js tests/listen-dsp.test.js tests/helpers/synth.js && git commit -m "feat(listen): moteur d'analyse — FFT, chroma, tétrades, tempo"`

---

### Task 2 : Assembleur de mesures, tonalité, sections

**Files:**
- Modify: `js/listen-dsp.js`
- Modify: `tests/listen-dsp.test.js`

**Interfaces:**
- Consumes: Task 1.
- Produces:
  - `createBarAssembler(opts) -> assembler` avec `opts = {beatsPerBar: number, chordsPerBar: 1|2, bpm?: number, hopSec: number}` :
    - `assembler.pushFrame({chroma, bass, rms, onset}) -> BarEvent[]` — renvoie 0, 1 ou plusieurs événements : `{type:'bar', chords:[{symbol, beats, uncertain:boolean}]}`, `{type:'pause'}` (silence long commencé), `{type:'resume'}`, `{type:'tempo', bpm}` (tempo établi, une seule fois). Tant que le tempo n'est pas établi (≥ 8 s de son si `bpm` non fourni), les trames sont mises en attente puis traitées dès qu'il l'est.
    - `assembler.flush() -> BarEvent[]` — termine la mesure en cours (si au moins la moitié des temps sont présents).
    - `assembler.data() -> {bpm, beatChroma: Array<{chroma, bass, silent}>, firstBeatFrame}` — données dérivées gardées pour la reconstruction.
  - `rebuildBars(data, {beatsPerBar, chordsPerBar, beatOffset}) -> Array<{chords:[{symbol, beats, uncertain}]}>` — reconstruit toutes les mesures depuis `beatChroma` (décalage d'un temps = `beatOffset` ±1), même règles que l'assembleur.
  - `UNCERTAIN_MARGIN` (constante, valeur initiale `0.04`, à ajuster sur des morceaux réels) : `uncertain = margin < UNCERTAIN_MARGIN`.
  - `estimateKey(beatChroma) -> string` — corrélation du chroma total avec les profils de Krumhansl (majeur / mineur, 24 tonalités) → `'Ab'`, `'Fm'`… (racines de `ROOT_NAMES`).
  - `proposeSections(symbolsPerBar: string[], sizes=[8,4]) -> Array<{start, length, label}> | null` — découpe en blocs de 8 (sinon 4) mesures ; blocs identiques (même suite d'accords) → même lettre (`A`, `B`, `C`…) ; `null` si aucun bloc ne se répète.

- [ ] **Step 1 : Tests qui échouent** (trames synthétiques : on fabrique directement des objets `{chroma, bass, rms, onset}` avec un `onset` fort sur chaque temps)
  - `assembleur : 8 mesures Fm7 puis Bbm7` (4/4, `bpm` fourni 120) → événements `bar` dans l'ordre, symboles `Fm7`×4 puis `Bbm7`×4, chaque mesure `beats: 4`.
  - `assembleur : 2 accords par mesure seulement si changement` (`chordsPerBar: 2`) : mesure Fm7 entière → 1 accord `beats 4` ; mesure Fm7 | Bb7 → 2 accords `[2,2]` ; en 3/4 → `[2,1]`.
  - `assembleur : silence court → N.C.` : 1 mesure de silence entre deux mesures de musique → une mesure `N.C.`.
  - `silence long arrête le compteur` : 3 mesures de silence → un événement `pause`, aucune mesure `N.C.`, puis `resume` et mesures suivantes correctes.
  - `assembleur : silence initial puis musique` (sans `bpm`, clics à 120) : 3 s de silence puis 12 s de musique → un événement `tempo` (bpm dans [118,122]), première mesure = premier accord joué, pas de mesure vide avant.
  - `accord incertain` : chroma ambigu (deux gabarits presque égaux) → `uncertain: true`.
  - `rebuildBars décale d'un temps` : avec `beatOffset: 1`, les mesures sont reconstruites en partant du 2ᵉ temps.
  - `estimateKey` : chroma de la gamme de Fa mineur → `'Fm'` ; de La bémol majeur → `'Ab'`.
  - `proposeSections` : `['Fm7'×8, 'Fm7'×8, 'Eb7'×8]` (blocs de 8) → `[{start:0,length:8,label:'A'},{start:8,length:8,label:'A'},{start:16,length:8,label:'B'}]` ; suite sans répétition → `null`.
- [ ] **Step 2 : Lancer, constater l'échec.**
- [ ] **Step 3 : Implémenter** dans `js/listen-dsp.js`. Chaque temps agrège le chroma moyen de ses trames ; une mesure = `beatsPerBar` temps ; le symbole d'une mesure (ou d'une demi-mesure en mode 2) vient de `matchChord` sur le chroma moyen ; une trame est silencieuse si `rms` < 1 % du `rms` médian des trames sonores (avec un plancher absolu `1e-4`).
- [ ] **Step 4 : Lancer, constater le succès.**
- [ ] **Step 5 : Commit** — `git commit -m "feat(listen): assembleur de mesures, tonalité, sections"`

---

### Task 3 : Marque d'incertitude dans la grille

**Files:**
- Modify: `js/render.js` (rendu d'un accord : si `chord._uncertain`, ajouter la classe `uncertain` sur le slot et un `<span class="chord-uncertain">?</span>`)
- Modify: `css/app.css` (`.chord-uncertain` discret, couleur ambre atténuée) et `css/print.css` (`.chord-uncertain{display:none!important}`)
- Modify: `js/actions.js:80` (`exportJSON` supprime aussi `_uncertain`)
- Create: `tests/uncertain.test.js`

**Interfaces:**
- Produces: `stripInternalChordFields(chart) -> chart` dans `js/state.js` (testable sans DOM, chargée sous Node via `vm` comme dans `tests/transpose.test.js`), utilisée par `exportJSON` ; renvoie une copie dont chaque accord a perdu `_originalSymbol` et `_uncertain`.
- `applyChord` (`js/modals.js:70`) remplace déjà l'objet accord : la marque disparaît à l'édition sans changement.

- [ ] **Step 1 : Test qui échoue** — `stripInternalChordFields retire _uncertain et _originalSymbol` (copie, l'original intact ; un accord sans ces champs inchangé). Charger `js/state.js` comme dans `tests/transpose.test.js` (contexte `vm` avec DOM minimal).
- [ ] **Step 2 : Lancer, constater l'échec.**
- [ ] **Step 3 : Implémenter** `stripInternalChordFields`, l'utiliser dans `exportJSON`, ajouter le rendu et les styles.
- [ ] **Step 4 : Lancer, constater le succès** ; vérifier en headless qu'un accord `_uncertain` affiche « ? » et qu'il n'apparaît pas en impression (PDF headless comme pour les annotations de section).
- [ ] **Step 5 : Commit** — `git commit -m "feat(listen): marque d'accord incertain, retirée à l'export et à l'impression"`

---

### Task 4 : Écoute — fenêtre, capture, lecture, remplissage en direct

**Files:**
- Create: `js/listen.js`
- Create: `tests/listen.test.js`
- Modify: `index.html` (bouton toolbar « 🎧 » après « 🔎 », entrée dans `#dd-file`, markup `#listen-dialog` et `#listen-bar` **avant** les `<script>`, `<script src="js/listen.js">` après `js/gridsearch.js` ; **pas** de balise pour `listen-dsp.js`)
- Modify: `css/app.css` (bandeau `#listen-bar` fixé en haut, `body.listening` qui bloque l'édition : `pointer-events:none` sur `.measure`, `.section-header`, boutons d'ajout ; la mesure en cours réutilise `.measure.playing`)
- Modify: `js/player.js:368` (le raccourci barre d'espace ne fait rien si `document.body.classList.contains('listening')`)
- Modify: `js/modals.js` (`openModal` ne s'ouvre pas pendant l'écoute)
- Modify: `js/i18n.js`

**Interfaces:**
- Consumes: Task 1-2 (`FRAME_SIZE`, `HOP_SIZE`, `chromaFromFrame`, `fftMagnitudes`, `onsetStrength`, `createBarAssembler`, `estimateKey`), Task 3 (rendu `_uncertain`), `snapshotUndo`, `render`, `_newSectionId`, `_isDirty`, `escHtml`, `t`.
- Produces:
  - `openListen()`, `closeListen()`, `listenStartTab()`, `listenStartFile(file)`, `listenStop()`, `listenNewSection()`, `listenTogglePause()` (fichier seulement).
  - Fonctions pures testées : `listenStreamHasAudio(stream) -> boolean` (au moins une piste audio `readyState !== 'ended'`), `listenTitleFromFile(name) -> string` (nom sans extension), `nextSectionLabel(labels: string[]) -> string` (`[]→'A'`, `['A']→'B'`, `['A','B']→'C'`… après `Z` → `A2`), `listenNewChart({title, bpm, timeSig}) -> chartData` (une section `A`, annotation = `t('listenAnnot')` sous navigateur, chaîne passée en paramètre sous Node, `measures: []`, `key: 'C'`, `style: ''`).

- [ ] **Step 1 : Tests qui échouent** (`tests/listen.test.js`) pour les quatre fonctions pures ci-dessus (`js/listen.js` chargeable sous Node : rien ne touche `document` au chargement).
- [ ] **Step 2 : Lancer, constater l'échec.**
- [ ] **Step 3 : Implémenter les fonctions pures.**
- [ ] **Step 4 : Lancer, constater le succès.**
- [ ] **Step 5 : Implémenter la colle navigateur**
  - `openListen()` : charge `js/listen-dsp.js` (injection d'une balise `<script>`, une seule fois, promesse) puis ouvre `#listen-dialog` : deux gros boutons (« 🎧 Écouter un onglet » masqué si `!navigator.mediaDevices?.getDisplayMedia`), zone de dépôt + input `accept="audio/*"`, réglages mesure (liste `2/4,3/4,4/4,5/4,6/8,7/8,12/8`, défaut `4/4`), tempo (`auto` par défaut, champ nombre, bouton « Taper » qui moyenne les 4 derniers intervalles), accords par mesure (`1` / `2`), rappel `listenTabHint`.
  - Démarrage commun : si `_isDirty` et `!confirm(t('listenConfirmReplace'))` → stop ; `snapshotUndo()` ; `chartData = listenNewChart(...)` ; afficher l'éditeur, `render()` ; `document.body.classList.add('listening')` ; afficher `#listen-bar` (🔴, tempo, métrique, n° de mesure, « Nouvelle section », « ■ Arrêter », et pour un fichier « ⏸ / ▶ »).
  - Onglet : `getDisplayMedia({video:true, audio:true})` ; si `!listenStreamHasAudio` → arrêter les pistes, message `listenErrNoAudio`, ne rien changer. Arrêter la piste vidéo ; titre = `label` de la piste vidéo si non vide, sinon `t('listenDefaultTitle')`. `AudioContext` → `createMediaStreamSource` → `AnalyserNode` (`fftSize = FRAME_SIZE`), **non relié** aux haut-parleurs (l'onglet joue déjà). Fin de partage (`ended`) → `listenStop()`.
  - Fichier : `decodeAudioData` → `AudioBufferSourceNode` relié à l'analyseur **et** à `ctx.destination` (audible) ; pause/reprise via `ctx.suspend/resume` (l'analyse est suspendue aussi) ; fin du fichier → `listenStop()`. Titre = `listenTitleFromFile(name)`.
  - Boucle : toutes les `HOP_SIZE / sampleRate` secondes (horloge `ctx.currentTime`, pas `Date`), lire `getFloatTimeDomainData`, calculer chroma / onset, `assembler.pushFrame` ; pour chaque `bar` : ajouter la mesure à la dernière section (`_uncertain` sur les accords incertains), `render()`, surligner la dernière mesure (`.playing`) et `scrollIntoView` ; `tempo` → `chartData.tempo` et bandeau.
  - « Nouvelle section » (bouton + touche `N` hors champ texte) : nouvelle section `nextSectionLabel`, les mesures suivantes y vont.
  - `listenStop()` : `assembler.flush()`, arrêter source / pistes / contexte, retirer `listening`, cacher le surlignage ; `chartData.key = estimateKey(...)` ; garder `assembler.data()` en mémoire ; afficher dans le bandeau (mode « terminé ») : « ◀ Décaler d'un temps ▶ », « 1 / 2 accords par mesure » (via `rebuildBars`, après confirmation si l'utilisateur a modifié la grille depuis l'arrêt), et si l'utilisateur n'a créé aucune section et que `proposeSections` ne renvoie pas `null` : « Sections proposées : A(8) A(8) B(8) — Appliquer / Ignorer » ; bouton « Fermer ». `_isDirty = true`.
  - i18n (FR, traduire ES / IT / EN) : `btnListen:'🎧 Créer une grille à l\'écoute'`, `listenTitle`, `listenBtnTab:'🎧 Écouter un onglet'`, `listenBtnFile:'📄 Déposer un fichier audio'`, `listenTabHint:'Choisis l\'onglet du morceau et coche « Partager l\'audio ».'`, `listenLblTimeSig`, `listenLblTempo`, `listenTempoAuto:'auto'`, `listenTap:'Taper'`, `listenLblChords:'Accords par mesure'`, `listenStatus:'🔴 Écoute en cours'`, `listenBar:'mesure'`, `listenNewSection:'Nouvelle section'`, `listenStop:'■ Arrêter'`, `listenPause`, `listenResume`, `listenShift:'Décaler d\'un temps'`, `listenSections:'Sections proposées :'`, `listenApply:'Appliquer'`, `listenIgnore:'Ignorer'`, `listenClose:'Fermer'`, `listenAnnot:'Grille détectée à l\'écoute — à vérifier à l\'oreille'`, `listenDefaultTitle:'Grille à l\'écoute'`, `listenConfirmReplace:'Remplacer la grille en cours ? Les modifications non sauvegardées seront perdues (Ctrl+Z pour annuler).'`, `listenErrNoAudio:'Aucun son reçu : relance le partage et coche « Partager l\'audio ».'`, `listenErrFile:'Fichier audio illisible.'`.
- [ ] **Step 6 : Vérifier en headless** (Chrome, page de test dans le dossier scratchpad) : ouverture de la fenêtre, chargement paresseux de `listen-dsp.js` (absent avant, présent après), bouton onglet masqué si `getDisplayMedia` absent, `listenErrNoAudio` avec un flux simulé sans piste audio, barre d'espace sans effet sous `body.listening`, touche `N` crée une section. Puis **lecture réelle d'un fichier** : générer avec `tests/helpers/synth.js` un WAV de 16 mesures (Fm7×8, Bbm7×8, 120 BPM) dans le scratchpad, le donner à `listenStartFile` et vérifier à la fin : 16 mesures, symboles attendus, tempo dans [118,122], tonalité `Fm`, annotation présente. Dire précisément ce qui n'a pas pu être vérifié (vrai partage d'onglet).
- [ ] **Step 7 : Commit** — `git commit -m "feat(listen): créer une grille à l'écoute — onglet et fichier audio"`

---

### Task 5 : Documentation

**Files:** `README.md`, `README.en.md` (fonctionnalité « 🎧 Créer une grille à l'écoute », limites : Chrome/Edge pour l'onglet, tétrades, à vérifier à l'oreille, rien n'est enregistré), `CHANGELOG.md` (section `## v5.1 (en cours)` : ajouter l'écoute), `CLAUDE.md` (arborescence `js/listen.js`, `js/listen-dsp.js`, chargement paresseux), `doc/doc.html` (paragraphe de la fonctionnalité).

- [ ] **Step 1 : Rédiger.**
- [ ] **Step 2 : Vérifier** : `node --test tests/*.test.js` → PASS ; `grep -n "écoute\|Listen" README.md README.en.md CHANGELOG.md CLAUDE.md` → au moins une ligne par fichier.
- [ ] **Step 3 : Commit** — `git commit -m "docs: grille à l'écoute"`

---

## Après l'implémentation (utilisateur)

Régler `UNCERTAIN_MARGIN` et vérifier la qualité sur de vrais morceaux : *Knucklehead* (grille `.json` de référence) si l'utilisateur en a l'audio, plus 2-3 morceaux à harmonie simple. Objectif indicatif de la spec : une large majorité de mesures avec la bonne fondamentale et le bon mode.

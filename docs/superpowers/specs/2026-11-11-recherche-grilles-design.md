# Design — Recherche de grilles en ligne + import iReal Pro

Date : 2026-11-11

## Intention

Aujourd'hui, pour avoir la grille d'un morceau dans JazzGrid, l'utilisateur (bassiste) la saisit à la main ou passe par des outils externes, puis importe un `.json` ou un MusicXML. Il veut pouvoir **partir du titre d'un morceau** et arriver à une grille éditable dans JazzGrid, sans ressaisie, en passant par des sources web autorisées.

Usage visé : **les standards jazz** (largement couverts par les grilles partagées sur le forum iReal Pro) **et des morceaux plus rares** (ex. *Knucklehead*, Grover Washington Jr.), pour lesquels on trouvera moins souvent une source.

Deux briques, validées par l'utilisateur :

- **A — base : recherche guidée + import par collage de lien / fichier.** Fiable, gratuit, légal.
- **B — bonus : recherche par l'assistant IA (Claude uniquement).** Plus direct, mais payant à l'usage (clé API) et faillible.
- **C — nettoyage lié : retrait d'OpenAI de l'assistant IA.** Décision utilisateur : l'assistant IA ne fonctionne plus qu'avec Claude.

## Objectifs

- Un point d'entrée unique « 🔎 Trouver une grille ».
- Lancer en un clic une recherche pré-remplie (titre + compositeur) sur des sources web autorisées, **dans un nouvel onglet**.
- Importer une grille trouvée en **collant un lien `irealb://` / `irealbook://`** ou en **déposant un fichier** `.musicxml` / `.xml` / `.mxl`.
- **Aperçu** de la grille avant import ; l'import remplace la grille courante après confirmation.
- Implémenter l'**import iReal Pro** (ligne de la feuille de route README « Import iReal Pro® `.irealbook` »).
- Bonus : dans le panneau IA, « Trouve-moi la grille de … » → Claude cherche sur le web, cite ses sources, propose une grille via le flux existant brouillon → aperçu → appliquer.
- Retirer OpenAI de l'assistant IA (code, réglages ⚙, documentation).

## Non-objectifs

- Aller lire / extraire le contenu des sites depuis l'appli (le navigateur l'interdit — CORS — et ce serait du scraping).
- Récupérer quoi que ce soit depuis YouTube ou une plateforme vidéo/audio.
- Héberger ou embarquer une base de grilles dans l'appli.
- Export vers iReal Pro (seulement l'import).

## Anti-objectifs (ce qui rendrait la fonctionnalité ratée même si elle « marche »)

- Une grille IA appliquée **sans** que l'utilisateur ait vu l'aperçu et les sources.
- Une grille importée qui **écrase** la grille en cours sans confirmation alors qu'il y a des modifications non sauvegardées.
- Perdre des informations structurantes d'une grille iReal (sections, reprises, voltas, coda/segno) en silence.
- Casser le fonctionnement hors ligne du cœur de l'appli.

## Contraintes

- Projet sans build ni bundler : HTML/JS/CSS vanilla, fichiers dans `js/`, `css/`, chargés par `index.html`.
- i18n FR / ES / IT / EN obligatoire pour tout libellé (`js/i18n.js`).
- Sécurité : toute donnée importée (lien iReal, MusicXML, réponse IA, sources) est non fiable → `escHtml()` sur tout `innerHTML` (voir `CLAUDE.md`, section Sécurité). Les URLs de sources affichées par l'IA ne sont rendues cliquables que si elles sont en `http(s)://`.
- La conversion iReal → `chartData` se fait localement, sans réseau.
- Format cible : `chartData` existant (`title, key, tempo, timeSig, style, composer, sections[{id,label,annotation,measures[{chords[{symbol,beats,annot,altChord}], barlineLeft, barlineRight, volta, navSymbol, repeatStart, repeatEnd}]}]}`), cf. un `.json` exporté par l'appli.

## Ce qui a été décidé

### Point d'entrée

- Bouton **🔎 Trouver une grille** dans la toolbar (à côté de 📁 Fichier), et entrée équivalente dans le menu 📁 Fichier.
- Il ouvre une fenêtre (même famille visuelle que les dialogues existants, ex. `#midi-dialog`).

### Fenêtre « Trouver une grille » (brique A)

1. **Champs** : titre (obligatoire pour chercher), compositeur (facultatif). Pré-remplis avec le titre de la grille courante, et avec `chartData.composer` s'il existe.
   - *Choix de Claude :* `composer` reste une donnée stockée dans le JSON (déjà présente dans certains fichiers de l'utilisateur, et conservée par `exportJSON()`), renseignée par l'import iReal. **Pas** de nouveau champ « compositeur » dans l'en-tête de la grille, ni à l'impression, dans cette itération.
2. **Boutons de recherche ↗** — chacun ouvre un nouvel onglet avec une requête pré-remplie :
   - *Forum iReal Pro* — grilles partagées par la communauté (requête restreinte au site du forum).
   - *Web (grilles iReal)* — recherche web générale du titre + compositeur + « irealb ».
   - *MusicXML libres* — recherche du titre + « musicxml ».
3. **Zone d'import** : un champ où coller un lien `irealb://…` ou `irealbook://…`, et une zone de dépôt / bouton pour un fichier `.musicxml` / `.xml` / `.mxl` (réutilise `loadFileAsXML()` + `parseMusicXML()`).
4. **Choix du morceau** : si le lien contient plusieurs morceaux (playlist iReal, parfois des centaines), afficher une liste filtrable par titre pour en choisir un.
5. **Aperçu** compact de la grille obtenue (sections + accords, lisible en une ligne par section, ex. `Intro ‖: Fm7 | Fm7 | Fm7 | Fm7 :‖`), avec titre / compositeur / tonalité / tempo / style.
6. **Importer dans la grille** : remplace la grille courante. Si modifications non sauvegardées (`_isDirty`), demander confirmation (*choix de Claude :* uniquement depuis cette nouvelle fenêtre ; les imports JSON / MusicXML existants et le glisser-déposer ne changent pas). Faire un `snapshotUndo()` avant pour pouvoir annuler. Ensuite : même séquence que l'import MusicXML existant (`_ensureSectionIds`, `originalKey`, remise à zéro de la transposition, `render()`).

### Import iReal Pro

- Formats acceptés : `irealb://` (format chiffré/brouillé actuel) et `irealbook://` (ancien format en clair), URL-encodés, un ou plusieurs morceaux.
- À reprendre : titre, compositeur, style, tonalité, tempo s'il est présent, mesure (time signature), sections (marqueurs A/B/C/In/V…), barres de mesure et reprises, voltas 1/2, coda, segno, D.C./D.S./Fine, `N.C.`, mesure répétée (`%`), accords slash, accords alternatifs si présents.
- Les qualités d'accords iReal sont converties vers les qualités de JazzGrid ; un accord non reconnu est conservé tel quel comme symbole libre plutôt que perdu.
- Ce qui ne se traduit pas est ignoré, mais signalé dans l'annotation de la section concernée ou dans un message après import. *Choix de Claude :* on n'étend **pas** les symboles de navigation de JazzGrid (`NAV_DISPLAY` : segno, coda, dc-coda, ds-coda, dc-fine, fine, fermata). Les indications iReal sans équivalent (D.S. al Fine, D.C. al Segno, répétition de 2 mesures, etc.) deviennent une annotation de section.

### Recherche par l'IA (brique B, Claude uniquement)

- Dans le panneau IA existant (`js/ai.js`), l'utilisateur écrit par ex. « Trouve-moi la grille de Knucklehead de Grover Washington Jr. ».
- L'appel Claude active l'**outil de recherche web côté serveur d'Anthropic** ; Claude cherche, puis propose la grille via les outils d'édition, ce qui passe par le flux existant **brouillon → aperçu des changements → Appliquer / Annuler**.
- La réponse **cite ses sources** (liens) dans le message affiché.
- **La recherche web n'est active que sur demande explicite** (décision utilisateur) : un interrupteur « 🌐 Chercher sur le web » dans le panneau IA, **désactivé par défaut**. Chaque recherche web est facturée en plus des tokens ; les demandes d'édition habituelles ne doivent pas déclencher de recherche. *Choix de Claude :* l'interrupteur se désactive automatiquement après chaque envoi, pour éviter de laisser la facturation active par oubli.
- La grille proposée porte dans l'annotation de la première section une mention « Grille proposée par l'IA à partir de : … — à vérifier à l'oreille ».
- Si Claude trouve un lien `irealb://` dans ses résultats, il peut le donner à l'utilisateur ; l'import par la brique A reste la voie fiable.

### Retrait d'OpenAI (brique C)

- `js/ai.js` : supprimer `_aiCallOpenAI`, l'aiguillage par fournisseur dans `aiProviderChat`, les réglages `provider` / `openaiKey` / `openaiModel`.
- `index.html` : supprimer le sélecteur de fournisseur et la ligne de réglages OpenAI du panneau ⚙ ; libellés i18n devenus inutiles retirés.
- Migration au démarrage : si `localStorage['jgg_ai_settings']` contient une clé OpenAI, la **supprimer** (une clé en clair qui ne sert plus est un risque inutile) ; si le fournisseur était OpenAI, basculer sur Claude et, s'il n'y a pas de clé Claude, afficher le message habituel « Clé API non configurée ».
- Documentation : README FR/EN (section configuration IA, tableau des réglages), `CLAUDE.md`. L'historique des versions passées (CHANGELOG, « v4.0 — Claude et OpenAI ») n'est pas réécrit.

## Laissé au constructeur

- Moteur de recherche utilisé par les boutons ↗ et forme exacte des requêtes.
- Parser iReal : implémentation maison (le format est documenté par plusieurs projets open source) ; organisation en fichier dédié (ex. `js/ireal.js`).
- Table de correspondance des qualités d'accords iReal ↔ JazzGrid.
- Comment l'IA construit une grille entière : nouvel outil « remplacer la grille » ou enchaînement des outils existants (`add_section`, `add_bar`, `add_chord`…). La seule exigence : passer par le brouillon et l'aperçu.
- Gestion des réponses longues de la recherche web côté API (reprise si l'API interrompt le tour).
- Mise en page exacte de la fenêtre, dans le style de l'appli.

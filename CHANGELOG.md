# Changelog

## v5.1 (novembre 2026)
- ✅ Trouver une grille — fenêtre « 🔎 Trouver une grille » : boutons de recherche DuckDuckGo (forum iReal Pro, web, MusicXML libres), collage d'un lien `irealb://` / `irealbook://` ou dépôt d'un fichier `.musicxml` / `.xml` / `.mxl`, liste filtrable pour les playlists, aperçu, import avec confirmation et annulation par Ctrl+Z (`js/gridsearch.js`)
- ✅ Import iReal Pro® — décodage des liens `irealb://` et `irealbook://` (`js/ireal.js`) : sections, reprises, voltas, coda/segno, `N.C.`, `%`, accords slash et alternatifs ; qualités inconnues conservées comme symboles libres ; indications non traduisibles reportées en annotation de section
- ✅ Assistant IA sur Claude uniquement — OpenAI retiré ; ancienne clé OpenAI effacée au démarrage ; modèles Opus 5.5 (par défaut), Sonnet 5.5, Haiku 5.5
- ✅ Recherche web par l'IA — bouton « 🌐 Chercher sur le web » (désactivé par défaut, réinitialisé après chaque envoi ; chaque recherche est facturée par Anthropic en plus de l'usage Claude habituel) : Claude cherche sur le web, cite ses sources et propose une grille complète via l'aperçu existant ; annotation « Grille proposée par l'IA à partir de : … — à vérifier à l'oreille »
- ✅ Créer une grille à l'écoute — « 🎧 Créer une grille à l'écoute » : écoute d'un onglet (Chrome/Edge ordinateur, « Partager l'audio ») ou d'un fichier audio déposé, lu en temps réel ; la grille se remplit en direct mesure par mesure (mesure courante surlignée, « Nouvelle section » / touche `N`, édition verrouillée, « ■ Arrêter ») ; pause (fichier : lecture et analyse ; onglet : « ⏸ Pause analyse », l'onglet continue de jouer, la grille se recale à la reprise) ; confirmation de remplacement avant la fenêtre de partage d'onglet ; réglages métrique, tempo (auto / saisi / tapé), 1 ou 2 accords par mesure ; tétrades uniquement (maj7, m7, 7, m7b5, dim7), accords incertains marqués « ? » (non imprimé, non sauvegardé), silences courts → N.C. ; à l'arrêt : tonalité proposée, décalage d'un temps, bascule 1/2 accords, sections proposées, confirmation et Ctrl+Z ; rien n'est enregistré ni envoyé, moteur d'analyse local sans bibliothèque chargé à la demande (`js/listen.js`, `js/listen-dsp.js`) ; annotation « Grille détectée à l'écoute — à vérifier à l'oreille »
- ✅ Tests Node — `node --test tests/*.test.js` (Node n'est requis que pour les tests, pas pour utiliser l'application)

## v5.0 (juillet 2026)
- ✅ Plein écran — bouton `⛶` dans la toolbar ; masque le chrome du navigateur (barre d'adresse, onglets) ; toggle : second clic ou `Échap` pour sortir ; état actif reflété par la classe `.active` sur le bouton ; synchronisé avec le bouton natif du navigateur via `fullscreenchange`
- ✅ Wake lock — désactive la mise en veille de l'écran à l'entrée en plein écran ; relâché automatiquement à la sortie ; re-demandé si l'onglet reprend le focus (`visibilitychange`) ; échec silencieux si le navigateur ne supporte pas l'API (Firefox)

## v4.9 (juin 2026)
- ✅ Mode concert — au play, l'UI se masque (sauf la grille) ; barre flottante `#concert-bar` avec compteur de mesure et stop ; clic sur la grille pour revenir
- ✅ Métronome — bouton ♩ dans la toolbar (indépendant) + option dans la dialog de lecture (synchronisé aux accords) ; calé sur tempo et métrique ; volume ajustable et persisté ; gains rééquilibrés avec la lecture des accords
- ✅ Impression 1 page — option pour réduire la fonte et faire tenir toute la grille sur une page A4
- ✅ Symboles de navigation à l'impression — masqués par défaut, affichables via option ; encre forcée en noir (symboles nav + barres de reprise)

## v4.8 (juin 2026)
- ✅ Voicings jazz dans le lecteur intégré — étalement sur 2 octaves : chaque note du piano est placée strictement au-dessus de la précédente (ex. Cmaj9 → C4 E4 G4 B4 D5, C13 → C4 E4 G4 Bb4 D5 A5) ; toutes les extensions (`ARP_DEF`) incluses (plus de limite à 4 sons) ; accords slash (`C/E`, `Dm7/F#`…) : la note de basse est envoyée au canal basse au lieu de la fondamentale, validée via `noteIdx()`

## v4.7 (juin 2026)
- ✅ Export MIDI — Standard MIDI File (Type 0) ; voicings accords piano (canal 0, octave 4) + basse (canal 1, octave 2) ; sélecteur de répétitions (1–16) ; `N.C.` / `%` gérés
- ✅ Lecteur intégré — Web Audio API + soundfont-player CDN (piano acoustique + basse acoustique) ; résolveur de navigation complet : barres de reprise, volta 1/2, D.C. al Coda, D.S. al Coda, D.C. al Fine, Fine, Segno ; `%` / `/` résolus vers l'accord précédent ; mesure en cours surlignée (amber) avec scroll auto ; barre d'espace play/stop (ignoré dans les champs texte) ; instruments mis en cache après premier chargement
- ✅ Toolbar rationalisée — 17 éléments regroupés en 7 zones : menus déroulants 📁 Fichier (Nouveau · Ouvrir · Importer JSON · Sauvegarder JSON) et ⬆ Exporter (MusicXML · MXL · MIDI · Imprimer) ; fermeture au clic extérieur
- ✅ Fix dialog MIDI — le div `#midi-dialog` était placé après les `<script>`, donc `applyTranslations()` ne trouvait pas les éléments au démarrage ; déplacé avant les scripts

## v4.6 (mai 2026)
- ✅ Import MusicXML (`.musicxml`, `.xml`, `.mxl`) dans le Songbook, au même titre que les `.json` JGG
- ✅ Fix auto-scroll Songbook — la boucle rAF ne s'arrêtait plus immédiatement si l'iframe n'avait pas encore de contenu overflow

## v4.5 (mai 2026)
- ✅ Jazz Songbook — application compagnon (`songbook/`) : bibliothèque de morceaux, setlists, lecteur audio, auto-scroll réglable
- ✅ Intégration iframe JGG en mode view (`?mode=view`) depuis le Songbook
- ✅ BLE-MIDI — connexion HX Stomp, envoi Program Change + CC via Web Bluetooth
- ✅ IndexedDB — persistance locale songs/setlists/audioblobs
- ✅ Mode view JGG : masquage UI d'édition, navigation setlist précédent/suivant

## v4.4 (mai 2026)
- ✅ Avertissement avant fermeture de l'onglet si des modifications non sauvegardées sont en cours (flag `_isDirty`, listener `beforeunload`)

## v4.3 (mai 2026)
- ✅ ID unique par section (`#xxxx`), persisté en JSON, masqué à l'impression ; migration automatique des fichiers anciens
- ✅ Nouvel outil IA `toggle_all_diagrams`
- ✅ `set_annotation` expose `showSvg` pour contrôler la visibilité du diagramme
- ✅ Fix : export/import MXL restauré ; champs méta lisibles à l'impression

## v4.2 (mai 2026)
- ✅ Rendu Markdown dans les réponses IA — paragraphes, listes, **gras**, *italique*, `code`

## v4.0 (mai 2026)
- ✅ Assistant IA conversationnel — Claude et OpenAI®
- ✅ 15 outils IA : sections, mesures, accords, annotations, métadonnées, transposition
- ✅ Flux draft-preview-apply avec liste des changements et undo intégré
- ✅ Panneau IA en barre du bas, pleine largeur

## v3.0 (avril 2026)
- ✅ Diagrammes 5 cordes (BEADG) pour les 17 modes
- ✅ Toggle 🎸 4/5 cordes dans la toolbar, persisté en localStorage
- ✅ Correction `transposeModesvg()` — support des degrés altérés (`b2`, `#4`, `b6`, `b7`…)
- ✅ Réduction automatique de police en PDF pour les mesures multi-accords
- ✅ Auto-annotation à l'import MusicXML
- ✅ Menus popup (barlines, navigation) repositionnés en bord d'écran

## v2.0
- ✅ Historique Annuler / Rétablir (10 niveaux, Ctrl+Z/Y, boutons toolbar)
- ✅ Support tactile tablette — drag & drop Touch Events, pinch-to-zoom, MutationObserver
- ✅ Symbole `(w)` basse seule
- ✅ Accord alternatif (substitution tritoniée)
- ✅ Barres de mesure enrichies, Voltas, Symboles de navigation
- ✅ Symboles iReal Pro® (`%`, `𝄎`, `N.C.`, `/`)
- ✅ Drag & drop sections et mesures
- ✅ Import/Export MXL (JSZip)
- ✅ 4 langues (FR, ES, IT, EN)

## v1.0
- ✅ Éditeur de grilles basique
- ✅ Annotations de théorie musicale
- ✅ Import MusicXML
- ✅ Transposition chromatique
- ✅ Import/export JSON
- ✅ Impression PDF thème clair/sombre

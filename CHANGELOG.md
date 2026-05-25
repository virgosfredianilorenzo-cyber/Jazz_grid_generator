# Changelog

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

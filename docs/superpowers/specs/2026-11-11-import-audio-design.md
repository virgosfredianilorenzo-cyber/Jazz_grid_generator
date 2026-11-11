# Design — Grille à l'écoute : écouter un onglet + dépôt de fichier audio

Date : 2026-11-11

## Intention

L'utilisateur (bassiste) écoute ses morceaux **surtout en streaming et sur YouTube**, avec quelques mp3. Pour les morceaux dont on ne trouve pas de grille en ligne (ex. *Knucklehead*, Grover Washington Jr.), il veut **un premier jet de grille obtenu à l'écoute**, qu'il corrige ensuite à l'oreille dans JazzGrid. Jusqu'ici, il demandait à un chatbot à partir d'un lien YouTube ; le chatbot n'écoute pas réellement le morceau, d'où des grilles « à vérifier à l'oreille ».

Cette fonctionnalité complète la recherche de grilles en ligne (spec `2026-11-11-recherche-grilles-design.md`) : la recherche pour ce qui existe déjà, l'écoute pour le reste.

## Objectifs

- **🎧 Écouter un onglet** : l'utilisateur partage l'onglet où joue le morceau (YouTube, lecteur web de streaming) ; l'appli analyse l'audio **pendant la lecture**.
- **Dépôt de fichier audio** (mp3, wav, m4a ; ce que le navigateur sait décoder) : même analyse, plus rapide que le temps réel.
- Détection du **tempo**, du **placement des mesures**, et d'**un accord par mesure** (ou deux, au choix).
- **Vocabulaire d'accords écrit : toujours des tétrades** (décision utilisateur) — `maj7`, `m7`, `7`, `m7b5`, `dim7`. Pas de triades : un accord majeur sans septième entendue est écrit `maj7` ou `7` selon ce qui ressort le mieux, l'utilisateur corrige à l'oreille. Pas de sus, 6, aug dans cette itération.
- **Affichage en direct, mesure par mesure, directement dans la grille principale** (décision utilisateur, option A de la maquette) : la grille se construit dans l'éditeur habituel, rendu JazzGrid réel.
- Signaler les accords dont la détection est incertaine.
- Le résultat est une grille JazzGrid normale (`chartData`), éditable, sauvegardable, imprimable.

## Non-objectifs

- Télécharger ou enregistrer l'audio d'un site (YouTube ou autre). L'audio d'un onglet est **analysé à la volée et jamais stocké**.
- Transcrire la mélodie ou la ligne de basse note à note.
- Détecter fidèlement les extensions jazz (9, 11, 13, altérations) : hors de portée d'une détection fiable ; le vocabulaire visé est celui des tétrades et triades de base.
- Fonctionner dans Firefox pour l'écoute d'un onglet (Firefox ne partage pas l'audio d'un onglet). Le dépôt de fichier, lui, doit marcher partout.
- Envoyer l'audio à un service externe ou à une IA.

## Anti-objectifs

- Écraser la grille en cours sans confirmation alors qu'elle contient des modifications non sauvegardées.
- Une grille présentée comme sûre alors que la détection ne l'est pas : l'incertitude doit être visible.
- Alourdir le chargement de l'appli pour tous les utilisateurs : le moteur d'analyse n'est chargé qu'à la première utilisation.
- Introduire une dépendance dont la licence est incompatible avec la licence Apache 2.0 du projet.

## Contraintes

- Sans build ni bundler ; vanilla JS ; bibliothèques éventuelles chargées depuis un CDN, comme JSZip et soundfont-player aujourd'hui.
- **Licence** : toute bibliothèque utilisée doit être compatible avec Apache 2.0 (ex. MIT, BSD, Apache). Attention : Essentia.js est sous AGPL-3.0, donc à écarter sauf avis contraire de l'utilisateur.
- Écoute d'un onglet : `navigator.mediaDevices.getDisplayMedia` avec audio ; Chrome et Edge sur ordinateur. L'utilisateur doit cocher « Partager l'audio » dans la fenêtre de Chrome : l'appli le lui rappelle, et affiche un message clair si aucune piste audio n'est reçue.
- Tout libellé en 4 langues (`js/i18n.js`). `escHtml()` pour tout `innerHTML` alimenté par des données (noms de fichiers, etc.).
- Format cible : `chartData` existant (cf. un `.json` exporté par l'appli).
- Le reste de l'appli continue de fonctionner hors ligne ; l'analyse d'un fichier fonctionne hors ligne une fois le moteur chargé.

## Ce qui a été décidé

### Point d'entrée et démarrage

- Bouton **🎧 Créer une grille à l'écoute** (toolbar, et entrée dans 📁 Fichier).
- Fenêtre de démarrage : deux gros choix, **🎧 Écouter un onglet** / **📄 Déposer un fichier audio** ; réglages : mesure (4/4 par défaut, liste des métriques de l'appli), tempo (**auto** par défaut, ou saisi / tapé au clavier), accords par mesure (**1** par défaut, ou 2).
- Pour l'onglet : rappel « choisis l'onglet et coche Partager l'audio », puis la fenêtre de partage de Chrome.

### Pendant l'écoute (option A)

- Si la grille courante a des modifications non sauvegardées (`_isDirty`) : confirmation. Puis `snapshotUndo()` pour pouvoir revenir à la grille d'avant.
- La grille principale est remplacée par une grille neuve (titre = titre de l'onglet ou nom du fichier, modifiable ensuite) qui **se remplit mesure par mesure** dans l'éditeur habituel.
- **Bandeau d'écoute** en haut : 🔴 état, tempo détecté, métrique, numéro de mesure, bouton **■ Arrêter**.
- **Mesure en cours surlignée en ambre** (même code couleur que le lecteur intégré) ; la page défile pour la garder visible.
- **Accord incertain** : marqué visuellement (ex. « ? » discret) ; la marque disparaît dès que l'utilisateur modifie l'accord. Elle n'apparaît pas à l'impression.
  - *Choix de Claude :* c'est une marque **temporaire**, propre à la session : un champ interne de l'accord (préfixé `_`, comme `_originalSymbol`), retiré à l'export JSON et absent du MusicXML. Elle disparaît donc au rechargement. Elle suit la transposition et l'annulation (undo / redo).
- *Choix de Claude :* bouton **« Nouvelle section »** dans le bandeau (et raccourci clavier) : l'utilisateur le presse quand il entend une nouvelle partie ; les mesures suivantes vont dans une nouvelle section. C'est plus fiable qu'une détection automatique et ça colle à l'écoute d'un musicien.
- *Choix de Claude :* un silence **court** (moins de 2 mesures) à tempo stable est compté comme des mesures — ce sont les stops et breaks, fréquents en jazz-funk — et noté `N.C.`. Un silence **plus long** (pause de la vidéo, pub, fin du morceau) arrête le compteur de mesures, qui reprend avec le son.
- Pendant l'écoute, l'édition de la grille est bloquée (pour ne pas modifier une mesure en cours d'écriture). Elle redevient normale à l'arrêt.

### Fin de l'écoute

- À **■ Arrêter** (ou en fin de fichier, ou si l'utilisateur arrête le partage d'onglet), la grille reste telle quelle, éditable.
- Tonalité proposée à partir des accords détectés ; tempo et métrique renseignés dans les métadonnées.
- Annotation de la première section : « Grille détectée à l'écoute — à vérifier à l'oreille ».
- *Choix de Claude :* les **données d'analyse** (chroma par temps, positions des temps — jamais l'audio lui-même) restent **en mémoire jusqu'à la prochaine écoute ou au rechargement de la page**, sans être sauvegardées. Après l'arrêt, elles permettent sans réécouter : décaler le calage d'un temps, passer de 1 à 2 accords par mesure, proposer les sections.
- *Choix de Claude :* si l'utilisateur n'a créé aucune section pendant l'écoute, l'appli propose à la fin un découpage en sections à partir des passages qui se répètent ; l'utilisateur accepte ou ignore. Pas de découpage imposé.

### Dépôt de fichier

- **Le fichier est joué normalement, de façon audible, en temps réel** (décision utilisateur), exactement comme l'écoute d'un onglet : la grille se remplit en rythme, la mesure en cours est surlignée, le bouton « Nouvelle section » sert pareil. Le fichier est décodé localement. Le bandeau ajoute les contrôles de lecture utiles (pause / reprise) ; *choix de Claude :* pas d'analyse muette accélérée dans cette itération.
- Le fichier n'est ni stocké ni envoyé.

### Accords par mesure

- *Choix de Claude :* « 2 accords par mesure » veut dire **jusqu'à 2** : le second accord n'est écrit que si un changement est détecté au milieu de la mesure ; sinon, un seul accord sur toute la mesure. Coupure : à la moitié en 4/4 (2+2) ; pour les métriques impaires, sur le temps fort secondaire (3/4 → 2+1, 5/4 → 3+2 ; les autres sont laissées au constructeur).

### Critère d'acceptation

- *Choix de Claude :* tester sur quelques morceaux dont l'utilisateur a déjà la grille, dont *Knucklehead* (grille `.json` existante) s'il en a l'audio. Objectif indicatif : sur des morceaux à harmonie simple, une large majorité de mesures avec la bonne fondamentale et le bon mode (majeur / mineur). Les seuils d'incertitude sont réglés sur ces morceaux.

## Laissé au constructeur

- Moteur d'analyse : bibliothèque permissive (ex. extraction de chroma) et/ou code maison (chroma + comparaison à des gabarits d'accords, suivi de tempo) ; il faut juste respecter les contraintes de licence, de chargement différé et de vocabulaire d'accords.
- Seuil et calcul de l'incertitude.
- Détection du premier temps / de l'anacrouse, et correction du calage par l'utilisateur si besoin (ex. décaler d'un temps).
- Raccourci clavier pour « Nouvelle section » (attention : la barre d'espace sert déjà à lecture/arrêt).
- Algorithme de proposition des sections à la fin.
- Comportement exact sur mobile (le partage d'onglet n'y existe pas : n'y proposer que le fichier).

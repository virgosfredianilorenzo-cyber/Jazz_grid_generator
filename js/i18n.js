/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   JS — I18N
   Dictionnaires FR / ES / IT / EN  +  applyTranslations()  +  setLang()
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */


const LANGS = {
  fr: {
    menuFile:'📁 Fichier',menuExport:'⬆ Exporter',btnOpen:'📂 Ouvrir…',btnNew:'✨ Nouveau',lblTranspose:'🎵 Transposer :',keyPlaceholder:'Tonalité…',lblCols:'Colonnes :',btnPrint:'🖨️ Imprimer',btnExportJSON:'💾 Sauvegarder JSON',btnImportJSON:'📥 Importer JSON',btnExportXML:'🎼 Export MusicXML',btnExportMXL:'🎼 Export MXL',btnExportMIDI:'🎹 Export MIDI',midiDialogTitle:'Export MIDI',midiDialogLabel:'Répétitions :',midiCancel:'Annuler',midiOk:'Exporter',btnPlay:'▶ Lecture',playerDialogTitle:'Lecture',playerDialogLabel:'Boucles :',playerCancel:'Annuler',playerOk:'▶ Lire',
    btnFindGrid:'🔎 Trouver une grille',gsTitle:'Trouver une grille',gsLblTitle:'Titre',gsLblComposer:'Compositeur',gsSearchOn:'① Chercher sur :',gsBtnForum:'Forum iReal Pro ↗',gsBtnWeb:'Web (grilles iReal) ↗',gsBtnMusicXML:'MusicXML libres ↗',gsPasteLabel:'② Colle le lien trouvé, ou dépose le fichier :',gsBtnDecode:'Lire le lien',gsDrop:'Dépose un fichier MusicXML ici ou clique',gsFilter:'Filtrer les morceaux…',gsPreview:'Aperçu',gsBtnImport:'Importer dans la grille',gsCancel:'Fermer',gsErrInvalid:'Lien iReal Pro non reconnu. Copie le lien complet (il commence par irealb://).',gsErrFile:'Fichier MusicXML illisible.',gsConfirmReplace:'Remplacer la grille en cours ? Les modifications non sauvegardées seront perdues (Ctrl+Z pour annuler).',gsWarnings:'Indications non reprises :',
    btnListen:'🎧 Créer une grille à l\'écoute',listenTitle:'Créer une grille à l\'écoute',listenBtnTab:'🎧 Écouter un onglet',listenBtnFile:'📄 Déposer un fichier audio',listenTabHint:'Choisis l\'onglet du morceau et coche « Partager l\'audio ».',listenLblTimeSig:'Mesure',listenLblTempo:'Tempo',listenTempoAuto:'auto',listenTap:'Taper',listenLblChords:'Accords par mesure',listenStatus:'🔴 Écoute en cours',listenBar:'mesure',listenNewSection:'Nouvelle section',listenStop:'■ Arrêter',listenPause:'⏸ Pause',listenResume:'▶ Reprendre',listenShift:'Décaler d\'un temps',listenSections:'Sections proposées :',listenApply:'Appliquer',listenIgnore:'Ignorer',listenClose:'Fermer',listenAnnot:'Grille détectée à l\'écoute — à vérifier à l\'oreille',listenDefaultTitle:'Grille à l\'écoute',listenConfirmReplace:'Remplacer la grille en cours ? Les modifications non sauvegardées seront perdues (Ctrl+Z pour annuler).',listenErrNoAudio:'Aucun son reçu : relance le partage et coche « Partager l\'audio ».',listenErrFile:'Fichier audio illisible.',listenErrStart:'Impossible de démarrer l\'écoute.',listenSectionsUpdated:'La grille a changé : sections proposées recalculées. Vérifie-les puis clique sur Appliquer.',listenSectionsNone:'Aucun découpage en sections à proposer pour la grille actuelle.',listenErrNoTempo:'Tempo non détecté : saisis-le ou tape-le dans la fenêtre d\'écoute, puis relance l\'écoute.',
    aiWebSearch:'🌐 Chercher sur le web',aiWebSearchHint:'Une seule demande, facturée en plus par Anthropic. Se désactive après l\'envoi.',aiSources:'Sources :',aiGridSourceNote:'Grille proposée par l\'IA à partir de :',aiErrRefusal:'Claude a refusé cette demande.',aiGridCheck:'à vérifier à l\'oreille',
    dzTitle:'Déposer un fichier MusicXML',dzSub:'ou cliquer pour choisir un fichier .musicxml / .xml',
    metaKey:'Tonalité :',metaTempo:'Tempo :',metaBPM:'BPM',metaTime:'Mesure :',metaStyle:'Style :',
    btnAddSection:'+ Ajouter une section',secAddMeasure:'+ Mesure',secDuplicate:'⧉ Dupliquer',secDelete:'✕ Supprimer',secAnnotPlaceholder:'Annotation de section…',
    modalAddChord:'Ajouter un accord',modalEditChord:"Éditer l'accord",lblRoot:'FONDAMENTALE',lblQuality:'QUALITÉ',lblExt:'TENSIONS / OPTIONS',lblBass:'Basse (slash) :',btnClearBass:'Effacer',lblFreeChord:'Accord libre :',freePlaceholder:'ex: Cmaj7#11',basePlaceholder:'ex: G',lblBeats:'Durée (temps) :',btnDeleteChord:'🗑 Supprimer',btnCancel:'Annuler',btnApply:'✓ Appliquer',
    annotTitle:'Annotation',annotShowInBar:'Afficher dans la mesure',annotModeTitle:'🎼 Mode',annotModeHint:'Modes compatibles :',annotArpTitle:'🎹 Arpège 4 sons',annotArpHint:'Notes de base :',annotInvHint:'Renversements :',annotTensTitle:'⚡ Tensions',annotTensHint:'Cliquer pour sélectionner :',annotAvoidHint:'À éviter :',annotFreeTitle:'📝 Note libre',annotFreePH:'Indication de jeu, doigtés, remarques...',annotColorLbl:'Couleur :',lblBold:'Gras',lblItalic:'Italique',btnClearAnnot:'🗑 Tout effacer',annotNone:'Aucune',annotUnknown:'Accord non reconnu.',
    labelModalTitle:'✏️ Lettre de section',lblLetter:'Lettre principale :',lblSuffixLabel:'Suffixe :',lblPreview:'Aperçu :',
    invLabels:['Pos. fondamentale','1er renversement','2ème renversement','3ème renversement'],
    suffixLabels:["(aucun)","' (bis)","'' (ter)",'1','2'],
    lblPrintTheme:'🖨️ Thème :',themeLight:'☀️ Clair',themeDark:'🌙 Sombre',lblContrast:'Contraste :',lblSectionColors:'Couleurs sections :',btnDoPrint:'Imprimer',contrastLabels:['Léger','Standard','Soutenu','Fort','Maximum'],
    alertLastSection:'Impossible de supprimer la dernière section.',alertBadJSON:'JSON invalide.',alertBadXML:'Erreur MusicXML.',
    defaultTitle:'Mon Thème Jazz',editHint:'clic: éditer',tipDeleteMeasure:'Supprimer mesure',tipDupMeasure:'Dupliquer mesure',tipAddChord:'Ajouter un accord',sectionDefault:'Section',
    lblSymbols:'SYMBOLES RAPIDES',symRepeat:'% (répéter)',symRepeat2:'𝄎 (2 mes.)',symNC:'N.C.',symSlash:'/ (beat)',symNone:'— (aucun)',printOnepage:'1 page',printShowNav:'Repères nav.',metroLabel:'Métronome',metroVolume:'Volume :',
  },
  es: {
    menuFile:'📁 Archivo',menuExport:'⬆ Exportar',btnOpen:'📂 Abrir…',btnNew:'✨ Nuevo',lblTranspose:'🎵 Transponer :',keyPlaceholder:'Tonalidad…',lblCols:'Columnas :',btnPrint:'🖨️ Imprimir',btnExportJSON:'💾 Guardar JSON',btnImportJSON:'📥 Importar JSON',btnExportXML:'🎼 Exportar MusicXML',btnExportMXL:'🎼 Exportar MXL',btnExportMIDI:'🎹 Exportar MIDI',midiDialogTitle:'Exportar MIDI',midiDialogLabel:'Repeticiones :',midiCancel:'Cancelar',midiOk:'Exportar',btnPlay:'▶ Reproducir',playerDialogTitle:'Reproducir',playerDialogLabel:'Bucles :',playerCancel:'Cancelar',playerOk:'▶ Reproducir',
    btnFindGrid:'🔎 Encontrar una cuadrícula',gsTitle:'Encontrar una cuadrícula',gsLblTitle:'Título',gsLblComposer:'Compositor',gsSearchOn:'① Buscar en:',gsBtnForum:'Foro iReal Pro ↗',gsBtnWeb:'Web (cuadrículas iReal) ↗',gsBtnMusicXML:'MusicXML libres ↗',gsPasteLabel:'② Pega el enlace encontrado, o suelta el archivo:',gsBtnDecode:'Leer el enlace',gsDrop:'Suelta un archivo MusicXML aquí o haz clic',gsFilter:'Filtrar canciones…',gsPreview:'Vista previa',gsBtnImport:'Importar a la cuadrícula',gsCancel:'Cerrar',gsErrInvalid:'Enlace de iReal Pro no reconocido. Copia el enlace completo (empieza por irealb://).',gsErrFile:'Archivo MusicXML ilegible.',gsConfirmReplace:'¿Reemplazar la cuadrícula actual? Los cambios no guardados se perderán (Ctrl+Z para deshacer).',gsWarnings:'Indicaciones no incluidas:',
    btnListen:'🎧 Crear una cuadrícula de oído',listenTitle:'Crear una cuadrícula de oído',listenBtnTab:'🎧 Escuchar una pestaña',listenBtnFile:'📄 Soltar un archivo de audio',listenTabHint:'Elige la pestaña de la canción y marca «Compartir audio».',listenLblTimeSig:'Compás',listenLblTempo:'Tempo',listenTempoAuto:'auto',listenTap:'Marcar',listenLblChords:'Acordes por compás',listenStatus:'🔴 Escuchando',listenBar:'compás',listenNewSection:'Nueva sección',listenStop:'■ Detener',listenPause:'⏸ Pausa',listenResume:'▶ Reanudar',listenShift:'Desplazar un tiempo',listenSections:'Secciones propuestas:',listenApply:'Aplicar',listenIgnore:'Ignorar',listenClose:'Cerrar',listenAnnot:'Cuadrícula detectada de oído — a comprobar de oído',listenDefaultTitle:'Cuadrícula de oído',listenConfirmReplace:'¿Reemplazar la cuadrícula actual? Los cambios no guardados se perderán (Ctrl+Z para deshacer).',listenErrNoAudio:'No se recibe sonido: vuelve a compartir y marca «Compartir audio».',listenErrFile:'Archivo de audio ilegible.',listenErrStart:'No se ha podido iniciar la escucha.',listenSectionsUpdated:'La cuadrícula ha cambiado: secciones propuestas recalculadas. Revísalas y pulsa Aplicar.',listenSectionsNone:'No hay división en secciones que proponer para la cuadrícula actual.',listenErrNoTempo:'Tempo no detectado: escríbelo o márcalo en la ventana de escucha y vuelve a empezar.',
    aiWebSearch:'🌐 Buscar en la web',aiWebSearchHint:'Una sola consulta, facturada aparte por Anthropic. Se desactiva tras el envío.',aiSources:'Fuentes:',aiGridSourceNote:'Cuadrícula propuesta por la IA a partir de:',aiErrRefusal:'Claude ha rechazado esta solicitud.',aiGridCheck:'a comprobar de oído',
    dzTitle:'Arrastra un archivo MusicXML',dzSub:'o haz clic para elegir un archivo .musicxml / .xml',
    metaKey:'Tonalidad :',metaTempo:'Tempo :',metaBPM:'BPM',metaTime:'Compás :',metaStyle:'Estilo :',
    btnAddSection:'+ Agregar sección',secAddMeasure:'+ Compás',secDuplicate:'⧉ Duplicar',secDelete:'✕ Eliminar',secAnnotPlaceholder:'Anotación de sección…',
    modalAddChord:'Agregar acorde',modalEditChord:'Editar acorde',lblRoot:'FUNDAMENTAL',lblQuality:'CALIDAD',lblExt:'TENSIONES / OPCIONES',lblBass:'Bajo (slash) :',btnClearBass:'Borrar',lblFreeChord:'Acorde libre :',freePlaceholder:'ej: Cmaj7#11',basePlaceholder:'ej: G',lblBeats:'Duración (tiempos) :',btnDeleteChord:'🗑 Eliminar',btnCancel:'Cancelar',btnApply:'✓ Aplicar',
    annotTitle:'Anotación',annotShowInBar:'Mostrar en el compás',annotModeTitle:'🎼 Modo',annotModeHint:'Modos compatibles :',annotArpTitle:'🎹 Arpegio 4 notas',annotArpHint:'Notas base :',annotInvHint:'Inversiones :',annotTensTitle:'⚡ Tensiones',annotTensHint:'Clic para seleccionar :',annotAvoidHint:'A evitar :',annotFreeTitle:'📝 Nota libre',annotFreePH:'Indicación de ejecución, digitación, observaciones...',annotColorLbl:'Color :',lblBold:'Negrita',lblItalic:'Cursiva',btnClearAnnot:'🗑 Borrar todo',annotNone:'Ninguna',annotUnknown:'Acorde no reconocido.',
    labelModalTitle:'✏️ Letra de sección',lblLetter:'Letra principal :',lblSuffixLabel:'Sufijo :',lblPreview:'Vista previa :',
    invLabels:['Pos. fundamental','1ª inversión','2ª inversión','3ª inversión'],
    suffixLabels:['(ninguno)',"' (bis)","'' (ter)",'1','2'],
    lblPrintTheme:'🖨️ Tema :',themeLight:'☀️ Claro',themeDark:'🌙 Oscuro',lblContrast:'Contraste :',lblSectionColors:'Colores secciones :',btnDoPrint:'Imprimir',contrastLabels:['Suave','Estándar','Medio','Fuerte','Máximo'],
    alertLastSection:'No se puede eliminar la última sección.',alertBadJSON:'JSON inválido.',alertBadXML:'Error MusicXML.',
    defaultTitle:'Mi Tema Jazz',editHint:'clic: editar',tipDeleteMeasure:'Eliminar compás',tipDupMeasure:'Duplicar compás',tipAddChord:'Agregar acorde',sectionDefault:'Sección',
    lblSymbols:'SÍMBOLOS RÁPIDOS',symRepeat:'% (repetir)',symRepeat2:'𝄎 (2 comp.)',symNC:'N.C.',symSlash:'/ (pulso)',symNone:'— (ninguno)',printOnepage:'1 página',printShowNav:'Signos nav.',metroLabel:'Metrónomo',metroVolume:'Volumen :',
  },
  it: {
    menuFile:'📁 File',menuExport:'⬆ Esporta',btnOpen:'📂 Apri…',btnNew:'✨ Nuovo',lblTranspose:'🎵 Trasponi :',keyPlaceholder:'Tonalità…',lblCols:'Colonne :',btnPrint:'🖨️ Stampa',btnExportJSON:'💾 Salva JSON',btnImportJSON:'📥 Importa JSON',btnExportXML:'🎼 Esporta MusicXML',btnExportMXL:'🎼 Esporta MXL',btnExportMIDI:'🎹 Esporta MIDI',midiDialogTitle:'Esporta MIDI',midiDialogLabel:'Ripetizioni :',midiCancel:'Annulla',midiOk:'Esporta',btnPlay:'▶ Riproduci',playerDialogTitle:'Riproduzione',playerDialogLabel:'Loop :',playerCancel:'Annulla',playerOk:'▶ Riproduci',
    btnFindGrid:'🔎 Trova una griglia',gsTitle:'Trova una griglia',gsLblTitle:'Titolo',gsLblComposer:'Compositore',gsSearchOn:'① Cerca su:',gsBtnForum:'Forum iReal Pro ↗',gsBtnWeb:'Web (griglie iReal) ↗',gsBtnMusicXML:'MusicXML liberi ↗',gsPasteLabel:'② Incolla il link trovato, o trascina il file:',gsBtnDecode:'Leggi il link',gsDrop:'Trascina un file MusicXML qui o clicca',gsFilter:'Filtra i brani…',gsPreview:'Anteprima',gsBtnImport:'Importa nella griglia',gsCancel:'Chiudi',gsErrInvalid:'Link iReal Pro non riconosciuto. Copia il link completo (inizia con irealb://).',gsErrFile:'File MusicXML illeggibile.',gsConfirmReplace:'Sostituire la griglia corrente? Le modifiche non salvate andranno perse (Ctrl+Z per annullare).',gsWarnings:'Indicazioni non riportate:',
    btnListen:'🎧 Crea una griglia all\'ascolto',listenTitle:'Crea una griglia all\'ascolto',listenBtnTab:'🎧 Ascolta una scheda',listenBtnFile:'📄 Trascina un file audio',listenTabHint:'Scegli la scheda del brano e spunta «Condividi audio».',listenLblTimeSig:'Metro',listenLblTempo:'Tempo',listenTempoAuto:'auto',listenTap:'Batti',listenLblChords:'Accordi per battuta',listenStatus:'🔴 Ascolto in corso',listenBar:'battuta',listenNewSection:'Nuova sezione',listenStop:'■ Ferma',listenPause:'⏸ Pausa',listenResume:'▶ Riprendi',listenShift:'Sposta di un movimento',listenSections:'Sezioni proposte:',listenApply:'Applica',listenIgnore:'Ignora',listenClose:'Chiudi',listenAnnot:'Griglia rilevata all\'ascolto — da verificare a orecchio',listenDefaultTitle:'Griglia all\'ascolto',listenConfirmReplace:'Sostituire la griglia corrente? Le modifiche non salvate andranno perse (Ctrl+Z per annullare).',listenErrNoAudio:'Nessun suono ricevuto: rilancia la condivisione e spunta «Condividi audio».',listenErrFile:'File audio illeggibile.',listenErrStart:'Impossibile avviare l\'ascolto.',listenSectionsUpdated:'La griglia è cambiata: sezioni proposte ricalcolate. Controllale e clicca su Applica.',listenSectionsNone:'Nessuna suddivisione in sezioni da proporre per la griglia attuale.',listenErrNoTempo:'Tempo non rilevato: inseriscilo o battilo nella finestra di ascolto, poi riavvia l\'ascolto.',
    aiWebSearch:'🌐 Cerca sul web',aiWebSearchHint:'Una sola richiesta, fatturata a parte da Anthropic. Si disattiva dopo l\'invio.',aiSources:'Fonti:',aiGridSourceNote:'Griglia proposta dall\'IA a partire da:',aiErrRefusal:'Claude ha rifiutato questa richiesta.',aiGridCheck:'da verificare a orecchio',
    dzTitle:'Trascina un file MusicXML',dzSub:'o clicca per scegliere un file .musicxml / .xml',
    metaKey:'Tonalità :',metaTempo:'Tempo :',metaBPM:'BPM',metaTime:'Misura :',metaStyle:'Stile :',
    btnAddSection:'+ Aggiungi sezione',secAddMeasure:'+ Misura',secDuplicate:'⧉ Duplica',secDelete:'✕ Elimina',secAnnotPlaceholder:'Annotazione di sezione…',
    modalAddChord:'Aggiungi accordo',modalEditChord:'Modifica accordo',lblRoot:'FONDAMENTALE',lblQuality:'QUALITÀ',lblExt:'TENSIONI / OPZIONI',lblBass:'Basso (slash) :',btnClearBass:'Cancella',lblFreeChord:'Accordo libero :',freePlaceholder:'es: Cmaj7#11',basePlaceholder:'es: G',lblBeats:'Durata (tempi) :',btnDeleteChord:'🗑 Elimina',btnCancel:'Annulla',btnApply:'✓ Applica',
    annotTitle:'Annotazione',annotShowInBar:'Mostra nella misura',annotModeTitle:'🎼 Modo',annotModeHint:'Modi compatibili :',annotArpTitle:'🎹 Arpeggio 4 suoni',annotArpHint:'Note di base :',annotInvHint:'Rivolti :',annotTensTitle:'⚡ Tensioni',annotTensHint:'Clicca per selezionare :',annotAvoidHint:'Da evitare :',annotFreeTitle:'📝 Nota libera',annotFreePH:'Indicazioni di esecuzione, diteggiatura, osservazioni...',annotColorLbl:'Colore :',lblBold:'Grassetto',lblItalic:'Corsivo',btnClearAnnot:'🗑 Cancella tutto',annotNone:'Nessuna',annotUnknown:'Accordo non riconosciuto.',
    labelModalTitle:'✏️ Lettera di sezione',lblLetter:'Lettera principale :',lblSuffixLabel:'Suffisso :',lblPreview:'Anteprima :',
    invLabels:['Pos. fondamentale','1° rivolto','2° rivolto','3° rivolto'],
    suffixLabels:['(nessuno)',"' (bis)","'' (ter)",'1','2'],
    lblPrintTheme:'🖨️ Tema :',themeLight:'☀️ Chiaro',themeDark:'🌙 Scuro',lblContrast:'Contrasto :',lblSectionColors:'Colori sezioni :',btnDoPrint:'Stampa',contrastLabels:['Leggero','Standard','Sostenuto','Forte','Massimo'],
    alertLastSection:"Impossibile eliminare l'ultima sezione.",alertBadJSON:'JSON non valido.',alertBadXML:'Errore MusicXML.',
    defaultTitle:'Il Mio Tema Jazz',editHint:'clic: modifica',tipDeleteMeasure:'Elimina misura',tipDupMeasure:'Duplica misura',tipAddChord:'Aggiungi accordo',sectionDefault:'Sezione',
    lblSymbols:'SIMBOLI RAPIDI',symRepeat:'% (ripeti)',symRepeat2:'𝄎 (2 mis.)',symNC:'N.C.',symSlash:'/ (battuta)',symNone:'— (nessuno)',printOnepage:'1 pagina',printShowNav:'Segni nav.',metroLabel:'Metronomo',metroVolume:'Volume :',
  },
  en: {
    menuFile:'📁 File',menuExport:'⬆ Export',btnOpen:'📂 Open…',btnNew:'✨ New',lblTranspose:'🎵 Transpose :',keyPlaceholder:'Key…',lblCols:'Columns :',btnPrint:'🖨️ Print',btnExportJSON:'💾 Save JSON',btnImportJSON:'📥 Import JSON',btnExportXML:'🎼 Export MusicXML',btnExportMXL:'🎼 Export MXL',btnExportMIDI:'🎹 Export MIDI',midiDialogTitle:'Export MIDI',midiDialogLabel:'Repetitions:',midiCancel:'Cancel',midiOk:'Export',btnPlay:'▶ Play',playerDialogTitle:'Playback',playerDialogLabel:'Loops:',playerCancel:'Cancel',playerOk:'▶ Play',
    btnFindGrid:'🔎 Find a chart',gsTitle:'Find a chart',gsLblTitle:'Title',gsLblComposer:'Composer',gsSearchOn:'① Search on:',gsBtnForum:'iReal Pro forum ↗',gsBtnWeb:'Web (iReal charts) ↗',gsBtnMusicXML:'Free MusicXML ↗',gsPasteLabel:'② Paste the link you found, or drop the file:',gsBtnDecode:'Read link',gsDrop:'Drop a MusicXML file here or click',gsFilter:'Filter songs…',gsPreview:'Preview',gsBtnImport:'Import into chart',gsCancel:'Close',gsErrInvalid:'iReal Pro link not recognised. Copy the full link (it starts with irealb://).',gsErrFile:'Unreadable MusicXML file.',gsConfirmReplace:'Replace the current chart? Unsaved changes will be lost (Ctrl+Z to undo).',gsWarnings:'Markings not carried over:',
    btnListen:'🎧 Create a chart by ear',listenTitle:'Create a chart by ear',listenBtnTab:'🎧 Listen to a tab',listenBtnFile:'📄 Drop an audio file',listenTabHint:'Pick the song\'s tab and tick “Share audio”.',listenLblTimeSig:'Time signature',listenLblTempo:'Tempo',listenTempoAuto:'auto',listenTap:'Tap',listenLblChords:'Chords per bar',listenStatus:'🔴 Listening',listenBar:'bar',listenNewSection:'New section',listenStop:'■ Stop',listenPause:'⏸ Pause',listenResume:'▶ Resume',listenShift:'Shift by one beat',listenSections:'Suggested sections:',listenApply:'Apply',listenIgnore:'Ignore',listenClose:'Close',listenAnnot:'Chart detected by ear — check it by ear',listenDefaultTitle:'Chart by ear',listenConfirmReplace:'Replace the current chart? Unsaved changes will be lost (Ctrl+Z to undo).',listenErrNoAudio:'No sound received: share again and tick “Share audio”.',listenErrFile:'Unreadable audio file.',listenErrStart:'Could not start listening.',listenSectionsUpdated:'The chart has changed: suggested sections recalculated. Check them, then click Apply.',listenSectionsNone:'No section split to suggest for the current chart.',listenErrNoTempo:'Tempo not detected: type or tap it in the listening window, then start again.',
    aiWebSearch:'🌐 Search the web',aiWebSearchHint:'A single request, billed separately by Anthropic. Turns off after sending.',aiSources:'Sources:',aiGridSourceNote:'Chart proposed by AI from:',aiErrRefusal:'Claude refused this request.',aiGridCheck:'to be checked by ear',
    dzTitle:'Drop a MusicXML file here',dzSub:'or click to choose a .musicxml / .xml file',
    metaKey:'Key :',metaTempo:'Tempo :',metaBPM:'BPM',metaTime:'Time :',metaStyle:'Style :',
    btnAddSection:'+ Add section',secAddMeasure:'+ Measure',secDuplicate:'⧉ Duplicate',secDelete:'✕ Delete',secAnnotPlaceholder:'Section annotation…',
    modalAddChord:'Add chord',modalEditChord:'Edit chord',lblRoot:'ROOT',lblQuality:'QUALITY',lblExt:'TENSIONS / OPTIONS',lblBass:'Bass (slash) :',btnClearBass:'Clear',lblFreeChord:'Free chord :',freePlaceholder:'e.g. Cmaj7#11',basePlaceholder:'e.g. G',lblBeats:'Duration (beats) :',btnDeleteChord:'🗑 Delete',btnCancel:'Cancel',btnApply:'✓ Apply',
    annotTitle:'Annotation',annotShowInBar:'Show in measure',annotModeTitle:'🎼 Mode',annotModeHint:'Compatible modes :',annotArpTitle:'🎹 4-note arpeggio',annotArpHint:'Base notes :',annotInvHint:'Inversions :',annotTensTitle:'⚡ Tensions',annotTensHint:'Click to select :',annotAvoidHint:'Avoid :',annotFreeTitle:'📝 Free note',annotFreePH:'Performance notes, fingerings, remarks...',annotColorLbl:'Color :',lblBold:'Bold',lblItalic:'Italic',btnClearAnnot:'🗑 Clear all',annotNone:'None',annotUnknown:'Chord not recognized.',
    labelModalTitle:'✏️ Section label',lblLetter:'Main letter :',lblSuffixLabel:'Suffix :',lblPreview:'Preview :',
    invLabels:['Root position','1st inversion','2nd inversion','3rd inversion'],
    suffixLabels:['(none)',"' (bis)","'' (ter)",'1','2'],
    lblPrintTheme:'🖨️ Theme :',themeLight:'☀️ Light',themeDark:'🌙 Dark',lblContrast:'Contrast :',lblSectionColors:'Section colors :',btnDoPrint:'Print',contrastLabels:['Light','Standard','Medium','Strong','Maximum'],
    alertLastSection:'Cannot delete the last section.',alertBadJSON:'Invalid JSON.',alertBadXML:'MusicXML error.',
    defaultTitle:'My Jazz Theme',editHint:'click: edit',tipDeleteMeasure:'Delete measure',tipDupMeasure:'Duplicate measure',tipAddChord:'Add chord',sectionDefault:'Section',
    lblSymbols:'QUICK SYMBOLS',symRepeat:'% (repeat)',symRepeat2:'𝄎 (2 bars)',symNC:'N.C.',symSlash:'/ (beat)',symNone:'— (none)',printOnepage:'1 page',printShowNav:'Nav marks',metroLabel:'Metronome',metroVolume:'Volume :',
  }
};

let currentLang='fr';
function t(k){return LANGS[currentLang][k]||LANGS['fr'][k]||k;}

function applyTranslations(){
  {const w=document.getElementById('ai-websearch-lbl');if(w){w.textContent=t('aiWebSearch');w.parentElement.title=t('aiWebSearchHint');}}
  document.getElementById('btn-menu-file').textContent=t('menuFile');
  document.getElementById('btn-menu-export').textContent=t('menuExport');
  document.getElementById('btn-open').textContent=t('btnOpen');
  document.getElementById('btn-new').textContent=t('btnNew');
  document.getElementById('lbl-transpose').textContent=t('lblTranspose');
  document.getElementById('lbl-cols').textContent=t('lblCols');
  document.getElementById('btn-print').textContent=t('btnPrint');
  document.getElementById('btn-export-json').textContent=t('btnExportJSON');
  document.getElementById('btn-import-json').textContent=t('btnImportJSON');
  document.getElementById('btn-export-xml').textContent=t('btnExportXML');
  document.getElementById('btn-export-mxl').textContent=t('btnExportMXL');
  document.getElementById('btn-export-midi').textContent=t('btnExportMIDI');
  document.getElementById('btn-find-grid').textContent=t('btnFindGrid');
  document.getElementById('btn-find-grid-menu').textContent=t('btnFindGrid');
  document.getElementById('gs-dialog-title').textContent=t('gsTitle');
  document.getElementById('gs-lbl-title').textContent=t('gsLblTitle');
  document.getElementById('gs-lbl-composer').textContent=t('gsLblComposer');
  document.getElementById('gs-search-on').textContent=t('gsSearchOn');
  document.getElementById('gs-btn-forum').textContent=t('gsBtnForum');
  document.getElementById('gs-btn-web').textContent=t('gsBtnWeb');
  document.getElementById('gs-btn-musicxml').textContent=t('gsBtnMusicXML');
  document.getElementById('gs-paste-label').textContent=t('gsPasteLabel');
  document.getElementById('gs-btn-decode').textContent=t('gsBtnDecode');
  document.getElementById('gs-drop-text').textContent=t('gsDrop');
  document.getElementById('gs-filter').placeholder=t('gsFilter');
  document.getElementById('gs-btn-import').textContent=t('gsBtnImport');
  document.getElementById('gs-btn-cancel').textContent=t('gsCancel');
  {const L=(id,k)=>{const e=document.getElementById(id);if(e)e.textContent=t(k);};
   L('btn-listen','btnListen');L('btn-listen-menu','btnListen');L('ls-dialog-title','listenTitle');L('ls-btn-tab','listenBtnTab');L('ls-drop-text','listenBtnFile');L('ls-tab-hint','listenTabHint');
   L('ls-lbl-timesig','listenLblTimeSig');L('ls-lbl-tempo','listenLblTempo');L('ls-tap','listenTap');L('ls-lbl-chords','listenLblChords');L('ls-btn-cancel','listenClose');
   L('lb-status','listenStatus');L('lb-newsec','listenNewSection');L('lb-stop','listenStop');L('lb-shift-label','listenShift');L('lb-cpb-label','listenLblChords');
   L('lb-sections-label','listenSections');L('lb-apply','listenApply');L('lb-ignore','listenIgnore');L('lb-close','listenClose');
   const tp=document.getElementById('ls-tempo');if(tp)tp.placeholder=t('listenTempoAuto');
   if(typeof _lsUpdateBar==='function')_lsUpdateBar();}
  document.getElementById('midi-dialog-title').textContent=t('midiDialogTitle');
  document.getElementById('midi-dialog-label').textContent=t('midiDialogLabel');
  document.getElementById('midi-btn-cancel').textContent=t('midiCancel');
  document.getElementById('midi-btn-ok').textContent=t('midiOk');
  document.getElementById('player-dialog-title').textContent=t('playerDialogTitle');
  document.getElementById('player-dialog-label').textContent=t('playerDialogLabel');
  document.getElementById('player-btn-cancel').textContent=t('playerCancel');
  document.getElementById('player-btn-ok').textContent=t('playerOk');
  document.getElementById('dz-title').textContent=t('dzTitle');
  document.getElementById('dz-sub').textContent=t('dzSub');
  document.getElementById('meta-key-label').textContent=t('metaKey');
  document.getElementById('meta-tempo-label').textContent=t('metaTempo');
  document.getElementById('meta-bpm-label').textContent=t('metaBPM');
  document.getElementById('meta-time-label').textContent=t('metaTime');
  document.getElementById('meta-style-label').textContent=t('metaStyle');
  document.getElementById('btn-add-section').textContent=t('btnAddSection');
  document.getElementById('lbl-root').textContent=t('lblRoot');
  document.getElementById('lbl-symbols').textContent=t('lblSymbols');
  document.getElementById('lbl-quality').textContent=t('lblQuality');
  document.getElementById('lbl-ext').textContent=t('lblExt');
  document.getElementById('lbl-bass').textContent=t('lblBass');
  document.getElementById('btn-clear-bass').textContent=t('btnClearBass');
  document.getElementById('lbl-free-chord').textContent=t('lblFreeChord');
  document.getElementById('free-chord').placeholder=t('freePlaceholder');
  document.getElementById('bass-input').placeholder=t('basePlaceholder');
  document.getElementById('lbl-beats').textContent=t('lblBeats');
  document.getElementById('btn-delete-chord').textContent=t('btnDeleteChord');
  document.getElementById('btn-cancel-chord').textContent=t('btnCancel');
  document.getElementById('btn-apply-chord').textContent=t('btnApply');
  document.getElementById('annot-modal-title-label').textContent=t('annotTitle');
  document.getElementById('annot-mode-title').textContent=t('annotModeTitle');
  document.getElementById('toggle-mode').textContent=t('annotShowInBar');
  document.getElementById('annot-mode-hint').textContent=t('annotModeHint');
  document.getElementById('annot-arp-title').textContent=t('annotArpTitle');
  document.getElementById('toggle-arp').textContent=t('annotShowInBar');
  document.getElementById('annot-arp-hint').textContent=t('annotArpHint');
  document.getElementById('annot-inv-hint').textContent=t('annotInvHint');
  document.getElementById('annot-tens-title').textContent=t('annotTensTitle');
  document.getElementById('toggle-tens').textContent=t('annotShowInBar');
  document.getElementById('annot-tens-hint').textContent=t('annotTensHint');
  document.getElementById('annot-avoid-hint').textContent=t('annotAvoidHint');
  document.getElementById('annot-free-title').textContent=t('annotFreeTitle');
  document.getElementById('toggle-free').textContent=t('annotShowInBar');
  document.getElementById('annot-text').placeholder=t('annotFreePH');
  document.getElementById('annot-color-label').textContent=t('annotColorLbl');
  document.getElementById('lbl-bold').textContent=t('lblBold');
  document.getElementById('lbl-italic').textContent=t('lblItalic');
  document.getElementById('btn-clear-annot').textContent=t('btnClearAnnot');
  document.getElementById('btn-cancel-annot').textContent=t('btnCancel');
  document.getElementById('btn-apply-annot').textContent=t('btnApply');
  document.getElementById('label-modal-title').textContent=t('labelModalTitle');
  document.getElementById('lbl-letter').textContent=t('lblLetter');
  document.getElementById('lbl-suffix').textContent=t('lblSuffixLabel');
  document.getElementById('lbl-preview-label').textContent=t('lblPreview');
  document.getElementById('btn-cancel-label').textContent=t('btnCancel');
  document.getElementById('btn-apply-label').textContent=t('btnApply');
  document.getElementById('lbl-print-theme').textContent=t('lblPrintTheme');
  document.getElementById('theme-light-btn').textContent=t('themeLight');
  document.getElementById('theme-dark-btn').textContent=t('themeDark');
  document.getElementById('lbl-contrast').textContent=t('lblContrast');
  document.getElementById('lbl-section-colors').textContent=t('lblSectionColors');
  document.getElementById('btn-do-print').textContent=t('btnDoPrint');
  if(document.getElementById('lbl-onepage'))document.getElementById('lbl-onepage').textContent=t('printOnepage');
  if(document.getElementById('lbl-show-nav'))document.getElementById('lbl-show-nav').textContent=t('printShowNav');
  if(document.getElementById('lbl-metro'))document.getElementById('lbl-metro').textContent=t('metroLabel');
  if(document.getElementById('lbl-metro-vol'))document.getElementById('lbl-metro-vol').textContent=t('metroVolume');
  document.getElementById('transpose-key-select').options[0].textContent=t('keyPlaceholder');
  if(document.getElementById('chart-editor').style.display!=='none')render();
}

function setLang(lang){currentLang=lang;document.documentElement.lang=lang;applyTranslations();buildLabelModal();buildModal();}
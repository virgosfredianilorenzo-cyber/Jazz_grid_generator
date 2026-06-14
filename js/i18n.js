/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   JS — I18N
   Dictionnaires FR / ES / IT / EN  +  applyTranslations()  +  setLang()
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */


const LANGS = {
  fr: {
    menuFile:'📁 Fichier',menuExport:'⬆ Exporter',btnOpen:'📂 Ouvrir…',btnNew:'✨ Nouveau',lblTranspose:'🎵 Transposer :',keyPlaceholder:'Tonalité…',lblCols:'Colonnes :',btnPrint:'🖨️ Imprimer',btnExportJSON:'💾 Sauvegarder JSON',btnImportJSON:'📥 Importer JSON',btnExportXML:'🎼 Export MusicXML',btnExportMXL:'🎼 Export MXL',btnExportMIDI:'🎹 Export MIDI',midiDialogTitle:'Export MIDI',midiDialogLabel:'Répétitions :',midiCancel:'Annuler',midiOk:'Exporter',btnPlay:'▶ Lecture',playerDialogTitle:'Lecture',playerDialogLabel:'Boucles :',playerCancel:'Annuler',playerOk:'▶ Lire',
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
    lblSymbols:'SYMBOLES RAPIDES',symRepeat:'% (répéter)',symRepeat2:'𝄎 (2 mes.)',symNC:'N.C.',symSlash:'/ (beat)',symNone:'— (aucun)',
  },
  es: {
    menuFile:'📁 Archivo',menuExport:'⬆ Exportar',btnOpen:'📂 Abrir…',btnNew:'✨ Nuevo',lblTranspose:'🎵 Transponer :',keyPlaceholder:'Tonalidad…',lblCols:'Columnas :',btnPrint:'🖨️ Imprimir',btnExportJSON:'💾 Guardar JSON',btnImportJSON:'📥 Importar JSON',btnExportXML:'🎼 Exportar MusicXML',btnExportMXL:'🎼 Exportar MXL',btnExportMIDI:'🎹 Exportar MIDI',midiDialogTitle:'Exportar MIDI',midiDialogLabel:'Repeticiones :',midiCancel:'Cancelar',midiOk:'Exportar',btnPlay:'▶ Reproducir',playerDialogTitle:'Reproducir',playerDialogLabel:'Bucles :',playerCancel:'Cancelar',playerOk:'▶ Reproducir',
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
    lblSymbols:'SÍMBOLOS RÁPIDOS',symRepeat:'% (repetir)',symRepeat2:'𝄎 (2 comp.)',symNC:'N.C.',symSlash:'/ (pulso)',symNone:'— (ninguno)',
  },
  it: {
    menuFile:'📁 File',menuExport:'⬆ Esporta',btnOpen:'📂 Apri…',btnNew:'✨ Nuovo',lblTranspose:'🎵 Trasponi :',keyPlaceholder:'Tonalità…',lblCols:'Colonne :',btnPrint:'🖨️ Stampa',btnExportJSON:'💾 Salva JSON',btnImportJSON:'📥 Importa JSON',btnExportXML:'🎼 Esporta MusicXML',btnExportMXL:'🎼 Esporta MXL',btnExportMIDI:'🎹 Esporta MIDI',midiDialogTitle:'Esporta MIDI',midiDialogLabel:'Ripetizioni :',midiCancel:'Annulla',midiOk:'Esporta',btnPlay:'▶ Riproduci',playerDialogTitle:'Riproduzione',playerDialogLabel:'Loop :',playerCancel:'Annulla',playerOk:'▶ Riproduci',
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
    lblSymbols:'SIMBOLI RAPIDI',symRepeat:'% (ripeti)',symRepeat2:'𝄎 (2 mis.)',symNC:'N.C.',symSlash:'/ (battuta)',symNone:'— (nessuno)',
  },
  en: {
    menuFile:'📁 File',menuExport:'⬆ Export',btnOpen:'📂 Open…',btnNew:'✨ New',lblTranspose:'🎵 Transpose :',keyPlaceholder:'Key…',lblCols:'Columns :',btnPrint:'🖨️ Print',btnExportJSON:'💾 Save JSON',btnImportJSON:'📥 Import JSON',btnExportXML:'🎼 Export MusicXML',btnExportMXL:'🎼 Export MXL',btnExportMIDI:'🎹 Export MIDI',midiDialogTitle:'Export MIDI',midiDialogLabel:'Repetitions:',midiCancel:'Cancel',midiOk:'Export',btnPlay:'▶ Play',playerDialogTitle:'Playback',playerDialogLabel:'Loops:',playerCancel:'Cancel',playerOk:'▶ Play',
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
    lblSymbols:'QUICK SYMBOLS',symRepeat:'% (repeat)',symRepeat2:'𝄎 (2 bars)',symNC:'N.C.',symSlash:'/ (beat)',symNone:'— (none)',
  }
};

let currentLang='fr';
function t(k){return LANGS[currentLang][k]||LANGS['fr'][k]||k;}

function applyTranslations(){
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
  document.getElementById('transpose-key-select').options[0].textContent=t('keyPlaceholder');
  if(document.getElementById('chart-editor').style.display!=='none')render();
}

function setLang(lang){currentLang=lang;document.documentElement.lang=lang;applyTranslations();buildLabelModal();buildModal();}
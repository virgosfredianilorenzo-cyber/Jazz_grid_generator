/* ── Helpers ── */
function _newSectionId() {
  const c = 'BCDFGHJKMNPQRSTVWXZ23456789';
  let id = '';
  for (let i = 0; i < 4; i++) id += c[Math.floor(Math.random() * c.length)];
  return id;
}

/* ── Parse MusicXML string → chartData (format JGG) ── */
function parseMusicXML(xmlStr) {
  const doc = new DOMParser().parseFromString(xmlStr, 'application/xml');
  const te = doc.querySelector('work-title,movement-title');
  const title = te ? te.textContent.trim() : 'Thème';
  let tempo = 120;
  const se = doc.querySelector('sound[tempo]');
  if (se) tempo = parseInt(se.getAttribute('tempo'));
  let ts = '4/4';
  const b = doc.querySelector('beats'), bt = doc.querySelector('beat-type');
  if (b && bt) ts = `${b.textContent}/${bt.textContent}`;
  const bpm = parseInt(ts.split('/')[0]) || 4;
  let key = 'C';
  const fi = doc.querySelector('fifths');
  if (fi) {
    const f = parseInt(fi.textContent);
    const km = { 0:'C',1:'G',2:'D',3:'A',4:'E',5:'B',6:'F#','-1':'F','-2':'Bb','-3':'Eb','-4':'Ab','-5':'Db','-6':'Gb' };
    key = km[f] || 'C';
  }
  const measures = doc.querySelectorAll('measure'), pm = [];
  measures.forEach((m, idx) => {
    const md = { number: idx + 1, chords: [], repeatStart: false, repeatEnd: false,
                 barlineLeft: 'normal', barlineRight: 'normal', volta: null, navSymbol: null };
    m.querySelectorAll('barline').forEach(bl => {
      const loc = bl.getAttribute('location');
      const style = bl.querySelector('bar-style');
      const rep = bl.querySelector('repeat');
      const ending = bl.querySelector('ending');
      const styleMap = { 'light-light':'double','light-heavy':'final','heavy-light':'repeat-start' };
      if (loc === 'left' || loc === null) {
        if (rep && rep.getAttribute('direction') === 'forward') { md.barlineLeft = 'repeat-start'; md.repeatStart = true; }
        else if (style) { const s = styleMap[style.textContent]; if (s) md.barlineLeft = s; }
        if (ending && ending.getAttribute('type') === 'start') md.volta = ending.getAttribute('number') || '1';
      }
      if (loc === 'right') {
        if (rep && rep.getAttribute('direction') === 'backward') { md.barlineRight = 'repeat-end'; md.repeatEnd = true; }
        else if (style) { const map2 = { 'light-light':'double','light-heavy':'final' }; const s = map2[style.textContent]; if (s) md.barlineRight = s; }
      }
    });
    m.querySelectorAll('direction').forEach(dir => {
      if (dir.querySelector('segno')) md.navSymbol = 'segno';
      else if (dir.querySelector('coda')) md.navSymbol = 'coda';
      else if (dir.querySelector('fermata')) md.navSymbol = 'fermata';
      else {
        const w = dir.querySelector('words');
        if (w) {
          const txt = w.textContent.trim();
          if (/D\.C\..*Coda/i.test(txt)) md.navSymbol = 'dc-coda';
          else if (/D\.S\..*Coda/i.test(txt)) md.navSymbol = 'ds-coda';
          else if (/D\.C\..*Fine/i.test(txt)) md.navSymbol = 'dc-fine';
          else if (/^Fine$/i.test(txt)) md.navSymbol = 'fine';
        }
      }
    });
    const harmonyEls = [...m.querySelectorAll('harmony')];
    const harmByOffset = new Map();
    harmonyEls.forEach(h => {
      const off = parseInt(h.querySelector('offset')?.textContent || '0');
      const isAlt = h.querySelector('footnote')?.textContent === 'alt';
      const re = h.querySelector('root-step'), ae = h.querySelector('root-alter'),
            ke = h.querySelector('kind'), be = h.querySelector('bass-step'), bae = h.querySelector('bass-alter');
      if (!re) return;
      let root = re.textContent.trim();
      if (ae) { const a = parseFloat(ae.textContent); if (a === 1) root += '#'; if (a === -1) root += 'b'; }
      let kind = ke ? ke.getAttribute('text') || ke.textContent.trim() : '';
      if (kind === 'N.C.' || kind === 'none' || (ke && ke.textContent.trim() === 'none')) {
        const entry = { symbol: 'N.C.', beats: 0, annot: null, altChord: null };
        harmByOffset.set(off, entry); md.chords.push(entry); return;
      }
      const km2 = { 'major':'','minor':'m','dominant':'7','major-seventh':'maj7','minor-seventh':'m7',
                    'diminished':'dim','augmented':'aug','half-diminished':'m7b5','diminished-seventh':'dim7',
                    'major-ninth':'maj9','dominant-ninth':'9','minor-ninth':'m9','dominant-11th':'11',
                    'major-13th':'maj13','dominant-13th':'13','suspended-second':'sus2',
                    'suspended-fourth':'sus4','minor-major':'mM7' };
      if (km2[kind] !== undefined) kind = km2[kind];
      let bass = '';
      if (be) { bass = be.textContent.trim(); if (bae) { const a = parseFloat(bae.textContent); if (a === 1) bass += '#'; if (a === -1) bass += 'b'; } }
      const sym = root + kind + (bass ? '/' + bass : '');
      if (isAlt) { const existing = harmByOffset.get(off); if (existing) existing.altChord = sym; }
      else { const entry = { symbol: sym, beats: 0, annot: null, altChord: null }; harmByOffset.set(off, entry); md.chords.push(entry); }
    });
    if (md.chords.length > 0) {
      md.chords.forEach(c => { c.beats = Math.round(bpm / md.chords.length); });
      const s = md.chords.slice(0, -1).reduce((a, c) => a + c.beats, 0);
      md.chords[md.chords.length - 1].beats = bpm - s;
    } else md.chords.push({ symbol: '%', beats: bpm, annot: null });
    pm.push(md);
  });
  const sections = []; let cur = { id: _newSectionId(), label: 'A', annotation: '', measures: [] };
  measures.forEach((m, idx) => {
    const r = m.querySelector('rehearsal');
    if (r && idx > 0) { if (cur.measures.length > 0) sections.push(cur); cur = { id: _newSectionId(), label: r.textContent.trim(), annotation: '', measures: [] }; }
    cur.measures.push(pm[idx]);
  });
  if (cur.measures.length > 0) sections.push(cur);
  return { title, key, tempo, timeSig: ts, style: 'Swing', sections };
}

/* ── Charger un fichier en chaîne XML (supporte .mxl compressé via JSZip) ── */
async function loadFileAsXML(file) {
  return new Promise((resolve, reject) => {
    const ext = file.name.split('.').pop().toLowerCase();
    if (ext === 'mxl') {
      if (typeof JSZip === 'undefined') { reject(new Error('JSZip not loaded')); return; }
      const r = new FileReader();
      r.onload = async ev => {
        try {
          const zip = await JSZip.loadAsync(ev.target.result);
          let xmlPath = null;
          const containerFile = zip.file('META-INF/container.xml');
          if (containerFile) {
            const containerXml = await containerFile.async('string');
            const m = containerXml.match(/full-path="([^"]+)"/);
            if (m) xmlPath = m[1];
          }
          if (!xmlPath) {
            zip.forEach((p) => { if (!xmlPath && (p.endsWith('.xml') || p.endsWith('.musicxml')) && !p.startsWith('META-INF')) xmlPath = p; });
          }
          if (!xmlPath) { reject(new Error('No MusicXML found in MXL')); return; }
          const xmlStr = await zip.file(xmlPath).async('string');
          resolve(xmlStr);
        } catch (e) { reject(e); }
      };
      r.onerror = () => reject(new Error('Read failed'));
      r.readAsArrayBuffer(file);
    } else {
      const r = new FileReader();
      r.onload = ev => resolve(ev.target.result);
      r.onerror = () => reject(new Error('Read failed'));
      r.readAsText(file);
    }
  });
}

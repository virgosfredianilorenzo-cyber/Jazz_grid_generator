// ── Import iReal Pro : décodage des liens irealb:// et irealbook:// (fonctions pures, sans DOM) ──
const _IREAL_PREFIX = '1r34LbKcu7';

function _obfusc50(s){ const a=s.split('');
  for(let i=0;i<5;i++){ a[49-i]=s[i]; a[i]=s[49-i]; }
  for(let i=10;i<24;i++){ a[49-i]=s[i]; a[i]=s[49-i]; }
  return a.join(''); }

function irealUnscramble(s){ let r='';
  while(s.length>51){ r+=_obfusc50(s.substring(0,50)); s=s.substring(50); }
  r+=s;
  return r.replace(/Kcl/g,'| x').replace(/LZ/g,' |').replace(/XyQ/g,'   '); }

// Un morceau malformé dans une playlist est ignoré ; IREAL_INVALID seulement si aucun n'est exploitable
// Retourne [{title, composer, style, key, tempo, music}] (music déjà désembrouillée pour irealb)
function splitSongs(link){
  link = String(link||'').replace(/\s+/g,''); // un lien collé depuis un forum peut contenir des retours à la ligne
  const m = /^(irealb|irealbook):\/\//.exec(link);
  if(!m) throw new Error('IREAL_INVALID');
  const book = m[1]==='irealbook';
  let body = link.slice(m[0].length);
  try{ body = decodeURIComponent(body); }catch(e){ throw new Error('IREAL_INVALID'); }
  const parts = body.split('===').filter(p=>p!=='');
  // Plusieurs segments : le dernier, qui a moins de champs qu'un morceau, est le nom de la playlist
  const minFields = book ? 6 : 7;
  if(parts.length>1 && parts[parts.length-1].split('=').length<minFields) parts.pop();
  const songs = [];
  for(const p of parts){
    const f = p.split('=');
    let title, composer, style, key, music, tempo=null;
    if(book){
      if(f.length<6) continue;
      [title, composer, style, key] = f; music = f[5];
    } else {
      if(f.length<7 || !f[6].startsWith(_IREAL_PREFIX)) continue;
      title=f[0]; composer=f[1]; style=f[3]; key=f[4];
      music = irealUnscramble(f[6].slice(_IREAL_PREFIX.length));
      const t = parseInt(f[8],10);
      tempo = t>0 ? t : null;
    }
    if(!music) continue;
    songs.push({title:(title||'').trim(), composer:(composer||'').trim(), style:(style||'').trim(), key:(key||'').trim(), tempo, music});
  }
  if(!songs.length) throw new Error('IREAL_INVALID');
  return songs;
}

// ── Conversion d'un morceau iReal en chartData ──
const _IREAL_Q = {'':'','^7':'maj7','^':'maj7','^9':'maj9','^13':'maj13','6':'6','69':'6/9','-':'m','-6':'m6','-7':'m7','-9':'m9','-11':'m11','-13':'m13','-^7':'mM7','-^':'mM7','7':'7','9':'9','11':'11','13':'13','o':'dim','o7':'dim7','h':'m7b5','h7':'m7b5','+':'aug','sus':'sus4','sus4':'sus4','sus2':'sus2','7sus':'7sus4','7sus4':'7sus4'};
function irealQualityToJgg(q){ return Object.prototype.hasOwnProperty.call(_IREAL_Q,q) ? _IREAL_Q[q] : ''; }

let _irealSecN = 0;
function _irealSecId(){ return typeof _newSectionId==='function' ? _newSectionId() : 'sec'+(++_irealSecN); }

// Qualité limitée à l'alphabet iReal (+ m/j tolérés pour « maj7 ») : une lettre de contrôle collée
// (Z Q S N T * f x n r p U Y W) n'est pas avalée par l'accord.
const _IREAL_CHORD = /^([A-G][b#]?)([0-9b#^+\-ohsuadltmj]*)(\/[A-G][b#]?)?(\([^)]*\))?/;
const _IREAL_NAV = {'d.c. al coda':'dc-coda','d.s. al coda':'ds-coda','d.c. al fine':'dc-fine','fine':'fine'};

function _irealSymbol(root, q, bass){
  const j = irealQualityToJgg(q);
  return root + (j || q) + (bass||'');
}

function irealToChart(raw){
  const warnings = [];
  const chart = {title:raw.title||'', key:(raw.key||'C').replace(/-$/,'m'), tempo:raw.tempo>0?raw.tempo:120,
    timeSig:null, style:raw.style||'', composer:raw.composer||'', sections:[]};
  const music = raw.music||'';
  let num = 4, sec = null, label = null, lastChord = null;
  const newCur = () => ({chords:[], left:'normal', right:'normal', volta:null, nav:null, notes:[]});
  let cur = newCur();
  const mkChord = (symbol, alt) => ({symbol, beats:1, annot:null, altChord:alt||null});
  const flush = () => {
    if(!cur.chords.length) return;
    if(!sec || label!==null){
      sec = {id:_irealSecId(), label:label||(sec?'':'A'), annotation:'', measures:[]};
      chart.sections.push(sec); label = null;
    }
    const k = cur.chords.length, base = Math.floor(num/k), rem = num%k;
    cur.chords.forEach((c,i) => { c.beats = Math.max(1, base + (i<rem?1:0)); });
    cur.notes.forEach(n => { sec.annotation += (sec.annotation?' ; ':'') + n; });
    sec.measures.push({number:sec.measures.length+1, chords:cur.chords,
      repeatStart:cur.left==='repeat-start', repeatEnd:cur.right==='repeat-end',
      barlineLeft:cur.left, barlineRight:cur.right, volta:cur.volta, navSymbol:cur.nav});
    cur = newCur();
  };
  // Marque de fin de mesure (} ] Z) : s'applique à la mesure en cours, sinon à la précédente
  const closeBar = kind => {
    if(cur.chords.length){ cur.right = kind; flush(); }
    else if(sec && sec.measures.length && label===null){
      const m = sec.measures[sec.measures.length-1];
      m.barlineRight = kind; m.repeatEnd = kind==='repeat-end';
    }
  };
  const openBar = kind => { flush(); cur.left = kind; };
  const addChord = (symbol, alt) => { const c = mkChord(symbol, alt); cur.chords.push(c); lastChord = c; };

  let i = 0, m;
  while(i < music.length){
    const rest = music.slice(i), ch = music[i];
    if(ch==='*' && music[i+1]){
      flush();
      const l = music[i+1];
      label = l==='i' ? 'Intro' : l==='v' ? 'Verse' : l;
      i += 2; continue;
    }
    if((m = /^T(12|\d\d)/.exec(rest))){
      const a = m[1]==='12' ? '12/8' : m[1][0]+'/'+m[1][1];
      if(!chart.timeSig) chart.timeSig = a;
      num = parseInt(a, 10); i += m[0].length; continue;
    }
    if((m = /^N([1-3])/.exec(rest))){ flush(); cur.volta = m[1]; i += 2; continue; }
    if(ch==='<'){
      const e = music.indexOf('>', i);
      // « *72 » en tête : position verticale du texte dans iReal, pas du contenu
      const txt = (e<0 ? music.slice(i+1) : music.slice(i+1, e)).replace(/^\*\d\d/, '').trim();
      i = e<0 ? music.length : e+1;
      const nav = _IREAL_NAV[txt.toLowerCase()];
      if(nav) cur.nav = nav;
      else if(txt){ cur.notes.push(txt); warnings.push(txt); }
      continue;
    }
    if(ch==='{'){ openBar('repeat-start'); i++; continue; }
    if(ch==='['){ openBar('double'); i++; continue; }
    if(ch==='}'){ closeBar('repeat-end'); i++; continue; }
    if(ch===']'){ closeBar('double'); i++; continue; }
    if(ch==='Z'){ closeBar('final'); i++; continue; }
    if(ch==='|'){ flush(); i++; continue; }
    if(ch==='S'){ cur.nav = 'segno'; i++; continue; }
    if(ch==='Q'){ cur.nav = 'coda'; i++; continue; }
    if(ch==='f'){ cur.nav = 'fermata'; i++; continue; }
    if(ch==='n'){ addChord('N.C.'); i++; continue; }
    if(ch==='x'){ addChord('%'); i++; continue; }
    if(ch==='p'){ if(lastChord) addChord(lastChord.symbol, lastChord.altChord); i++; continue; }
    if(ch==='r'){
      flush();
      for(let k=0;k<2;k++){ addChord('%'); flush(); }
      warnings.push('r'); i++; continue;
    }
    if((m = _IREAL_CHORD.exec(rest))){
      let q = m[2], alt = null;
      if(m[4]){
        const inner = m[4].slice(1,-1), am = _IREAL_CHORD.exec(inner);
        if(am && am[0]===inner) alt = _irealSymbol(am[1], am[2], am[3]);
        else q += m[4];
      }
      addChord(_irealSymbol(m[1], q, m[3]), alt);
      i += m[0].length; continue;
    }
    i++; // l, s, Y, U, W, ',', espaces et caractères inconnus : ignorés
  }
  // Indication ou texte après la dernière mesure (ex. « Z<D.C. al Fine> ») : rattachés à la dernière mesure
  if(!cur.chords.length && sec && sec.measures.length){
    const lastM = sec.measures[sec.measures.length-1];
    if(cur.nav && !lastM.navSymbol) lastM.navSymbol = cur.nav;
    cur.notes.forEach(n => { sec.annotation += (sec.annotation?' ; ':'') + n; });
  }
  flush();
  if(!chart.timeSig) chart.timeSig = '4/4';
  return {chart, warnings};
}

function decodeIRealLink(link){
  const out = splitSongs(link).map(irealToChart).filter(r => r.chart.sections.length);
  if(!out.length) throw new Error('IREAL_INVALID');
  return out;
}

if(typeof module!=='undefined') module.exports = {irealUnscramble, splitSongs, irealQualityToJgg, irealToChart, decodeIRealLink};

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

// Retourne [{title, composer, style, key, tempo, music}] (music déjà désembrouillée pour irealb)
function splitSongs(link){
  const m = /^(irealb|irealbook):\/\//.exec(String(link||'').trim());
  if(!m) throw new Error('IREAL_INVALID');
  const book = m[1]==='irealbook';
  let body = String(link).trim().slice(m[0].length);
  try{ body = decodeURIComponent(body); }catch(e){ throw new Error('IREAL_INVALID'); }
  const parts = body.split('===').filter(p=>p!=='');
  // Plusieurs segments : le dernier sans '=' est le nom de la playlist
  if(parts.length>1 && !parts[parts.length-1].includes('=')) parts.pop();
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

if(typeof module!=='undefined') module.exports = {irealUnscramble, splitSongs};

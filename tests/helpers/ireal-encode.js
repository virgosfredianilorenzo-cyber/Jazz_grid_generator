// Encodeur irealb:// réservé aux tests (le brouillage par blocs de 50 est son propre inverse).
function _ob(s){ const a=s.split('');
  for(let i=0;i<5;i++){ a[49-i]=s[i]; a[i]=s[49-i]; }
  for(let i=10;i<24;i++){ a[49-i]=s[i]; a[i]=s[49-i]; }
  return a.join(''); }
function scramble(s){ let r=''; while(s.length>51){ r+=_ob(s.substring(0,50)); s=s.substring(50); } return r+s; }
// Même forme qu'iReal : titre=compo==style=tonalité=n=musique==style2=bpm=répétitions
function encodeSong(o){
  const music = o.music.replace(/\| x/g,'Kcl').replace(/ \|/g,'LZ').replace(/   /g,'XyQ');
  return [o.title,o.composer,'',o.style,o.key,'n','1r34LbKcu7'+scramble(music),'',o.tempo||0,0].join('=');
}
function encodeLink(songs, playlist){
  return 'irealb://' + songs.map(s=>encodeURIComponent(encodeSong(s))).join('===')
    + (playlist ? '===' + encodeURIComponent(playlist) : '');
}
module.exports = { scramble, encodeSong, encodeLink };

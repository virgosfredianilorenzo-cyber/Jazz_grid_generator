const AL = '[T44A-7 |D7 |Gmaj7 |Cmaj7 |F#h7 |B7b9 |E-7 |E-7 |Y[A-7 |D7 |Gmaj7 |Cmaj7 |F#h7 |B7b9 |E-7 |E-7 ]';
const ST = '[T44C^7 |A-7 |D-7 |G7 |C^7 |A-7 |D-7 |G7 Z';
const SONGS = {
  one: [{title:'Autumn Leaves',composer:'Kosma Joseph',style:'Medium Swing',key:'G',music:AL,tempo:120}],
  playlist: [
    {title:'Song One',composer:'Comp A',style:'Medium Swing',key:'C',music:ST,tempo:100},
    {title:'Song Two',composer:'Comp B',style:'Ballad',key:'F',music:'[T34F^7 |D-7 |G-7 |C7 |F^7 |Bb7 |A-7 |D7 Z',tempo:60},
    {title:'Song Three',composer:'Comp C',style:'Bossa Nova',key:'C-',music:ST,tempo:0},
  ],
  playlistName: 'My Playlist',
};
module.exports = SONGS;

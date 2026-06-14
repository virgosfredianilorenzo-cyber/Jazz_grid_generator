'use strict';
// Standard MIDI File (Type 0) export.
// Depends on theory.js globals: noteIdx, tr, parseChordSym, ARP_DEF, chartData.

const PPQ = 480; // ticks per quarter note

function _u32(n) {
  return [(n >>> 24) & 0xFF, (n >>> 16) & 0xFF, (n >>> 8) & 0xFF, n & 0xFF];
}
function _u16(n) { return [(n >>> 8) & 0xFF, n & 0xFF]; }

function _vlq(value) {
  const bytes = [value & 0x7F];
  value >>>= 7;
  while (value > 0) { bytes.unshift((value & 0x7F) | 0x80); value >>>= 7; }
  return bytes;
}

function _ascii(s) { return [...s].map(c => c.charCodeAt(0)); }

function _midiNote(name, octave) {
  const idx = noteIdx(name);
  if (idx === -1) return 60;
  return Math.min(127, Math.max(0, (octave + 1) * 12 + idx));
}

function _timeSigEvent(sig) {
  // sig: '4/4', '3/4', '6/8', etc.
  const [num, den] = sig.split('/').map(Number);
  const dd = Math.round(Math.log2(den || 4));
  return [0x00, 0xFF, 0x58, 0x04, num, dd, 0x18, 0x08];
}

function _tempoEvent(bpm) {
  const us = Math.round(60_000_000 / bpm);
  return [0x00, 0xFF, 0x51, 0x03, (us >>> 16) & 0xFF, (us >>> 8) & 0xFF, us & 0xFF];
}

// Returns Uint8Array of MIDI bytes for the whole file.
function _buildMidi(reps) {
  const bpm   = chartData.tempo || 120;
  const sig   = chartData.timeSig || '4/4';
  const title = chartData.title || 'chart';

  // Collect chord sequence (all sections, all measures, all chords)
  const sequence = []; // [{root, quality, ticks}] or [{root:null, ticks}]
  chartData.sections.forEach(sec => {
    sec.measures.forEach(meas => {
      (meas.chords || []).forEach(chord => {
        const beats = chord.beats || 1;
        const ticks = Math.round(beats * PPQ);
        const parsed = parseChordSym(chord.symbol);
        if (parsed) {
          sequence.push({ root: parsed.root, quality: parsed.quality || '', ticks });
        } else {
          // N.C., %, special symbol → silence
          sequence.push({ root: null, ticks });
        }
      });
    });
  });

  // Build track events
  const events = [];

  // Meta: title
  const titleBytes = Array.from(new TextEncoder().encode(title).slice(0, 127));
  events.push(0x00, 0xFF, 0x03, titleBytes.length, ...titleBytes);

  // Meta: tempo + time signature
  events.push(..._tempoEvent(bpm));
  events.push(..._timeSigEvent(sig));

  // Program change: ch0 = Grand Piano (0), ch1 = Acoustic Bass (32)
  events.push(0x00, 0xC0, 0x00);
  events.push(0x00, 0xC1, 0x20);

  // Repeat sequence reps times
  for (let rep = 0; rep < reps; rep++) {
    sequence.forEach(({ root, quality, ticks }) => {
      if (!root) {
        // silence: advance time with a no-op meta text event
        events.push(..._vlq(ticks), 0xFF, 0x01, 0x00);
        return;
      }

      const def      = ARP_DEF[quality] || ARP_DEF[''] || { i: [0, 4, 7, 10] };
      const chNotes  = def.i.map(s => _midiNote(tr(root, s), 4)); // piano ch0 oct4
      const bassNote = _midiNote(root, 2);                          // bass  ch1 oct2

      // Note ON: bass + all chord notes simultaneously (delta=0 between them)
      events.push(..._vlq(0), 0x91, bassNote, 80);                 // bass ON
      chNotes.forEach(n => events.push(..._vlq(0), 0x90, n, 70));  // chord ON

      // Note OFF after ticks
      events.push(..._vlq(ticks), 0x81, bassNote, 0);              // bass OFF
      chNotes.forEach(n => events.push(..._vlq(0), 0x80, n, 0));   // chord OFF
    });
  }

  // End of track
  events.push(0x00, 0xFF, 0x2F, 0x00);

  // Assemble SMF
  const header = [
    ..._ascii('MThd'),
    ..._u32(6),
    ..._u16(0),   // format 0
    ..._u16(1),   // 1 track
    ..._u16(PPQ),
  ];
  const track = [
    ..._ascii('MTrk'),
    ..._u32(events.length),
    ...events,
  ];

  return new Uint8Array([...header, ...track]);
}

function exportMIDI(reps) {
  reps = Math.max(1, Math.min(16, parseInt(reps) || 1));
  const bytes = _buildMidi(reps);
  const blob  = new Blob([bytes], { type: 'audio/midi' });
  const a     = document.createElement('a');
  a.href      = URL.createObjectURL(blob);
  a.download  = ((chartData.title || 'chart').replace(/\s+/g, '_')) + '.mid';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

function openMidiDialog() {
  document.getElementById('midi-dialog').classList.add('active');
}
function closeMidiDialog() {
  document.getElementById('midi-dialog').classList.remove('active');
}
function confirmMidiExport() {
  const reps = document.getElementById('midi-reps').value;
  closeMidiDialog();
  exportMIDI(reps);
}

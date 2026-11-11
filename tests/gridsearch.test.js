const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { gridSearchUrls, chartPreviewText } = require('../js/gridsearch.js');
const dec = u => decodeURIComponent(u.replace('https://duckduckgo.com/?q=', ''));

test('gridSearchUrls encode titre et compositeur', () => {
  const u = gridSearchUrls('Knucklehead', 'Grover Washington Jr.');
  assert.ok(u.forum.startsWith('https://duckduckgo.com/?q='));
  assert.ok(dec(u.forum).includes('site:forums.irealpro.com "Knucklehead"'));
  assert.ok(dec(u.web).includes('"Knucklehead" "Grover Washington Jr." irealb'));
  assert.ok(dec(u.musicxml).includes('"Knucklehead" musicxml'));
  assert.ok(!/[ "]/.test(u.forum));
});
test('gridSearchUrls sans compositeur', () => {
  const u = gridSearchUrls('Knucklehead', '');
  assert.ok(!dec(u.web).includes('""'));
  assert.ok(dec(u.web).includes('"Knucklehead" irealb'));
});
test('chartPreviewText sur Knucklehead', () => {
  const chart = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'knucklehead.json'), 'utf8'));
  const lines = chartPreviewText(chart);
  assert.equal(lines.length, 4);
  assert.equal(lines[0], 'Intro ‖: Fm7 | Fm7 | Fm7 | Fm7 :‖');
});
test('chartPreviewText : deux accords et voltas', () => {
  const m = (chords, extra) => Object.assign({ chords: chords.map(s => ({ symbol: s })), repeatStart: false, repeatEnd: false, volta: null }, extra);
  const lines = chartPreviewText({ sections: [{ label: 'A', measures: [m(['C', 'G']), m(['F'], { volta: '1' }), m(['G'], { volta: '2' })] }] });
  assert.equal(lines[0], 'A C G | [1. F | [2. G');
});

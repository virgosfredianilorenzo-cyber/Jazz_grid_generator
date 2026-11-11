const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

// Charge theory.js + state.js comme des scripts globaux de navigateur, avec un DOM minimal.
function loadApp(chart) {
  const els = {};
  const el = id => els[id] || (els[id] = {
    id, value: '', textContent: '', style: {}, options: [],
    classList: { toggle() {}, add() {}, remove() {} },
  });
  const ctx = {
    console, window: {}, localStorage: { getItem() { return null; }, setItem() {} },
    document: { getElementById: el, addEventListener() {}, querySelectorAll: () => [] },
    render() {},
  };
  vm.createContext(ctx);
  for (const f of ['theory.js', 'state.js']) {
    vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'js', f), 'utf8'), ctx, { filename: f });
  }
  ctx.__chart = chart;
  vm.runInContext('chartData = __chart; originalKey = chartData.key; currentSemitoneOffset = 0;', ctx);
  return { ctx, el, run: code => vm.runInContext(code, ctx) };
}

const chart = (key, symbols) => ({
  title: 'T', key, tempo: 120, timeSig: '4/4', style: 'Swing',
  sections: [{ id: 'A', label: 'A', annotation: '', measures: symbols.map((s, i) => ({
    number: i + 1, chords: [{ symbol: s, beats: 4, annot: null }],
    repeatStart: false, repeatEnd: false, barlineLeft: 'normal', barlineRight: 'normal', volta: null, navSymbol: null,
  })) }],
});
const symbols = app => app.run('chartData.sections[0].measures.map(m => m.chords[0].symbol)');

test('deux transpositions +1 successives gardent tonalité et accords alignés (mineur)', () => {
  const app = loadApp(chart('Cm', ['Cm7', 'Fm7', 'G7']));
  app.run('transposeBySemitone(1); transposeBySemitone(1);');
  assert.equal(app.run('chartData.key'), 'Dm');
  assert.deepEqual(symbols(app), ['Dm7', 'Gm7', 'A7']);
  assert.equal(app.el('semitone-display').textContent, '+2');
});

test('trois transpositions successives en majeur, puis retour à l\'original', () => {
  const app = loadApp(chart('C', ['Cmaj7', 'Dm7', 'G7']));
  app.run('transposeBySemitone(1); transposeBySemitone(1); transposeBySemitone(1);');
  assert.equal(app.run('chartData.key'), 'Eb');
  assert.deepEqual(symbols(app), ['Ebmaj7', 'Fm7', 'Bb7']);
  app.run('resetTranspose();');
  assert.equal(app.run('chartData.key'), 'C');
  assert.deepEqual(symbols(app), ['Cmaj7', 'Dm7', 'G7']);
});

test('transposition vers une tonalité puis par demi-ton reste cohérente', () => {
  const app = loadApp(chart('C', ['Cmaj7', 'G7']));
  app.run("transposeToKey('F'); transposeBySemitone(-1);");
  assert.equal(app.run('chartData.key'), 'E');
  assert.deepEqual(symbols(app), ['Emaj7', 'B7']);
});

test('le sélecteur de tonalité affiche une option existante pour C#m / G#m', () => {
  const app = loadApp(chart('Am', ['Am7']));
  app.run('transposeBySemitone(4);'); // Am → C#m
  assert.equal(app.run('chartData.key'), 'C#m');
  const sel = app.el('transpose-key-select').value;
  assert.ok(app.run('ALL_KEYS').includes(sel), `option « ${sel} » absente de ALL_KEYS`);
  app.run('resetTranspose(); transposeBySemitone(11);'); // Am → G#m
  assert.ok(app.run('ALL_KEYS').includes(app.el('transpose-key-select').value));
});

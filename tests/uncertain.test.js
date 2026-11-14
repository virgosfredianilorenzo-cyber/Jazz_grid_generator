const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function loadState() {
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
  return ctx;
}

test('stripInternalChordFields retire _uncertain et _originalSymbol', () => {
  const ctx = loadState();
  const chart = { sections: [{ measures: [{ chords: [
    { symbol: 'Dm7', beats: 4, annot: null, _uncertain: true, _originalSymbol: 'Cm7' },
    { symbol: 'G7', beats: 4, annot: null },
  ] }] }] };
  const out = ctx.stripInternalChordFields(chart);
  const [a, b] = out.sections[0].measures[0].chords;
  assert.equal(a._uncertain, undefined);
  assert.equal(a._originalSymbol, undefined);
  assert.equal(a.symbol, 'Dm7');
  assert.deepEqual(JSON.parse(JSON.stringify(b)), { symbol: 'G7', beats: 4, annot: null });
  // copie : l'original reste intact
  assert.notEqual(out, chart);
  assert.equal(chart.sections[0].measures[0].chords[0]._uncertain, true);
  assert.equal(chart.sections[0].measures[0].chords[0]._originalSymbol, 'Cm7');
});

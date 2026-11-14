const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { getArpDegrees } = require('../js/theory.js');

test('getArpDegrees : extensions du nom de l\'accord', () => {
  const n = q => getArpDegrees(q).n.join(' ');
  assert.equal(n('maj9'), '1 3 5 7 9');
  assert.equal(n('maj13'), '1 3 5 7 9 13');
  assert.equal(n('6/9'), '1 3 5 6 9');
  assert.equal(n('m9'), '1 b3 5 b7 9');
  assert.equal(n('m11'), '1 b3 5 b7 9 11');
  assert.equal(n('m13'), '1 b3 5 b7 9 11 13');
  assert.equal(n('9'), '1 3 5 b7 9');
  assert.equal(n('11'), '1 5 b7 9 11');
  assert.equal(n('13'), '1 3 5 b7 9 13');
  assert.deepEqual(getArpDegrees('13').i, [0, 4, 7, 10, 14, 21]);
});

test('getArpDegrees : 4 sons et triades comme ARP_DEF, repli maj7', () => {
  assert.equal(getArpDegrees('m7').n.join(' '), '1 b3 5 b7');
  assert.deepEqual(getArpDegrees('m7').i, [0, 3, 7, 10]);
  assert.equal(getArpDegrees('').n.join(' '), '1 3 5 8');
  assert.equal(getArpDegrees('add9').n.join(' '), '1 3 5 7');
});

function loadDiagrams() {
  const ctx = { console: { log() {}, warn() {}, error() {} }, window: {} };
  vm.createContext(ctx);
  for (const f of ['theory.js', 'diagrams.js']) {
    vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'js', f), 'utf8'), ctx, { filename: f });
  }
  return ctx;
}
const ctx = loadDiagrams();
const pos = (r, q, s) => ctx.arpTabNotes(r, q, s).map(x => x.name + x.fret).join(' ');

test('arpTabNotes : Bb9 en 4 cordes (référence)', () => {
  assert.equal(pos('Bb', '9', 4), 'E6 A5 A8 D6 G5');
  assert.equal(ctx.arpTabNotes('Bb', '9', 4).map(x => x.degree).join(' '), '1 3 5 b7 9');
  assert.equal(ctx.arpTabNotes('Bb', '9', 4).map(x => x.isRoot).join(' '), 'true false false false false');
});

test('arpTabNotes : 5 cordes, fondamentale sur Si', () => {
  assert.equal(pos('Bb', '9', 5), 'B11 E10 E13 A11 D10');
  assert.equal(pos('C', 'maj7', 4), 'E8 A7 A10 D9');
});

test('arpTabNotes : pas de corde à vide', () => {
  assert.equal(ctx.arpTabNotes('E', 'm7', 4)[0].fret, 12);
  assert.equal(ctx.arpTabNotes('B', '7', 5)[0].fret, 12);
});

test('arpTabNotes : m13 en 4 cordes reste montant et jouable', () => {
  const ns = ctx.arpTabNotes('A', 'm13', 4);
  const open = [28, 33, 38, 43];
  const midi = ns.map(x => open[x.string] + x.fret);
  assert.equal(ns.length, 7);
  for (let k = 1; k < midi.length; k++) assert.ok(midi[k] > midi[k - 1]);
  assert.ok(ns.every(x => x.fret >= 1 && x.fret <= 24));
});

test('arpTabNotes : qualité inconnue → repli maj7', () => {
  assert.equal(pos('C', 'add9', 4), pos('C', 'maj7', 4));
});

test('arpTabSvg : cordes, cases, degrés, fondamentale marquée', () => {
  const s4 = ctx.arpTabSvg('Bb', '9', 4), s5 = ctx.arpTabSvg('Bb', '9', 5);
  assert.match(s4, /^<svg[^>]*class="arp-tab"/);
  assert.equal((s4.match(/class="arp-root"/g) || []).length, 2); // case + degré de la fondamentale
  assert.ok(s4.includes('>♭7<') && s4.includes('>9<'));
  assert.ok(!s4.includes('<g'));
  const bString = /font-size="16"[^>]*>B</; // nom de corde (le « B » de TAB est plus petit)
  assert.ok(bString.test(s5) && !bString.test(s4));
});

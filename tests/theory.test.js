const test = require('node:test');
const assert = require('node:assert/strict');
const { transposeKeyName, semitoneDiff, keySpelling } = require('../js/theory.js');

test('transposeKeyName conserve le mineur', () => {
  assert.equal(transposeKeyName('Cm', 2), 'Dm');
  assert.equal(transposeKeyName('C-', 2), 'Dm');
  assert.equal(transposeKeyName('Am', 3), 'Cm');
  assert.equal(transposeKeyName('Gm', -2), 'Fm');
  assert.equal(transposeKeyName('C', 2), 'D');
  assert.equal(transposeKeyName('Bb', 2), 'C');
  assert.equal(transposeKeyName('C', 1), 'Db');
});
test('semitoneDiff accepte une tonalité mineure', () => {
  assert.equal(semitoneDiff('Cm', 'D'), 2);
  assert.equal(semitoneDiff('Cm', 'Dm'), 2);
  assert.equal(semitoneDiff('C', 'Eb'), 3);
});
test('keySpelling : relatif majeur pour l\'orthographe des accords', () => {
  assert.equal(keySpelling('Dm'), 'F');
  assert.equal(keySpelling('Cm'), 'Eb');
  assert.equal(keySpelling('Am'), 'C');
  assert.equal(keySpelling('Bb'), 'Bb');
});

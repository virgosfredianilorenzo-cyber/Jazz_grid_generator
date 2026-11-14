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

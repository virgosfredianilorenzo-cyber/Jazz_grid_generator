const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { listenDspSrc } = require('../js/listen.js');

// Les fichiers JS/CSS portent la version (?v=X.Y) : après une mise en ligne, le navigateur ne mélange
// pas d'anciens fichiers en cache avec les nouveaux (ex. render.js neuf + diagrams.js ancien → grille vide).
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const version = html.match(/<title>Jazz Grid Generator v([\d.]+)<\/title>/)[1];

test('index.html : chaque JS/CSS local porte la version du titre', () => {
  const refs = [...html.matchAll(/(?:src|href)="((?:js|css)\/[^"]+)"/g)].map(m => m[1]);
  assert.ok(refs.length >= 19);
  for (const r of refs) assert.equal(r.replace(/^[^?]*/, ''), '?v=' + version, r);
});

test('listenDspSrc : le moteur chargé à la demande suit la version de listen.js', () => {
  assert.equal(listenDspSrc('js/listen.js?v=5.2'), 'js/listen-dsp.js?v=5.2');
  assert.equal(listenDspSrc('js/listen.js'), 'js/listen-dsp.js');
  assert.equal(listenDspSrc(null), 'js/listen-dsp.js');
});

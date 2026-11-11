const test = require('node:test');
const assert = require('node:assert/strict');
const { aiSettingsMigrate, AI_CLAUDE_MODELS } = require('../js/ai.js');

test('aiSettingsMigrate supprime la clé OpenAI', () => {
  const out = aiSettingsMigrate({ provider: 'openai', openaiKey: 'sk-x', openaiModel: 'gpt-4o', claudeKey: '', claudeModel: 'claude-sonnet-4-6' });
  for (const k of ['provider', 'openaiKey', 'openaiModel']) assert.ok(!(k in out), k);
  assert.equal(out.claudeKey, '');
  assert.equal(out.claudeModel, 'claude-opus-5-5');
});

test('aiSettingsMigrate garde un modèle Claude valide', () => {
  const out = aiSettingsMigrate({ claudeKey: 'k', claudeModel: 'claude-haiku-5-5' });
  assert.deepEqual(out, { claudeKey: 'k', claudeModel: 'claude-haiku-5-5' });
});

test('aiSettingsMigrate remplace un modèle absent et expose la liste', () => {
  assert.deepEqual(AI_CLAUDE_MODELS, ['claude-opus-5-5', 'claude-sonnet-5-5', 'claude-haiku-5-5']);
  assert.equal(aiSettingsMigrate({}).claudeModel, 'claude-opus-5-5');
  assert.equal(aiSettingsMigrate({}).claudeKey, '');
});

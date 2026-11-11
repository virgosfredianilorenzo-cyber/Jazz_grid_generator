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

test('aiSettingsLoad réécrit le stockage sans la clé OpenAI', () => {
  const { aiSettingsLoad } = require('../js/ai.js');
  const store = { jgg_ai_settings: JSON.stringify({ provider: 'openai', openaiKey: 'sk-test', claudeKey: 'k' }) };
  globalThis.localStorage = {
    getItem: k => (k in store ? store[k] : null),
    setItem: (k, v) => { store[k] = v; }
  };
  try {
    const s = aiSettingsLoad();
    assert.equal(s.claudeKey, 'k');
    assert.ok(!store.jgg_ai_settings.includes('sk-test'));
    assert.ok(!store.jgg_ai_settings.includes('openai'));
  } finally { delete globalThis.localStorage; }
});

/* ── Task 5 : recherche web ── */
const ai = require('../js/ai.js');

test('aiBuildClaudeBody n\'ajoute la recherche que sur demande', () => {
  const base = { system: 's', messages: [{ role: 'user', content: 'x' }], tools: [{ name: 'a', description: 'd', inputSchema: { type: 'object' } }], model: 'claude-sonnet-5-5' };
  const off = ai.aiBuildClaudeBody({ ...base, webSearch: false });
  assert.equal(off.tools.filter(t => t.type === 'web_search_20260209').length, 0);
  const on = ai.aiBuildClaudeBody({ ...base, webSearch: true });
  const ws = on.tools.filter(t => t.type === 'web_search_20260209');
  assert.equal(ws.length, 1);
  assert.equal(ws[0].max_uses, 5);
  assert.equal(on.max_tokens, 16000);
});

test('aiBuildClaudeBody n\'envoie fallbacks qu\'aux modèles qui l\'acceptent', () => {
  const base = { system: 's', messages: [], tools: [], webSearch: false };
  assert.equal(ai.aiBuildClaudeBody({ ...base, model: 'claude-opus-5-5' }).fallbacks, 'default');
  assert.equal(ai.aiBuildClaudeBody({ ...base, model: 'claude-sonnet-5-5' }).fallbacks, 'default');
  assert.ok(!('fallbacks' in ai.aiBuildClaudeBody({ ...base, model: 'claude-haiku-5-5' })));
});

test('aiParseClaudeContent extrait texte, outils et sources', () => {
  const r = ai.aiParseClaudeContent([
    { type: 'server_tool_use', id: 's1', name: 'web_search', input: {} },
    { type: 'web_search_tool_result', content: [{ type: 'web_search_result', url: 'https://a.example', title: 'A' }] },
    { type: 'text', text: 'Voici', citations: [{ url: 'https://b.example', title: 'B' }] },
    { type: 'tool_use', id: 't1', name: 'set_full_chart', input: {} }
  ]);
  assert.equal(r.message, 'Voici');
  assert.equal(r.toolCalls.length, 1);
  assert.equal(r.toolCalls[0].name, 'set_full_chart');
  assert.ok(r.sources.some(s => s.url === 'https://b.example'));
  const urls = r.sources.map(s => s.url);
  assert.equal(new Set(urls).size, urls.length);
});

test('aiParseClaudeContent ignore une erreur de recherche', () => {
  const r = ai.aiParseClaudeContent([
    { type: 'web_search_tool_result', content: { type: 'web_search_tool_result_error', error_code: 'max_uses_exceeded' } },
    { type: 'text', text: 'ok' }
  ]);
  assert.deepEqual(r.sources, []);
  assert.equal(r.message, 'ok');
});

test('aiRunClaudeTurn relance sur pause_turn', async () => {
  const first = [{ type: 'server_tool_use', id: 's', name: 'web_search', input: {} }];
  const bodies = [];
  const responses = [
    { stop_reason: 'pause_turn', content: first, usage: { input_tokens: 1, output_tokens: 2 } },
    { stop_reason: 'end_turn', content: [{ type: 'text', text: 'ok' }], usage: { input_tokens: 3, output_tokens: 4 } }
  ];
  const doFetch = async body => { bodies.push(JSON.parse(JSON.stringify(body))); return responses[bodies.length - 1]; };
  const r = await ai.aiRunClaudeTurn({ messages: [{ role: 'user', content: 'q' }] }, doFetch);
  assert.equal(bodies.length, 2);
  const last = bodies[1].messages[bodies[1].messages.length - 1];
  assert.equal(last.role, 'assistant');
  assert.deepEqual(last.content, first);
  assert.equal(r.message, 'ok');
  assert.equal(r.usage.in, 4);
  assert.equal(r.usage.out, 6);
});

test('aiRunClaudeTurn lève sur refusal', async () => {
  await assert.rejects(ai.aiRunClaudeTurn({ messages: [] }, async () => ({ stop_reason: 'refusal', content: [] })));
});

test('set_full_chart remplit les champs manquants', () => {
  const draft = { title: 'old', key: 'C', sections: [] };
  ai._AI_TOOL_EXECUTORS.set_full_chart(draft, { title: 'X', sections: [{ label: 'A', measures: [{ chords: [{ symbol: 'Fm7', beats: 4 }] }] }] });
  assert.equal(draft.title, 'X');
  const m = draft.sections[0].measures[0];
  assert.equal(m.barlineLeft, 'normal');
  assert.equal(m.barlineRight, 'normal');
  assert.equal(m.volta, null);
  assert.equal(m.navSymbol, null);
  assert.equal(m.chords[0].annot, null);
  assert.ok(draft.sections[0].id);
  assert.ok(ai.AI_TOOLS.some(t => t.name === 'set_full_chart'));
});

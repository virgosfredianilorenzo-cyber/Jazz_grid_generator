/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   JS — AI : SETTINGS
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

const _AI_STORAGE_KEY = 'jgg_ai_settings';
const _AI_DEFAULTS = {
  provider: 'claude',
  claudeModel: 'claude-sonnet-4-6',
  openaiModel: 'gpt-4o',
  claudeKey: '',
  openaiKey: ''
};

function aiSettingsLoad() {
  try {
    const raw = localStorage.getItem(_AI_STORAGE_KEY);
    return raw ? Object.assign({}, _AI_DEFAULTS, JSON.parse(raw)) : Object.assign({}, _AI_DEFAULTS);
  } catch (e) { console.warn('[AI] settings parse error, using defaults', e); return Object.assign({}, _AI_DEFAULTS); }
}

function aiSettingsSave(patch) {
  localStorage.setItem(_AI_STORAGE_KEY,
    JSON.stringify(Object.assign(aiSettingsLoad(), patch)));
}

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

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   JS — AI : PROVIDERS
   Interface commune : aiProviderChat(systemPrompt, messages, tools, settings)
   → Promise<{ message: string, toolCalls: [{id, name, args}] }>
   messages format : [{role:'user'|'assistant', content:string}]
   tools format    : [{name, description, inputSchema:{type,properties,required}}]
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

async function aiProviderChat(systemPrompt, messages, tools, settings) {
  if (settings.provider === 'openai') return _aiCallOpenAI(systemPrompt, messages, tools, settings);
  return _aiCallClaude(systemPrompt, messages, tools, settings);
}

async function _aiCallClaude(systemPrompt, messages, tools, settings) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': settings.claudeKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
      'anthropic-dangerous-direct-browser-access': 'true'
    },
    body: JSON.stringify({
      model: settings.claudeModel || 'claude-sonnet-4-6',
      max_tokens: 4096,
      system: systemPrompt,
      messages: messages.map(m => ({ role: m.role, content: m.content })),
      tools: tools.map(t => ({ name: t.name, description: t.description, input_schema: t.inputSchema }))
    })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error('Claude ' + res.status + ': ' + (err.error?.message || res.statusText));
  }
  const data = await res.json();
  let message = '';
  const toolCalls = [];
  for (const block of data.content || []) {
    if (block.type === 'text') message += block.text;
    else if (block.type === 'tool_use') toolCalls.push({ id: block.id, name: block.name, args: block.input });
  }
  return { message, toolCalls };
}

async function _aiCallOpenAI(systemPrompt, messages, tools, settings) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + settings.openaiKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: settings.openaiModel || 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages.map(m => ({ role: m.role, content: m.content }))
      ],
      tools: tools.map(t => ({ type: 'function', function: { name: t.name, description: t.description, parameters: t.inputSchema } }))
    })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error('OpenAI ' + res.status + ': ' + (err.error?.message || res.statusText));
  }
  const data = await res.json();
  const msg = data.choices?.[0]?.message || {};
  return {
    message: msg.content || '',
    toolCalls: (msg.tool_calls || []).map(tc => ({
      id: tc.id, name: tc.function.name,
      args: JSON.parse(tc.function.arguments || '{}')
    }))
  };
}

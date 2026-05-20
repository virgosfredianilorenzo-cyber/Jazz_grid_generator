# Infomaniak Provider Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ajouter Infomaniak comme troisième provider IA dans le Jazz Grid Generator, avec sa propre fonction d'appel API, ses settings persistés et son panneau de configuration.

**Architecture:** L'API Infomaniak est OpenAI-compatible ; la fonction `_aiCallInfomaniak` suit le même patron que `_aiCallOpenAI` avec une URL construite depuis `product_id`. Les settings, l'UI et les fonctions de config suivent exactement le même modèle que les providers existants.

**Tech Stack:** Vanilla JS, HTML — aucun build, aucune dépendance. Deux fichiers modifiés : `Split/js/ai.js` et `Split/index.html`.

---

## Fichiers modifiés

| Fichier | Modifications |
|---------|--------------|
| `Split/js/ai.js` | `_AI_DEFAULTS`, nouvelle fonction `_aiCallInfomaniak`, dispatch `aiProviderChat`, vérification clé `aiChatSend`, `aiConfigUpdateRows`, `_aiConfigRender`, `aiConfigSave` |
| `Split/index.html` | Nouvelle `<option>` dans le select provider, nouveau bloc `<div id="ai-cfg-row-infomaniak">` |

---

## Task 1 — Settings + fonction API + dispatch + vérification clé

**Fichiers :**
- Modifier : `Split/js/ai.js`

### Étape 1.1 — Étendre `_AI_DEFAULTS`

Localiser la constante `_AI_DEFAULTS` (ligne ~6 de `ai.js`) et ajouter trois clés :

```js
const _AI_DEFAULTS = {
  provider: 'claude',
  claudeModel: 'claude-sonnet-4-6',
  openaiModel: 'gpt-4o',
  claudeKey: '',
  openaiKey: '',
  infomaniakModel: 'euria',
  infomaniakKey: '',
  infomaniakProductId: ''
};
```

### Étape 1.2 — Ajouter `_aiCallInfomaniak`

Insérer la fonction juste après `_aiCallOpenAI` (après la ligne `}` qui ferme `_aiCallOpenAI`, avant le bloc `/* AI : TOOLS */`) :

```js
async function _aiCallInfomaniak(systemPrompt, messages, tools, settings) {
  const productId = settings.infomaniakProductId;
  if (!productId) throw new Error('Product ID Infomaniak non configuré');
  const res = await fetch('https://api.infomaniak.com/2/ai/' + productId + '/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + settings.infomaniakKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: settings.infomaniakModel || 'euria',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages.map(m => ({ role: m.role, content: m.content }))
      ],
      tools: tools.map(t => ({ type: 'function', function: { name: t.name, description: t.description, parameters: t.inputSchema } }))
    })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error('Infomaniak ' + res.status + ': ' + (err.error?.message || res.statusText));
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
```

### Étape 1.3 — Mettre à jour `aiProviderChat`

Remplacer la fonction `aiProviderChat` existante :

```js
async function aiProviderChat(systemPrompt, messages, tools, settings) {
  if (settings.provider === 'openai') return _aiCallOpenAI(systemPrompt, messages, tools, settings);
  if (settings.provider === 'infomaniak') return _aiCallInfomaniak(systemPrompt, messages, tools, settings);
  return _aiCallClaude(systemPrompt, messages, tools, settings);
}
```

### Étape 1.4 — Mettre à jour la vérification de clé dans `aiChatSend`

Localiser dans `aiChatSend` la ligne :
```js
const key = settings.provider === 'openai' ? settings.openaiKey : settings.claudeKey;
```

La remplacer par :
```js
const key = settings.provider === 'openai'     ? settings.openaiKey
          : settings.provider === 'infomaniak' ? settings.infomaniakKey
          : settings.claudeKey;
```

### Étape 1.5 — Commit

```bash
git add Split/js/ai.js
git commit -m "feat(ai): ajout provider Infomaniak — logique API et dispatch"
```

---

## Task 2 — HTML : option provider + bloc config

**Fichiers :**
- Modifier : `Split/index.html`

### Étape 2.1 — Ajouter l'option dans le select provider

Localiser dans `index.html` le `<select id="ai-cfg-provider">` :
```html
<select id="ai-cfg-provider" onchange="aiConfigUpdateRows(this.value)">
  <option value="claude">Claude (Anthropic)</option>
  <option value="openai">OpenAI</option>
</select>
```

Ajouter l'option Infomaniak :
```html
<select id="ai-cfg-provider" onchange="aiConfigUpdateRows(this.value)">
  <option value="claude">Claude (Anthropic)</option>
  <option value="openai">OpenAI</option>
  <option value="infomaniak">Infomaniak</option>
</select>
```

### Étape 2.2 — Ajouter le bloc config Infomaniak

Localiser la ligne de fermeture `</div>` du bloc `ai-cfg-row-openai`, puis insérer juste après :

```html
      <div id="ai-cfg-row-infomaniak" class="ai-cfg-row" style="display:none">
        <label>Modèle Infomaniak</label>
        <select id="ai-cfg-infomaniak-model">
          <option value="euria">euria</option>
          <option value="mistralai/Ministral-3-14B-Instruct-2512">Ministral-3B</option>
          <option value="Qwen/Qwen3.5-122B-A10B-FP8">Qwen3.5-122B</option>
          <option value="google/gemma-4-31B-it">Gemma-4-31B</option>
          <option value="moonshotai/Kimi-K2.6">Kimi-K2.6</option>
        </select>
        <label style="margin-top:6px;">Product ID</label>
        <input type="text" id="ai-cfg-infomaniak-product-id" placeholder="ex: 12345">
        <label style="margin-top:6px;">Clé API</label>
        <input type="password" id="ai-cfg-infomaniak-key" placeholder="Bearer token…">
      </div>
```

### Étape 2.3 — Commit

```bash
git add Split/index.html
git commit -m "feat(ai): config UI provider Infomaniak"
```

---

## Task 3 — JS config : updateRows, render, save

**Fichiers :**
- Modifier : `Split/js/ai.js`

### Étape 3.1 — Mettre à jour `aiConfigUpdateRows`

Remplacer la fonction entière :

```js
function aiConfigUpdateRows(provider) {
  document.getElementById('ai-cfg-row-claude').style.display      = provider === 'claude'      ? '' : 'none';
  document.getElementById('ai-cfg-row-openai').style.display      = provider === 'openai'      ? '' : 'none';
  document.getElementById('ai-cfg-row-infomaniak').style.display  = provider === 'infomaniak'  ? '' : 'none';
}
```

### Étape 3.2 — Mettre à jour `_aiConfigRender`

Remplacer la fonction entière :

```js
function _aiConfigRender() {
  const s = aiSettingsLoad();
  document.getElementById('ai-cfg-provider').value              = s.provider;
  document.getElementById('ai-cfg-claude-model').value          = s.claudeModel;
  document.getElementById('ai-cfg-openai-model').value          = s.openaiModel;
  document.getElementById('ai-cfg-claude-key').value            = s.claudeKey;
  document.getElementById('ai-cfg-openai-key').value            = s.openaiKey;
  document.getElementById('ai-cfg-infomaniak-model').value      = s.infomaniakModel;
  document.getElementById('ai-cfg-infomaniak-product-id').value = s.infomaniakProductId;
  document.getElementById('ai-cfg-infomaniak-key').value        = s.infomaniakKey;
  aiConfigUpdateRows(s.provider);
}
```

### Étape 3.3 — Mettre à jour `aiConfigSave`

Remplacer la fonction entière :

```js
function aiConfigSave() {
  aiSettingsSave({
    provider:            document.getElementById('ai-cfg-provider').value,
    claudeModel:         document.getElementById('ai-cfg-claude-model').value,
    openaiModel:         document.getElementById('ai-cfg-openai-model').value,
    claudeKey:           document.getElementById('ai-cfg-claude-key').value,
    openaiKey:           document.getElementById('ai-cfg-openai-key').value,
    infomaniakModel:     document.getElementById('ai-cfg-infomaniak-model').value,
    infomaniakProductId: document.getElementById('ai-cfg-infomaniak-product-id').value,
    infomaniakKey:       document.getElementById('ai-cfg-infomaniak-key').value
  });
  document.getElementById('ai-config').classList.remove('ai-config-open');
}
```

### Étape 3.4 — Commit

```bash
git add Split/js/ai.js
git commit -m "feat(ai): fonctions config render/save/updateRows pour Infomaniak"
```

---

## Task 4 — Vérification manuelle dans le navigateur

Ouvrir `Split/index.html` directement dans un navigateur (file://).

- [ ] **4.1 — Provider select** : Cliquer ⚙ → vérifier que le select affiche bien "Infomaniak" comme troisième option.

- [ ] **4.2 — Affichage conditionnel** : Sélectionner "Infomaniak" → vérifier que seul le bloc Infomaniak s'affiche (Product ID + Clé API + Modèle). Resélectionner "Claude" et "OpenAI" pour vérifier qu'ils masquent le bloc Infomaniak.

- [ ] **4.3 — Persistence** : Saisir un Product ID factice (`99999`), une clé factice (`test-key`), cliquer 💾. Rouvrir ⚙ → vérifier que les valeurs sont bien rechargées.

- [ ] **4.4 — Sélecteur modèle** : Vérifier que les 5 modèles sont présents dans la liste déroulante.

- [ ] **4.5 — Message clé manquante** : Sélectionner Infomaniak sans saisir de clé, envoyer un message → vérifier l'affichage du message d'erreur "Clé API non configurée".

- [ ] **4.6 — Push**

```bash
git push
```

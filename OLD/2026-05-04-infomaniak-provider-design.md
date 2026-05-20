# Design : Ajout du provider Infomaniak

**Date :** 2026-05-04  
**Scope :** `Split/js/ai.js` + `Split/index.html`  
**Approche retenue :** Option A — fonction dédiée `_aiCallInfomaniak`

---

## Contexte

Le Jazz Grid Generator supporte actuellement deux providers IA : Claude (Anthropic) et OpenAI.  
L'objectif est d'ajouter Infomaniak comme troisième provider.

L'API Infomaniak AI est compatible OpenAI (même format de requête/réponse), avec deux différences :
- URL dynamique : `https://api.infomaniak.com/2/ai/{product_id}/openai/v1/chat/completions`
- Authentification : `Authorization: Bearer {token}` (pas de header propriétaire)

Le `product_id` est un identifiant lié au compte Infomaniak, saisi manuellement dans la config.  
*(À terme : récupération automatique via `GET https://api.infomaniak.com/1/ai`.)*

---

## 1. Settings

**Fichier :** `Split/js/ai.js` — `_AI_DEFAULTS`

Trois nouvelles clés ajoutées :

```js
infomaniakModel: 'euria',
infomaniakKey: '',
infomaniakProductId: ''
```

---

## 2. Fonction `_aiCallInfomaniak`

**Fichier :** `Split/js/ai.js`

Nouvelle fonction async suivant le même pattern que `_aiCallOpenAI` :

- **URL :** `https://api.infomaniak.com/2/ai/${settings.infomaniakProductId}/openai/v1/chat/completions`
- **Headers :**
  - `Authorization: Bearer ${settings.infomaniakKey}`
  - `Content-Type: application/json`
- **Body :** format OpenAI standard (même qu'`_aiCallOpenAI`) :
  - `model`, `messages` (avec system en premier), `tools` (type `function`)
- **Parsing réponse :** identique à `_aiCallOpenAI` (`choices[0].message`, `tool_calls`)
- **Erreur :** préfixée `'Infomaniak ' + res.status + ': ' + ...`

---

## 3. Dispatch dans `aiProviderChat`

**Fichier :** `Split/js/ai.js`

```js
if (settings.provider === 'infomaniak') return _aiCallInfomaniak(systemPrompt, messages, tools, settings);
```

Ajout avant le `return _aiCallClaude(...)` existant.

---

## 4. Vérification de clé manquante

**Fichier :** `Split/js/ai.js` — `aiChatSend`

```js
const key = settings.provider === 'openai'      ? settings.openaiKey
          : settings.provider === 'infomaniak'  ? settings.infomaniakKey
          : settings.claudeKey;
```

---

## 5. HTML — Panneau de configuration

**Fichier :** `Split/index.html`

### Sélecteur de provider
Ajout d'une option dans `<select id="ai-cfg-provider">` :
```html
<option value="infomaniak">Infomaniak</option>
```

### Nouveau bloc config
```html
<div id="ai-cfg-row-infomaniak" class="ai-cfg-row" style="display:none">
  <!-- sélecteur modèle, input product_id, input clé API -->
</div>
```

Champs :
1. **Modèle** — `<select id="ai-cfg-infomaniak-model">` avec options :
   - `euria` (défaut)
   - `mistralai/Ministral-3-14B-Instruct-2512`
   - `Qwen/Qwen3.5-122B-A10B-FP8`
   - `google/gemma-4-31B-it`
   - `moonshotai/Kimi-K2.6`
2. **Product ID** — `<input type="text" id="ai-cfg-infomaniak-product-id" placeholder="ex: 12345">`
3. **Clé API** — `<input type="password" id="ai-cfg-infomaniak-key" placeholder="Bearer token…">`

---

## 6. Fonctions de config JS

**Fichier :** `Split/js/ai.js`

### `aiConfigUpdateRows(provider)`
Ajout du cas `infomaniak` : afficher `ai-cfg-row-infomaniak`, masquer les autres.

### `_aiConfigRender()`
Charger les trois valeurs depuis les settings :
- `s.infomaniakModel` → `ai-cfg-infomaniak-model`
- `s.infomaniakProductId` → `ai-cfg-infomaniak-product-id`
- `s.infomaniakKey` → `ai-cfg-infomaniak-key`

### `aiConfigSave()`
Sauvegarder les trois valeurs :
- `infomaniakModel`
- `infomaniakProductId`
- `infomaniakKey`

---

## Hors scope

- Récupération automatique du `product_id` via `GET /1/ai` *(prévu plus tard)*
- Test du support tool use pour les modèles non-euria
- Ajout de nouveaux modèles Infomaniak

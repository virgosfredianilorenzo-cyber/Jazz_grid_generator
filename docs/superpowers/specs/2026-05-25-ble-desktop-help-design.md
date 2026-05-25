# Design — Aide contextuelle BLE desktop

**Date :** 2026-05-25  
**Contexte :** Le Songbook utilise Web Bluetooth (BLE-MIDI) pour envoyer des presets au HX Stomp. Sur Linux Chrome, `navigator.bluetooth` est `undefined` par défaut et le code affiche un `alert()` peu informatif qui bloque l'utilisateur desktop.  
**Objectif :** Remplacer l'alert par un bloc d'aide contextuel dans la vue MIDI, avec instructions adaptées à la plateforme.

---

## Architecture

Aucun nouveau fichier. Modifications ciblées dans 3 fichiers existants :

- `songbook/js/midi.js` — logique de détection + affichage de l'aide
- `songbook/index.html` — ajout du bloc `#ble-help` dans `view-ble`
- `songbook/css/app.css` — styles du bloc d'aide

---

## Logique de détection (`midi.js`)

Fonction `_getBleHelpContent()` appelée si `!navigator.bluetooth`.  
Retourne un objet `{ title, steps }` selon le contexte détecté via `navigator.userAgent` :

| Condition | Titre | Instructions |
|---|---|---|
| Firefox | Non supporté | Utiliser Chrome ou Edge |
| Safari | Non supporté | Utiliser Chrome |
| Linux + Chrome/Chromium | Web Bluetooth désactivé | Activer `chrome://flags/#enable-web-bluetooth`, relancer Chrome |
| Windows/macOS + Chrome/Edge | Bluetooth non détecté | Vérifier que le Bluetooth système est activé, relancer la page |
| Autre | Non disponible | Message générique |

Android + Chrome ne passe pas dans cette branche (BT disponible → flux normal).

Fonction `_showBleHelp()` :
1. Appelle `_getBleHelpContent()`
2. Peuple `#ble-help-title` et `#ble-help-steps`
3. Retire la classe `hidden` de `#ble-help`
4. Cache le bouton `#btn-ble-connect`

---

## HTML (`index.html`)

Dans `view-ble`, après les boutons existants, ajouter :

```html
<div id="ble-help" class="hidden">
  <p id="ble-help-title"></p>
  <ol id="ble-help-steps"></ol>
  <button id="btn-ble-retry">Réessayer</button>
</div>
```

`#btn-ble-retry` rappelle `midiConnect()` — utile après avoir suivi les instructions et rechargé l'onglet (ou activé le flag sans relancer).

---

## CSS (`app.css`)

Bloc `#ble-help` dans le thème sombre existant :
- Fond légèrement contrasté (`#0f3460`), padding, border-radius
- `#ble-help-title` en orange/rouge pour signaler le problème
- `#ble-help-steps` liste ordonnée avec espacement lisible
- `#btn-ble-retry` secondaire (même style que `btn-ble-disconnect`)

---

## Comportement complet

1. Utilisateur ouvre la vue MIDI et clique "Connecter HX Stomp"
2. `midiConnect()` détecte `!navigator.bluetooth`
3. `_showBleHelp()` affiche le bloc d'aide adapté à la plateforme
4. L'utilisateur suit les instructions (ex : active le flag Chrome, relance)
5. Il clique "Réessayer" → `midiConnect()` re-tente ; si `navigator.bluetooth` est maintenant disponible, connexion normale

---

## Hors scope

- Ajout de Web MIDI API (USB) — possible future v4.6
- Persistance du choix navigateur
- Tests automatisés (app sans build, tests manuels suffisent)

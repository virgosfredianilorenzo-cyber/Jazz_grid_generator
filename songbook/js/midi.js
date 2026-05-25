/* ── Encodage messages MIDI ── */
function midiPCBytes(channel, program) {
  return new Uint8Array([0xC0 | ((channel - 1) & 0x0F), program & 0x7F]);
}
function midiCCBytes(channel, cc, value) {
  return new Uint8Array([0xB0 | ((channel - 1) & 0x0F), cc & 0x7F, value & 0x7F]);
}

/* ── BLE-MIDI ── */
const BLE_MIDI_SERVICE = '03b80e5a-ede8-4b33-a751-6ce34ec4c700';
const BLE_MIDI_CHAR    = '7772e5db-3868-4112-a1a9-f2669d106bf3';

let _bleDevice = null;
let _bleChar = null;

function _bleWrap(midiBytes) {
  const buf = new Uint8Array(midiBytes.length + 2);
  buf[0] = 0x80; buf[1] = 0x80;
  buf.set(midiBytes, 2);
  return buf;
}

function _updateBleUI() {
  const connected = !!_bleChar;
  const ind = document.getElementById('ble-indicator');
  const statusText = document.getElementById('ble-status-text');
  const btnConnect = document.getElementById('btn-ble-connect');
  const btnDisconnect = document.getElementById('btn-ble-disconnect');
  if (ind) {
    ind.classList.toggle('connected', connected);
    ind.classList.toggle('disconnected', !connected);
  }
  if (statusText) statusText.textContent = connected
    ? `Connecté : ${_bleDevice.name || 'HX Stomp'}` : 'Non connecté';
  if (btnConnect) btnConnect.classList.toggle('hidden', connected);
  if (btnDisconnect) btnDisconnect.classList.toggle('hidden', !connected);
}

async function midiConnect() {
  if (!navigator.bluetooth) {
    alert('Web Bluetooth non disponible. Utiliser Chrome sur Android.');
    return;
  }
  try {
    _bleDevice = await navigator.bluetooth.requestDevice({
      filters: [{ services: [BLE_MIDI_SERVICE] }],
      optionalServices: [BLE_MIDI_SERVICE]
    });
    _bleDevice.addEventListener('gattserverdisconnected', () => {
      _bleChar = null; _updateBleUI();
    });
    const server = await _bleDevice.gatt.connect();
    const service = await server.getPrimaryService(BLE_MIDI_SERVICE);
    _bleChar = await service.getCharacteristic(BLE_MIDI_CHAR);
    localStorage.setItem('ble_device_name', _bleDevice.name || '');
    _updateBleUI();
  } catch (e) {
    console.warn('[MIDI] connexion échouée', e);
    _bleChar = null; _updateBleUI();
  }
}

function midiDisconnect() {
  if (_bleDevice && _bleDevice.gatt.connected) _bleDevice.gatt.disconnect();
  _bleChar = null; _bleDevice = null;
  localStorage.removeItem('ble_device_name');
  _updateBleUI();
}

async function midiSendPreset(preset) {
  if (!_bleChar) return;
  try {
    const { channel, programChange, cc } = preset;
    if (programChange !== null && programChange !== undefined) {
      await _bleChar.writeValueWithoutResponse(_bleWrap(midiPCBytes(channel, programChange)));
    }
    for (const c of (cc || [])) {
      await _bleChar.writeValueWithoutResponse(_bleWrap(midiCCBytes(channel, c.number, c.value)));
    }
  } catch (e) {
    console.warn('[MIDI] envoi échoué', e);
  }
}

/* ── Boutons vue BLE ── */
document.getElementById('btn-ble-connect').addEventListener('click', midiConnect);
document.getElementById('btn-ble-disconnect').addEventListener('click', midiDisconnect);
document.getElementById('ble-indicator').addEventListener('click', () => {
  if (!_bleChar) midiConnect();
});

_updateBleUI();

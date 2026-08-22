const mqtt = require('mqtt');
const WebSocket = require('ws');
const readline = require('readline');

console.log('====================================================');
console.log('   fumii hardware simulator (Zero-Friction Pairing)  ');
console.log('====================================================\n');

let isPaired = process.argv.includes('--paired');
let pairedDesktopId = isPaired ? 'default-desktop' : null;
let pairedToken = isPaired ? 'mock-secret-token-1234567890abcdef' : null;
let mode = 'companion';

const client = mqtt.connect('mqtt://127.0.0.1:1883', { clientId: 'fumii-esp32-sim' });

client.on('connect', () => {
  console.log('[MQTT] Connected to desktop broker (127.0.0.1:1883).');
  
  // Announce initial status (LWT will mark offline if disconnected)
  const initialStatus = isPaired ? 'online' : 'unpaired';
  client.publish('fumii/device/status', initialStatus, { retain: true });
  console.log(`[MQTT] Published initial device status: "${initialStatus}"`);
  
  // Subscribe to desktop commands & pairing topics
  client.subscribe('fumii/desktop/#');

  // Start periodic heartbeat and telemetry
  setInterval(() => {
    client.publish('fumii/device/heartbeat', Date.now().toString());
  }, 2500);
  
  setInterval(() => {
    client.publish('fumii/device/battery', '92');
    client.publish('fumii/device/wifi', 'Home_WiFi_5G');
  }, 8000);
});

client.on('message', (topic, message) => {
  const msgStr = message.toString();
  console.log(`\n[MQTT] <-- Received on [${topic}]: ${msgStr}`);

  // ── Pairing Handshake ──
  if (topic === 'fumii/desktop/pair') {
    try {
      const data = JSON.parse(msgStr);
      if (isPaired) {
        console.log('[SIM] ⚠️ Rejecting pair request — device is already paired.');
        return;
      }
      pairedDesktopId = data.desktop_id;
      pairedToken = data.token;
      isPaired = true;
      console.log(`[SIM] ✨ PAIRED SUCCESSFULLY with desktop: ${pairedDesktopId}`);
      console.log(`[SIM] 🔑 Stored Token: ${pairedToken.slice(0, 8)}...`);
      client.publish('fumii/device/status', 'online', { retain: true });
      client.publish('fumii/device/mode', mode);
    } catch (e) {
      console.error('[SIM] Failed to parse pair payload:', e.message);
    }
    return;
  }

  if (topic === 'fumii/desktop/unpair') {
    try {
      const data = JSON.parse(msgStr);
      if (data.token === pairedToken) {
        isPaired = false;
        pairedDesktopId = null;
        pairedToken = null;
        console.log('[SIM] 🔓 Device UNPAIRED via desktop request.');
        client.publish('fumii/device/status', 'unpaired', { retain: true });
      } else {
        console.log('[SIM] ⚠️ Rejecting unpair request — invalid token.');
      }
    } catch (e) {
      console.error('[SIM] Failed to parse unpair payload:', e.message);
    }
    return;
  }

  // ── Command Authorization Check ──
  if (isPaired) {
    try {
      const data = JSON.parse(msgStr);
      if (data.token !== pairedToken) {
        console.log('[SIM] 🛑 UNAUTHORIZED COMMAND DROPPED (token missing or mismatched).');
        return;
      }
      console.log('[SIM] ✅ Command authorized with valid token.');
    } catch {
      console.log('[SIM] 🛑 Dropping unauthenticated plaintext command.');
      return;
    }
  }

  if (topic === 'fumii/desktop/identify') {
    console.log('[SIM] 💡 (LEDs pulse blue + companion waves)');
  } else if (topic === 'fumii/desktop/face') {
    console.log('[SIM] 😊 (Display face updated)');
  }
});

// Setup audio websocket simulation
let inputWs, outputWs;

function connectAudio() {
  inputWs = new WebSocket('ws://127.0.0.1:8765/audio/input');
  outputWs = new WebSocket('ws://127.0.0.1:8765/audio/output');

  inputWs.on('open', () => console.log('[WS] Input socket connected (/audio/input mic ready)'));
  outputWs.on('open', () => console.log('[WS] Output socket connected (/audio/output TTS ready)'));

  outputWs.on('message', (data, isBinary) => {
    if (!isBinary) {
      console.log(`[WS TTS] <-- Header: ${data.toString()}`);
    } else {
      console.log(`[WS TTS] <-- Audio Chunk: ${data.length} bytes`);
    }
  });

  inputWs.on('error', () => {});
  outputWs.on('error', () => {});
}

setTimeout(connectAudio, 1200);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('\n--- Simulator Interactive Controls ---');
console.log('  w : trigger wake / touch tap');
console.log('  m : toggle mode (companion <-> assistant)');
console.log('  u : simulate 5s button hold (Unpair)');
console.log('  r : simulate 10s button hold (Factory Reset)');
console.log('  p : print current pairing state');
console.log('  q : quit simulator');
console.log('-------------------------------------\n');

rl.on('line', (input) => {
  const cmd = input.trim();
  if (cmd === 'w') {
    console.log('>> [Action] Triggering head touch / wake...');
    client.publish('fumii/device/wake', Date.now().toString());
  } else if (cmd === 'm') {
    mode = mode === 'companion' ? 'assistant' : 'companion';
    console.log(`>> [Action] Switching mode to: ${mode}`);
    client.publish('fumii/device/mode', mode);
  } else if (cmd === 'u') {
    console.log('>> [Action] 5s Button Hold — Unpairing...');
    isPaired = false;
    pairedDesktopId = null;
    pairedToken = null;
    client.publish('fumii/device/status', 'unpaired', { retain: true });
    console.log('>> Device status is now: "unpaired"');
  } else if (cmd === 'r') {
    console.log('>> [Action] 10s Button Hold — Factory Reset & SoftAP reboot...');
    isPaired = false;
    pairedDesktopId = null;
    pairedToken = null;
    client.publish('fumii/device/status', 'unpaired', { retain: true });
    console.log('>> Credentials cleared. SoftAP fumii-setup-A1B2 ready.');
  } else if (cmd === 'p') {
    console.log(`>> [State] isPaired=${isPaired}, desktop=${pairedDesktopId}, token=${pairedToken ? pairedToken.slice(0, 8) + '...' : 'none'}`);
  } else if (cmd === 'q') {
    client.publish('fumii/device/status', 'offline', { retain: true });
    setTimeout(() => process.exit(0), 200);
  }
});

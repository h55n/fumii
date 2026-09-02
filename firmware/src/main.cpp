#include <Arduino.h>
#include <WiFi.h>
#include <WiFiUdp.h>
#include <ESPmDNS.h>
#include <WebSocketsClient.h>
#include <ArduinoJson.h>

#include "config.h"
#include "DisplayManager.h"
#include "AudioCapture.h"
#include "AudioPlayback.h"
#include "MQTTHandler.h"
#include "ModeSwitch.h"
#include "HapticController.h"
#include "LEDRing.h"
#include "WiFiProvisioning.h"

DeviceConfig deviceConfig;

DisplayManager display;
AudioCapture audioCapture;
AudioPlayback audioPlayback;
WiFiClient netClient;
MQTTHandler mqtt;
ModeSwitch modeSwitch;
HapticController haptic;
LEDRing ledRing;
WiFiProvisioning provisioning;
WebSocketsClient audioSocket;

bool speaking = false;

void discoverDesktopHost() {
  // If a valid non-default IP or hostname was loaded from NVS, use it
  if (strlen(deviceConfig.desktopHost) > 0 && strcmp(deviceConfig.desktopHost, "fumii-desktop.local") != 0) {
    Serial.printf("[fumii] using pre-configured desktop host: %s\n", deviceConfig.desktopHost);
    return;
  }

  // 1. Try zero-conf UDP discovery on port 8766
  WiFiUDP udp;
  udp.begin(8766);
  const char* query = "{\"query\":\"fumii-desktop\"}";
  udp.beginPacket(IPAddress(255, 255, 255, 255), 8766);
  udp.write((const uint8_t*)query, strlen(query));
  udp.endPacket();

  unsigned long start = millis();
  bool found = false;
  char packetBuffer[256];

  while (millis() - start < 1500UL) {
    int packetSize = udp.parsePacket();
    if (packetSize > 0) {
      int len = udp.read(packetBuffer, sizeof(packetBuffer) - 1);
      if (len > 0) {
        packetBuffer[len] = '\0';
        StaticJsonDocument<256> doc;
        DeserializationError err = deserializeJson(doc, packetBuffer);
        if (!err && doc.containsKey("host")) {
          const char* host = doc["host"];
          if (host && strlen(host) > 0) {
            strncpy(deviceConfig.desktopHost, host, sizeof(deviceConfig.desktopHost) - 1);
            Serial.printf("[fumii] zero-conf UDP discovered desktop: %s\n", deviceConfig.desktopHost);
            found = true;
            break;
          }
        }
      }
    }
    delay(20);
  }
  udp.stop();

  if (found) return;

  // 2. Fallback to mDNS
  if (MDNS.begin("fumii-device")) {
    IPAddress resolved = MDNS.queryHost("fumii-desktop", 1000);
    if (resolved != IPAddress()) {
      strncpy(deviceConfig.desktopHost, resolved.toString().c_str(), sizeof(deviceConfig.desktopHost) - 1);
      Serial.printf("[fumii] mDNS resolved desktop: %s\n", deviceConfig.desktopHost);
      return;
    }
  }

  Serial.printf("[fumii] discovery fallback default host: %s\n", deviceConfig.desktopHost);
}

void onModeChanged(const char* newMode) {
  mqtt.publishMode(newMode);
  haptic.play(1); // one short tap — mode switch confirmation
  display.setState(FaceState::HAPPY); // brief "wave" substitute — see note below
}

void onUnpairRequested() {
  Serial.println("[fumii] Unpair requested via button hold");
  haptic.play(2); // short double-buzz
  mqtt.forceUnpair();
}

void onFactoryResetRequested() {
  Serial.println("[fumii] Factory Reset requested via 10s button hold");
  haptic.play(3); // long single buzz
  provisioning.clearCredentials();
  mqtt.forceUnpair();
  delay(1000);
  ESP.restart();
}

void onAudioSocketEvent(WStype_t type, uint8_t* payload, size_t length) {
  switch (type) {
    case WStype_CONNECTED:
      Serial.println("[fumii] audio websocket connected");
      break;
    case WStype_BIN:
      if (speaking) audioPlayback.onChunkReceived(payload, length);
      break;
    case WStype_DISCONNECTED:
      Serial.println("[fumii] audio websocket disconnected");
      break;
    default:
      break;
  }
}

void setup() {
  Serial.begin(115200);
  Serial.println("\n[fumii] booting...");

  // Battery ADC pin — input only, no pull
  pinMode(PIN_BATTERY_ADC, INPUT);
  analogReadResolution(12); // 0–4095
  analogSetAttenuation(ADC_11db); // 0–3.3V range

  display.init();
  display.setState(FaceState::OFFLINE);

  ledRing.init();
  haptic.init();
  audioCapture.init();
  audioPlayback.init();

  modeSwitch.init(onModeChanged, onUnpairRequested, onFactoryResetRequested);

  // ── WiFi ──
  if (!provisioning.hasStoredCredentials()) {
    // Show provisioning animation so the user sees the device is alive and waiting
    display.setState(FaceState::PROVISIONING);
    provisioning.startProvisioningPortal();
  }
  if (!provisioning.connect()) {
    Serial.println("[fumii] wifi connect failed — retrying provisioning");
    display.setState(FaceState::PROVISIONING);
    provisioning.startProvisioningPortal();
    provisioning.connect();
  }
  Serial.printf("[fumii] wifi connected: %s\n", WiFi.localIP().toString().c_str());

  // ── Auto-Discover Desktop Host ──
  discoverDesktopHost();

  // ── MQTT ──
  mqtt.init(netClient, &display);

  // Report connected SSID, RSSI, and IP to desktop so telemetry reflects live status
  mqtt.publishWifi(WiFi.SSID().c_str());
  mqtt.publishWifiRssi(WiFi.RSSI());
  mqtt.publishIp(WiFi.localIP().toString().c_str());
  mqtt.publishFirmwareVersion("2.0.0");

  // ── WebSocket audio ──
  audioSocket.begin(deviceConfig.desktopHost, deviceConfig.wsPort, "/audio/input");
  audioSocket.onEvent(onAudioSocketEvent);
  audioSocket.setReconnectInterval(3000);

  display.setState(FaceState::IDLE);
  Serial.println("[fumii] ready");
}

void loop() {
  mqtt.loop();
  modeSwitch.tick();
  ledRing.tick();
  display.tick();
  audioSocket.loop();

  // ── Wake-word detection ──────────────────────────────────────────────────
  // Integration hook: define WAKE_WORD_ENABLED in config.h and wire your
  // Porcupine (or microWakeWord) callback here. When the keyword fires:
  //
  //   mqtt.publishWake();
  //   display.setState(FaceState::LISTENING);
  //   audioCapture.startStreaming(&audioSocket);
  //
  // See firmware/include/config.h → WAKE_WORD_ENABLED for dependency notes.
  // Without a library installed this section compiles as a no-op.
  //
#ifdef WAKE_WORD_ENABLED
  // pv_porcupine_process(...) — add your callback here
  // if (wakeWordDetected) {
  //   mqtt.publishWake();
  //   display.setState(FaceState::LISTENING);
  //   audioCapture.startStreaming(&audioSocket);
  // }
#endif

  // ── Battery telemetry ─────────────────────────────────────────────────────
  static unsigned long lastBatteryPublish = 0;
  if (millis() - lastBatteryPublish > 5 * 60 * 1000UL) {
    // Read raw ADC and map to 0–100%.
    // Uses a simple resistor-divider model — calibrate VBAT_FULL_ADC /
    // VBAT_EMPTY_ADC in config.h for your exact circuit.
    int raw = analogRead(PIN_BATTERY_ADC);
    int pct = constrain(
      map(raw, VBAT_EMPTY_ADC, VBAT_FULL_ADC, 0, 100),
      0, 100
    );
    mqtt.publishBattery((uint8_t)pct);
    lastBatteryPublish = millis();
  }
}

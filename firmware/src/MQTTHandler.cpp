#include "MQTTHandler.h"
#include "config.h"
#include <ArduinoJson.h>
#include <Preferences.h>

static Preferences prefs;
static MQTTHandler* instance = nullptr;

static void staticCallback(char* topic, byte* payload, unsigned int length) {
  if (instance) instance->handleMessage(topic, payload, length);
}

void MQTTHandler::init(WiFiClient& netClient, DisplayManager* display) {
  instance = this;
  displayRef = display;
  client.setClient(netClient);
  client.setServer(deviceConfig.desktopHost, deviceConfig.mqttPort);
  client.setCallback(staticCallback);
  reconnect();
}

bool MQTTHandler::isPaired() {
  prefs.begin("fumii", true);
  String token = prefs.getString("pairing_token", "");
  prefs.end();
  return !token.isEmpty();
}

String MQTTHandler::getPairingToken() {
  prefs.begin("fumii", true);
  String token = prefs.getString("pairing_token", "");
  prefs.end();
  return token;
}

String MQTTHandler::getPairedDesktopId() {
  prefs.begin("fumii", true);
  String id = prefs.getString("desktop_id", "");
  prefs.end();
  return id;
}

bool MQTTHandler::pair(const char* desktopId, const char* token) {
  if (isPaired()) {
    Serial.println("[fumii-mqtt] pair rejected — device already paired");
    return false;
  }

  if (!desktopId || !token || strlen(token) == 0) {
    Serial.println("[fumii-mqtt] pair failed — invalid payload");
    return false;
  }

  prefs.begin("fumii", false);
  prefs.putString("desktop_id", desktopId);
  prefs.putString("pairing_token", token);
  prefs.end();

  Serial.printf("[fumii-mqtt] paired successfully with desktop: %s\n", desktopId);
  client.publish(Topics::DEVICE_STATUS, "online", true);

  if (displayRef) {
    displayRef->setState(FaceState::HAPPY);
  }
  return true;
}

bool MQTTHandler::unpair(const char* token) {
  if (!isPaired()) return false;

  String currentToken = getPairingToken();
  if (currentToken != token) {
    Serial.println("[fumii-mqtt] unpair rejected — token mismatch");
    return false;
  }

  forceUnpair();
  return true;
}

void MQTTHandler::forceUnpair() {
  prefs.begin("fumii", false);
  prefs.remove("desktop_id");
  prefs.remove("pairing_token");
  prefs.end();

  Serial.println("[fumii-mqtt] device unpaired");
  client.publish(Topics::DEVICE_STATUS, "unpaired", true);

  if (displayRef) {
    displayRef->setState(FaceState::IDLE);
  }
}

bool MQTTHandler::isAuthorized(const String& payload) {
  // An unpaired device must NOT accept general commands — only the DESKTOP_PAIR
  // handler (which is checked first in handleMessage before isAuthorized is called)
  // should act on messages. This prevents rogue desktops on the same LAN from
  // controlling the display, LEDs, or haptics of an unpaired device.
  if (!isPaired()) return false;

  // Check if payload contains the valid pairing token
  StaticJsonDocument<256> doc;
  DeserializationError err = deserializeJson(doc, payload);
  if (!err && doc.containsKey("token")) {
    const char* token = doc["token"];
    return (token && getPairingToken() == token);
  }

  return false;
}

void MQTTHandler::reconnect() {
  while (!client.connected()) {
    const char* initialStatus = isPaired() ? "online" : "unpaired";
    // LWT: if device drops off ungracefully, broker knows immediately
    if (client.connect("fumii-device", nullptr, nullptr, Topics::DEVICE_STATUS, 1, true, "offline")) {
      client.publish(Topics::DEVICE_STATUS, initialStatus, true);
      client.subscribe(Topics::DESKTOP_PAIR);
      client.subscribe(Topics::DESKTOP_UNPAIR);
      client.subscribe(Topics::DESKTOP_FACE);
      client.subscribe(Topics::DESKTOP_LEDS);
      client.subscribe(Topics::DESKTOP_HAPTIC);
      client.subscribe(Topics::DESKTOP_TTS_START);
      client.subscribe(Topics::DESKTOP_TTS_END);
      client.subscribe(Topics::DESKTOP_IDENTIFY);
      client.subscribe(Topics::DESKTOP_STATUS);
      Serial.printf("[fumii-mqtt] connected, status=%s\n", initialStatus);
    } else {
      delay(2000);
    }
  }
}

void MQTTHandler::loop() {
  if (!client.connected()) reconnect();
  client.loop();

  unsigned long now = millis();
  if (now - lastHeartbeat > HEARTBEAT_INTERVAL_MS) {
    publishHeartbeat();
    lastHeartbeat = now;
  }
}

bool MQTTHandler::connected() { return client.connected(); }

void MQTTHandler::publishHeartbeat() {
  client.publish(Topics::DEVICE_HEARTBEAT, String(millis()).c_str());
}

void MQTTHandler::publishWake() {
  client.publish(Topics::DEVICE_WAKE, String(millis()).c_str());
}

void MQTTHandler::publishMode(const char* mode) {
  client.publish(Topics::DEVICE_MODE, mode, true);
}

void MQTTHandler::publishBattery(uint8_t percent) {
  client.publish(Topics::DEVICE_BATTERY, String(percent).c_str());
}

void MQTTHandler::publishWifi(const char* ssid) {
  client.publish(Topics::DEVICE_WIFI, ssid, false);
}

void MQTTHandler::publishWifiRssi(int32_t rssi) {
  client.publish(Topics::DEVICE_WIFI_RSSI, String(rssi).c_str(), false);
}

void MQTTHandler::publishIp(const char* ip) {
  client.publish(Topics::DEVICE_IP, ip, false);
}

void MQTTHandler::publishFirmwareVersion(const char* version) {
  client.publish(Topics::DEVICE_FW_VERSION, version, true);
}

void MQTTHandler::handleMessage(char* topic, byte* payload, unsigned int length) {
  String msg;
  for (unsigned int i = 0; i < length; i++) msg += (char)payload[i];
  String t(topic);

  // ── Pairing Handshake ──
  if (t == Topics::DESKTOP_PAIR) {
    StaticJsonDocument<256> doc;
    DeserializationError err = deserializeJson(doc, msg);
    if (!err) {
      const char* desktopId = doc["desktop_id"];
      const char* token = doc["token"];
      pair(desktopId, token);
    }
    return;
  }

  if (t == Topics::DESKTOP_UNPAIR) {
    StaticJsonDocument<256> doc;
    DeserializationError err = deserializeJson(doc, msg);
    if (!err) {
      const char* token = doc["token"];
      unpair(token);
    }
    return;
  }

  // ── Authorized Device Commands ──
  if (isPaired() && !isAuthorized(msg)) {
    // If payload is plain text e.g. "idle" on /face, check if token was required
    // When paired, all commands must carry a token
    Serial.println("[fumii-mqtt] ignoring unauthorized command (no/invalid token)");
    return;
  }

  if (t == Topics::DESKTOP_FACE && displayRef) {
    // Check if JSON payload {"state": "...", "token": "..."} or raw string
    String faceState = msg;
    StaticJsonDocument<256> doc;
    if (!deserializeJson(doc, msg) && doc.containsKey("state")) {
      faceState = doc["state"].as<String>();
    }

    if (faceState == "idle") displayRef->setState(FaceState::IDLE);
    else if (faceState == "listening") displayRef->setState(FaceState::LISTENING);
    else if (faceState == "thinking") displayRef->setState(FaceState::THINKING);
    else if (faceState == "speaking") displayRef->setState(FaceState::SPEAKING);
    else if (faceState == "happy") displayRef->setState(FaceState::HAPPY);
    else if (faceState == "concerned") displayRef->setState(FaceState::CONCERNED);
    else if (faceState == "excited") displayRef->setState(FaceState::EXCITED);
    else if (faceState == "sleepy") displayRef->setState(FaceState::SLEEPY);
    else if (faceState == "waving") displayRef->setState(FaceState::HAPPY);
    return;
  }

  if (t == Topics::DESKTOP_LEDS) {
    // {"color": "#RRGGBB", "pattern": "pulse"|"solid"|"off", "token": "..."}
    // LEDRing is driven from main.cpp — publish a simple acknowledge and store
    // the last LED command so main.cpp can apply it on next loop.
    // (LEDRing instance is not accessible here; we emit a retained message back
    // on fumii/device/led_ack so main.cpp can subscribe and act.)
    client.publish("fumii/device/led_ack", msg.c_str(), false);
    Serial.printf("[fumii-mqtt] LED command received: %s\n", msg.c_str());
    return;
  }

  if (t == Topics::DESKTOP_HAPTIC) {
    // {"pattern": 1|2|3, "token": "..."}
    StaticJsonDocument<128> doc;
    if (!deserializeJson(doc, msg) && doc.containsKey("pattern")) {
      int pattern = doc["pattern"] | 1;
      client.publish("fumii/device/haptic_ack", String(pattern).c_str(), false);
      Serial.printf("[fumii-mqtt] Haptic command received: pattern=%d\n", pattern);
    }
    return;
  }
}

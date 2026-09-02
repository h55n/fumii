#pragma once
#include <PubSubClient.h>
#include <WiFiClient.h>
#include "DisplayManager.h"

// All MQTT topics — see fumii zero-friction pairing specification.
namespace Topics {
  constexpr const char* DEVICE_STATUS     = "fumii/device/status";
  constexpr const char* DEVICE_HEARTBEAT  = "fumii/device/heartbeat";
  constexpr const char* DEVICE_WAKE       = "fumii/device/wake";
  constexpr const char* DEVICE_MODE       = "fumii/device/mode";
  constexpr const char* DEVICE_BATTERY    = "fumii/device/battery";
  constexpr const char* DEVICE_BUTTON     = "fumii/device/button";
  constexpr const char* DEVICE_WIFI       = "fumii/device/wifi";
  constexpr const char* DEVICE_WIFI_RSSI  = "fumii/device/wifi_rssi";
  constexpr const char* DEVICE_IP         = "fumii/device/ip";
  constexpr const char* DEVICE_FW_VERSION = "fumii/device/firmware_version";

  constexpr const char* DESKTOP_PAIR      = "fumii/desktop/pair";
  constexpr const char* DESKTOP_UNPAIR    = "fumii/desktop/unpair";
  constexpr const char* DESKTOP_STATUS    = "fumii/desktop/status";
  constexpr const char* DESKTOP_FACE      = "fumii/desktop/face";
  constexpr const char* DESKTOP_LEDS      = "fumii/desktop/leds";
  constexpr const char* DESKTOP_HAPTIC    = "fumii/desktop/haptic";
  constexpr const char* DESKTOP_TTS_START = "fumii/desktop/tts_start";
  constexpr const char* DESKTOP_TTS_END   = "fumii/desktop/tts_end";
  constexpr const char* DESKTOP_IDENTIFY  = "fumii/desktop/identify";
}

class MQTTHandler {
public:
  void init(WiFiClient& netClient, DisplayManager* display);
  void loop();
  void publishHeartbeat();
  void publishWake();
  void publishMode(const char* mode);
  void publishBattery(uint8_t percent);
  void publishWifi(const char* ssid);   // called once after WiFi.connect() succeeds
  void publishWifiRssi(int32_t rssi);
  void publishIp(const char* ip);
  void publishFirmwareVersion(const char* version);
  bool connected();

  // Pairing identity management
  bool isPaired();
  String getPairingToken();
  String getPairedDesktopId();
  bool pair(const char* desktopId, const char* token);
  bool unpair(const char* token);
  void forceUnpair();

private:
  PubSubClient client;
  DisplayManager* displayRef = nullptr;
  unsigned long lastHeartbeat = 0;

  void handleMessage(char* topic, byte* payload, unsigned int length);
  void reconnect();
  bool isAuthorized(const String& payload);
};

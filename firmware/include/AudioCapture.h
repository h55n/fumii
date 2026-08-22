#pragma once
#include <Arduino.h>
#include <WebSocketsClient.h>

// Captures I2S mic audio and streams raw PCM chunks to the desktop over
// WebSocket. See fumii_master_prd.md §29 "Device -> Desktop (Microphone Audio)".
class AudioCapture {
public:
  void init();
  void startStreaming(WebSocketsClient* ws);
  void stopStreaming();
  void tick(); // call every loop() while streaming — reads + sends one chunk

private:
  bool streaming = false;
  WebSocketsClient* wsClient = nullptr;
  static const size_t CHUNK_BYTES = 512;
  uint8_t buffer[CHUNK_BYTES];
};

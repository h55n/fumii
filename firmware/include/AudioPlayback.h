#pragma once
#include <Arduino.h>

// Receives PCM chunks over WebSocket and plays them via the MAX98357A I2S
// amp. Buffers 3 chunks before starting playback to avoid choppy audio from
// network jitter, per fumii_master_prd.md §29.
class AudioPlayback {
public:
  void init();
  void onChunkReceived(const uint8_t* data, size_t len);
  void reset(); // call when tts_end MQTT message arrives

private:
  static const int PREBUFFER_CHUNKS = 3;
  int bufferedChunks = 0;
  bool playing = false;
};

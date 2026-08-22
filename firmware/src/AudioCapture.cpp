#include "AudioCapture.h"
#include "config.h"
#include <driver/i2s.h>

void AudioCapture::init() {
  i2s_config_t i2sConfig = {
    .mode = (i2s_mode_t)(I2S_MODE_MASTER | I2S_MODE_RX),
    .sample_rate = 16000,
    .bits_per_sample = I2S_BITS_PER_SAMPLE_16BIT,
    .channel_format = I2S_CHANNEL_FMT_ONLY_LEFT,
    .communication_format = I2S_COMM_FORMAT_STAND_I2S,
    .intr_alloc_flags = ESP_INTR_FLAG_LEVEL1,
    .dma_buf_count = 4,
    .dma_buf_len = 256,
    .use_apll = false
  };
  i2s_pin_config_t pinConfig = {
    .bck_io_num = PIN_MIC_SCK,
    .ws_io_num = PIN_MIC_WS,
    .data_out_num = I2S_PIN_NO_CHANGE,
    .data_in_num = PIN_MIC_SD
  };
  i2s_driver_install(I2S_NUM_0, &i2sConfig, 0, nullptr);
  i2s_set_pin(I2S_NUM_0, &pinConfig);
}

void AudioCapture::startStreaming(WebSocketsClient* ws) {
  wsClient = ws;
  streaming = true;
}

void AudioCapture::stopStreaming() {
  streaming = false;
  wsClient = nullptr;
}

void AudioCapture::tick() {
  if (!streaming || !wsClient) return;

  size_t bytesRead = 0;
  i2s_read(I2S_NUM_0, buffer, CHUNK_BYTES, &bytesRead, 0);
  if (bytesRead > 0) {
    wsClient->sendBIN(buffer, bytesRead);
  }
}

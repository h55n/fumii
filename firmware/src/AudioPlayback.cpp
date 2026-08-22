#include "AudioPlayback.h"
#include "config.h"
#include <driver/i2s.h>

// Small ring buffer to smooth network jitter before playback starts.
static uint8_t prebuffer[3][512];

void AudioPlayback::init() {
  i2s_config_t i2sConfig = {
    .mode = (i2s_mode_t)(I2S_MODE_MASTER | I2S_MODE_TX),
    .sample_rate = 16000,
    .bits_per_sample = I2S_BITS_PER_SAMPLE_16BIT,
    .channel_format = I2S_CHANNEL_FMT_ONLY_LEFT,
    .communication_format = I2S_COMM_FORMAT_STAND_I2S,
    .intr_alloc_flags = ESP_INTR_FLAG_LEVEL1,
    .dma_buf_count = 6,
    .dma_buf_len = 256,
    .use_apll = false
  };
  i2s_pin_config_t pinConfig = {
    .bck_io_num = PIN_SPK_BCLK,
    .ws_io_num = PIN_SPK_LRC,
    .data_out_num = PIN_SPK_DIN,
    .data_in_num = I2S_PIN_NO_CHANGE
  };
  i2s_driver_install(I2S_NUM_1, &i2sConfig, 0, nullptr);
  i2s_set_pin(I2S_NUM_1, &pinConfig);
}

void AudioPlayback::onChunkReceived(const uint8_t* data, size_t len) {
  if (!playing && bufferedChunks < PREBUFFER_CHUNKS) {
    memcpy(prebuffer[bufferedChunks], data, min(len, sizeof(prebuffer[0])));
    bufferedChunks++;
    if (bufferedChunks == PREBUFFER_CHUNKS) {
      playing = true;
      size_t written = 0;
      for (int i = 0; i < PREBUFFER_CHUNKS; i++) {
        i2s_write(I2S_NUM_1, prebuffer[i], sizeof(prebuffer[i]), &written, portMAX_DELAY);
      }
    }
    return;
  }

  size_t written = 0;
  i2s_write(I2S_NUM_1, data, len, &written, portMAX_DELAY);
}

void AudioPlayback::reset() {
  playing = false;
  bufferedChunks = 0;
}

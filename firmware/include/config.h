#pragma once
#include <Arduino.h>

// ─── GPIO MAP — see fumii_master_prd.md §26 for the full wiring diagram ───

// SPI — ST7789 TFT 240x240
#define PIN_TFT_MOSI 11
#define PIN_TFT_SCK  12
#define PIN_TFT_CS   10
#define PIN_TFT_DC   9
#define PIN_TFT_RST  46
#define PIN_TFT_BLK  3

// Battery ADC — TP4056 VBAT sense via 1:1 voltage divider into GPIO 34.
// ADC1_CH6 on ESP32-S3. Reference: 3.3V. Full: ~4.2V (reads ~2.1V after divider).
// Calibrate VBAT_FULL_ADC and VBAT_EMPTY_ADC for your specific resistor pair.
#define PIN_BATTERY_ADC 34
#define VBAT_FULL_ADC   2450   // ~4.2V / 2 in ADC counts (12-bit, 0–4095)
#define VBAT_EMPTY_ADC  1600   // ~2.75V / 2 — safe cutoff for LiPo

// I2S — INMP441 microphone (input)
#define PIN_MIC_WS   4
#define PIN_MIC_SCK  5
#define PIN_MIC_SD   6

// I2S — MAX98357A amplifier (output)
#define PIN_SPK_BCLK 7
#define PIN_SPK_LRC  8
#define PIN_SPK_DIN  17

// I2C — DRV2605L haptic driver
#define PIN_I2C_SDA  18
#define PIN_I2C_SCL  19

// EC11 rotary encoder — mode switch
#define PIN_ENC_CLK  20
#define PIN_ENC_DT   21
#define PIN_ENC_SW   22

// WS2812B LED ring
#define PIN_LED_RING 48
#define LED_COUNT    8

// ─── Network — filled in by WiFiProvisioning, persisted to NVS ───
// Do NOT hardcode real credentials here — this file ships in the repo.
struct DeviceConfig {
  char wifiSsid[32] = "";
  char wifiPassword[64] = "";
  char desktopHost[64] = "fumii-desktop.local";
  uint16_t mqttPort = 1883;
  uint16_t wsPort = 8765;
  char mode[16] = "companion"; // "companion" | "assistant"
};

extern DeviceConfig deviceConfig;

// Timing
#define HEARTBEAT_INTERVAL_MS 3000
#define HEARTBEAT_TIMEOUT_MS  5000

// ─── Wake-word detection (Phase 2 opt-in) ────────────────────────────────
// Uncomment to enable Porcupine wake-word detection.
// Requires: picovoice/arduino-voice-processor + an access key from
// console.picovoice.ai, plus the .ppn model file built for ESP32.
// See: https://picovoice.ai/platform/porcupine/
//
// #define WAKE_WORD_ENABLED
//
// When enabled, define:
// #define PORCUPINE_ACCESS_KEY "your-key-here"
// and provide the .ppn keyword model as a header array.

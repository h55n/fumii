# fumii — Physical Companion Hardware Specification & Pinout Guide

**Device:** fumii Desktop Robot (Physical Companion)  
**Microcontroller:** ESP32-S3-WROOM-1 (Dual-Core Xtensa LX7 @ 240MHz, 8MB PSRAM, 16MB Flash)  
**Connectivity:** 802.11 b/g/n Wi-Fi, Bluetooth 5.0 (BLE)  
**Firmware Framework:** PlatformIO (Arduino-ESP32 / FreeRTOS)  

---

## 1. Subsystem Pinout Mapping

| Component | Function | ESP32-S3 GPIO | Protocol / Interface | Notes |
|-----------|----------|---------------|----------------------|-------|
| **ST7789V 1.54" TFT** | SPI MOSI (SDA) | `GPIO 11` | Hardware SPI (DMA) | 240×240 IPS Color Display |
| | SPI SCLK (SCL) | `GPIO 12` | Hardware SPI (DMA) | 40MHz SPI Clock |
| | Display CS | `GPIO 10` | Chip Select | Active Low |
| | Display DC | `GPIO 9` | Data / Command | |
| | Display RST | `GPIO 14` | Reset | Hardware pulse on boot |
| | Display BL (Backlight)| `GPIO 13` | PWM Backlight Control| 1kHz frequency |
| **INMP441 Digital Mic** | I2S SCK (BCLK) | `GPIO 4` | I2S Digital Audio | Bit Clock |
| | I2S WS (LRCLK) | `GPIO 5` | I2S Word Select | Left Channel (16kHz 16-bit) |
| | I2S SD (DIN) | `GPIO 6` | I2S Serial Data In | Audio input to ESP32 |
| **MAX98357A DAC Amp** | I2S BCLK | `GPIO 15` | I2S Digital Audio | Shared Bit Clock |
| | I2S LRC (WS) | `GPIO 16` | I2S Word Select | Word Select |
| | I2S DIN (DOUT) | `GPIO 17` | I2S Serial Data Out | 3.2W Class-D Amp output |
| **EC11 Rotary Collar** | Encoder Pin A | `GPIO 1` | GPIO Interrupt | Mode switch (Companion) |
| | Encoder Pin B | `GPIO 2` | GPIO Interrupt | Mode switch (Assistant) |
| | Switch Button | `GPIO 3` | GPIO Input (Pull-up) | Push to wake / toggle |
| **WS2812B LED Ring** | LED Data In | `GPIO 48` | RMT / FastLED | 8-pixel RGB Mood Ring |
| **DRV2605L Haptics** | I2C SDA | `GPIO 8` | I2C (400kHz) | Haptic driver communication |
| | I2C SCL | `GPIO 7` | I2C (400kHz) | Shared I2C Bus |

---

## 2. Power Architecture & Battery Management

- **Power Input:** USB Type-C (5V @ 1.5A via TP4056 charging IC).
- **Battery:** 3.7V 1200mAh Single-Cell Lithium Polymer (LiPo).
- **Voltage Regulation:** Ultra-low dropout 3.3V 800mA LDO (AP2112K-3.3) powering ESP32-S3 and peripherals.
- **Battery Fuel Gauge:** 100kΩ / 100kΩ voltage divider connected to `GPIO 18` (ADC1_CH7) for real-time percentage monitoring.
- **Expected Battery Life:** 8–10 hours active companion mode on a single charge.

---

## 3. Firmware Architecture

1. **`DisplayManager.cpp`**: Double-buffered DMA rendering for 10 animated facial expressions (`idle`, `listening`, `thinking`, `speaking`, `happy`, `concerned`, `excited`, `sleepy`, `waving`, `provisioning`).
2. **`AudioCapture.cpp`**: Streams raw 16kHz PCM audio buffers to desktop over WebSocket (`ws://<desktop-ip>:8765/stream`).
3. **`AudioPlayback.cpp`**: Receives TTS audio chunks from desktop over WebSocket and plays them smoothly through I2S DMA FIFO.
4. **`MQTTHandler.cpp`**: Maintains lightweight telemetry & state synchronization with desktop Aedes MQTT broker (`:1883`), including battery telemetry, WiFi RSSI, and Last Will & Testament (LWT) for offline detection.
5. **`WiFiProvisioning.cpp`**: SoftAP captive portal (`fumii-setup-XXXX`) providing zero-code WiFi configuration from any smartphone.

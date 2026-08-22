# fumii firmware

ESP32-S3 firmware for the fumii physical companion device. Targets the exact
hardware spec in `fumii_master_prd.md §11` and `§26–29`.

---

## Requirements

| Tool | Version |
|---|---|
| PlatformIO Core | ≥ 6.1 |
| Python | ≥ 3.9 (for PlatformIO) |
| ESP-IDF toolchain | bundled with PlatformIO `espressif32` |

Install PlatformIO: https://platformio.org/install/cli

---

## Hardware

| Component | Part |
|---|---|
| MCU | ESP32-S3-DevKitC-1 |
| Display | ST7789 240×240 TFT (SPI) |
| Microphone | INMP441 (I2S) |
| Speaker | MAX98357A (I2S) |
| Haptic | DRV2605L (I2C) |
| LEDs | WS2812B ring × 8 |
| Encoder | EC11 rotary (mode switch) |

**GPIO assignments** are in [`include/config.h`](include/config.h). Do not
change them unless your PCB differs from the PRD schematic.

---

## First Build

```bash
# From this directory:
pio run

# Flash:
pio run --target upload

# Monitor serial output:
pio device monitor
```

---

## WiFi Provisioning

On first boot the device starts a SoftAP named **`fumii-setup`** (password
`fumii1234`). Connect your phone or laptop to that network, then open:

```
http://192.168.4.1
```

Enter your home WiFi SSID and password. fumii saves them to NVS and
reconnects. The portal closes automatically — you'll never see it again
unless you erase NVS.

To re-provision (e.g. after a WiFi change):

```bash
# Erase NVS partition only:
pio run --target erase
# then flash again:
pio run --target upload
```

---

## Battery ADC

The firmware reads battery voltage from **GPIO 34** via a resistor divider
(1:1 recommended). Calibrate `VBAT_FULL_ADC` and `VBAT_EMPTY_ADC` in
`include/config.h` for your specific resistors and LiPo cell.

---

## Wake Word (opt-in)

Wake-word detection is not shipped by default — the model file must be
obtained separately. To enable:

1. Sign up at [console.picovoice.ai](https://console.picovoice.ai) and get
   an access key.
2. Build a `hey fumii` keyword model for ESP32 (`.ppn` file).
3. Convert to a C header array.
4. Uncomment `#define WAKE_WORD_ENABLED` in `include/config.h` and fill in
   `PORCUPINE_ACCESS_KEY`.
5. Add `picovoice/arduino-voice-processor` to `lib_deps` in
   `platformio.ini`.

When wake word fires, the firmware calls `mqtt.publishWake()` and switches
the display to `FaceState::LISTENING`. The rest of the STT pipeline runs on
the desktop (WhisperService.ts via the audio WebSocket).

---

## MQTT Topics

The device connects to the desktop app's Aedes broker on **port 1883** via
mDNS (`fumii-desktop.local`).

| Direction | Topic | Payload |
|---|---|---|
| device → desktop | `fumii/device/status` | `"online"` / `"offline"` |
| device → desktop | `fumii/device/heartbeat` | `millis()` |
| device → desktop | `fumii/device/battery` | `"85"` (%) |
| device → desktop | `fumii/device/mode` | `"companion"` / `"assistant"` |
| device → desktop | `fumii/device/wake` | `millis()` |
| desktop → device | `fumii/desktop/face` | `"idle"` / `"thinking"` / … |
| desktop → device | `fumii/desktop/leds` | `{"color":"#F5A623","pattern":"pulse"}` |
| desktop → device | `fumii/desktop/haptic` | `{"pattern":1}` |
| desktop → device | `fumii/desktop/tts/start` | — (audio follows on WS) |
| desktop → device | `fumii/desktop/tts/end` | — |

---

## Audio WebSocket

The desktop streams TTS audio to the device via a WebSocket server on
**port 8765** at `/audio/input`. Format: raw PCM16, mono, 16 kHz.
Audio capture from the device uploads to `/audio/input` on the same server.

---

## Libraries

All dependencies are declared in `platformio.ini` and installed automatically
by `pio run`. No manual library installation required.

| Library | Purpose |
|---|---|
| bodmer/TFT_eSPI | ST7789 display driver |
| knolleary/PubSubClient | MQTT client |
| madhephaestus/ESP32Encoder | EC11 rotary encoder |
| adafruit/Adafruit DRV2605 | Haptic driver |
| fastled/FastLED | WS2812B LED ring |
| bblanchon/ArduinoJson | JSON parsing |
| links2004/WebSockets | WebSocket audio client |

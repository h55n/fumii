# firmware-quadbot

ESP8266 firmware for the **ACEBOTT QD020** 8-servo quadruped robot.
Serves a web control panel over a Wi-Fi Access Point so any phone or laptop can
drive the robot without installing an app.

This is **separate hardware** from the ESP32-S3 fumii companion device in
[`../firmware/`](../firmware/).

---

## Hardware

| Component | Detail |
|---|---|
| MCU | ESP8266 (e.g. Wemos D1 Mini, NodeMCU) |
| Servos | 8× standard PWM servos |
| Power | External 5 V supply for servos; USB or 3.3 V for ESP8266 |

### GPIO → Servo map

| GPIO | Servo position |
|---|---|
| 14 | Upper right paw |
| 12 | Upper right arm |
| 13 | Lower right arm |
| 15 | Lower right paw |
| 16 | Upper left paw |
| 5  | Upper left arm |
| 4  | Lower left arm |
| 2  | Lower left paw |

> Pin assignments match the original ACEBOTT QD020 factory firmware (`text.h`).
> Do not change them unless your wiring differs.

---

## File Map

| File | Purpose |
|---|---|
| `8_4web_control_fast.ino` | Wi-Fi AP + HTTP routing (main sketch) |
| `text.h` | All 15 gait tables + servo helpers (`Servo_PROGRAM_Run`, `Set_PWM_to_Servo`, etc.) |
| `motion_fast.h` | `runGaitFast()` — same interpolation as `text.h`, scaled by `GAIT_SPEED_PERCENT` |
| `ui.h` | Embedded HTML/CSS/JS control panel (PROGMEM) |
| `platformio.ini` | PlatformIO build config (`espressif8266 / d1_mini`) |

---

## Build & Flash

### PlatformIO (recommended — matches the rest of the fumii repo)

```bash
# From this directory:
pio run

# Flash to connected board:
pio run --target upload

# Monitor serial output:
pio device monitor
```

### Arduino IDE (alternative)

1. Install **ESP8266 board support** via Boards Manager:
   `http://arduino.esp8266.com/stable/package_esp8266com_index.json`
2. Open `8_4web_control_fast.ino` — the IDE will pick up the three `.h` files
   automatically (they must be in the same folder).
3. Select your board (e.g. *LOLIN(WEMOS) D1 Mini*) and COM port, then Upload.

> **Board target:** The `platformio.ini` defaults to `d1_mini`. If you are using
> a NodeMCU, change `board = nodemcuv2`. For a bare ESP-12F module, use
> `board = esp12e`.

---

## Wi-Fi Access Point

The firmware creates its own AP — no router required.

| Setting | Value |
|---|---|
| SSID | `QuadBot-E` |
| Password | `12345678` |
| IP address | `192.168.4.1` |
| HTTP port | `80` |

Connect your phone or laptop to **QuadBot-E**, then open
**`http://192.168.4.1`** in any browser to see the control panel.

---

## Web UI Routes

| Method | Path | Action |
|---|---|---|
| `GET` | `/` | Returns the HTML control panel |
| `GET` | `/cmd?action=<name>` | Runs a motion (see table below) |

### Available actions

| `action` | Motion |
|---|---|
| `standby` | Return to standby pose |
| `forward` | Walk forward |
| `back` | Walk backward |
| `left` | Turn left |
| `right` | Turn right |
| `shiftleft` | Strafe left |
| `shiftright` | Strafe right |
| `hello` | Wave hello |
| `pushup` | Push-up sequence |
| `fight` | Fight stance |
| `lie` | Lie down |
| `sleep` | Sleep pose (stays down until `wake`) |
| `wake` | Wake up + return to standby |
| `dance1` | Dance sequence 1 |
| `dance2` | Dance sequence 2 |
| `dance3` | Dance sequence 3 |

---

## Tuning Playback Speed

Edit `GAIT_SPEED_PERCENT` in `motion_fast.h`:

```cpp
const int GAIT_SPEED_PERCENT = 60;  // 100 = original ACEBOTT timing; lower = faster
```

| Value | Feel |
|---|---|
| 100 | Original factory timing (smooth but sluggish) |
| 70 | Noticeably quicker, still gentle |
| **60** | **Default — snappy, feels alive** |
| 50 | Very snappy |
| < 35 | Collapses toward a single jump (no room left to interpolate) |

The gait tables themselves (`text.h`) are **not changed** — only the clock speed
at which they play back.

---

## Relationship to fumii

This sketch has no dependencies on the rest of the fumii codebase. It is a
self-contained Arduino project that shares the same git repository for
convenience. The ESP32-S3 fumii companion device firmware lives in
[`../firmware/`](../firmware/) and uses a completely different set of libraries
(MQTT, WebSocket, TFT, I2S audio, haptics).

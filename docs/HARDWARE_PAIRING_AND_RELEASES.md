# Fumii — Hardware Pairing & Cross-Platform Releases Guide

This guide details how to build, install, and run **Fumii Desktop** on **Windows** and **Linux**, and how to pair your physical hardware devices (**Fumii ESP32-S3 Companion** and **ACEBOTT QD020 ESP8266 QuadBot**) over Wi-Fi with zero friction.

---

## 1. App Downloads & Packaging

Fumii is built with Electron and Vite. Pre-built installers and packages are generated via `electron-builder`.

### Windows (.exe / NSIS Installer)
- **Installer Artifact:** `release/fumii-2.0.0-windows-setup.exe`
- **Portable Unpacked Directory:** `release/win-unpacked/fumii.exe`
- **Build Command:**
  ```bash
  npm run build:win
  ```
- **Installation:** Run the setup `.exe`. On first run, Windows Firewall will prompt to allow local network communication — click **"Allow access"** on Private networks so the app can communicate with devices on your Wi-Fi.

### Linux (.AppImage & .deb)
- **AppImage Artifact:** `release/fumii-2.0.0-linux-x64.AppImage`
- **Debian/Ubuntu Package:** `release/fumii-2.0.0-linux-amd64.deb`
- **Build Command:**
  ```bash
  npm run build:linux
  ```
- **Installation & Execution:**
  - **AppImage:**
    ```bash
    chmod +x fumii-2.0.0-linux-x64.AppImage
    ./fumii-2.0.0-linux-x64.AppImage --no-sandbox
    ```
  - **Debian/Ubuntu:**
    ```bash
    sudo dpkg -i fumii-2.0.0-linux-amd64.deb
    fumii
    ```

---

## 2. Local Network & Firewall Requirements

For the physical companion devices to communicate with your computer over Wi-Fi, ensure your firewall permits traffic on the following local ports:

| Port | Protocol | Purpose | Direction |
|---|---|---|---|
| **1883** | TCP | Local MQTT Broker (Aedes) — telemetry, pairing tokens, commands | Device ⇄ Desktop |
| **8765** | TCP | Audio WebSocket — bidirectional PCM16 audio streaming (Whisper STT / TTS) | Device ⇄ Desktop |
| **8766** | UDP | Zero-Friction Discovery Beacon — auto-resolves desktop IP on LAN | Desktop → Device |

### Linux Firewall Configuration (UFW)
If `ufw` or `iptables` is active on Linux:
```bash
sudo ufw allow 1883/tcp comment "fumii MQTT"
sudo ufw allow 8765/tcp comment "fumii Audio WS"
sudo ufw allow 8766/udp comment "fumii Discovery"
sudo ufw reload
```

---

## 3. Pairing the Fumii Companion Device (ESP32-S3)

The Fumii Companion Device features animated facial expressions on a 240×240 TFT screen, INMP441 microphone, MAX98357A speaker, DRV2605L haptics, and a WS2812B LED ring.

### Step 1 — Flash the Firmware (One-time)
```bash
cd firmware
pio run --target upload
```

### Step 2 — First-Time Wi-Fi Provisioning
1. Power on the device. On first boot, the screen displays the provisioning face, and the ESP32 starts an open SoftAP named **`fumii-setup-XXXX`** (where `XXXX` are the last 4 characters of the MAC address).
2. Connect your phone or computer to the **`fumii-setup-XXXX`** Wi-Fi network.
3. Open your browser and navigate to:
   ```
   http://192.168.4.1
   ```
4. Select your home 2.4 GHz Wi-Fi network, enter the password, and click **"Connect Fumii"**.
5. Fumii stores your credentials to non-volatile storage (NVS), closes the portal, and connects to your home network.

### Step 3 — Automatic Zero-Friction Pairing
1. Once connected to Wi-Fi, Fumii immediately queries the desktop via **UDP beacon on port 8766** and resolves your computer's local IP address (`192.168.x.x`).
2. Open the Fumii Desktop App and navigate to the **Device & Companion** dashboard page.
3. You will see **"Fumii Device Found Nearby — Ready to Pair"**.
4. Click **"Pair with Fumii →"**. The app securely exchanges authentication tokens with the device.
5. The device screen turns happy, the LED ring pulses, and telemetry (Battery, Wi-Fi Signal, IP, Mic, Speaker) goes live!

---

## 4. Driving the ACEBOTT QD020 QuadBot (ESP8266)

The ACEBOTT QD020 is an 8-servo quadruped robot powered by an ESP8266 with v3 fast/snappy motion curves.

### Step 1 — Flash the QuadBot
```bash
cd firmware-quadbot
pio run --target upload
```
*(Or open `8_4web_control_fast.ino` directly in the Arduino IDE with ESP8266 board support and upload).*

### Step 2 — Connect & Drive
1. The robot broadcasts its own standalone Wi-Fi Access Point:
   - **SSID:** `QuadBot-E`
   - **Password:** `12345678`
2. Connect your laptop, phone, or tablet to the **`QuadBot-E`** Wi-Fi network.
3. Open your web browser and navigate to:
   ```
   http://192.168.4.1
   ```
4. You will see the touch-optimized web control panel with:
   - **Directional D-Pad:** Forward, Backward, Turn Left/Right, Shift Left/Right, Standby.
   - **Tricks:** Wave Hello, Push-ups, Fight Stance, Lie Down.
   - **Dances:** Dance 1, Dance 2, Dance 3.
   - **Sleep & Wake:** Low-power sleep mode and instant wake.

---

## 5. Troubleshooting & Diagnostics

- **Device not found on desktop:**
  - Check the **Device** page in the Fumii desktop app. It displays your computer's current LAN IP address (e.g., `192.168.1.105`) and the status of the UDP beacon.
  - Click **"Copy Host LAN IP"** to copy it.
  - Make sure your computer and the device are connected to the same 2.4 GHz Wi-Fi router (guest networks with AP client isolation may block peer-to-peer traffic).
- **Manual IP Override:**
  - During the captive portal setup on `http://192.168.4.1`, you can optionally type your computer's LAN IP directly into the **"Desktop IP / Host"** field.
- **Factory Reset:**
  - Hold the physical mode encoder button on the Fumii device for **10 seconds** to erase Wi-Fi and pairing credentials and reboot into setup mode.

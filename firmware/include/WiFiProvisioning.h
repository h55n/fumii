#pragma once
#include <Arduino.h>

/**
 * WiFiProvisioning
 * ────────────────
 * Manages device WiFi setup and credential persistence via NVS (Preferences).
 *
 * First boot flow (PRD §12):
 *   1. hasStoredCredentials() returns false.
 *   2. startProvisioningPortal() starts a SoftAP named "fumii-setup" and
 *      serves a captive portal HTML form at http://192.168.4.1/.
 *   3. User connects their phone to "fumii-setup", opens the portal, enters
 *      their WiFi SSID + password, and submits.
 *   4. Credentials are saved to NVS. Portal closes. connect() is called.
 *
 * Subsequent boots: hasStoredCredentials() returns true, go directly to
 * connect() — no portal needed.
 *
 * Implementation: ESP32 built-in WebServer library (no external deps needed).
 */
class WiFiProvisioning {
public:
  /** Returns true if SSID is stored in NVS "fumii" namespace. */
  bool hasStoredCredentials();

  /** Returns the SoftAP SSID formatted as fumii-setup-XXXX based on MAC address. */
  String getApSsid();

  /** Clears stored WiFi credentials from NVS. */
  void clearCredentials();

  /**
   * Starts SoftAP "fumii-setup-XXXX" and blocks until:
   *   (a) the user submits the captive-portal form, or
   *   (b) the 5-minute timeout expires.
   * Returns true if credentials were saved, false if timed out.
   * Always tears down the SoftAP before returning — call connect() immediately after.
   */
  bool startProvisioningPortal();

  /**
   * Reads SSID/password from NVS and attempts to join the network.
   * Returns true if WiFi.status() == WL_CONNECTED within 15 seconds.
   */
  bool connect();
};

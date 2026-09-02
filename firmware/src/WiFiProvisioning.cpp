#include "WiFiProvisioning.h"
#include "config.h"
#include <WiFi.h>
#include <WebServer.h>
#include <Preferences.h>

static Preferences prefs;
static WebServer server(80);

// ─── Captive-portal HTML ────────────────────────────────────────────────────
// Served at http://192.168.4.1/ while the SoftAP is active.
// Includes styled Wi-Fi selection dropdown and password field.
static String generatePortalHtml(const std::vector<String>& networks) {
  String html = F(
    "<!DOCTYPE html><html lang=\"en\"><head><meta charset=\"UTF-8\">"
    "<meta name=\"viewport\" content=\"width=device-width,initial-scale=1.0\">"
    "<title>fumii setup</title><style>"
    "*{box-sizing:border-box;margin:0;padding:0}"
    "body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#0b0f19;color:#f8fafc;"
    "display:flex;align-items:center;justify-content:center;min-height:100vh;padding:16px}"
    ".card{background:#131b2e;border:1px solid rgba(255,255,255,0.08);border-radius:20px;padding:32px 24px;width:100%;max-width:380px;box-shadow:0 10px 40px rgba(0,0,0,0.5)}"
    "h1{font-size:24px;font-weight:800;color:#3b82f6;margin-bottom:6px;letter-spacing:-0.02em}"
    "p{font-size:13px;color:#94a3b8;margin-bottom:24px;line-height:1.5}"
    "label{display:block;font-size:11px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:#94a3b8;margin-bottom:6px}"
    "select,input{width:100%;background:#1e293b;border:1px solid rgba(255,255,255,0.12);border-radius:10px;padding:12px 14px;color:#f8fafc;font-size:14px;outline:none;margin-bottom:18px}"
    "select:focus,input:focus{border-color:#3b82f6}"
    "button{width:100%;background:#2563eb;color:#ffffff;font-weight:700;font-size:14px;border:none;border-radius:10px;padding:14px;cursor:pointer;transition:background 0.2s}"
    "button:hover{background:#1d4ed8}"
    ".footer{margin-top:20px;font-size:11px;color:#64748b;text-align:center}"
    "</style></head><body><div class=\"card\">"
    "<h1>fumii setup</h1>"
    "<p>Select your home Wi-Fi network and enter password. Fumii will connect automatically.</p>"
    "<form method=\"POST\" action=\"/setup\">"
    "<label>Select Wi-Fi Network</label>"
    "<select name=\"ssid\" id=\"ssid-select\" onchange=\"checkCustom(this)\">"
  );

  for (const auto& net : networks) {
    html += "<option value=\"" + net + "\">" + net + "</option>";
  }
  html += F("<option value=\"__custom__\">+ Enter other network name...</option></select>");
  html += F(
    "<div id=\"custom-ssid-box\" style=\"display:none;\">"
    "<label>Custom Network Name (SSID)</label>"
    "<input type=\"text\" name=\"custom_ssid\" placeholder=\"Network name\">"
    "</div>"
    "<label>Wi-Fi Password</label>"
    "<input type=\"password\" name=\"password\" placeholder=\"Wi-Fi password\" maxlength=\"63\">"
    "<label>Desktop IP / Host (Optional — Auto Discovered)</label>"
    "<input type=\"text\" name=\"desktop_host\" placeholder=\"e.g. 192.168.1.105 or fumii-desktop.local\">"
    "<button type=\"submit\">Connect Fumii</button>"
    "</form>"
    "<div class=\"footer\">fumii &bull; you're never really alone</div>"
    "</div>"
    "<script>"
    "function checkCustom(select){"
    "  document.getElementById('custom-ssid-box').style.display = (select.value === '__custom__') ? 'block' : 'none';"
    "}"
    "</script></body></html>"
  );
  return html;
}

static const char SUCCESS_HTML[] PROGMEM = R"rawhtml(
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>fumii — connected</title>
  <style>
    body{ font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif; background:#0b0f19; color:#f8fafc;
          display:flex; align-items:center; justify-content:center; min-height:100vh; padding:16px; }
    .card{ background:#131b2e; border:1px solid rgba(34,197,94,0.3); border-radius:20px;
           padding:36px 24px; width:100%; max-width:360px; text-align:center; box-shadow:0 10px 40px rgba(0,0,0,0.5); }
    h1{ color:#22c55e; font-size:22px; font-weight:800; margin-bottom:8px; }
    p{ font-size:13px; color:#94a3b8; line-height:1.6; }
  </style>
</head>
<body>
  <div class="card">
    <h1>&#10003; Wi-Fi Saved</h1>
    <p>Fumii is connecting to your network now. You can return to the desktop app to pair!</p>
  </div>
</body>
</html>
)rawhtml";
// ────────────────────────────────────────────────────────────────────────────

String WiFiProvisioning::getApSsid() {
  String mac = WiFi.macAddress();
  mac.replace(":", "");
  String last4 = mac.length() >= 4 ? mac.substring(mac.length() - 4) : "0000";
  last4.toUpperCase();
  return "fumii-setup-" + last4;
}

bool WiFiProvisioning::hasStoredCredentials() {
  prefs.begin("fumii", true);
  bool has = prefs.isKey("ssid") && prefs.getString("ssid", "").length() > 0;
  prefs.end();
  return has;
}

void WiFiProvisioning::clearCredentials() {
  prefs.begin("fumii", false);
  prefs.remove("ssid");
  prefs.remove("password");
  prefs.end();
  Serial.println("[fumii] WiFi credentials cleared from NVS");
}

bool WiFiProvisioning::startProvisioningPortal() {
  String apName = getApSsid();
  Serial.printf("[fumii] starting SoftAP provisioning portal: %s\n", apName.c_str());

  WiFi.mode(WIFI_AP_STA);
  WiFi.softAP(apName.c_str(), nullptr); // Open network — zero friction, no password required

  // Scan local networks to populate the dropdown
  int numNetworks = WiFi.scanNetworks();
  std::vector<String> networks;
  for (int i = 0; i < numNetworks; i++) {
    String name = WiFi.SSID(i);
    if (!name.isEmpty()) {
      bool exists = false;
      for (const auto& existing : networks) {
        if (existing == name) { exists = true; break; }
      }
      if (!exists) networks.push_back(name);
    }
  }

  IPAddress apIP = WiFi.softAPIP();
  Serial.printf("[fumii] SoftAP IP: %s\n", apIP.toString().c_str());

  // Portal form page
  server.on("/", HTTP_GET, [networks]() {
    server.send(200, "text/html", generatePortalHtml(networks));
  });

  // Captive Portal probes redirect to /
  auto handleCaptiveRedirect = []() {
    server.sendHeader("Location", "http://192.168.4.1/", true);
    server.send(302, "text/plain", "");
  };

  server.on("/generate_204", HTTP_GET, handleCaptiveRedirect); // Android
  server.on("/hotspot-detect.html", HTTP_GET, handleCaptiveRedirect); // iOS / macOS
  server.on("/canonical.html", HTTP_GET, handleCaptiveRedirect);
  server.on("/connecttest.txt", HTTP_GET, handleCaptiveRedirect); // Windows
  server.on("/ncsi.txt", HTTP_GET, handleCaptiveRedirect); // Windows
  server.on("/redirect", HTTP_GET, handleCaptiveRedirect);

  // Handle form submission
  server.on("/setup", HTTP_POST, []() {
    String ssid = server.arg("ssid");
    if (ssid == "__custom__") {
      ssid = server.arg("custom_ssid");
    }
    String password = server.arg("password");
    String desktopHost = server.arg("desktop_host");

    if (ssid.isEmpty()) {
      server.send(400, "text/plain", "SSID is required");
      return;
    }

    // Persist to NVS
    prefs.begin("fumii", false);
    prefs.putString("ssid", ssid);
    prefs.putString("password", password);
    if (!desktopHost.isEmpty()) {
      prefs.putString("desktop_host", desktopHost);
    }
    prefs.end();

    Serial.printf("[fumii] credentials saved: SSID=%s\n", ssid.c_str());
    server.send_P(200, "text/html", SUCCESS_HTML);
  });

  // Catch-all 302 redirect for captive portal detection
  server.onNotFound(handleCaptiveRedirect);

  server.begin();
  Serial.println("[fumii] portal server listening on http://192.168.4.1");

  // Block until credentials arrive or timeout (5 mins)
  unsigned long start = millis();
  const unsigned long TIMEOUT_MS = 5 * 60 * 1000UL;
  while (!hasStoredCredentials() && millis() - start < TIMEOUT_MS) {
    server.handleClient();
    delay(5);
  }

  // Always tear down the SoftAP — whether we got credentials or timed out.
  // If we don't do this, the device stays in WIFI_AP_STA mode which can
  // interfere with STA-only association in connect().
  server.stop();
  delay(300); // short settle before disconnect
  WiFi.softAPdisconnect(true);
  WiFi.mode(WIFI_STA);

  if (!hasStoredCredentials()) {
    Serial.println("[fumii] provisioning timeout — no credentials entered");
    return false;
  }

  return true;
}

bool WiFiProvisioning::connect() {
  prefs.begin("fumii", true);
  String ssid = prefs.getString("ssid", "");
  String pass = prefs.getString("password", "");
  String savedHost = prefs.getString("desktop_host", "");
  prefs.end();

  if (ssid.isEmpty()) return false;

  if (!savedHost.isEmpty()) {
    strncpy(deviceConfig.desktopHost, savedHost.c_str(), sizeof(deviceConfig.desktopHost) - 1);
    Serial.printf("[fumii] loaded stored desktop host: %s\n", deviceConfig.desktopHost);
  }

  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid.c_str(), pass.c_str());

  unsigned long start = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - start < 15000UL) {
    delay(250);
  }
  return WiFi.status() == WL_CONNECTED;
}

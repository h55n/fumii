/*
 * ACEBOTT QD020 - Web UI Control (v3 - fast/snappy motion)
 * ----------------------------------------------------------
 * File map:
 *   text.h        - UNCHANGED. Original servo setup, zero position,
 *                   standby position, and all 15 gait tables
 *                   (Servo_Prg_1..15). Still fully intact and
 *                   available; just no longer the execution path
 *                   used by the buttons (see motion_fast.h for why).
 *   motion_fast.h - NEW. Reuses the exact same gait tables from
 *                   text.h but executes each row the way the
 *                   original per-motion reference files do (direct
 *                   write + hold) instead of text.h's gradual-ramp
 *                   interpolation - this is what makes movement feel
 *                   instant/alive instead of sluggish. No new servo
 *                   angles or timings were introduced.
 *   ui.h          - Web page only (HTML/CSS/JS). Unchanged from v2.
 *   this file     - Wi-Fi + HTTP routing glue. Every route calls a
 *                   fastXxx() wrapper from motion_fast.h.
 */

#include <ESP8266WiFi.h>
#include <ESP8266WebServer.h>
#include "text.h"
#include "motion_fast.h"
#include "ui.h"

// Same Wi-Fi credentials as the original ACEBOTT firmware
const char* ssid = "QuadBot-E";
const char* password = "12345678";

// Web server on standard HTTP port 80
ESP8266WebServer server(80);

void handleRoot() {
  server.send_P(200, "text/html", PAGE_INDEX);
}

// Every branch calls a fast wrapper, which in turn plays the ORIGINAL
// gait table from text.h - just without the artificial slow-ramp.
void handleCommand() {
  String action = server.arg("action");

  if (action == "standby")         fastStandby();
  else if (action == "forward")    fastForward();
  else if (action == "back")       fastBack();
  else if (action == "left")       fastTurnLeft();
  else if (action == "right")      fastTurnRight();
  else if (action == "shiftleft")  fastShiftLeft();
  else if (action == "shiftright") fastShiftRight();
  else if (action == "hello")      fastHello();
  else if (action == "pushup")     fastPushup();
  else if (action == "fight")      fastFighting();
  else if (action == "lie")        fastLie();
  else if (action == "sleep")      fastSleep();
  else if (action == "wake")       fastWake();
  else if (action == "dance1")     fastDance1();
  else if (action == "dance2")     fastDance2();
  else if (action == "dance3")     fastDance3();
  else {
    server.send(400, "text/plain", "Unknown action");
    return;
  }

  server.send(200, "text/plain", "Done: " + action);
}

void handleNotFound() {
  server.send(404, "text/plain", "Not found");
}

// ---------------------------------------------------------------
// Setup - identical servo/AP init as the original firmware
// ---------------------------------------------------------------
void setup()
{
  Serial.setTimeout(10);
  Serial.begin(115200);

  WiFi.mode(WIFI_AP);
  WiFi.softAP(ssid, password, 5);
  delay(100);

  servo_14.attach(14, SERVOMIN, SERVOMAX);
  servo_12.attach(12, SERVOMIN, SERVOMAX);
  servo_13.attach(13, SERVOMIN, SERVOMAX);
  servo_15.attach(15, SERVOMIN, SERVOMAX);
  servo_16.attach(16, SERVOMIN, SERVOMAX);
  servo_5.attach(5, SERVOMIN, SERVOMAX);
  servo_4.attach(4, SERVOMIN, SERVOMAX);
  servo_2.attach(2, SERVOMIN, SERVOMAX);

  Servo_PROGRAM_Zero(); // exact same zero -> standby settle as original

  server.on("/", handleRoot);
  server.on("/cmd", handleCommand);
  server.onNotFound(handleNotFound);
  server.begin();

  Serial.print("AP IP address: ");
  Serial.println(WiFi.softAPIP());
  Serial.println("Web server started");
}

void loop()
{
  server.handleClient();
}

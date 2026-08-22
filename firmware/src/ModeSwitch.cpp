#include "ModeSwitch.h"
#include "config.h"
#include <Preferences.h>

static Preferences prefs;

void ModeSwitch::init(ModeChangeCallback onModeChange, ButtonHoldCallback onUnpair, ButtonHoldCallback onFactoryReset) {
  onChange = onModeChange;
  onUnpairCallback = onUnpair;
  onFactoryResetCallback = onFactoryReset;
  loadFromNVS();

  ESP32Encoder::useInternalWeakPullResistors = puType::up;
  encoder.attachHalfQuad(PIN_ENC_CLK, PIN_ENC_DT);
  encoder.setCount(0);
  pinMode(PIN_ENC_SW, INPUT_PULLUP);
}

void ModeSwitch::tick() {
  // ── Rotary Encoder ──
  int64_t pos = encoder.getCount();
  if (pos != lastPosition) {
    unsigned long now = millis();
    if (now - lastDebounceMs > 5) {
      toggle();
      lastDebounceMs = now;
    }
    lastPosition = pos;
  }

  // ── Push Button Hold Detection ──
  bool pressed = (digitalRead(PIN_ENC_SW) == LOW);
  unsigned long now = millis();

  if (pressed) {
    if (!isButtonPressed) {
      isButtonPressed = true;
      buttonPressStart = now;
      unpairFired = false;
      resetFired = false;
    } else {
      unsigned long duration = now - buttonPressStart;
      if (duration >= 10000 && !resetFired) {
        resetFired = true;
        Serial.println("[fumii-mode] 10s hold detected — Factory Reset requested");
        if (onFactoryResetCallback) onFactoryResetCallback();
      } else if (duration >= 5000 && !unpairFired && !resetFired) {
        unpairFired = true;
        Serial.println("[fumii-mode] 5s hold detected — Unpair requested");
        if (onUnpairCallback) onUnpairCallback();
      }
    }
  } else {
    isButtonPressed = false;
  }
}

void ModeSwitch::toggle() {
  bool isCompanion = strcmp(mode, "companion") == 0;
  strcpy(mode, isCompanion ? "assistant" : "companion");
  saveToNVS();
  if (onChange) onChange(mode);
}

const char* ModeSwitch::currentMode() { return mode; }

void ModeSwitch::loadFromNVS() {
  prefs.begin("fumii", true);
  String stored = prefs.getString("mode", "companion");
  strncpy(mode, stored.c_str(), sizeof(mode) - 1);
  prefs.end();
}

void ModeSwitch::saveToNVS() {
  prefs.begin("fumii", false);
  prefs.putString("mode", mode);
  prefs.end();
}

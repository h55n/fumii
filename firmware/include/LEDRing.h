#pragma once
#include <FastLED.h>
#include "config.h"

class LEDRing {
public:
  void init();
  void setColorPulse(uint32_t hexColor);
  void identify(); // flash white 3x — used by "identify device" dashboard button
  void tick();

private:
  CRGB leds[LED_COUNT];
  uint32_t currentColor = 0xF5A623;
  uint8_t pulsePhase = 0;
  unsigned long lastTick = 0;
};

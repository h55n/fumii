#include "LEDRing.h"

void LEDRing::init() {
  FastLED.addLeds<WS2812B, PIN_LED_RING, GRB>(leds, LED_COUNT);
  FastLED.setBrightness(80);
  FastLED.clear();
  FastLED.show();
}

void LEDRing::setColorPulse(uint32_t hexColor) {
  currentColor = hexColor;
}

void LEDRing::identify() {
  for (int i = 0; i < 3; i++) {
    fill_solid(leds, LED_COUNT, CRGB::White);
    FastLED.show();
    delay(150);
    FastLED.clear();
    FastLED.show();
    delay(150);
  }
}

void LEDRing::tick() {
  unsigned long now = millis();
  if (now - lastTick < 30) return;
  lastTick = now;

  pulsePhase = (pulsePhase + 2) % 255;
  uint8_t brightness = beatsin8(15, 40, 255, 0, pulsePhase);
  CRGB c = CRGB((currentColor >> 16) & 0xFF, (currentColor >> 8) & 0xFF, currentColor & 0xFF);
  c.nscale8(brightness);
  fill_solid(leds, LED_COUNT, c);
  FastLED.show();
}

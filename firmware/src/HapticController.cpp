#include "HapticController.h"
#include "config.h"
#include <Wire.h>

// Pattern IDs — see fumii_master_prd.md §28 "Haptic Pattern IDs".
// 1: mode switch confirm | 2: wake word confirm | 3: shutdown rumble | 4: error

void HapticController::init() {
  Wire.begin(PIN_I2C_SDA, PIN_I2C_SCL);
  drv.begin();
  drv.selectLibrary(1);
  drv.setMode(DRV2605_MODE_INTTRIG);
}

void HapticController::play(uint8_t patternId) {
  uint8_t effect;
  switch (patternId) {
    case 1: effect = 1;  break; // Strong Click
    case 2: effect = 10; break; // Double Click
    case 3: effect = 76; break; // Long buzz
    case 4: effect = 27; break; // Triple click
    default: effect = 1;
  }
  drv.setWaveform(0, effect);
  drv.setWaveform(1, 0);
  drv.go();
}

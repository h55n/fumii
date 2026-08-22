#pragma once
#include <Adafruit_DRV2605.h>

// DRV2605L haptic driver — pattern IDs per fumii_master_prd.md §28.
class HapticController {
public:
  void init();
  void play(uint8_t patternId);

private:
  Adafruit_DRV2605 drv;
};

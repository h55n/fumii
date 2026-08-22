#pragma once
#include <ESP32Encoder.h>

// EC11 rotary collar — physically toggles companion <-> assistant mode.
// Debounced, persisted to NVS. See fumii_master_prd.md §13, §16 Flow C.
class ModeSwitch {
public:
  using ModeChangeCallback = void (*)(const char* newMode);
  using ButtonHoldCallback = void (*)();

  void init(ModeChangeCallback onModeChange, ButtonHoldCallback onUnpair = nullptr, ButtonHoldCallback onFactoryReset = nullptr);
  void tick();
  const char* currentMode();

private:
  ESP32Encoder encoder;
  ModeChangeCallback onChange = nullptr;
  ButtonHoldCallback onUnpairCallback = nullptr;
  ButtonHoldCallback onFactoryResetCallback = nullptr;

  int64_t lastPosition = 0;
  unsigned long lastDebounceMs = 0;
  unsigned long buttonPressStart = 0;
  bool isButtonPressed = false;
  bool unpairFired = false;
  bool resetFired = false;

  char mode[16] = "companion";

  void toggle();
  void loadFromNVS();
  void saveToNVS();
};

#pragma once
#include <TFT_eSPI.h>

enum class FaceState {
  IDLE,
  LISTENING,
  THINKING,
  SPEAKING,
  HAPPY,
  HEART,
  CONCERNED,
  EXCITED,
  SLEEPY,
  OFFLINE,
  PROVISIONING  // captive-portal Wi-Fi setup phase — shows animated signal bars
};

class DisplayManager {
public:
  void init();
  void setState(FaceState state);
  void tick(); // call every loop() — advances blink/animation timers

private:
  TFT_eSPI tft;
  TFT_eSprite* sprite = nullptr; // sprite buffer avoids flicker (PRD: 12fps target)
  FaceState currentState = FaceState::IDLE;
  unsigned long lastFrameMs = 0;
  unsigned long lastBlinkMs = 0;
  bool blinking = false;
  uint8_t animFrame = 0;

  void drawIdle();
  void drawListening();
  void drawThinking();
  void drawSpeaking();
  void drawHappy();
  void drawHeart();
  void drawConcerned();
  void drawExcited();
  void drawSleepy();
  void drawOffline();
  void drawProvisioning();
};

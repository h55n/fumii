#include "DisplayManager.h"
#include "config.h"

// Colors — matches src/styles/tokens.css so the device face and desktop UI
// read as the same character.
#define C_BG     0x0821 // near #0F0F14
#define C_AMBER  0xFD20 // #F5A623
#define C_GREEN  0xCFF5 // #CAFFA6
#define C_BLUE   0xAF3E // #A9E0F1
#define C_WHITE  0xFFFF

void DisplayManager::init() {
  tft.init();
  tft.setRotation(0);
  tft.fillScreen(C_BG);

  pinMode(PIN_TFT_BLK, OUTPUT);
  digitalWrite(PIN_TFT_BLK, HIGH);

  sprite = new TFT_eSprite(&tft);
  sprite->createSprite(240, 240);
  sprite->fillSprite(C_BG);
  sprite->pushSprite(0, 0);
}

void DisplayManager::setState(FaceState state) {
  currentState = state;
  animFrame = 0;
}

void DisplayManager::tick() {
  unsigned long now = millis();
  // 12fps target per PRD — redraw only when the frame interval elapses
  if (now - lastFrameMs < 83) return;
  lastFrameMs = now;

  sprite->fillSprite(C_BG);

  switch (currentState) {
    case FaceState::IDLE:         drawIdle(); break;
    case FaceState::LISTENING:    drawListening(); break;
    case FaceState::THINKING:     drawThinking(); break;
    case FaceState::SPEAKING:     drawSpeaking(); break;
    case FaceState::HAPPY:        drawHappy(); break;
    case FaceState::HEART:        drawHeart(); break;
    case FaceState::CONCERNED:    drawConcerned(); break;
    case FaceState::EXCITED:      drawExcited(); break;
    case FaceState::SLEEPY:       drawSleepy(); break;
    case FaceState::OFFLINE:      drawOffline(); break;
    case FaceState::PROVISIONING: drawProvisioning(); break;
  }

  sprite->pushSprite(0, 0);
  animFrame++;
}

void DisplayManager::drawIdle() {
  // slow blink every 4-6s
  unsigned long now = millis();
  bool eyesClosed = (now - lastBlinkMs) % 5000 < 150;
  int eyeH = eyesClosed ? 3 : 22;
  sprite->fillRoundRect(80, 108, 18, eyeH, 6, C_AMBER);
  sprite->fillRoundRect(142, 108, 18, eyeH, 6, C_AMBER);
}

void DisplayManager::drawListening() {
  sprite->fillEllipse(89, 118, 14, 18, C_AMBER);
  sprite->fillEllipse(151, 118, 14, 18, C_AMBER);
  // small sound-wave arc below
  for (int i = 0; i < 3; i++) {
    sprite->drawArc(120, 165, 10 + i * 8, 10 + i * 8 + 2, 200, 340, C_BLUE, C_BG);
  }
}

void DisplayManager::drawThinking() {
  sprite->fillRoundRect(75, 100, 18, 14, 6, C_AMBER); // eyes look up-left
  sprite->fillRoundRect(137, 100, 18, 14, 6, C_AMBER);
  int dots = (animFrame / 4) % 4;
  for (int i = 0; i < dots; i++) {
    sprite->fillCircle(105 + i * 14, 160, 3, C_AMBER);
  }
}

void DisplayManager::drawSpeaking() {
  sprite->fillRoundRect(80, 108, 18, 20, 6, C_AMBER);
  sprite->fillRoundRect(142, 108, 18, 20, 6, C_AMBER);
  // mouth open/close synced to animFrame — real sync comes from audio
  // chunk arrival events fed in via setState() calls from AudioPlayback
  int mouthH = (animFrame % 6 < 3) ? 18 : 6;
  sprite->fillRoundRect(100, 165, 40, mouthH, 8, C_AMBER);
}

void DisplayManager::drawHappy() {
  // eyes curve upward (^_^)
  sprite->drawArc(89, 118, 10, 14, 180, 360, C_AMBER, C_BG);
  sprite->drawArc(151, 118, 10, 14, 180, 360, C_AMBER, C_BG);
  sprite->fillRoundRect(90, 160, 60, 14, 7, C_AMBER);
}

void DisplayManager::drawHeart() {
  // two small bezier-ish heart fills for eyes
  for (int dx : {89, 151}) {
    sprite->fillCircle(dx - 5, 112, 7, C_AMBER);
    sprite->fillCircle(dx + 5, 112, 7, C_AMBER);
    sprite->fillTriangle(dx - 11, 116, dx + 11, 116, dx, 130, C_AMBER);
  }
}

void DisplayManager::drawConcerned() {
  sprite->fillRoundRect(83, 112, 16, 16, 5, C_AMBER); // eyes angled inward
  sprite->fillRoundRect(141, 112, 16, 16, 5, C_AMBER);
  sprite->drawLine(78, 100, 96, 106, C_AMBER); // worried brows
  sprite->drawLine(162, 106, 144, 100, C_AMBER);
  sprite->fillRoundRect(100, 168, 40, 4, 2, C_AMBER); // flat mouth
}

void DisplayManager::drawExcited() {
  sprite->fillCircle(89, 118, 15, C_AMBER); // large circle eyes
  sprite->fillCircle(151, 118, 15, C_AMBER);
  // sparkle marks
  sprite->fillCircle(60, 90, 2, C_GREEN);
  sprite->fillCircle(180, 90, 2, C_GREEN);
}

void DisplayManager::drawSleepy() {
  sprite->fillRect(80, 116, 18, 3, C_AMBER); // half-closed
  sprite->fillRect(142, 116, 18, 3, C_AMBER);
  sprite->setTextColor(C_BLUE);
  sprite->setTextSize(1);
  sprite->drawString("z z z", 150, 90);
}

void DisplayManager::drawOffline() {
  sprite->fillCircle(120, 110, 20, C_WHITE); // moon icon
  sprite->fillCircle(130, 105, 18, C_BG);
}

void DisplayManager::drawProvisioning() {
  // Animated Wi-Fi signal bars — 3 arcs that pulse in sequence to show setup in progress.
  // The active bar cycles every ~0.7s so the user knows the device is alive and waiting.
  uint8_t step = (animFrame / 8) % 3; // 0, 1, 2 cycling at 12fps/8 ≈ 0.67s per step

  // Center coordinates for the Wi-Fi fan
  int cx = 120, cy = 155;

  // Smallest arc (always on)
  sprite->drawArc(cx, cy, 18, 14, 210, 330, C_AMBER, C_BG);
  // Medium arc (on when step >= 1)
  if (step >= 1) sprite->drawArc(cx, cy, 32, 28, 210, 330, C_AMBER, C_BG);
  else           sprite->drawArc(cx, cy, 32, 28, 210, 330, 0x4208, C_BG); // dim
  // Largest arc (on when step >= 2)
  if (step >= 2) sprite->drawArc(cx, cy, 46, 42, 210, 330, C_AMBER, C_BG);
  else           sprite->drawArc(cx, cy, 46, 42, 210, 330, 0x4208, C_BG); // dim

  // Dot at base of Wi-Fi icon
  sprite->fillCircle(cx, cy, 4, C_AMBER);

  // "SETUP" label below
  sprite->setTextColor(C_BLUE);
  sprite->setTextSize(1);
  sprite->drawString("SETUP", cx - 15, 88);
}

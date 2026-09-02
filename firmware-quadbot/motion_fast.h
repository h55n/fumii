/*
 * motion_fast.h - v3: the ACEBOTT motion curve, played back faster
 * ---------------------------------------------------------------------
 * v1: text.h's Servo_PROGRAM_Run() ramps every step across the FULL
 * step duration (200-500ms+) - correct, smooth interpolation, but felt
 * sluggish because the pose only arrives right at the end of the window.
 *
 * v2 (two attempts): replaced the interpolation with direct writes,
 * then with two different hand-built easing curves (fixed-duration
 * ease-out, then distance-proportional ease-out). Both were the wrong
 * fix - they were solving the wrong variable. Comparing against the
 * real ACEBOTT app-control firmware (8_1app_control.ino, which drives
 * these same 8 direct-GPIO servos over the same kind of WiFi AP) shows
 * it uses text.h's ORIGINAL interpolation curve, unmodified - that
 * curve is already the hardware-proven "derived motion" for this
 * robot. The only actual problem was its default playback speed.
 *
 * v3 (this file) makes exactly ONE change: it reuses text.h's exact
 * interpolation algorithm - same Set_PWM_to_Servo() calls, same
 * map()-based per-substep formula, same Running_Servo_POS bookkeeping
 * - and scales the per-row timing by a speed percentage before running
 * it. No new curve, no new angles, no changes to text.h. This mirrors
 * the approach already prototyped in 4_1standby.ino ("100 = original
 * Acebott timing, lower = faster").
 */

#ifndef MOTION_FAST_H
#define MOTION_FAST_H

// The one tuning knob. 100 = identical to the original text.h speed
// (the "sluggish" one). Lower = the exact same motion curve, played
// back faster. 60 is a reasonable starting point; try ~50 for snappier
// or ~70 for gentler. Very low values (well under ~30-40) start to
// collapse back toward a single jump, since InterTotalTime approaches
// BASEDELAYTIME and there's no room left to interpolate.
const int GAIT_SPEED_PERCENT = 60;

// Identical to text.h's Servo_PROGRAM_Run() - same interpolation
// formula, same Set_PWM_to_Servo() calls, same Running_Servo_POS
// state (shared with text.h, so Servo_PROGRAM_Zero()/standby() stay
// in sync with whatever this function last did). The only addition is
// scaling InterTotalTime by GAIT_SPEED_PERCENT before computing the
// ramp - this is not a new motion, just the same one on a faster clock.
void runGaitFast(const int iMatrix[][ALLMATRIX], int iSteps) {
  int INT_TEMP_A, INT_TEMP_B, INT_TEMP_C;

  for (int MainLoopIndex = 0; MainLoopIndex < iSteps; MainLoopIndex++) {
    int InterTotalTime = iMatrix[MainLoopIndex][ALLMATRIX - 1];

    InterTotalTime = (InterTotalTime * GAIT_SPEED_PERCENT) / 100;
    if (InterTotalTime < BASEDELAYTIME) InterTotalTime = BASEDELAYTIME;

    int InterDelayCounter = InterTotalTime / BASEDELAYTIME;
    if (InterDelayCounter < 1) InterDelayCounter = 1;

    for (int InterStepLoop = 0; InterStepLoop < InterDelayCounter; InterStepLoop++) {
      for (int ServoIndex = 0; ServoIndex < ALLSERVOS; ServoIndex++) {
        INT_TEMP_A = Running_Servo_POS[ServoIndex];
        INT_TEMP_B = iMatrix[MainLoopIndex][ServoIndex];

        if (INT_TEMP_A == INT_TEMP_B) {
          INT_TEMP_C = INT_TEMP_B;
        } else if (INT_TEMP_A > INT_TEMP_B) {
          INT_TEMP_C = map(BASEDELAYTIME * InterStepLoop, 0, InterTotalTime, 0, INT_TEMP_A - INT_TEMP_B);
          if (INT_TEMP_A - INT_TEMP_C >= INT_TEMP_B) {
            Set_PWM_to_Servo(ServoIndex, INT_TEMP_A - INT_TEMP_C);
          }
        } else {
          INT_TEMP_C = map(BASEDELAYTIME * InterStepLoop, 0, InterTotalTime, 0, INT_TEMP_B - INT_TEMP_A);
          if (INT_TEMP_A + INT_TEMP_C <= INT_TEMP_B) {
            Set_PWM_to_Servo(ServoIndex, INT_TEMP_A + INT_TEMP_C);
          }
        }
      }

      delay(BASEDELAYTIME);
    }

    // Save the target frame as the new current position - same as
    // text.h, keeps Running_Servo_POS consistent for whatever runs next.
    for (int Index = 0; Index < ALLMATRIX; Index++) {
      Running_Servo_POS[Index] = iMatrix[MainLoopIndex][Index];
    }
  }
}

// One fast wrapper per existing gait table - mirrors the exact call
// sequence of the original functions in text.h. Every action returns
// to standby when it finishes, EXCEPT sleep, which stays in its
// resting pose until "wake" is pressed.
void fastStandby()    { runGaitFast(Servo_Prg_1,  Servo_Prg_1_Step); }
void fastForward()    { runGaitFast(Servo_Prg_2,  Servo_Prg_2_Step);  fastStandby(); }
void fastBack()       { runGaitFast(Servo_Prg_3,  Servo_Prg_3_Step);  fastStandby(); }
void fastShiftLeft()  { runGaitFast(Servo_Prg_4,  Servo_Prg_4_Step);  fastStandby(); }
void fastShiftRight() { runGaitFast(Servo_Prg_5,  Servo_Prg_5_Step);  fastStandby(); }
void fastTurnLeft()   { runGaitFast(Servo_Prg_6,  Servo_Prg_6_Step);  fastStandby(); }
void fastTurnRight()  { runGaitFast(Servo_Prg_7,  Servo_Prg_7_Step);  fastStandby(); }
void fastLie()        { runGaitFast(Servo_Prg_8,  Servo_Prg_8_Step);  fastStandby(); }
void fastHello()      { runGaitFast(Servo_Prg_9,  Servo_Prg_9_Step);  fastStandby(); }
void fastFighting()   { runGaitFast(Servo_Prg_10, Servo_Prg_10_Step); fastStandby(); }
void fastPushup()     { runGaitFast(Servo_Prg_11, Servo_Prg_11_Step); fastStandby(); }
void fastSleep()      { fastStandby(); runGaitFast(Servo_Prg_12, Servo_Prg_12_Step); } // stays asleep on purpose
void fastDance1()     { runGaitFast(Servo_Prg_13, Servo_Prg_13_Step); fastStandby(); }
void fastDance2()     { runGaitFast(Servo_Prg_14, Servo_Prg_14_Step); fastStandby(); }
void fastDance3()     { runGaitFast(Servo_Prg_15, Servo_Prg_15_Step); fastStandby(); }
void fastWake()       { Servo_PROGRAM_Zero(); fastStandby(); }

#endif
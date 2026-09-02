#include <Servo.h>
Servo servo_14;//Upper right [paw]
Servo servo_12;//Upper right [arm]
Servo servo_13;//Lower right [arm]
Servo servo_15;//Lower right [paw]
Servo servo_16;//Upper left [paw]
Servo servo_5;//Upper left [arm]
Servo servo_4;//Lower left [arm]
Servo servo_2;//Lower left [paw]
String item;//Because serial data is in string format, the variables are also in string format

const int PWMRES_Min = 1; // PWM Resolution 1
const int PWMRES_Max = 180; // PWM Resolution 180
const int ALLMATRIX = 9; // GPIO14 + GPIO12 + GPIO13 + GPIO15 + GPIO16 + GPIO5 + GPIO4 + GPIO2 + Run Time
const int ALLSERVOS = 8; // GPIO14 + GPIO12 + GPIO13 + GPIO15 + GPIO16 + GPIO5 + GPIO4 + GPIO2
const int SERVOMIN = 400; // 400
const int SERVOMAX = 2400; // 2400
// Backup servo value
int Running_Servo_POS [ALLMATRIX];
// Servo delay base time
int BASEDELAYTIME = 10; // 10 ms

// ----------------------------- G14, G12, G13, G15, G16,  G5,  G4,  G2,  ms
const int Servo_Act_0 [ ] PROGMEM = {   90,  90,  90,  90,  90,  90,  90,  90,  500  };
const int Servo_Act_1 [ ] PROGMEM = {   60,  90,  90, 120, 120,  90,  90,  60,  500  };

// Standby 待机
const int Servo_Prg_1_Step = 2;
const int Servo_Prg_1 [][ALLMATRIX] PROGMEM = {
  // G14, G12, G13, G15, G16,  G5,  G4,  G2,  ms
//  {   90,  90,  90,  90,  90,  90,  90,  90,  500  }, // servo center point
//  {   70,  90,  90, 110, 110,  90,  90,  70,  500  }, // standby
  {   90,  90,  90,  90,  90,  90,  90,  90,  500  }, // servo center point
  {   60,  90,  90, 120, 120,  90,  90,  60,  500  }, // standby
};
// Forward 前进
const int Servo_Prg_2_Step = 11;
const int Servo_Prg_2 [][ALLMATRIX] PROGMEM = {
  // G14, G12, G13, G15, G16,  G5,  G4,  G2,  ms
  /*{   70,  90,  90, 110, 110,  90,  90,  70,  200  }, // standby
  {   90,  90,  90, 110, 110,  90,  45,  90,  200  }, // leg1,4 up; leg4 fw
  {   70,  90,  90, 110, 110,  90,  45,  70,  200  }, // leg1,4 dn
  {   70,  90,  90,  90,  90,  90,  45,  70,  200  }, // leg2,3 up
  {   70,  45-6, 135+6,  90,  90,  90,  90,  70,  200  }, // leg1,4 bk; leg2 fw
  {   70,  45-6, 135+6, 110, 110,  90,  90,  70,  200  }, // leg2,3 dn
  {   90,  90, 135+6, 110, 110,  90,  90,  90,  200  }, // leg1,4 up; leg1 fw
  {   90,  90,  90, 110, 110, 135,  90,  90,  200  }, // leg2,3 bk
  {   70,  90,  90, 110, 110, 135,  90,  70,  200  }, // leg1,4 dn
  {   70,  90,  90, 110,  90, 135,  90,  70,  200  }, // leg3 up
  {   70,  90,  90, 110, 110,  90,  90,  70,  200  }, // leg3 fw dn*/
  {70, 90,  90, 110, 110, 90, 90, 70, 200},// standby
  {90, 90,  90, 110, 110, 90, 90, 90, 200},//Right upper paw and left lower paw are raised
  {90, 120, 90, 110, 110, 90, 60, 90, 200},//Right upper arm and left lower arm forward
  {70, 120, 90, 110, 110, 90, 60, 70, 200},//Right upper paw and left lower paw drop
  {70, 120, 90, 90,  90,  90, 60, 70, 200},//The left upper paw and right lower paw are raised
  {70, 90,  90, 90,  90,  90, 90, 70, 200},//Right upper arm and left lower arm back
  {70, 90,  120,90,  90,  60, 90, 70, 200},//Left upper arm and right lower arm forward
  {70, 90,  120,110, 110, 60, 90, 70, 200},//Left upper paw and right lower paw drop
  {90, 90,  120,110, 110, 60, 90, 90, 200},//Right upper paw and left lower paw are raised
  {90, 90,  90, 110, 110, 90, 90, 90, 200},//The upper left arm and lower right arm back
  {70, 90,  90, 110, 110, 90, 90, 70, 200},//Right upper paw and left lower paw drop
};
// Backward 后退
const int Servo_Prg_3_Step = 11;
const int Servo_Prg_3 [][ALLMATRIX] PROGMEM = {
  // G14, G12, G13, G15, G16,  G5,  G4,  G2,  ms
  /*{   70,  90,  90, 110, 110,  90,  90,  70,  200  }, // standby
  {   90,  45,  90, 110, 110,  90,  90,  90,  200  }, // leg4,1 up; leg1 fw
  {   70,  45,  90, 110, 110,  90,  90,  70,  200  }, // leg4,1 dn
  {   70,  45,  90,  90,  90,  90,  90,  70,  200  }, // leg3,2 up
  {   70,  90,  90,  90,  90, 135,  45,  70,  200  }, // leg4,1 bk; leg3 fw
  {   70,  90,  90, 110, 110, 135,  45,  70,  200  }, // leg3,2 dn
  {   90,  90,  90, 110, 110, 135,  90,  90,  200  }, // leg4,1 up; leg4 fw
  {   90,  90, 135, 110, 110,  90,  90,  90,  200  }, // leg3,1 bk
  {   70,  90, 135, 110, 110,  90,  90,  70,  200  }, // leg4,1 dn
  {   70,  90, 135,  90, 110,  90,  90,  70,  200  }, // leg2 up
  {   70,  90,  90, 110, 110,  90,  90,  70,  200  }, // leg2 fw dn*/
  {70, 90,  90, 110, 110, 90, 90, 70, 200},//standby
  {90, 90,  90, 110, 110, 90, 90, 90, 200},//Right upper paw and left lower paw are raised
  {90, 60,  90, 110, 110, 90, 120,90, 200},//Right upper arm and left lower arm back
  {70, 60,  90, 110, 110, 90, 120,70, 200},//Right upper paw and left lower paw drop
  {70, 60,  90, 90,  90,  90, 120,70, 200},//The left upper paw and right lower paw are raised
  {70, 90,  90, 90,  90,  90, 90, 70, 200},//Right upper arm and left lower arm forward
  {70, 90,  60, 90,  90,  120,90, 70, 200},//The upper left arm and lower right arm back
  {70, 90,  60,110, 110,  120,90, 70, 200},//Left upper paw and right lower paw drop
  {90, 90,  60,110, 110,  120,90, 90, 200},//Right upper paw and left lower paw are raised
  {90, 90,  90, 110, 110, 90, 90, 90, 200},//Left upper arm and right lower arm forward
  {70, 90,  90, 110, 110, 90, 90, 70, 200},//Right upper paw and left lower paw drop
};

// Left shift 左移
const int Servo_Prg_4_Step = 11;
const int Servo_Prg_4 [][ALLMATRIX] PROGMEM = {
  // G14, G12, G13, G15, G16,  G5,  G4,  G2,  ms
  /*{   70,  90,  90, 110, 110,  90,  90,  70,  200  }, // standby
  {   70,  90,  45,  90,  90,  90,  90,  70,  200  }, // leg3,2 up; leg2 fw
  {   70,  90,  45, 110, 110,  90,  90,  70,  200  }, // leg3,2 dn
  {   90,  90,  45, 110, 110,  90,  90,  90,  200  }, // leg1,4 up
  {   90, 135,  90, 110, 110,  45,  90,  90,  200  }, // leg3,2 bk; leg1 fw
  {   70, 135,  90, 110, 110,  45,  90,  70,  200  }, // leg1,4 dn
  {   70, 135,  90,  90,  90,  90,  90,  70,  200  }, // leg3,2 up; leg3 fw
  {   70,  90,  90,  90,  90,  90, 135,  70,  200  }, // leg1,4 bk
  {   70,  90,  90, 110, 110,  90, 135,  70,  200  }, // leg3,2 dn
  {   70,  90,  90, 110, 110,  90, 135,  90,  200  }, // leg4 up
  {   70,  90,  90, 110, 110,  90,  90,  70,  200  }, // leg4 fw dn*/
  {70, 90, 90, 110, 110, 90, 90, 70, 200},//Standby mode
  {70, 90, 90, 90,  90,  90, 90, 70, 200},//The left upper paw and right lower paw are raised
  {70, 90, 60, 90,  90,  120,90, 70, 200},//Left upper paw and right lower paw drop
  {70, 90, 60, 110, 110, 120,90, 70, 200},//Left upper paw and right lower paw drop
  {90, 90, 60, 110, 110, 120,90, 90, 200},//Right upper paw and left lower paw are raised
  {90, 90, 90, 110, 110, 90, 90, 90, 200},//Left upper arm and right lower arm forward
  {90, 120,90, 110, 110, 90, 60, 90, 200},//Right upper arm and left lower arm forward
  {70, 120,90, 110, 110, 90, 60, 70, 200},//Right upper paw and left lower paw drop
  {70, 120,90, 90,  90,  90, 60, 70, 200},//The left upper paw and right lower paw are raised
  {70, 90, 90, 90,  90,  90, 90, 70, 200},//Right upper arm and left lower arm back
  {70, 90, 90, 110, 110, 90, 90, 70, 200},//Left upper paw and right lower paw drop
};

// Right shift 右移
const int Servo_Prg_5_Step = 11;
const int Servo_Prg_5 [][ALLMATRIX] PROGMEM = {
  // G14, G12, G13, G15, G16,  G5,  G4,  G2,  ms
  /*{   70,  90,  90, 110, 110,  90,  90,  70,  200  }, // standby
  {   70,  90,  90,  90,  90,  45,  90,  70,  200  }, // leg2,3 up; leg3 fw
  {   70,  90,  90, 110, 110,  45,  90,  70,  200  }, // leg2,3 dn
  {   90,  90,  90, 110, 110,  45,  90,  90,  200  }, // leg4,1 up
  {   90,  90,  45, 110, 110,  90, 135,  90,  200  }, // leg2,3 bk; leg4 fw
  {   70,  90,  45, 110, 110,  90, 135,  70,  200  }, // leg4,1 dn
  {   70,  90,  90,  90,  90,  90, 135,  70,  200  }, // leg2,3 up; leg2 fw
  {   70, 135,  90,  90,  90,  90,  90,  70,  200  }, // leg4,1 bk
  {   70, 135,  90, 110, 110,  90,  90,  70,  200  }, // leg2,3 dn
  {   90, 135,  90, 110, 110,  90,  90,  70,  200  }, // leg1 up
  {   70,  90,  90, 110, 110,  90,  90,  70,  200  }, // leg1 fw dn*/
  {70, 90, 90, 110, 110, 90, 90, 70, 200},//standby
  {90, 90, 90, 110, 110, 90, 90, 90, 200},//Right upper paw and left lower paw are raised
  {90, 60, 90, 110, 110, 90, 120,90, 200},//Right upper arm and left lower arm back
  {70, 60, 90, 110, 110, 90, 120,70, 200},//Right upper paw and left lower paw drop
  {70, 60, 90, 90,  90,  90, 120,70, 200},//The left upper paw and right lower paw are raised
  {70, 90, 90, 90,  90,  90, 90, 70, 200},//Right upper arm and left lower arm forward
  {70, 90, 120,90,  90,  60, 90, 70, 200},//Left upper arm and right lower arm forward
  {70, 90, 120,110, 110, 60, 90, 70, 200},//Left upper paw and right lower paw drop
  {90, 90, 120,110, 110, 60, 90, 90, 200},//Right upper paw and left lower paw are raised
  {90, 90, 90, 110, 110, 90, 90, 90, 200},//The upper left arm and lower right arm back
  {70, 90, 90, 110, 110, 90, 90, 70, 200},//Right upper paw and left lower paw drop
};

// Turn left 左转
const int Servo_Prg_6_Step = 8;
const int Servo_Prg_6 [][ALLMATRIX] PROGMEM = {
  // G14, G12, G13, G15, G16,  G5,  G4,  G2,  ms
  {   70,  90,  90, 110, 110,  90,  90,  70,  200  }, // standby
  {   90,  90,  90, 110, 110,  90,  90,  90,  200  }, // leg1,4 up
  {   90, 135,  90, 110, 110,  90, 135,  90,  200  }, // leg1,4 turn
  {   70, 135,  90, 110, 110,  90, 135,  70,  200  }, // leg1,4 dn
  {   70, 135,  90,  90,  90,  90, 135,  70,  200  }, // leg2,3 up
  {   70, 135, 135,  90,  90, 135, 135,  70,  200  }, // leg2,3 turn
  {   70, 135, 135, 110, 110, 135, 135,  70,  200  }, // leg2,3 dn
  {   70,  90,  90, 110, 110,  90,  90,  70,  200  }, // leg1,2,3,4 turn
};

// Turn right 右转
const int Servo_Prg_7_Step = 8;
const int Servo_Prg_7 [][ALLMATRIX] PROGMEM = {
  // G14, G12, G13, G15, G16,  G5,  G4,  G2,  ms
  {   70,  90,  90, 110, 110,  90,  90,  70,  200  }, // standby
  {   70,  90,  90,  90,  90,  90,  90,  70,  200  }, // leg2,3 up
  {   70,  90,  45,  90,  90,  45,  90,  70,  200  }, // leg2,3 turn
  {   70,  90,  45, 110, 110,  45,  90,  70,  200  }, // leg2,3 dn
  {   90,  90,  45, 110, 110,  45,  90,  90,  200  }, // leg1,4 up
  {   90,  45,  45, 110, 110,  45,  45,  90,  200  }, // leg1,4 turn
  {   70,  45,  45, 110, 110,  45,  45,  70,  200  }, // leg1,4 dn
  {   70,  90,  90, 110, 110,  90,  90,  70,  200  }, // leg1,2,3,4 turn
};

// Lie 趴地
const int Servo_Prg_8_Step = 1;
const int Servo_Prg_8 [][ALLMATRIX] PROGMEM = {
  // G14, G12, G13, G15, G16,  G5,  G4,  G2,  ms
  {  110,  90,  90,  70,  70,  90,  90, 110,  500  }, // leg1,4 up
};

// Say Hi 打招呼
const int Servo_Prg_9_Step = 7;
const int Servo_Prg_9 [][ALLMATRIX] PROGMEM = {
  // G14, G12, G13, G15, G16,  G5,  G4,  G2,  ms
//  {   70,  90,  90,  90,  90,  90,  90,  90,  400}, // leg2,3,4 dn
//  {  170,  90,  90,  90,  90,  90,  90,  90,  400}, // leg1 up
//  {  170, 130,  90,  90,  90,  90,  90,  90,  400}, // leg1 left
//  {  170,  50,  90,  90,  90,  90,  90,  90,  400}, // leg1 right
//  {  170, 130,  90,  90,  90,  90,  90,  90,  400}, // leg1 left
//  {  170,  90,  90,  90,  90,  90,  90,  90,  400}, // leg1 right
//  {   70,  90,  90,  90,  90,  90,  90,  90,  400}, // leg1 dn

  {  70,  90,  135,  90,  90,  90,  90,  90,  400}, // leg2,3,4 dn
  {  170,  90,  135,  90,  90,  90,  90,  90,  400}, // leg1 up
  {  170,  130,  135,  90,  90,  90,  90,  90,  400}, // leg1 left
  {  170,  50,  135,  90,  90,  90,  90,  90,  400}, // leg1 right
  {  170,  130,  135,  90,  90,  90,  90,  90,  400}, // leg1 left
  {  170,  90,  135,  90,  90,  90,  90,  90,  400}, // leg1 right
  {  70,  90,  135,  90,  90,  90,  90,  90,  400}, // leg1 dn
};

// Fighting 战斗姿态
const int Servo_Prg_10_Step = 11;
const int Servo_Prg_10 [][ALLMATRIX] PROGMEM = {
  // G14, G12, G13, G15, G16,  G5,  G4,  G2,  ms
  {  120,  90,  90, 110,  60,  90,  90,  70,  500  }, // leg1, 2 down
  {  120,  70,  70, 110,  60,  70,  70,  70,  500  }, // body turn left
  {  120, 110, 110, 110,  60, 110, 110,  70,  500  }, // body turn right
  {  120,  70,  70, 110,  60,  70,  70,  70,  500  }, // body turn left
  {  120, 110, 110, 110,  60, 110, 110,  70,  500  }, // body turn right
  {   70,  90,  90,  70, 110,  90,  90, 110,  500  }, // leg1, 2 up ; leg3, 4 down
  {   70,  70,  70,  70, 110,  70,  70, 110,  500  }, // body turn left
  {   70, 110, 110,  70, 110, 110, 110, 110,  500  }, // body turn right
  {   70,  70,  70,  70, 110,  70,  70, 110,  500  }, // body turn left
  {   70, 110, 110,  70, 110, 110, 110, 110,  500  }, // body turn right
  {   70,  90,  90,  70, 110,  90,  90, 110,  500  }  // leg1, 2 up ; leg3, 4 down
};

// Push up 俯卧撑
const int Servo_Prg_11_Step = 7;
const int Servo_Prg_11 [][ALLMATRIX] PROGMEM = {
  // G14, G12, G13, G15, G16,  G5,  G4,  G2,  ms
  /*{   70,  90,  90, 110, 110,  90,  90,  70,  500  }, // start
  {  100,  90,  90,  80,  80,  90,  90, 100,  600  }, // down
  {   70,  90,  90, 110, 110,  90,  90,  70,  700  }, // up
  {  100,  90,  90,  80,  80,  90,  90, 100,  800  }, // down
  {   70,  90,  90, 110, 110,  90,  90,  70,  900  }, // up
  {  100,  90,  90,  80,  80,  90,  90, 100, 1500  }, // down
  {   70,  90,  90, 110, 110,  90,  90,  70, 2000  }, // up
  {  135,  90,  90,  45,  45,  90,  90, 135,  200  }, // fast down
  {   70,  90,  90,  45,  60,  90,  90, 135,  800  }, // leg1 up
  {   70,  90,  90,  45, 110,  90,  90, 135,  800  }, // leg2 up
  {   70,  90,  90, 110, 110,  90,  90,  70,  800  }  // leg3, leg4 up*/
  {70, 90, 90, 110, 110, 90, 90, 70, 100},//时间
  {90, 90, 90, 90, 90, 90, 90, 90, 600},
  {70, 90, 90, 110, 110, 90, 90, 70, 500},
  {90, 90, 90, 90, 90, 90, 90, 100, 700},
  {70, 90, 90, 110, 110, 90, 90, 70, 500},
  {90, 90, 90, 90, 90, 90, 90, 100, 800},
  {70, 90, 90, 110, 110, 90, 90, 70, 500},
};

// Sleep 睡眠姿勢
const int Servo_Prg_12_Step = 2;
const int Servo_Prg_12 [][ALLMATRIX] PROGMEM = {
  // G14, G12, G13, G15, G16,  G5,  G4,  G2,  ms
  {   30,  90,  90, 150, 150,  90,  90,  30,  500  }, // leg1,4 dn
  {   30,  45, 135, 150, 150, 135,  45,  30,  500  }, // protect myself
};

// 舞步 1
const int Servo_Prg_13_Step = 10;
const int Servo_Prg_13 [][ALLMATRIX] PROGMEM = {
  // G14, G12, G13, G15, G16,  G5,  G4,  G2,  ms
  {   90,  90,  90,  90,  90,  90,  90,  90,  400  }, // leg1,2,3,4 up
  {   50,  90,  90,  90,  90,  90,  90,  90,  400  }, // leg1 dn
  {   90,  90,  90, 130,  90,  90,  90,  90,  400  }, // leg1 up; leg2 dn
  {   90,  90,  90,  90,  90,  90,  90,  50,  400  }, // leg2 up; leg4 dn
  {   90,  90,  90,  90, 130,  90,  90,  90,  400  }, // leg4 up; leg3 dn
  {   50,  90,  90,  90,  90,  90,  90,  90,  400  }, // leg3 up; leg1 dn
  {   90,  90,  90, 130,  90,  90,  90,  90,  400  }, // leg1 up; leg2 dn
  {   90,  90,  90,  90,  90,  90,  90,  50,  400  }, // leg2 up; leg4 dn
  {   90,  90,  90,  90, 130,  90,  90,  90,  400  }, // leg4 up; leg3 dn
  {   90,  90,  90,  90,  90,  90,  90,  90,  400  }, // leg3 up
};

// 舞步 2
const int Servo_Prg_14_Step = 9;
const int Servo_Prg_14 [][ALLMATRIX] PROGMEM = {
  // G14, G12, G13, G15, G16,  G5,  G4,  G2,  ms
  {   70,  45, 135, 110, 110, 135,  45,  70,  400  }, // leg1,2,3,4 two sides
  {  115,  45, 135,  65, 110, 135,  45,  70,  400  }, // leg1,2 up
  {   70,  45, 135, 110,  65, 135,  45, 115,  400  }, // leg1,2 dn; leg3,4 up
  {  115,  45, 135,  65, 110, 135,  45,  70,  400  }, // leg3,4 dn; leg1,2 up
  {   70,  45, 135, 110,  65, 135,  45, 115,  400  }, // leg1,2 dn; leg3,4 up
  {  115,  45, 135,  65, 110, 135,  45,  70,  400  }, // leg3,4 dn; leg1,2 up
  {   70,  45, 135, 110,  65, 135,  45, 115,  400  }, // leg1,2 dn; leg3,4 up
  {  115,  45, 135,  65, 110, 135,  45,  70,  400  }, // leg3,4 dn; leg1,2 up
  {   75,  45, 135, 105, 110, 135,  45,  70,  400  }, // leg1,2 dn
};

// 舞步 3
const int Servo_Prg_15_Step = 10;
const int Servo_Prg_15 [][ALLMATRIX] PROGMEM = {
  // G14, G12, G13, G15, G16,  G5,  G4,  G2,  ms
  {   70,  45,  45, 110, 110, 135, 135,  70,  400  }, // leg1,2,3,4 bk
  {  110,  45,  45,  60,  70, 135, 135,  70,  400  }, // leg1,2,3 up
  {   70,  45,  45, 110, 110, 135, 135,  70,  400  }, // leg1,2,3 dn
  {  110,  45,  45, 110,  70, 135, 135, 120,  400  }, // leg1,3,4 up
  {   70,  45,  45, 110, 110, 135, 135,  70,  400  }, // leg1,3,4 dn
  {  110,  45,  45,  60,  70, 135, 135,  70,  400  }, // leg1,2,3 up
  {   70,  45,  45, 110, 110, 135, 135,  70,  400  }, // leg1,2,3 dn
  {  110,  45,  45, 110,  70, 135, 135, 120,  400  }, // leg1,3,4 up
  {   70,  45,  45, 110, 110, 135, 135,  70,  400  }, // leg1,3,4 dn
  {   70,  90,  90, 110, 110,  90,  90,  70,  400  }, // standby
};

void Set_PWM_to_Servo(int iServo, int iValue)
{
  int NewPWM = map(iValue, PWMRES_Min, PWMRES_Max, SERVOMIN, SERVOMAX);

	if (iServo >= 7) {
		servo_2.write(NewPWM);
	} else if (iServo >= 6) {
		servo_4.write(NewPWM);
	} else if (iServo >= 5) {
		servo_5.write(NewPWM);
	} else if (iServo >= 4) {
		servo_16.write(NewPWM);
	} else if (iServo >= 3) {
		servo_15.write(NewPWM);
	} else if (iServo >= 2) {
		servo_13.write(NewPWM);
	} else if (iServo >= 1) {
		servo_12.write(NewPWM);
	} else if (iServo == 0) {
		servo_14.write(NewPWM);
	}
}
void Servo_PROGRAM_Run(const int iMatrix[][ALLMATRIX], int iSteps)
{
    int INT_TEMP_A, INT_TEMP_B, INT_TEMP_C;

    for (int MainLoopIndex = 0; MainLoopIndex < iSteps; MainLoopIndex++) // iSteps Step main loop
    {
        int InterTotalTime = iMatrix[MainLoopIndex][ALLMATRIX - 1]; // InterTotalTime Total time for this step

        int InterDelayCounter = InterTotalTime / BASEDELAYTIME; // InterDelayCounter This step is delayed a basic number of times

        for (int InterStepLoop = 0; InterStepLoop < InterDelayCounter; InterStepLoop++) // Interpolate loops
        {
            for (int ServoIndex = 0; ServoIndex < ALLSERVOS; ServoIndex++) // Servo main cycle
            {
                INT_TEMP_A = Running_Servo_POS[ServoIndex]; // The current position of the servo
                INT_TEMP_B = iMatrix[MainLoopIndex][ServoIndex]; // Target position of the servo
 
                if (INT_TEMP_A == INT_TEMP_B) // The servo values are unchanged
                {
                    INT_TEMP_C = INT_TEMP_B;
                } 
                else if (INT_TEMP_A > INT_TEMP_B) // Reduction of servo value
                {
                    INT_TEMP_C =  map(BASEDELAYTIME * InterStepLoop, 0, InterTotalTime, 0, INT_TEMP_A - INT_TEMP_B); // PWM internal difference = map(execution time accumulation, start time, end time, start value of internal difference, maximum value of internal difference)
                    if (INT_TEMP_A - INT_TEMP_C >= INT_TEMP_B) 
                    {
                        Set_PWM_to_Servo(ServoIndex, INT_TEMP_A - INT_TEMP_C);
                    }
                } 
                else if (INT_TEMP_A < INT_TEMP_B) // The servo value is increased
                {
                    INT_TEMP_C =  map(BASEDELAYTIME * InterStepLoop, 0, InterTotalTime, 0, INT_TEMP_B - INT_TEMP_A); // PWM internal difference = map(execution time accumulation, start time, end time, start internal difference, maximum internal difference)
                    if (INT_TEMP_A + INT_TEMP_C <= INT_TEMP_B) {
                    Set_PWM_to_Servo(ServoIndex, INT_TEMP_A + INT_TEMP_C);
                    }
                }
            }

            delay(BASEDELAYTIME);
        }

        // Backup current servo value
        for (int Index = 0; Index < ALLMATRIX; Index++) 
        {
            Running_Servo_POS[Index] = iMatrix[MainLoopIndex][Index];
        }
    }
}

void Servo_PROGRAM_Zero()
{
	for (int Index = 0; Index < ALLMATRIX; Index++) 
	{
		Running_Servo_POS[Index] = Servo_Act_0[Index];
	}

  for (int iServo = 0; iServo < ALLSERVOS; iServo++) 
	{
		Set_PWM_to_Servo(iServo, Running_Servo_POS[iServo]);
		delay(10);
	}

	for (int Index = 0; Index < ALLMATRIX; Index++) 
	{
		Running_Servo_POS[Index] = Servo_Act_1[Index];
	}

  for (int iServo = 0; iServo < ALLSERVOS; iServo++) 
	{
		Set_PWM_to_Servo(iServo, Running_Servo_POS[iServo]);
		delay(10);
	}
}

void standby() {
  Servo_PROGRAM_Run(Servo_Prg_1, Servo_Prg_1_Step);
}

// Sleep program
void sleep() {
  Servo_PROGRAM_Run(Servo_Prg_1, Servo_Prg_1_Step);
	Servo_PROGRAM_Run(Servo_Prg_12, Servo_Prg_12_Step);
}

// Planking procedure
void lie() {
  Servo_PROGRAM_Run(Servo_Prg_8, Servo_Prg_8_Step);
}

void forward() {
  Servo_PROGRAM_Run(Servo_Prg_2, Servo_Prg_2_Step);
}

void back() {
  Servo_PROGRAM_Run(Servo_Prg_3, Servo_Prg_3_Step);
}

// Left turn program
void turnleft() {
  Servo_PROGRAM_Run(Servo_Prg_6, Servo_Prg_6_Step);
}

// Right turn program
void turnright() {
  Servo_PROGRAM_Run(Servo_Prg_7, Servo_Prg_7_Step);
}
//Left shift
void leftmove() {
 Servo_PROGRAM_Run(Servo_Prg_4, Servo_Prg_4_Step);
}
//Right shift
void rightmove() {
 Servo_PROGRAM_Run(Servo_Prg_5, Servo_Prg_5_Step);
}

void hello() {
  Servo_PROGRAM_Run(Servo_Prg_9, Servo_Prg_9_Step);
	Servo_PROGRAM_Run(Servo_Prg_1, Servo_Prg_1_Step);
}

void dance1() {
 Servo_PROGRAM_Run(Servo_Prg_13, Servo_Prg_13_Step);
}

void dance2() {
 Servo_PROGRAM_Run(Servo_Prg_14, Servo_Prg_14_Step);
}

void dance3() {
 Servo_PROGRAM_Run(Servo_Prg_15, Servo_Prg_15_Step);
}

// Push up routine
void pushup() {
  Servo_PROGRAM_Run(Servo_Prg_11, Servo_Prg_11_Step);
}

// Combat procedure
void fighting() {
  Servo_PROGRAM_Run(Servo_Prg_10, Servo_Prg_10_Step);
}

/*
 * Test des composants - SecurityApp ESP32
 * Un seul fichier pour tester : buzzer, servo, LEDs (un par un)
 * 
 * Broches (même câblage que security_door.ino) :
 * - Buzzer  : GPIO 27 (via transistor)
 * - Servo   : GPIO 13
 * - LED OK  : GPIO 12
 * - LED NOK : GPIO 14
 */

// -------- Broches --------
const int BUZZER_PIN  = 27;
const int SERVO_PIN   = 13;
const int LED_OK_PIN  = 12;
const int LED_NO_PIN  = 14;

// -------- Tests à exécuter --------
#define TEST_BUZZER  1   // 1 = tester le buzzer
#define TEST_SERVO   1   // 1 = tester le servo
#define TEST_LED_OK  1   // 1 = tester la LED verte
#define TEST_LED_NO  1   // 1 = tester la LED rouge

#include <ESP32Servo.h>
Servo servo;

void beep(int ms) {
  digitalWrite(BUZZER_PIN, HIGH);
  delay(ms);
  digitalWrite(BUZZER_PIN, LOW);
}

void testBuzzer() {
  Serial.println("\n--- TEST BUZZER ---");
  Serial.println("Le buzzer va bipper 3 fois (court, court, long)...");
  pinMode(BUZZER_PIN, OUTPUT);
  digitalWrite(BUZZER_PIN, LOW);

  beep(200);
  delay(300);
  beep(200);
  delay(300);
  beep(500);

  Serial.println("Test buzzer termine.\n");
}

void testServo() {
  Serial.println("\n--- TEST SERVO ---");
  Serial.println("Le servo va tourner : ferme -> ouvre -> ferme...");
  servo.attach(SERVO_PIN, 500, 2400);
  servo.write(0);   // ferme
  delay(1000);
  servo.write(90);  // ouvre
  delay(2000);
  servo.write(0);   // ferme
  delay(1000);
  servo.detach();
  Serial.println("Test servo termine.\n");
}

void testLedOk() {
  Serial.println("\n--- TEST LED VERTE ---");
  Serial.println("La LED verte va clignoter 3 fois...");
  pinMode(LED_OK_PIN, OUTPUT);
  for (int i = 0; i < 3; i++) {
    digitalWrite(LED_OK_PIN, HIGH);
    delay(300);
    digitalWrite(LED_OK_PIN, LOW);
    delay(300);
  }
  Serial.println("Test LED verte termine.\n");
}

void testLedNo() {
  Serial.println("\n--- TEST LED ROUGE ---");
  Serial.println("La LED rouge va clignoter 3 fois...");
  pinMode(LED_NO_PIN, OUTPUT);
  for (int i = 0; i < 3; i++) {
    digitalWrite(LED_NO_PIN, HIGH);
    delay(300);
    digitalWrite(LED_NO_PIN, LOW);
    delay(300);
  }
  Serial.println("Test LED rouge termine.\n");
}

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("\n=================================");
  Serial.println("  TEST COMPOSANTS - SecurityApp");
  Serial.println("=================================");

#if TEST_BUZZER
  testBuzzer();
#endif
#if TEST_SERVO
  testServo();
#endif
#if TEST_LED_OK
  testLedOk();
#endif
#if TEST_LED_NO
  testLedNo();
#endif

  Serial.println("Tous les tests sont termines.");
  Serial.println("Redemarrez pour repeter. Changez TEST_xxx a 1 pour tester d'autres composants.");
}

void loop() {
  // Ne rien faire
  delay(5000);
}

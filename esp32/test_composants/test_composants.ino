/*
 * Test interactif de tous les composants - SecurityApp ESP32
 *
 * Broches (identiques à security_door.ino + capteur) :
 *   LED verte     GPIO 12
 *   LED rouge     GPIO 14
 *   Servo signal  GPIO 13
 *   Buzzer        GPIO 27 (via transistor NPN)
 *   Empreinte RX  GPIO 16  <- fil TX du capteur
 *   Empreinte TX  GPIO 17  -> fil RX du capteur
 *
 * Bibliothèques Arduino (Gestionnaire) :
 *   - ESP32Servo
 *   - Adafruit Fingerprint Sensor Library
 *   - Adafruit BusIO
 *
 * Moniteur série : 115200 baud, fin de ligne = Nouvelle ligne
 */

#include <ESP32Servo.h>
#include <Adafruit_Fingerprint.h>

// UART2 : RX=16, TX=17
HardwareSerial fingerSerial(2);
Adafruit_Fingerprint finger = Adafruit_Fingerprint(&fingerSerial);

const int BUZZER_PIN = 27;
const int SERVO_PIN  = 13;
const int LED_OK_PIN = 12;
const int LED_NO_PIN = 14;

const int FINGER_RX_PIN = 16;
const int FINGER_TX_PIN = 17;

Servo servo;
static bool fingerUartStarted = false;

bool initFingerprint();

void printMenu() {
  Serial.println();
  Serial.println("========== MENU TEST ==========");
  Serial.println("  1 - LED verte (3 clignotements)");
  Serial.println("  2 - LED rouge (3 clignotements)");
  Serial.println("  3 - Buzzer (3 bips)");
  Serial.println("  4 - Servo (ferme -> ouvre -> ferme)");
  Serial.println("  5 - Capteur : test connexion");
  Serial.println("  6 - Capteur : enregistrer doigt (choix du slot)");
  Serial.println("  7 - Capteur : verifier doigt");
  Serial.println("  9 - Capteur : lister les slots enregistres");
  Serial.println("  0 - Capteur : effacer TOUTES les empreintes");
  Serial.println("  8 - Tout tester (1 a 5, sans enregistrement)");
  Serial.println("  m - Afficher ce menu");
  Serial.println("==============================");
  Serial.print("Choix : ");
}

void refreshTemplateCount() {
  uint8_t r = finger.getTemplateCount();
  if (r != FINGERPRINT_OK) {
    Serial.print("getTemplateCount erreur 0x");
    Serial.println(r, HEX);
  }
}

bool slotOccupied(uint16_t id) {
  return finger.loadModel(id) == FINGERPRINT_OK;
}

void listStoredTemplates() {
  Serial.println("\n--- SLOTS ENREGISTRES ---");
  if (!initFingerprint()) return;
  refreshTemplateCount();
  Serial.print("Compteur capteur : ");
  Serial.println(finger.templateCount);

  int found = 0;
  for (uint16_t i = 1; i <= 32; i++) {
    if (slotOccupied(i)) {
      Serial.print("  slot ");
      Serial.println(i);
      found++;
    }
  }
  if (found == 0) {
    Serial.println("  (aucun slot avec donnees - refaites le test 6)");
  }
}

void clearAllTemplates() {
  Serial.println("\n--- EFFACER TOUTES LES EMPREINTES ---");
  if (!initFingerprint()) return;
  if (finger.emptyDatabase() == FINGERPRINT_OK) {
    refreshTemplateCount();
    Serial.println("Memoire capteur videe.");
    Serial.print("Compteur : ");
    Serial.println(finger.templateCount);
  } else {
    Serial.println("Echec emptyDatabase");
  }
}

void setupPins() {
  pinMode(LED_OK_PIN, OUTPUT);
  pinMode(LED_NO_PIN, OUTPUT);
  pinMode(BUZZER_PIN, OUTPUT);
  digitalWrite(LED_OK_PIN, LOW);
  digitalWrite(LED_NO_PIN, LOW);
  digitalWrite(BUZZER_PIN, LOW);
}

void beep(int ms) {
  digitalWrite(BUZZER_PIN, HIGH);
  delay(ms);
  digitalWrite(BUZZER_PIN, LOW);
}

void testLedOk() {
  Serial.println("\n--- LED VERTE ---");
  for (int i = 0; i < 3; i++) {
    digitalWrite(LED_OK_PIN, HIGH);
    delay(300);
    digitalWrite(LED_OK_PIN, LOW);
    delay(300);
  }
  Serial.println("OK");
}

void testLedNo() {
  Serial.println("\n--- LED ROUGE ---");
  for (int i = 0; i < 3; i++) {
    digitalWrite(LED_NO_PIN, HIGH);
    delay(300);
    digitalWrite(LED_NO_PIN, LOW);
    delay(300);
  }
  Serial.println("OK");
}

void testBuzzer() {
  Serial.println("\n--- BUZZER ---");
  beep(200);
  delay(300);
  beep(200);
  delay(300);
  beep(500);
  Serial.println("OK");
}

void testServo() {
  Serial.println("\n--- SERVO ---");
  Serial.println("Mouvement : 0° -> 90° -> 0°");
  servo.attach(SERVO_PIN, 500, 2400);
  servo.write(0);
  delay(800);
  servo.write(90);
  delay(1500);
  servo.write(0);
  delay(800);
  servo.detach();
  Serial.println("OK");
}

bool initFingerprint() {
  if (!fingerUartStarted) {
    fingerSerial.begin(57600, SERIAL_8N1, FINGER_RX_PIN, FINGER_TX_PIN);
    delay(300);
    finger.begin(57600);
    fingerUartStarted = true;
  }
  if (!finger.verifyPassword()) {
    Serial.println("ERREUR : capteur non detecte ou mauvais cablage TX/RX.");
    Serial.println("  TX capteur -> GPIO 16, RX capteur -> GPIO 17");
    Serial.println("  3V3 + T-3V3 -> 3V3 (obligatoire), GND -> GND");
    Serial.println("  T-OUT : optionnel (peut rester debranche)");
    return false;
  }
  finger.getParameters();
  refreshTemplateCount();
  return true;
}

void testFingerprintConnection() {
  Serial.println("\n--- CAPTEUR EMPREINTE (connexion) ---");
  if (!initFingerprint()) return;

  finger.getParameters();
  Serial.print("Capteur OK. Capacite : ");
  Serial.print(finger.capacity);
  Serial.println(" empreintes.");
  Serial.print("Empreintes enregistrees : ");
  Serial.println(finger.templateCount);
  Serial.println("Posez un doigt pour test lecture (5 s)...");

  unsigned long start = millis();
  while (millis() - start < 5000) {
    uint8_t r = finger.getImage();
    if (r == FINGERPRINT_OK) {
      Serial.println("Doigt detecte : lecture OK.");
      finger.LEDcontrol(FINGERPRINT_LED_ON, 0, FINGERPRINT_LED_BLUE);
      delay(300);
      finger.LEDcontrol(FINGERPRINT_LED_OFF, 0, FINGERPRINT_LED_BLUE);
      return;
    }
    if (r == FINGERPRINT_NOFINGER) {
      delay(50);
      continue;
    }
    Serial.print("Code erreur getImage : 0x");
    Serial.println(r, HEX);
    return;
  }
  Serial.println("Timeout : aucun doigt detecte (normal si vous n'avez pas pose le doigt).");
}

// bufferId : 1 ou 2 pour l enregistrement (createModel compare 1 et 2)
uint8_t waitFingerAndConvert(int bufferId) {
  Serial.println("Posez le doigt au centre du capteur, appuyez legerement...");
  unsigned long start = millis();
  while (finger.getImage() != FINGERPRINT_OK) {
    if (millis() - start > 15000) {
      Serial.println("Timeout : aucun doigt detecte.");
      return FINGERPRINT_TIMEOUT;
    }
    delay(50);
  }
  uint8_t r = finger.image2Tz(bufferId);
  if (r != FINGERPRINT_OK) {
    Serial.print("Echec conversion (buffer ");
    Serial.print(bufferId);
    Serial.print(") code 0x");
    Serial.println(r, HEX);
  }
  return r;
}

void waitFingerRemoved() {
  Serial.println("Retirez le doigt du capteur...");
  unsigned long start = millis();
  while (finger.getImage() != FINGERPRINT_NOFINGER) {
    if (millis() - start > 10000) {
      Serial.println("(timeout retrait, on continue)");
      break;
    }
    delay(50);
  }
  delay(800);
}

uint8_t readFingerImage() {
  return waitFingerAndConvert(1);
}

uint16_t readSlotIdFromSerial() {
  Serial.println("Numero de slot (1-127) puis Entree — meme numero que l app :");
  Serial.print("Slot : ");
  unsigned long start = millis();
  String input = "";
  while (millis() - start < 60000) {
    while (Serial.available()) {
      char c = Serial.read();
      if (c == '\n' || c == '\r') {
        if (input.length() == 0) return 1;
        int id = input.toInt();
        if (id >= 1 && id <= 127) return (uint16_t)id;
        Serial.println("Invalide, utilisez 1-127. Recommencez.");
        input = "";
        Serial.print("Slot : ");
        continue;
      }
      if (c >= '0' && c <= '9') input += c;
    }
    delay(10);
  }
  Serial.println("(timeout, slot 1 par defaut)");
  return 1;
}

void testFingerprintEnroll() {
  Serial.println("\n--- CAPTEUR : ENREGISTREMENT ---");
  if (!initFingerprint()) return;

  const uint16_t id = readSlotIdFromSerial();
  Serial.print("Enregistrement dans le slot ");
  Serial.println(id);
  finger.deleteModel(id);

  Serial.println("IMPORTANT : le MEME doigt aux 2 scans (pas deux doigts differents).");
  Serial.println("Branchez T-3V3 sur 3V3 (T-OUT peut rester debranche).");
  Serial.println("");

  for (int attempt = 1; attempt <= 3; attempt++) {
    if (attempt > 1) {
      Serial.print("Nouvelle tentative ");
      Serial.print(attempt);
      Serial.println("/3...");
    }

    Serial.println("Etape 1/2 : premier scan");
    if (waitFingerAndConvert(1) != FINGERPRINT_OK) continue;

    waitFingerRemoved();

    Serial.println("Etape 2/2 : second scan (meme doigt, meme angle)");
    if (waitFingerAndConvert(2) != FINGERPRINT_OK) continue;

    uint8_t r = finger.createModel();
    if (r != FINGERPRINT_OK) {
      Serial.println("Les deux scans ne correspondent pas.");
      Serial.println("Reessayez : ne bougez pas le doigt, couvrez bien le capteur.");
      waitFingerRemoved();
      continue;
    }

    r = finger.storeModel(id);
    if (r != FINGERPRINT_OK) {
      Serial.print("Echec stockage, code 0x");
      Serial.println(r, HEX);
      continue;
    }

    refreshTemplateCount();
    if (!slotOccupied(id)) {
      Serial.println("ERREUR : slot vide apres stockage. Reessayez.");
      continue;
    }

    Serial.print("OK - Empreinte enregistree, slot ");
    Serial.print(id);
    Serial.print(" (total capteur : ");
    Serial.print(finger.templateCount);
    Serial.println(")");
    Serial.println("Faites le test 9 pour lister, puis 7 pour verifier.");
    digitalWrite(LED_OK_PIN, HIGH);
    beep(200);
    delay(500);
    digitalWrite(LED_OK_PIN, LOW);
    return;
  }

  Serial.println("Echec apres 3 tentatives.");
}

void testFingerprintVerify() {
  Serial.println("\n--- CAPTEUR : VERIFICATION ---");
  if (!initFingerprint()) return;

  refreshTemplateCount();
  Serial.print("Empreintes en memoire (compteur) : ");
  Serial.println(finger.templateCount);
  listStoredTemplates();

  bool anySlot = false;
  for (uint16_t i = 1; i <= 32; i++) {
    if (slotOccupied(i)) {
      anySlot = true;
      break;
    }
  }
  if (!anySlot) {
    Serial.println("Aucun slot charge. Test 0 puis 6 pour re-enregistrer.");
    return;
  }

  Serial.println("Posez le doigt (celui enregistre au test 6)...");
  if (readFingerImage() != FINGERPRINT_OK) return;

  uint8_t r = finger.fingerFastSearch();
  if (r != FINGERPRINT_OK) {
    Serial.println("Empreinte NON reconnue.");
    digitalWrite(LED_NO_PIN, HIGH);
    beep(100);
    delay(100);
    beep(100);
    delay(300);
    digitalWrite(LED_NO_PIN, LOW);
    return;
  }

  Serial.print("Empreinte reconnue ! ID = ");
  Serial.print(finger.fingerID);
  Serial.print(", score = ");
  Serial.println(finger.confidence);
  digitalWrite(LED_OK_PIN, HIGH);
  beep(300);
  delay(500);
  digitalWrite(LED_OK_PIN, LOW);
}

void testAllBasic() {
  testLedOk();
  testLedNo();
  testBuzzer();
  testServo();
  testFingerprintConnection();
  Serial.println("\n--- Suite de tests de base terminee ---");
}

void handleChoice(char c) {
  switch (c) {
    case '1': testLedOk(); break;
    case '2': testLedNo(); break;
    case '3': testBuzzer(); break;
    case '4': testServo(); break;
    case '5': testFingerprintConnection(); break;
    case '6': testFingerprintEnroll(); break;
    case '7': testFingerprintVerify(); break;
    case '9': listStoredTemplates(); break;
    case '0': clearAllTemplates(); break;
    case '8': testAllBasic(); break;
    case 'm':
    case 'M':
      printMenu();
      return;
    default:
      if (c != '\n' && c != '\r') {
        Serial.print("Choix inconnu : ");
        Serial.println(c);
      }
      return;
  }
  printMenu();
}

void setup() {
  Serial.begin(115200);
  delay(500);
  setupPins();

  Serial.println();
  Serial.println("SecurityApp - Test composants");
  Serial.println("Vitesse moniteur : 115200");
  printMenu();
}

void loop() {
  if (Serial.available()) {
    char c = Serial.read();
    handleChoice(c);
  }
}

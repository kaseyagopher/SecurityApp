/*
 * SecurityApp - Porte securisee (capteur empreinte R03 sur la porte)
 *
 * Flux principal : doigt sur le capteur -> identification -> ouverture si autorise
 * HTTP : statut, alarme, ouverture a distance (admin / secours)
 *
 * Câblage :
 *   Servo signal     GPIO 13
 *   LED verte        GPIO 12 (+ 330 ohm)
 *   LED rouge        GPIO 14 (+ 330 ohm)
 *   Buzzer           GPIO 27 (via transistor NPN)
 *   Capteur TX       -> GPIO 16 (RX2)
 *   Capteur RX       <- GPIO 17 (TX2)
 *   Capteur 3V3 + T-3V3 -> 3V3 ESP32
 *
 * Bibliotheques Arduino :
 *   ESP32Servo, Adafruit Fingerprint Sensor Library, Adafruit BusIO, HTTPClient
 *
 * Phase 3 : slots autorises et historique via le serveur Node (voir server/README.md)
 */

#include <WiFi.h>
#include <WebServer.h>
#include <HTTPClient.h>
#include <ESPmDNS.h>
#include <ESP32Servo.h>
#include <Adafruit_Fingerprint.h>

// -------- WiFi (a configurer) --------
const char* WIFI_SSID     = "TECHNO POP 10C";
const char* WIFI_PASSWORD = "live.net";

// -------- Serveur Node (phase 3) — IP du PC qui lance "npm start", meme WiFi --------
#define USE_BACKEND     1
const char* BACKEND_HOST    = "192.168.177.108";    // ← IP du PC (ipconfig), pas l ESP32
const uint16_t BACKEND_PORT = 3001;
const char* ESP32_API_KEY   = "change-me-esp32-key";  // = ESP32_API_KEY dans server/.env

// -------- Composants (0 = non branche) --------
#define USE_LEDS        1
#define USE_BUZZER      1
#define USE_FINGERPRINT 1

// -------- Broches --------
const int SERVO_PIN      = 13;
const int LED_OK_PIN     = 12;
const int LED_NO_PIN     = 14;
const int BUZZER_PIN     = 27;
const int FINGER_RX_PIN  = 16;
const int FINGER_TX_PIN  = 17;

// -------- Servo --------
const int SERVO_LOCKED   = 180;
const int SERVO_UNLOCKED = 90;
const int DOOR_OPEN_MS   = 10000;  // porte ouverte 10 s
const int SERVO_STEP_DEG = 2;      // pas par cran (mouvement progressif)
const int SERVO_STEP_MS  = 30;     // delai entre chaque cran

// -------- Securite --------
const int MAX_FAILED_ATTEMPTS = 3;
const unsigned long DENY_LED_MS = 800;
const unsigned long FINGER_POLL_MS = 80;
const unsigned long ALARM_AUTO_STOP_MS = 180000;  // 3 min max (evite blocage)
const unsigned long SLOT_SYNC_MS = 300000;        // resync slots toutes les 5 min

#define MAX_AUTH_SLOTS 16
const uint8_t FALLBACK_SLOTS[] = {1};
const size_t FALLBACK_SLOT_COUNT = sizeof(FALLBACK_SLOTS) / sizeof(FALLBACK_SLOTS[0]);

uint8_t authorizedSlots[MAX_AUTH_SLOTS];
size_t authorizedSlotCount = 0;
bool backendReachable = false;
unsigned long lastSlotSync = 0;

// -------- Globales --------
WebServer server(80);
Servo servo;
int currentServoAngle = SERVO_LOCKED;

void pollSerialCommands();
void processAlarmBuzzer();

#if USE_FINGERPRINT
HardwareSerial fingerSerial(2);
Adafruit_Fingerprint finger = Adafruit_Fingerprint(&fingerSerial);
bool fingerReady = false;
uint16_t lastMatchedId = 0;
uint16_t lastConfidence = 0;

bool slotHasTemplate(uint16_t id) {
  return finger.loadModel(id) == FINGERPRINT_OK;
}

void refreshTemplateCount() {
  finger.getTemplateCount();
}
#endif

bool alarmActive = false;
unsigned long alarmStartedAt = 0;
int failedAttempts = 0;
unsigned long lastBeepMillis = 0;
bool beepOn = false;
const unsigned long BEEP_ON_MS = 300;
const unsigned long BEEP_OFF_MS = 200;
unsigned long lastFingerPoll = 0;

String lastEvent = "idle";  // idle | granted | denied | remote_open

// -------- Serveur backend (phase 3) --------
#if USE_BACKEND
String buildBackendUrl(const char* path) {
  String url = "http://";
  url += BACKEND_HOST;
  url += ":";
  url += BACKEND_PORT;
  url += path;
  return url;
}

bool parseSlotsFromResponse(const String& json) {
  int bracket = json.indexOf('[');
  if (bracket < 0) return false;
  int endBracket = json.indexOf(']', bracket);
  if (endBracket < 0) return false;

  authorizedSlotCount = 0;
  for (int p = bracket + 1; p < endBracket && authorizedSlotCount < MAX_AUTH_SLOTS; ) {
    while (p < endBracket && (json[p] == ' ' || json[p] == ',')) p++;
    if (p >= endBracket) break;
    int start = p;
    while (p < endBracket && isDigit(json[p])) p++;
    if (p > start) {
      authorizedSlots[authorizedSlotCount++] =
          (uint8_t)json.substring(start, p).toInt();
    } else {
      p++;
    }
  }
  return true;
}

void printAuthorizedSlots(const char* label) {
  Serial.print(label);
  Serial.print(" : [");
  for (size_t i = 0; i < authorizedSlotCount; i++) {
    if (i > 0) Serial.print(", ");
    Serial.print(authorizedSlots[i]);
  }
  Serial.println("]");
}

void applyFallbackSlots() {
  authorizedSlotCount = FALLBACK_SLOT_COUNT;
  for (size_t i = 0; i < FALLBACK_SLOT_COUNT; i++) {
    authorizedSlots[i] = FALLBACK_SLOTS[i];
  }
}

bool postBackendEvent(const char* event, uint16_t slotId, uint16_t confidence) {
  if (WiFi.status() != WL_CONNECTED) return false;

  HTTPClient http;
  http.begin(buildBackendUrl("/api/esp32/events"));
  http.addHeader("Content-Type", "application/json");
  http.addHeader("X-ESP32-Key", ESP32_API_KEY);
  http.setTimeout(4000);

  String body = "{\"event\":\"";
  body += event;
  body += "\"";
  if (strcmp(event, "granted") == 0 || strcmp(event, "denied") == 0) {
    body += ",\"slot_id\":";
    body += slotId;
    if (confidence > 0) {
      body += ",\"confidence\":";
      body += confidence;
    }
  }
  body += "}";

  int code = http.POST(body);
  http.end();

  if (code >= 200 && code < 300) {
    Serial.print("Serveur OK : ");
    Serial.println(event);
    return true;
  }
  Serial.print("Serveur event HTTP ");
  Serial.print(code);
  Serial.print(" (");
  Serial.print(event);
  Serial.println(")");
  return false;
}

bool fetchAuthorizedSlotsFromServer() {
  if (WiFi.status() != WL_CONNECTED) return false;

  HTTPClient http;
  http.begin(buildBackendUrl("/api/esp32/authorized-slots"));
  http.addHeader("X-ESP32-Key", ESP32_API_KEY);
  http.setTimeout(5000);

  int code = http.GET();
  if (code != 200) {
    Serial.print("Sync slots HTTP ");
    Serial.println(code);
    http.end();
    backendReachable = false;
    return false;
  }

  String payload = http.getString();
  http.end();

  if (!parseSlotsFromResponse(payload)) {
    Serial.println("Sync slots : JSON invalide");
    backendReachable = false;
    return false;
  }

  backendReachable = true;
  return true;
}

void syncAuthorizedSlotsFromServer() {
#if !USE_BACKEND
  applyFallbackSlots();
  return;
#endif

  Serial.print("Sync serveur http://");
  Serial.print(BACKEND_HOST);
  Serial.print(":");
  Serial.print(BACKEND_PORT);
  Serial.println(" ...");

  if (fetchAuthorizedSlotsFromServer()) {
    if (authorizedSlotCount > 0) {
      printAuthorizedSlots("Slots serveur");
    } else {
      Serial.println("Serveur : 0 slot actif -> fallback local");
      applyFallbackSlots();
      printAuthorizedSlots("Slots fallback");
    }
  } else {
    if (authorizedSlotCount == 0) {
      applyFallbackSlots();
    }
    printAuthorizedSlots("Slots fallback (serveur HS)");
  }
  lastSlotSync = millis();
}

void maybeResyncSlots() {
#if USE_BACKEND
  if (millis() - lastSlotSync >= SLOT_SYNC_MS) {
    syncAuthorizedSlotsFromServer();
  }
#endif
}
#else
void applyFallbackSlots() {
  authorizedSlotCount = FALLBACK_SLOT_COUNT;
  for (size_t i = 0; i < FALLBACK_SLOT_COUNT; i++) {
    authorizedSlots[i] = FALLBACK_SLOTS[i];
  }
}
void syncAuthorizedSlotsFromServer() { applyFallbackSlots(); }
void maybeResyncSlots() {}
bool postBackendEvent(const char*, uint16_t, uint16_t) { return false; }
#endif

// -------- Utilitaires materiel --------
void setupPins() {
#if USE_LEDS
  pinMode(LED_OK_PIN, OUTPUT);
  pinMode(LED_NO_PIN, OUTPUT);
  digitalWrite(LED_OK_PIN, LOW);
  digitalWrite(LED_NO_PIN, LOW);
#endif

#if USE_BUZZER
  pinMode(BUZZER_PIN, OUTPUT);
  digitalWrite(BUZZER_PIN, LOW);
#endif

  servo.attach(SERVO_PIN, 500, 2400);
  currentServoAngle = SERVO_LOCKED;
  servo.write(currentServoAngle);
}

void maintainServices() {
  pollSerialCommands();
  server.handleClient();
  processAlarmBuzzer();
}

void moveServoSmooth(int targetAngle) {
  targetAngle = constrain(targetAngle, 0, 180);
  if (targetAngle == currentServoAngle) return;

  const int step = (targetAngle > currentServoAngle) ? SERVO_STEP_DEG : -SERVO_STEP_DEG;

  while (currentServoAngle != targetAngle) {
    int next = currentServoAngle + step;
    if ((step > 0 && next >= targetAngle) || (step < 0 && next <= targetAngle)) {
      next = targetAngle;
    }
    currentServoAngle = next;
    servo.write(currentServoAngle);
    maintainServices();
    if (currentServoAngle == targetAngle) break;
    delay(SERVO_STEP_MS);
  }
}

void beep(int ms) {
#if USE_BUZZER
  digitalWrite(BUZZER_PIN, HIGH);
  delay(ms);
  digitalWrite(BUZZER_PIN, LOW);
#else
  (void)ms;
#endif
}

void stopAlarm(const char* reason) {
  if (!alarmActive) {
#if USE_BUZZER
    digitalWrite(BUZZER_PIN, LOW);
#endif
#if USE_LEDS
    digitalWrite(LED_NO_PIN, LOW);
#endif
    return;
  }
  alarmActive = false;
  beepOn = false;
  lastBeepMillis = millis();
#if USE_LEDS
  digitalWrite(LED_NO_PIN, LOW);
#endif
#if USE_BUZZER
  digitalWrite(BUZZER_PIN, LOW);
#endif
  if (reason && reason[0] != '\0') {
    Serial.print("Alarme arretee : ");
    Serial.println(reason);
  }
#if USE_BACKEND
  postBackendEvent("alarm_stop", 0, 0);
#endif
}

void triggerAlarm(const char* reason) {
  alarmActive = true;
  alarmStartedAt = millis();
  lastBeepMillis = millis();
  beepOn = true;
#if USE_BUZZER
  digitalWrite(BUZZER_PIN, HIGH);
#endif
#if USE_LEDS
  digitalWrite(LED_NO_PIN, HIGH);
#endif
  Serial.print("ALARME : ");
  Serial.println(reason ? reason : "inconnue");
  Serial.println("Arret : doigt autorise | touche 's' (serie) | POST /alarm-stop | auto 3 min");
#if USE_BACKEND
  postBackendEvent("alarm", 0, 0);
#endif
}

void pollSerialCommands() {
  while (Serial.available() > 0) {
    char c = Serial.read();
    if (c == 's' || c == 'S' || c == '0') {
      stopAlarm("commande serie");
    }
  }
}

void openDoorSequence() {
#if USE_LEDS
  digitalWrite(LED_NO_PIN, LOW);
  digitalWrite(LED_OK_PIN, HIGH);
#endif
  beep(200);
  Serial.println("Ouverture progressive...");
  moveServoSmooth(SERVO_UNLOCKED);

  unsigned long holdUntil = millis() + DOOR_OPEN_MS;
  while (millis() < holdUntil) {
    maintainServices();
    delay(50);
  }

  Serial.println("Fermeture progressive...");
  moveServoSmooth(SERVO_LOCKED);
#if USE_LEDS
  digitalWrite(LED_OK_PIN, LOW);
#endif
}

void denyFeedback() {
#if USE_LEDS
  digitalWrite(LED_OK_PIN, LOW);
  digitalWrite(LED_NO_PIN, HIGH);
#endif
  beep(100);
  delay(100);
  beep(100);
  delay(DENY_LED_MS);
#if USE_LEDS
  digitalWrite(LED_NO_PIN, LOW);
#endif
}

#if USE_FINGERPRINT
bool initFingerprint() {
  fingerSerial.begin(57600, SERIAL_8N1, FINGER_RX_PIN, FINGER_TX_PIN);
  delay(300);
  finger.begin(57600);
  if (!finger.verifyPassword()) {
    Serial.println("Capteur empreinte : ERREUR");
    Serial.println("  TX capteur -> GPIO 16, RX capteur -> GPIO 17");
    Serial.println("  3V3 + T-3V3 -> 3V3, GND -> GND");
    return false;
  }
  finger.getParameters();
  refreshTemplateCount();
  Serial.print("Capteur OK. Templates en memoire : ");
  Serial.print(finger.templateCount);
  Serial.print(" / ");
  Serial.println(finger.capacity);

  return true;
}

void verifyAuthorizedSlotsOnSensor() {
  Serial.println("Verification empreintes sur capteur :");
  bool ready = false;
  for (size_t i = 0; i < authorizedSlotCount; i++) {
    uint8_t slot = authorizedSlots[i];
    if (slotHasTemplate(slot)) {
      Serial.print("  slot ");
      Serial.print(slot);
      Serial.println(" : OK");
      ready = true;
    } else {
      Serial.print("  slot ");
      Serial.print(slot);
      Serial.println(" : VIDE (test_composants menu 6)");
    }
  }
  if (!ready) {
    Serial.println("ATTENTION : enregistrez une empreinte avant de tester.");
  }
}

bool isSlotAuthorized(uint16_t slotId) {
  if (slotId == 0) return false;
  for (size_t i = 0; i < authorizedSlotCount; i++) {
    if (authorizedSlots[i] == slotId) return true;
  }
  return false;
}

bool captureAndIdentify(uint16_t* outId, uint16_t* outConfidence) {
  if (!fingerReady) return false;

  if (finger.getImage() != FINGERPRINT_OK) return false;

  if (finger.image2Tz(1) != FINGERPRINT_OK) {
    Serial.println("Echec lecture empreinte");
    return false;
  }

  if (finger.fingerFastSearch() != FINGERPRINT_OK) {
    *outId = 0;
    *outConfidence = 0;
    return true;  // doigt lu mais inconnu
  }

  *outId = finger.fingerID;
  *outConfidence = finger.confidence;
  return true;
}

void onAccessGranted(uint16_t slotId, uint16_t confidence) {
  failedAttempts = 0;
  lastMatchedId = slotId;
  lastConfidence = confidence;
  lastEvent = "granted";
  Serial.print("Acces OK - slot ");
  Serial.println(slotId);
#if USE_BACKEND
  postBackendEvent("granted", slotId, confidence);
#endif
  openDoorSequence();
}

void onAccessDenied(uint16_t slotId, uint16_t confidence) {
  lastEvent = "denied";
  lastConfidence = confidence;
  if (slotId > 0) {
    Serial.print("Empreinte connue mais non autorisee - slot ");
    Serial.println(slotId);
  } else {
    Serial.println("Empreinte inconnue");
  }
#if USE_BACKEND
  postBackendEvent("denied", slotId, confidence);
#endif
  denyFeedback();
  failedAttempts++;
  Serial.print("Tentatives echouees: ");
  Serial.println(failedAttempts);
  if (failedAttempts >= MAX_FAILED_ATTEMPTS) {
    failedAttempts = 0;
    triggerAlarm("3 tentatives refusees");
  }
}

bool trySilenceAlarmWithFinger() {
  if (!alarmActive) return false;
  if (finger.getImage() != FINGERPRINT_OK) return false;
  if (finger.image2Tz(1) != FINGERPRINT_OK) return false;
  if (finger.fingerFastSearch() != FINGERPRINT_OK) return false;
  if (!isSlotAuthorized(finger.fingerID)) return false;
  failedAttempts = 0;
  stopAlarm("empreinte autorisee");
  return true;
}

void pollFingerprint() {
  if (!fingerReady) return;

  if (enrollmentInProgress()) {
    pollEnrollment();
    return;
  }

  unsigned long now = millis();
  if (now - lastFingerPoll < FINGER_POLL_MS) return;
  lastFingerPoll = now;

  if (alarmActive) {
    if (trySilenceAlarmWithFinger()) {
      delay(300);
      while (finger.getImage() != FINGERPRINT_NOFINGER) {
        pollSerialCommands();
        server.handleClient();
        processAlarmBuzzer();
        delay(50);
      }
    }
    return;
  }

  uint16_t id = 0;
  uint16_t conf = 0;
  if (!captureAndIdentify(&id, &conf)) return;

  lastConfidence = conf;
  if (id > 0 && isSlotAuthorized(id)) {
    onAccessGranted(id, conf);
  } else {
    onAccessDenied(id, conf);
  }

  // Attendre retrait du doigt
  delay(300);
  while (finger.getImage() != FINGERPRINT_NOFINGER) {
    pollSerialCommands();
    server.handleClient();
    processAlarmBuzzer();
    delay(50);
  }
}

// -------- Enregistrement empreinte (sans changer de sketch) --------
enum EnrollPhase {
  ENROLL_IDLE,
  ENROLL_WAIT_FINGER1,
  ENROLL_WAIT_LIFT,
  ENROLL_WAIT_FINGER2,
  ENROLL_STORING,
  ENROLL_DONE,
  ENROLL_FAILED
};

EnrollPhase enrollPhase = ENROLL_IDLE;
uint16_t enrollSlotId = 0;
uint8_t enrollAttempt = 0;
String enrollMessage = "";
unsigned long enrollPhaseAt = 0;
unsigned long enrollLiftAt = 0;
const unsigned long ENROLL_STEP_TIMEOUT_MS = 25000;
const uint8_t ENROLL_MAX_ATTEMPTS = 3;

bool enrollmentInProgress() {
  return enrollPhase != ENROLL_IDLE && enrollPhase != ENROLL_DONE && enrollPhase != ENROLL_FAILED;
}

const char* enrollPhaseName() {
  switch (enrollPhase) {
    case ENROLL_WAIT_FINGER1: return "wait_finger1";
    case ENROLL_WAIT_LIFT: return "wait_lift";
    case ENROLL_WAIT_FINGER2: return "wait_finger2";
    case ENROLL_STORING: return "storing";
    case ENROLL_DONE: return "done";
    case ENROLL_FAILED: return "failed";
    default: return "idle";
  }
}

void resetEnrollmentIdle() {
  enrollPhase = ENROLL_IDLE;
  enrollSlotId = 0;
  enrollAttempt = 0;
  enrollMessage = "";
}

void failEnrollment(const char* msg) {
  enrollPhase = ENROLL_FAILED;
  enrollMessage = msg;
  Serial.print("Enregistrement echec : ");
  Serial.println(msg);
}

void beginEnrollment(uint16_t slotId) {
  if (!fingerReady) return;
  enrollSlotId = slotId;
  enrollAttempt = 1;
  enrollPhase = ENROLL_WAIT_FINGER1;
  enrollMessage = "Posez le doigt sur le capteur";
  enrollPhaseAt = millis();
  enrollLiftAt = 0;
  finger.deleteModel(slotId);
  refreshTemplateCount();
  Serial.print("Enregistrement demarre, slot ");
  Serial.println(slotId);
}

void pollEnrollment() {
  if (!fingerReady) return;
  if (enrollPhase == ENROLL_IDLE || enrollPhase == ENROLL_DONE || enrollPhase == ENROLL_FAILED) {
    return;
  }

  if (millis() - enrollPhaseAt > ENROLL_STEP_TIMEOUT_MS) {
    if (enrollAttempt < ENROLL_MAX_ATTEMPTS) {
      enrollAttempt++;
      enrollPhase = ENROLL_WAIT_FINGER1;
      enrollMessage = "Nouvelle tentative : posez le doigt";
      enrollPhaseAt = millis();
      finger.deleteModel(enrollSlotId);
      return;
    }
    failEnrollment("Delai depasse");
    return;
  }

  switch (enrollPhase) {
    case ENROLL_WAIT_FINGER1:
      if (finger.getImage() != FINGERPRINT_OK) return;
      if (finger.image2Tz(1) == FINGERPRINT_OK) {
        enrollPhase = ENROLL_WAIT_LIFT;
        enrollMessage = "Retirez le doigt";
        enrollPhaseAt = millis();
        enrollLiftAt = 0;
      }
      break;

    case ENROLL_WAIT_LIFT:
      if (finger.getImage() == FINGERPRINT_NOFINGER) {
        if (enrollLiftAt == 0) enrollLiftAt = millis();
        else if (millis() - enrollLiftAt > 600) {
          enrollPhase = ENROLL_WAIT_FINGER2;
          enrollMessage = "Meme doigt : deuxieme scan";
          enrollPhaseAt = millis();
        }
      } else {
        enrollLiftAt = 0;
      }
      break;

    case ENROLL_WAIT_FINGER2:
      if (finger.getImage() != FINGERPRINT_OK) return;
      if (finger.image2Tz(2) == FINGERPRINT_OK) {
        enrollPhase = ENROLL_STORING;
        enrollMessage = "Enregistrement...";
        enrollPhaseAt = millis();
      }
      break;

    case ENROLL_STORING: {
      uint8_t r = finger.createModel();
      if (r != FINGERPRINT_OK) {
        if (enrollAttempt < ENROLL_MAX_ATTEMPTS) {
          enrollAttempt++;
          enrollPhase = ENROLL_WAIT_FINGER1;
          enrollMessage = "Scans differents : recommencez";
          enrollPhaseAt = millis();
          finger.deleteModel(enrollSlotId);
        } else {
          failEnrollment("Empreintes non identiques");
        }
        break;
      }
      r = finger.storeModel(enrollSlotId);
      if (r != FINGERPRINT_OK) {
        failEnrollment("Echec stockage capteur");
        break;
      }
      refreshTemplateCount();
      enrollPhase = ENROLL_DONE;
      enrollMessage = "Empreinte enregistree";
      enrollPhaseAt = millis();
      Serial.print("Enregistrement OK slot ");
      Serial.println(enrollSlotId);
#if USE_LEDS
      digitalWrite(LED_OK_PIN, HIGH);
      delay(300);
      digitalWrite(LED_OK_PIN, LOW);
#endif
      beep(200);
      syncAuthorizedSlotsFromServer();
      break;
    }

    default:
      break;
  }
}

int parseSlotIdFromBody() {
  if (!server.hasArg("plain")) return -1;
  String body = server.arg("plain");
  int key = body.indexOf("slot_id");
  if (key < 0) return -1;
  int colon = body.indexOf(':', key);
  if (colon < 0) return -1;
  int end = colon + 1;
  while (end < (int)body.length() && (body[end] == ' ' || body[end] == '"')) end++;
  return body.substring(end).toInt();
}

void handleEnrollStart() {
  if (!fingerReady) {
    server.send(503, "application/json", "{\"error\":\"Capteur hors ligne\"}");
    return;
  }
  if (enrollmentInProgress()) {
    server.send(409, "application/json", "{\"error\":\"Enregistrement deja en cours\"}");
    return;
  }
  int slotId = parseSlotIdFromBody();
  if (slotId < 1 || slotId > 127) {
    server.send(400, "application/json", "{\"error\":\"slot_id requis (1-127)\"}");
    return;
  }
  beginEnrollment((uint16_t)slotId);
  String json = "{\"success\":true,\"slot_id\":";
  json += slotId;
  json += ",\"phase\":\"wait_finger1\"}";
  server.send(200, "application/json", json);
}

void handleEnrollStatus() {
  String json = "{\"phase\":\"";
  json += enrollPhaseName();
  json += "\",\"message\":\"";
  json += enrollMessage;
  json += "\",\"slot_id\":";
  json += enrollSlotId;
  json += ",\"attempt\":";
  json += enrollAttempt;
  json += ",\"templates\":";
  json += finger.templateCount;
  json += "}";
  server.send(200, "application/json", json);
}

void handleEnrollCancel() {
  resetEnrollmentIdle();
  server.send(200, "application/json", "{\"success\":true,\"message\":\"Annule\"}");
}

void handleFingerprintDelete() {
  if (!fingerReady) {
    server.send(503, "application/json", "{\"error\":\"Capteur hors ligne\"}");
    return;
  }
  int slotId = parseSlotIdFromBody();
  if (slotId < 1 || slotId > 127) {
    server.send(400, "application/json", "{\"error\":\"slot_id requis (1-127)\"}");
    return;
  }
  if (enrollmentInProgress()) {
    server.send(409, "application/json", "{\"error\":\"Enregistrement en cours\"}");
    return;
  }
  finger.deleteModel((uint16_t)slotId);
  refreshTemplateCount();
  syncAuthorizedSlotsFromServer();
  Serial.print("Slot capteur supprime : ");
  Serial.println(slotId);
  server.send(200, "application/json", "{\"success\":true}");
}

#endif

void processAlarmBuzzer() {
  if (!alarmActive) return;

  if (millis() - alarmStartedAt >= ALARM_AUTO_STOP_MS) {
    stopAlarm("delai maximal (3 min)");
    return;
  }

#if USE_LEDS
  digitalWrite(LED_NO_PIN, HIGH);
#endif

  unsigned long now = millis();
  if (beepOn) {
#if USE_BUZZER
    digitalWrite(BUZZER_PIN, HIGH);
#endif
    if (now - lastBeepMillis >= BEEP_ON_MS) {
      beepOn = false;
      lastBeepMillis = now;
#if USE_BUZZER
      digitalWrite(BUZZER_PIN, LOW);
#endif
    }
  } else {
#if USE_BUZZER
    digitalWrite(BUZZER_PIN, LOW);
#endif
    if (now - lastBeepMillis >= BEEP_OFF_MS) {
      beepOn = true;
      lastBeepMillis = now;
    }
  }
}

// -------- HTTP --------
void handleOpen() {
  if (server.method() != HTTP_POST) {
    server.send(405, "application/json", "{\"error\":\"Method Not Allowed\"}");
    return;
  }
  failedAttempts = 0;
  lastEvent = "remote_open";
  Serial.println("Ouverture a distance (HTTP)");
#if USE_BACKEND
  postBackendEvent("remote_open", 0, 0);
#endif
  openDoorSequence();
  server.send(200, "application/json", "{\"success\":true,\"message\":\"Porte ouverte\"}");
}

void handleStatus() {
  String wifi = WiFi.status() == WL_CONNECTED ? "connected" : "disconnected";
  String alarm = alarmActive ? "active" : "inactive";
#if USE_FINGERPRINT
  String sensor = fingerReady ? "online" : "offline";
  String json = "{";
  json += "\"door\":\"locked\",";
  json += "\"wifi\":\"" + wifi + "\",";
  json += "\"alarm\":\"" + alarm + "\",";
  json += "\"fingerprint\":\"" + sensor + "\",";
  json += "\"templates\":" + String(finger.templateCount) + ",";
  json += "\"last_slot\":" + String(lastMatchedId) + ",";
  json += "\"last_event\":\"" + lastEvent + "\",";
  json += "\"failed_attempts\":" + String(failedAttempts) + ",";
  json += "\"backend\":\"" + String(backendReachable ? "online" : "offline") + "\",";
  json += "\"auth_slot_count\":" + String(authorizedSlotCount);
  json += "}";
  server.send(200, "application/json", json);
#else
  server.send(200, "application/json",
    "{\"door\":\"locked\",\"wifi\":\"" + wifi + "\",\"alarm\":\"" + alarm + "\"}");
#endif
}

void handleAlarm() {
  if (server.method() != HTTP_POST) {
    server.send(405, "application/json", "{\"error\":\"Method Not Allowed\"}");
    return;
  }
  triggerAlarm("manuel");
  server.send(200, "application/json", "{\"success\":true,\"message\":\"Alarme activee\"}");
}

void handleAlarmStop() {
  if (server.method() != HTTP_POST) {
    server.send(405, "application/json", "{\"error\":\"Method Not Allowed\"}");
    return;
  }
  stopAlarm("HTTP");
  server.send(200, "application/json", "{\"success\":true,\"message\":\"Alarme desactivee\"}");
}

void handleRoot() {
  server.send(200, "text/plain",
    "SecurityApp ESP32 - Porte + empreinte.\n"
    "GET /status | POST /open | POST /alarm | POST /alarm-stop\n"
    "POST /fingerprint/enroll | GET /fingerprint/enroll/status\n"
    "POST /fingerprint/delete | POST /fingerprint/enroll/cancel");
}

void setup() {
  Serial.begin(115200);
  delay(500);
  Serial.println();
  Serial.println("=== SecurityApp - Porte + empreinte ===");

  setupPins();

#if USE_FINGERPRINT
  fingerReady = initFingerprint();
  if (!fingerReady) {
    Serial.println("Mode degrade : HTTP seulement (pas de capteur)");
  }
#endif

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Connexion WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println();
  Serial.print("IP ESP32: ");
  Serial.println(WiFi.localIP());

  syncAuthorizedSlotsFromServer();
#if USE_FINGERPRINT
  if (fingerReady) {
    verifyAuthorizedSlotsOnSensor();
  }
#endif

  if (!MDNS.begin("securityapp")) {
    Serial.println("mDNS non demarre");
  }

  server.on("/", HTTP_GET, handleRoot);
  server.on("/open", HTTP_POST, handleOpen);
  server.on("/alarm", HTTP_POST, handleAlarm);
  server.on("/alarm-stop", HTTP_POST, handleAlarmStop);
  server.on("/alarmstop", HTTP_POST, handleAlarmStop);
  server.on("/status", HTTP_GET, handleStatus);
  server.on("/fingerprint/enroll", HTTP_POST, handleEnrollStart);
  server.on("/fingerprint/enroll/status", HTTP_GET, handleEnrollStatus);
  server.on("/fingerprint/enroll/cancel", HTTP_POST, handleEnrollCancel);
  server.on("/fingerprint/delete", HTTP_POST, handleFingerprintDelete);
  server.onNotFound([]() {
    server.send(404, "application/json", "{\"error\":\"Not Found\"}");
  });

  server.begin();
  Serial.println("Pret. Posez un doigt autorise (slots ci-dessus).");
  Serial.println("Serie : touche 's' = arreter l alarme");
}

void loop() {
  pollSerialCommands();
  server.handleClient();
  processAlarmBuzzer();
  maybeResyncSlots();
#if USE_FINGERPRINT
  pollEnrollment();
  pollFingerprint();
#endif
}

/*
 * SecurityApp - Porte sécurisée pilotée par l'app (empreinte téléphone)
 * ESP32 : WiFi + serveur HTTP → Servo (porte), LEDs, Buzzer 5V
 *
 * Câblage typique:
 * - Servo: signal → GPIO 13, VCC → 5V, GND → GND
 * - LED verte (accès OK): GPIO 12 → résistance 330Ω → GND
 * - LED rouge (alerte):   GPIO 14 → résistance 330Ω → GND
 * - Buzzer 5V: GPIO 27 → base transistor NPN (ex. 2N2222) → buzzer entre 5V et collecteur
 *   (L'ESP32 est en 3.3V, ne pas connecter le buzzer 5V directement à une sortie GPIO.)
 */

#include <WiFi.h>
#include <WebServer.h>
#include <ESPmDNS.h>
#include <ESP32Servo.h>

// -------- À CONFIGURER --------
const char* WIFI_SSID     = "A07 de Gopher";
const char* WIFI_PASSWORD = "wifi-1221";

// Mettre à 0 si les composants ne sont pas branchés.
#define USE_LEDS   1   // 1 = LEDs branchées (résistances 330Ω obligatoires)
#define USE_BUZZER 1   // 1 = buzzer branché (transistor NPN ou buzzer 3.3V)

// Broches (adapter à votre câblage)
const int SERVO_PIN   = 13;
const int LED_OK_PIN  = 12;   // LED verte
const int LED_NO_PIN  = 14;   // LED rouge
const int BUZZER_PIN  = 27;   // Buzzer (optionnel)

// Angles servo (à ajuster selon votre montage)
const int SERVO_LOCKED   = 180;   // Porte fermée
const int SERVO_UNLOCKED = 90;  // Porte ouverte
const int DOOR_OPEN_MS   = 5000; // Temps avant de reverrouiller

// Alarme persistante (reste active jusqu'à désactivation)
bool alarmActive = false;
unsigned long lastBeepMillis = 0;
bool beepOn = false;
const unsigned long BEEP_ON_MS = 300;
const unsigned long BEEP_OFF_MS = 200;

// -------- Objets --------
WebServer server(80);
Servo servo;

void setupPins() {
#if USE_LEDS
  pinMode(LED_OK_PIN, OUTPUT);
  pinMode(LED_NO_PIN, OUTPUT);
  digitalWrite(LED_OK_PIN, LOW);
  digitalWrite(LED_NO_PIN, LOW);
#else
  pinMode(LED_OK_PIN, INPUT);
  pinMode(LED_NO_PIN, INPUT);
#endif

#if USE_BUZZER
  pinMode(BUZZER_PIN, OUTPUT);
  digitalWrite(BUZZER_PIN, LOW);
#endif

  // Pour ESP32, on utilise la librairie ESP32Servo (voir Library Manager Arduino)
  // Les valeurs 500–2400 µs couvrent la plupart des servos hobby.
  servo.attach(SERVO_PIN, 500, 2400);
  servo.write(SERVO_LOCKED);
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

void openDoorSequence() {
#if USE_LEDS
  digitalWrite(LED_OK_PIN, HIGH);
#endif
  beep(200);
  servo.write(SERVO_UNLOCKED);

  delay(DOOR_OPEN_MS);

  servo.write(SERVO_LOCKED);
#if USE_LEDS
  digitalWrite(LED_OK_PIN, LOW);
#endif
}

void handleOpen() {
  if (server.method() != HTTP_POST) {
    server.send(405, "application/json", "{\"error\":\"Method Not Allowed\"}");
    return;
  }

  openDoorSequence();
  server.send(200, "application/json", "{\"success\":true,\"message\":\"Porte ouverte\"}");
}

void handleStatus() {
  String wifi = WiFi.status() == WL_CONNECTED ? "connected" : "disconnected";
  String alarm = alarmActive ? "active" : "inactive";
  server.send(200, "application/json",
    "{\"door\":\"locked\",\"wifi\":\"" + wifi + "\",\"alarm\":\"" + alarm + "\"}");
}

void handleAlarm() {
  if (server.method() != HTTP_POST) {
    server.send(405, "application/json", "{\"error\":\"Method Not Allowed\"}");
    return;
  }
  alarmActive = true;
  lastBeepMillis = 0;
  server.send(200, "application/json", "{\"success\":true,\"message\":\"Alarme activée\"}");
}

void handleAlarmStop() {
  if (server.method() != HTTP_POST) {
    server.send(405, "application/json", "{\"error\":\"Method Not Allowed\"}");
    return;
  }
  alarmActive = false;
#if USE_LEDS
  digitalWrite(LED_NO_PIN, LOW);
#endif
#if USE_BUZZER
  digitalWrite(BUZZER_PIN, LOW);
#endif
  server.send(200, "application/json", "{\"success\":true,\"message\":\"Alarme désactivée\"}");
}

void handleRoot() {
  server.send(200, "text/plain", "SecurityApp ESP32 - OK. POST /open pour ouvrir la porte.");
}

void setup() {
  Serial.begin(115200);
  setupPins();

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Connexion WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println();
  Serial.print("IP: ");
  Serial.println(WiFi.localIP());

  if (!MDNS.begin("securityapp")) {
    Serial.println("mDNS non démarré");
  }

  server.on("/", HTTP_GET, handleRoot);
  server.on("/open", HTTP_POST, handleOpen);
  server.on("/alarm", HTTP_POST, handleAlarm);
  server.on("/alarm-stop", HTTP_POST, handleAlarmStop);
  server.on("/alarmstop", HTTP_POST, handleAlarmStop);  // Variante sans tiret
  server.on("/status", HTTP_GET, handleStatus);
  server.onNotFound([]() {
    server.send(404, "application/json", "{\"error\":\"Not Found\"}");
  });

  server.begin();
  Serial.println("Serveur HTTP démarré.");
}

void loop() {
  server.handleClient();

  // Alarme persistante : LED rouge allumée + bip répétitif jusqu'à désactivation
  if (alarmActive) {
#if USE_LEDS
    digitalWrite(LED_NO_PIN, HIGH);
#endif
    unsigned long now = millis();
    if (beepOn) {
      if (now - lastBeepMillis >= BEEP_ON_MS) {
        beepOn = false;
        lastBeepMillis = now;
#if USE_BUZZER
        digitalWrite(BUZZER_PIN, LOW);
#endif
      } else {
#if USE_BUZZER
        digitalWrite(BUZZER_PIN, HIGH);
#endif
      }
    } else { 
      if (now - lastBeepMillis >= BEEP_OFF_MS) {
        beepOn = true;
        lastBeepMillis = now;
      }
    }
  }
}

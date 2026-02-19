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

// Sans résistances ni transistor ? Mettez les deux à 0 : seul le servo est branché.
#define USE_LEDS   0   // 1 = LEDs branchées (il faut des résistances 330Ω)
#define USE_BUZZER 0   // 1 = buzzer branché (transistor ou buzzer 3.3V)

// Broches (adapter à votre câblage)
const int SERVO_PIN   = 13;
const int LED_OK_PIN  = 12;   // LED verte
const int LED_NO_PIN  = 14;   // LED rouge
const int BUZZER_PIN  = 27;   // Buzzer (optionnel)

// Angles servo (à ajuster selon votre montage)
const int SERVO_LOCKED   = 0;   // Porte fermée
const int SERVO_UNLOCKED = 90;  // Porte ouverte
const int DOOR_OPEN_MS   = 5000; // Temps avant de reverrouiller

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
  server.send(200, "application/json",
    "{\"door\":\"locked\",\"wifi\":\"" + wifi + "\"}");
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
  server.on("/status", HTTP_GET, handleStatus);
  server.onNotFound([]() {
    server.send(404, "application/json", "{\"error\":\"Not Found\"}");
  });

  server.begin();
  Serial.println("Serveur HTTP démarré.");
}

void loop() {
  server.handleClient();
}

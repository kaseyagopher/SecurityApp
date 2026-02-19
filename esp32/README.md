# ESP32 – Porte sécurisée (SecurityApp)

Ce dossier contient le programme Arduino à flasher sur l’**ESP32** pour piloter la porte (servo), les LEDs et le buzzer. L’app mobile envoie une requête HTTP après validation de l’empreinte (ou Face ID) du téléphone.

## Matériel

- **ESP32** (avec WiFi)
- **Servo** (porte / verrou)
- **LEDs** (ex. verte = accès OK, rouge = alerte)
- **Buzzer 5V** (à brancher via un transistor, l’ESP32 est en 3,3 V)

## Câblage (à adapter)

| Composant | GPIO  | Remarque |
|-----------|--------|-----------|
| Servo (signal) | 13 | Alimentation 5 V séparée si besoin |
| LED verte      | 12 | + résistance ~330 Ω |
| LED rouge      | 14 | + résistance ~330 Ω |
| Buzzer         | 27 | Via transistor (NPN) pour buzzer 5 V |

## Configuration

1. Ouvrir `security_door/security_door.ino` dans l’IDE Arduino (ou Platform IO).
2. Carte : **ESP32 Dev Module** (ou la vôtre).
3. Dans le sketch, modifier :
   - `WIFI_SSID` et `WIFI_PASSWORD` (votre réseau WiFi).
   - Broches et angles du servo si besoin (`SERVO_LOCKED`, `SERVO_UNLOCKED`, `DOOR_OPEN_MS`).
4. Téléverser le sketch sur l’ESP32.
5. Ouvrir le moniteur série (115200 bauds) pour afficher l’**adresse IP** de l’ESP32.

## Configuration de l’app

Dans le projet React Native / Expo, éditer **`config/esp32.ts`** et mettre l’IP affichée par l’ESP32 dans `baseUrl`, par exemple :

```ts
baseUrl: 'http://192.168.1.100'
```

L’app et l’ESP32 doivent être sur le **même réseau WiFi** (ou réseau routé).

## API exposée par l’ESP32

- **POST /open** : ouvre la porte (servo + LED verte + bip), puis referme après quelques secondes. C’est ce que l’app appelle après validation de l’empreinte.
- **GET /status** : renvoie l’état (porte, WiFi) en JSON.
- **GET /** : message de test.

## Empreinte du téléphone

L’ouverture se fait en deux temps :

1. L’utilisateur appuie sur « Scanner maintenant » dans l’app.
2. Le téléphone affiche **Touch ID** ou **Face ID** (selon l’appareil).
3. Si la biométrie réussit, l’app envoie **POST /open** à l’ESP32, qui actionne le servo, les LEDs et le buzzer.

Aucun capteur d’empreinte physique n’est nécessaire sur la porte : l’authentification est faite sur le téléphone, la commande est envoyée en WiFi à l’ESP32.

# security_door.ino — Phases 1–3

## Comportement

1. **Doigt sur le capteur R03** → identification
2. **Slot autorise** → ouverture **progressive**, maintien **10 s**, fermeture **progressive**
3. **Refus** → LED rouge ; **3 echecs** → alarme
4. **Historique** : chaque acces est envoye au serveur (`POST /api/esp32/events`)

### Arreter l alarme

Doigt autorise | touche **`s`** (serie) | `POST /alarm-stop` | auto 3 min

## Configuration (sketch)

```cpp
// WiFi
const char* WIFI_SSID = "...";
const char* WIFI_PASSWORD = "...";

// Serveur (IP du PC qui lance npm start — ipconfig)
const char* BACKEND_HOST = "10.78.217.97";
const uint16_t BACKEND_PORT = 3001;
const char* ESP32_API_KEY = "...";  // identique a server/.env
```

`USE_BACKEND 1` : slots depuis le serveur. Si le serveur est down : **fallback** slot `{1}`.

## Flash

Bibliotheques : **ESP32Servo**, **Adafruit Fingerprint**, **Adafruit BusIO**, **HTTPClient** (inclus ESP32).

1. Televerser le sketch
2. Moniteur serie **115200**
3. Verifier :
   - `Slots serveur : [1]` (ou fallback)
   - `Serveur OK : granted` apres un acces reussi

## Tester la phase 3

1. `cd server` → `npm start` (PC sur le **meme WiFi** que l ESP32)
2. Slot assigne : `POST /api/fingerprint-slots` ou interface admin plus tard
3. Ouvrir avec le doigt → dans l historique serveur :
   ```powershell
   Invoke-RestMethod http://localhost:3001/api/history -Headers @{ Authorization = "Bearer TOKEN" }
   ```
4. `http://IP_ESP32/status` → `"backend":"online"`, `"auth_slot_count":1`

## Depannage

| Probleme | Piste |
|----------|--------|
| `Sync slots HTTP -1` | Mauvaise `BACKEND_HOST` (IP PC), serveur arrete, ou pare-feu Windows |
| `Serveur event HTTP 401` | `ESP32_API_KEY` different entre sketch et `server/.env` |
| Fallback local seulement | Normal si le PC est eteint ; la porte utilise `{1}` |

## Phase 4

App mobile (`USE_MOCKS = false`) branchée sur le meme serveur.

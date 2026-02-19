# Carte branchée : quoi faire maintenant ?

## 1. Configurer le WiFi dans le sketch

Ouvre **`security_door/security_door.ino`** dans l’IDE Arduino et modifie ces deux lignes (vers le haut du fichier) :

```cpp
const char* WIFI_SSID     = "LeNomDeTonWiFi";
const char* WIFI_PASSWORD = "TonMotDePasseWiFi";
```

Enregistre le fichier (Ctrl+S).

---

## 2. Choisir la carte et le port

- **Outil** → **Carte** → choisis **ESP32 Dev Module** (ou ta carte ESP32).
- **Outil** → **Port** → choisis le port où l’ESP32 est branché (ex. COM3, COM4 sous Windows ; /dev/cu.usb... sous Mac).

Si le port n’apparaît pas, installe le pilote USB du câble (CP2102, CH340, etc.) ou vérifie que le câble transmet les données (pas un câble charge-only).

---

## 3. Téléverser le programme sur l’ESP32

- Clique sur le bouton **Téléverser** (flèche →) dans l’IDE Arduino.
- Attends la fin du téléversement (« Le téléversement est terminé »).

---

## 4. Récupérer l’adresse IP de l’ESP32

- Ouvre le **Moniteur série** : **Outils** → **Moniteur série**.
- Règle la **vitesse** sur **115200** (en bas à droite).
- Appuie sur le bouton **RST** (reset) sur l’ESP32 si besoin.
- Tu dois voir quelque chose comme :
  ```
  Connexion WiFi.....
  IP: 192.168.1.42
  Serveur HTTP démarré.
  ```
- **Note l’adresse IP** affichée (ex. `192.168.1.42`).

---

## 5. Mettre l’IP dans l’app

Dans le projet de l’app (Expo / React Native), ouvre **`config/esp32.ts`** et remplace l’IP par celle de ton ESP32 :

```ts
baseUrl: 'http://192.168.1.42',   // ← ton IP ici
```

Enregistre le fichier.

---

## 6. Tester

- L’ESP32 reste alimenté (USB ou alimentation) et connecté au **même WiFi** que ton téléphone.
- Lance l’app sur ton téléphone : `npm start` puis scanne le QR code (Expo) ou lance sur émulateur.
- Va dans l’onglet **Accès**.
- Appuie sur **« Scanner maintenant »** → valide avec ton empreinte ou Face ID.
- Si tout est bon : la requête part vers l’ESP32 et le **servo** doit bouger (porte ouverte puis refermée après quelques secondes).

---

## Dépannage

| Problème | À vérifier |
|----------|------------|
| Le port n’apparaît pas | Pilote USB (CP2102/CH340), câble données, autre prise USB. |
| « Connexion WiFi » sans fin | SSID et mot de passe corrects, WiFi 2,4 GHz (pas 5 GHz uniquement). |
| L’app ne contacte pas la porte | Même WiFi pour téléphone et ESP32 ; IP correcte dans `config/esp32.ts`. |
| Le servo ne bouge pas | Câblage (signal sur GPIO 13, 5 V, GND) ; angles dans le sketch (`SERVO_LOCKED`, `SERVO_UNLOCKED`) si besoin. |

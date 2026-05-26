# Connexion sans tunnel (Wi‑Fi campus)

## Pourquoi ça bloque

Sur beaucoup de Wi‑Fi **école / entreprise**, le routeur fait de l’**isolation client** : chaque appareil ne peut pas parler aux autres, même sur le même Wi‑Fi.  
Résultat : le téléphone n’atteint ni Metro (`8081`) ni l’API (`3001`) sur le PC.

Ce n’est pas un bug de l’app : **le réseau interdit** téléphone → PC. Le tunnel ngrok contourne ça via Internet ; voici des alternatives **sans tunnel**.

---

## Solution 1 — Hotspot du téléphone (la plus simple)

1. Sur le **téléphone** : activer le **partage de connexion** / point d’accès.
2. Sur le **PC** : se connecter au Wi‑Fi du téléphone (pas le Wi‑Fi campus).
3. L’**ESP32** doit aussi être sur ce hotspot (reconfigurer `WIFI_SSID` / mot de passe dans le sketch si besoin).
4. Terminal serveur : `cd server` → `npm start`
5. Terminal app : `npm start` → scanner le QR dans Expo Go.

Téléphone, PC et ESP32 sont sur **un même petit réseau** que vous contrôlez → pas d’isolation.

---

## Solution 2 — Câble USB + `npm run start:usb` (très fiable pour la soutenance)

Pas besoin que le Wi‑Fi campus autorise téléphone → PC : le trafic passe par le **câble USB**.

1. Téléphone Android branché en USB, **débogage USB** activé.
2. Installer [platform-tools adb](https://developer.android.com/tools/releases/platform-commands) si besoin.
3. Terminal 1 : `cd server` → `npm start`
4. Terminal 2 : à la racine → `npm run start:usb`
5. Expo Go : ouvrir `exp://localhost:8081` (souvent proposé automatiquement).

Le script fait `adb reverse` pour les ports **8081** (Expo) et **3001** (API). L’app appelle alors `http://localhost:3001` sur le téléphone, redirigé vers le PC.

**Note :** l’ESP32 reste en Wi‑Fi ; seul le lien **téléphone ↔ PC** passe par USB. PC et ESP32 doivent encore se voir (souvent OK sur le Wi‑Fi campus pour le serveur → ESP32).

---

## Solution 3 — Même Wi‑Fi + pare-feu (si l’école ne isole pas)

1. PC et téléphone sur le **même** Wi‑Fi.
2. `npm start` (ou `npm run start:lan`).
3. **Pare-feu Windows** : autoriser **Node.js** en réseau **privé** (ports 8081 et 3001).
4. Test sur le **navigateur du téléphone** :  
   `http://10.199.43.97:3001/api/health`  
   (remplacez par l’IP du PC affichée par `ipconfig`).

Si ce test **échoue** dans le navigateur du téléphone → isolation Wi‑Fi : utilisez solution 1 ou 2, pas le pare-feu seul.

---

## Solution 4 — Démo sur le PC (secours)

```powershell
npm run start:web
```

L’app s’ouvre dans le navigateur du PC (API + serveur sur la même machine). La **porte / ESP32** se démontre à part (capteur, moniteur série).

---

## Jour de présentation — ordre recommandé

| Priorité | Méthode | Commande app |
|----------|---------|----------------|
| 1 | Hotspot téléphone | `npm start` |
| 2 | USB Android | `npm run start:usb` |
| 3 | Wi‑Fi LAN (si health OK sur téléphone) | `npm start` |
| 4 | Secours | `npm run start:web` |

Serveur : toujours `cd server` → `npm start` en premier.

Comptes : `admin@securityapp.local` / `Admin123!`

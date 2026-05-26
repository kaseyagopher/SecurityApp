# Paramètres réseau et configuration (après clone)

Tout doit pointer vers **deux IP différentes** sur le même Wi‑Fi :

| Appareil | IP actuelle | Rôle |
|----------|-------------|------|
| **PC** (serveur + Expo) | `10.199.43.97` | API port **3001**, Metro port **8081** |
| **ESP32** (porte) | `10.199.43.47` | HTTP port **80** |

Si `ipconfig` affiche une **autre** IP pour le PC, mettez-la partout où c’est indiqué « PC ».

---

## 1. Fichiers à vérifier (identiques partout pour la clé ESP32)

### `server/.env` (créer si absent : `copy .env.example .env`)

```env
PORT=3001
JWT_SECRET=change-me-in-production
ESP32_URL=http://10.199.43.47
ESP32_API_KEY=change-me-esp32-key
```

### `esp32/security_door/security_door.ino`

```cpp
const char* WIFI_SSID     = "A07 de Gopher";      // votre Wi‑Fi
const char* WIFI_PASSWORD = "wifi-1221";
const char* BACKEND_HOST    = "10.199.43.97";    // IP du PC (ipconfig)
const char* ESP32_API_KEY   = "change-me-esp32-key";  // = server/.env
```

### `config/api.ts`

```ts
const FALLBACK_HOST = '10.199.43.97';  // IP du PC
```

### `config/app.ts`

```ts
export const USE_MOCKS = false;   // true = démo sans serveur
```

### `config/esp32.ts` (optionnel, admin / ouverture directe ESP32)

```ts
baseUrl: 'http://10.199.43.47',
```

---

## 2. Pare-feu Windows (souvent la cause après clone / nouveau dossier)

Le PC doit **accepter** les connexions entrantes sur **3001** et **8081** (réseau **Privé**).

### A. Profil réseau Wi‑Fi

Paramètres → Réseau et Internet → Wi‑Fi → votre réseau → Profil de connectivité → **Privé** (pas « Public »).

### B. Autoriser Node.js (interface graphique)

1. Panneau de configuration → Pare-feu Windows → « Autoriser une application »
2. Cocher **Node.js** pour **Réseau privé** (pas seulement Domaine)
3. Si Node.js n’apparaît pas : « Autoriser une autre application » →  
   `C:\Program Files\nodejs\node.exe`

### C. Règles ports (PowerShell **en administrateur**)

```powershell
New-NetFirewallRule -DisplayName "SecurityApp API" -Direction Inbound -LocalPort 3001 -Protocol TCP -Action Allow -Profile Private
New-NetFirewallRule -DisplayName "SecurityApp Expo" -Direction Inbound -LocalPort 8081 -Protocol TCP -Action Allow -Profile Private
```

---

## 3. Après un clone : commandes une fois

```powershell
cd C:\Users\Gopher\Documents\Codes\SecurityApp
npm install

cd server
npm install
copy .env.example .env
```

---

## 4. Démarrage (comme avant, 2 terminaux)

**Terminal 1 — serveur**

```powershell
cd server
npm start
```

Attendu :

```
SecurityApp API : http://localhost:3001
  → http://10.199.43.97:3001
```

**Terminal 2 — Expo**

```powershell
cd C:\Users\Gopher\Documents\Codes\SecurityApp
npm start
```

Même Wi‑Fi que le PC → Expo Go → QR ou `exp://10.199.43.97:8081`.

---

## 5. Tests obligatoires (dans l’ordre)

| # | Où | URL | OK si |
|---|-----|-----|--------|
| 1 | PC | http://localhost:3001/api/health | `{"ok":true,...}` |
| 2 | PC | http://10.199.43.47/status | JSON capteur |
| 3 | **Téléphone** (Chrome) | http://10.199.43.97:3001/api/health | même JSON |
| 4 | App | Login admin | Accueil sans timeout |

Si **3 échoue** sur le téléphone mais **1 OK** sur le PC → **pare-feu Windows** (script ci-dessous) ou **isolation Wi‑Fi** du campus.  
Si **3 OK** mais l’app timeout → relancer Expo (`npm start`) après le serveur.

### Script pare-feu (ce PC)

PowerShell **administrateur**, à la racine du projet :

```powershell
.\scripts\autoriser-parefeu.ps1
```

Puis retester sur le téléphone : `http://10.199.43.97:3001/api/health`

---

## 6. Erreurs fréquentes

| Message | Cause | Action |
|---------|--------|--------|
| `EADDRINUSE` port 3001 | Serveur déjà lancé | Fermer l’autre terminal ou tuer le processus Node |
| Timeout app | PC injoignable depuis le téléphone | Pare-feu + test 3 ci-dessus |
| `Sync slots HTTP -1` (ESP32) | PC éteint ou mauvais `BACKEND_HOST` | `npm start` dans `server/` |
| `401` clé ESP32 | Clés différentes | Même `ESP32_API_KEY` dans `.env` et `.ino` |

---

## 7. Ce qui a changé par rapport à « avant le clone »

- `USE_MOCKS = false` → l’app **exige** le serveur (avant peut‑être `true` = mocks sans réseau).
- Nouveau chemin du projet → Windows redemande parfois l’autorisation pare-feu pour Node.
- `server/node_modules` à réinstaller (`npm install` dans `server/`).
- IP du PC peut avoir changé (DHCP) → mettre à jour `BACKEND_HOST` et `FALLBACK_HOST`.

Pour revenir au mode démo sans serveur : `USE_MOCKS = true` dans `config/app.ts`.

# SecurityApp — API serveur (Phase 2)

Backend Node.js + SQLite : utilisateurs, **slots empreinte R03**, historique des accès, pont vers l’ESP32.

## Installation

```bash
cd server
npm install
copy .env.example .env
# Editer .env : ESP32_URL, ESP32_API_KEY, JWT_SECRET
npm start
```

La base utilise **sql.js** (pas de module natif) : compatible Node 20+ sous Windows sans Python ni Visual Studio.

Si vous aviez l’erreur `NODE_MODULE_VERSION` avec `better-sqlite3`, refaites `npm install` dans `server/` (dépendance déjà remplacée).

API : `http://localhost:3001`

## Comptes démo (base vide)

| Email | Mot de passe |
|-------|----------------|
| admin@securityapp.local | Admin123! |
| marie@demo.local | User123! |

Au premier lancement, **slot #1** est lié à Marie (à modifier si votre empreinte est sur un autre slot).

## Routes principales

### Auth (app)

- `POST /api/auth/login` — `{ email, password }` → `{ token, user }`

### Admin (header `Authorization: Bearer <token>`)

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/api/users` | Utilisateurs + `fingerprintSlot`, `isAuthorized` |
| GET | `/api/fingerprint-slots` | Liste des assignations slot ↔ user |
| POST | `/api/fingerprint-slots` | `{ user_id, slot_id, label? }` |
| PATCH | `/api/fingerprint-slots/:id` | `{ slot_id?, user_id?, active?, label? }` |
| DELETE | `/api/fingerprint-slots/:id` | Retirer une assignation |
| GET | `/api/history` | Historique (`?limit=50`) |
| GET | `/api/door/status` | Statut ESP32 + slots autorisés |

### ESP32 (header `X-ESP32-Key: <ESP32_API_KEY>`)

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/api/esp32/authorized-slots` | `{ slots: [1, 2], count, updated_at }` |
| POST | `/api/esp32/events` | Enregistrer un événement porte |

Body `POST /api/esp32/events` :

```json
{
  "event": "granted",
  "slot_id": 1,
  "confidence": 120,
  "details": "optionnel"
}
```

`event` : `granted` | `denied` | `alarm` | `alarm_stop` | `remote_open`

## Tests rapides (PowerShell)

```powershell
# Login admin
$login = Invoke-RestMethod -Uri http://localhost:3001/api/auth/login -Method POST -ContentType application/json -Body '{"email":"admin@securityapp.local","password":"Admin123!"}'
$headers = @{ Authorization = "Bearer $($login.token)" }

# Slots autorises (admin)
Invoke-RestMethod -Uri http://localhost:3001/api/fingerprint-slots -Headers $headers

# Slots pour l'ESP32
$key = "change-me-esp32-key"  # comme dans .env
Invoke-RestMethod -Uri http://localhost:3001/api/esp32/authorized-slots -Headers @{ "X-ESP32-Key" = $key }

# Simuler acces OK slot 1
Invoke-RestMethod -Uri http://localhost:3001/api/esp32/events -Method POST -ContentType application/json -Headers @{ "X-ESP32-Key" = $key } -Body '{"event":"granted","slot_id":1,"confidence":95}'

# Historique
Invoke-RestMethod -Uri http://localhost:3001/api/history -Headers $headers
```

## Phase 3 (ESP32)

Dans `security_door.ino` : `BACKEND_HOST` = **IP du PC** (`ipconfig`), `ESP32_API_KEY` = même valeur que dans `.env`.

L’ESP32 appelle au boot `GET /api/esp32/authorized-slots` et après chaque accès `POST /api/esp32/events`.

**Valider** : moniteur série `Slots serveur : [1]` puis `Serveur OK : granted` ; historique visible sur `GET /api/history`.

# Câblage des composants – SecurityApp ESP32

Schéma de branchement pour **ESP32**, **servo**, **LEDs** et **buzzer 5 V**.

---

## Vue d’ensemble des broches

| Composant      | Broche ESP32 | Couleur fil (souvent) | Remarque              |
|----------------|--------------|------------------------|------------------------|
| Servo (signal) | **GPIO 13**  | Orange / Jaune         | Alimentation 5 V à part |
| LED verte      | **GPIO 12**  | -                      | Avec résistance 330 Ω  |
| LED rouge      | **GPIO 14**  | -                      | Avec résistance 330 Ω  |
| Buzzer         | **GPIO 27**  | -                      | Via transistor (voir plus bas) |

Toutes les **GND** des composants vont au **GND** de l’ESP32 (ou d’une alimentation commune).

---

## 0. Je n'ai que les composants (pas de résistances ni transistor)

Dans ce cas, **branche uniquement le servo**. Aucune résistance n'est nécessaire pour lui.

| Fil du servo   | Où le brancher sur l'ESP32 |
|----------------|----------------------------|
| **Orange / Jaune** (signal) | **GPIO 13** |
| **Rouge** (alimentation)    | **5 V** (ou VIN) |
| **Marron / Noir** (masse)   | **GND** |

**Ne branche pas** les LEDs ni le buzzer sans résistances ni transistor : risque d'abîmer l'ESP32 ou les composants.

Dans le code (`security_door.ino`), c'est déjà réglé : **`USE_LEDS 0`** et **`USE_BUZZER 0`**. Rien à modifier. La porte s'ouvrira avec le servo quand tu valides l'empreinte dans l'app.

---

## 1. Servo moteur

Un servo a en général **3 fils** :

- **Marron / Noir** → **GND** (ESP32 ou alimentation)
- **Rouge** → **5 V** (alimentation 5 V, pas la sortie 3,3 V de l’ESP32)
- **Orange / Jaune** (signal) → **GPIO 13** sur l’ESP32

Si le servo consomme beaucoup de courant, alimente-le avec une **alimentation 5 V externe** (ex. bloc 5 V 2 A) en reliant les GND (ESP32 et alimentation) ensemble.

```
  ESP32                    Servo
  ------                    -----
  GPIO 13  ---------------  Signal (orange)
  GND      ---------------  GND (marron)
  5V *     ---------------  VCC (rouge)   * ou alimentation externe 5V
```

---

## 2. LED verte (accès OK) et LED rouge (alerte)

Chaque LED doit être en **série avec une résistance** (environ **330 Ω**) pour limiter le courant. L’ESP32 délivre du 3,3 V ; sans résistance la LED peut griller.

**Polarité** :  
- **Anode** (patte longue, +) vers la **résistance** → **GPIO**  
- **Cathode** (patte courte, -) vers **GND**

**LED verte (accès autorisé)**  
- **GPIO 12** → résistance 330 Ω → **Anode** de la LED verte → **Cathode** → **GND**

**LED rouge (alerte / refus)**  
- **GPIO 14** → résistance 330 Ω → **Anode** de la LED rouge → **Cathode** → **GND**

```
  ESP32                    Résistance 330Ω        LED
  ------                   ----------------       ---
  GPIO 12  ---------------  [ 330Ω ]  ----------  Anode (+)  LED verte
  LED verte cathode  ---------------------------  GND

  GPIO 14  ---------------  [ 330Ω ]  ----------  Anode (+)  LED rouge
  LED rouge cathode  --------------------------  GND
```

---

## 3. Buzzer (optionnel)

### Option A : Sans buzzer (pas de transistor)

Si vous n’avez pas de transistor (ou pas de buzzer), **ne branchez rien** sur le buzzer. Dans le code, le buzzer est déjà désactivé par défaut :

- Dans `security_door.ino`, la ligne **`#define USE_BUZZER 0`** désactive le bip. La porte et les LEDs fonctionnent normalement.

---

### Option B : Buzzer 3,3 V branché directement (sans transistor)

Avec un **petit buzzer actif** qui supporte le 3,3 V (souvent vendu comme "3–5 V") :

- **GPIO 27** → **résistance 100 Ω à 330 Ω** → **patte +** du buzzer → **patte –** → **GND**

Mettez **`#define USE_BUZZER 1`** dans le sketch. Le son peut être un peu plus faible qu’en 5 V, mais ça évite le transistor.

⚠️ **Ne pas** brancher un gros buzzer 5 V directement sur l’ESP32 (risque pour la sortie). En cas de doute, restez avec **USE_BUZZER 0**.

---

### Option C : Buzzer 5 V (avec transistor)

L’ESP32 est en **3,3 V**. Un buzzer **5 V** ne doit **pas** être branché directement sur une sortie GPIO. On utilise un **transistor NPN** (ex. 2N2222, BC547, 2N3904) pour commuter le buzzer.

**Composants** :  
- 1 transistor NPN (ex. 2N2222)  
- 1 résistance ~1 kΩ (entre GPIO et base du transistor)  
- Buzzer 5 V

**Branchement** :

- **GPIO 27** → résistance **1 kΩ** → **Base** du transistor (B)
- **Émetteur (E)** du transistor → **GND**
- **Collecteur (C)** du transistor → une patte du **buzzer**
- **Autre patte du buzzer** → **5 V** (alimentation 5 V, pas l’ESP32 si le buzzer consomme beaucoup)

Sur un **2N2222** (boîtier TO-92, vu de face, pattes en bas) :  
- à gauche : **Émetteur**  
- au centre : **Base**  
- à droite : **Collecteur**

```
  ESP32                    Transistor NPN (2N2222)         Buzzer 5V
  ------                   -----------------------         ---------
  GPIO 27  ----[ 1kΩ ]----  Base (B)
                            Émetteur (E)  ----------------  GND
                            Collecteur (C) ----------------  Patte 1 Buzzer
  5V (alim)  ----------------------------------------------  Patte 2 Buzzer
```

Si ton buzzer est **actif** (3–12 V avec circuit intégré), une seule patte va au + et l’autre au collecteur ; si c’est un **piézo passif**, le sens peut influencer le volume mais ne détruit pas le composant.

---

## 4. Alimentation

- **ESP32** : alimentation USB 5 V ou via VIN (5 V).
- **Servo** : 5 V (USB de l’ESP32 peut suffire pour un petit servo ; sinon alimentation 5 V externe).
- **Buzzer 5 V** : 5 V (comme sur le schéma ci‑dessus).
- **LEDs** : alimentées par les GPIO 3,3 V (via les résistances).

Pense à **relier tous les GND ensemble** (ESP32, alimentation externe, servo, buzzer, LEDs) pour avoir une masse commune.

---

## 5. Récapitulatif sur l’ESP32

```
                    ESP32 (vue broches typique)
                    ---------------------------
                         [ 3V3 ]  [ 5V ]
                         [ GND ]  [ GND ]
                         [ ... ]  [ ... ]
              LED verte  [ 12  ]  [ 13  ]  Servo signal
              LED rouge  [ 14  ]  [ ... ]
                         [ ... ]  [ 27  ]  Buzzer (via transistor)
                         [ ... ]  [ ... ]
```

- **GPIO 12** : LED verte (+ résistance 330 Ω → GND)  
- **GPIO 13** : Servo (signal)  
- **GPIO 14** : LED rouge (+ résistance 330 Ω → GND)  
- **GPIO 27** : Base du transistor (via 1 kΩ) pour le buzzer 5 V  

Tous les **GND** des composants → **GND** de l’ESP32 (ou de la même alimentation).

---

## Liste de courses (ordre de grandeur)

| Composant            | Quantité | Note                    |
|----------------------|----------|-------------------------|
| ESP32                | 1        | Module avec WiFi        |
| Servo (ex. SG90)     | 1        | 5 V                     |
| LED verte            | 1        | 5 mm ou 3 mm            |
| LED rouge            | 1        | 5 mm ou 3 mm            |
| Résistances 330 Ω    | 2        | Pour les LEDs           |
| Résistance 1 kΩ      | 1        | Pour la base transistor |
| Transistor NPN       | 1        | 2N2222, BC547, 2N3904   |
| Buzzer actif 5 V     | 1        | Ou piézo + circuit      |
| Fils Dupont          | -        | Pour tout relier        |

Une fois le câblage fait, tu peux flasher le programme `security_door.ino` et configurer le WiFi dans le sketch, puis l’IP dans l’app (fichier `config/esp32.ts`).

# Test des composants (ESP32)

Sketch interactif : **un seul téléversement**, puis chaque composant se teste depuis le **moniteur série**.

## Prérequis Arduino IDE

1. Carte : **ESP32 Dev Module** (ou équivalent).
2. Port COM de l’ESP32 sélectionné.
3. Bibliothèques (**Outils → Gérer les bibliothèques**) :
   - **ESP32Servo**
   - **Adafruit Fingerprint Sensor Library**
   - **Adafruit BusIO** (dépendance)

## Téléverser

1. Ouvrir `test_composants.ino`.
2. Cliquer **Téléverser**.
3. **Outils → Moniteur série** → vitesse **115200**.
4. En bas du moniteur : **Nouvelle ligne** (ou « Both NL & CR »).

## Menu

| Touche | Test |
|--------|------|
| **1** | LED verte — 3 clignotements |
| **2** | LED rouge — 3 clignotements |
| **3** | Buzzer — 3 bips |
| **4** | Servo — ouverture / fermeture |
| **5** | Capteur — connexion + lecture doigt (5 s) |
| **6** | Capteur — enregistrer **un** doigt (emplacement 1) |
| **7** | Capteur — vérifier un doigt enregistré |
| **8** | Enchaîne les tests 1 à 5 |
| **m** | Réafficher le menu |

## Ordre conseillé

1. **1** puis **2** — LEDs  
2. **3** — buzzer  
3. **4** — servo (le servo peut tirer du courant : alim USB stable)  
4. **5** — capteur branché ? posez le doigt dans les 5 secondes  
5. **6** — enregistrer votre doigt  
6. **7** — vérifier le même doigt  

## Dépannage capteur (test 5 en échec)

- **TX capteur** → GPIO **16**, **RX capteur** → GPIO **17**
- **3V3** et **T-3V3** → broche **3V3** ESP32
- **GND** commun
- Inverser TX/RX si « capteur non détecté »

## Câblage

Voir [`../CABLAGE.md`](../CABLAGE.md).

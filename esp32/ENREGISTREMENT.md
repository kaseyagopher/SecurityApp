# Enregistrer une empreinte et l’associer à un utilisateur

## Vue d’ensemble (recommandé)

| Étape | Où | Quoi |
|-------|-----|------|
| 1 | **PC** | Téléverser **une fois** `security_door/security_door.ino` |
| 2 | **App** (admin) | **Enregistrer** → choisir l’utilisateur → **Démarrer l’enregistrement** |
| 3 | **Capteur R03** | Suivre les invites : 1er scan, retirer le doigt, 2e scan |

L’app parle au **serveur** (slot ↔ utilisateur) et à l’**ESP32** (empreinte physique). **Plus besoin** de basculer vers `test_composants.ino` ni de retéléverser à chaque enregistrement ou suppression.

---

## Prérequis

- Serveur : `cd server` → `npm start`
- ESP32 en Wi‑Fi avec `security_door.ino` (capteur R03 sur GPIO 16/17)
- Téléphone et ESP32 sur le **même réseau** que le PC
- `config/esp32.ts` : IP de l’ESP32 (ex. `http://10.199.43.47`)
- Compte **admin** dans l’app

---

## Enregistrement depuis l’app

1. **Personnes** → **Enregistrer** (ou **Porte** → **Enregistrer une empreinte**)
2. Choisir la personne ou **Administrateur** (votre empreinte)
3. **Démarrer l’enregistrement**
4. Sur le capteur à la porte : posez le doigt, retirez-le, reposez le **même** doigt
5. Message **Terminé** dans l’app → la personne peut ouvrir la porte

---

## Supprimer une empreinte

**Personnes** → **Retirer empreinte** : l’app supprime le slot sur le **capteur** et l’**assignation serveur**. Aucun changement de sketch.

---

## Dépannage

| Problème | Piste |
|----------|--------|
| « ESP32 injoignable » | Vérifier `config/esp32.ts`, pare-feu, même Wi‑Fi |
| « Enregistrement en cours » | Attendre la fin ou redémarrer l’ESP32 |
| Doigt refusé à la porte | Resync au boot ; vérifier slot dans les logs série |
| Capteur hors ligne | Câblage TX/RX, alimentation 3,3 V du R03 |

---

## Ancienne méthode (secours)

Si l’enrôlement HTTP ne fonctionne pas, vous pouvez encore utiliser `test_composants.ino` (menu **6**, même numéro de slot que l’app). Voir l’historique git de ce fichier pour le détail.

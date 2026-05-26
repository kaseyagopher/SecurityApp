import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Routes } from '../../lib/routes';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { Screen } from '../../components/layout/Screen';
import { ActivityRow } from '../../components/ui/ActivityRow';
import { AppCard } from '../../components/ui/Card';
import { DeviceRow } from '../../components/ui/DeviceRow';
import { MockBanner } from '../../components/ui/MockBanner';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { COLORS, RADIUS, SPACING } from '../../constants/theme';
import { USE_MOCKS } from '../../config/app';
import { useAuth } from '../../contexts/AuthContext';
import { useSystem } from '../../contexts/SystemContext';

export default function DoorScreen() {
  const { user } = useAuth();
  const { door, history, loading, refresh, remoteOpen, simulateAccess } = useSystem();
  const [busy, setBusy] = useState(false);
  const isAdmin = user?.role === 'admin';

  const doorEvents = history.filter(
    (e) => e.event_type === 'door_open' || e.event_type === 'door_denied'
  );

  const handleRemoteOpen = () => {
    Alert.alert(
      'Ouverture à distance',
      'Réservé à l\'admin en secours. L\'accès normal se fait au capteur sur la porte.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Ouvrir',
          onPress: async () => {
            setBusy(true);
            try {
              await remoteOpen();
            } finally {
              setBusy(false);
            }
          },
        },
      ]
    );
  };

  const handleSimulate = (success: boolean) => {
    const name = success ? 'Marie Dupont' : null;
    setBusy(true);
    simulateAccess(success, name).finally(() => setBusy(false));
  };

  const stateLabel =
    door?.state === 'unlocked'
      ? 'Ouverte'
      : door?.state === 'unlocking'
        ? 'Ouverture en cours'
        : 'Verrouillée';

  return (
    <Screen title="Porte" subtitle="Capteur d'empreinte sur place" scroll>
      <MockBanner />

      {loading && !door ? (
        <ActivityIndicator color={COLORS.primary} />
      ) : (
        <>
          <AppCard accent>
            <View style={styles.hero}>
              <View style={[styles.ring, door?.state === 'unlocked' && styles.ringOpen]}>
                <MaterialCommunityIcons
                  name="fingerprint"
                  size={56}
                  color={door?.state === 'unlocked' ? COLORS.success : COLORS.primary}
                />
              </View>
              <Text style={styles.heroTitle}>{stateLabel}</Text>
              <StatusBadge
                label={`${door?.enrolledTemplates ?? 0} / ${door?.capacity ?? 0} empreintes`}
                tone="info"
              />
              <Text style={styles.heroHint}>
                Posez votre doigt sur le capteur à la porte pour entrer. Cette application affiche
                l'état en temps réel.
              </Text>
            </View>
          </AppCard>

          <AppCard title="Équipements">
            <DeviceRow icon="chip" label="ESP32 (porte)" status={door?.devices.esp32 ?? 'offline'} />
            <DeviceRow
              icon="fingerprint"
              label="Capteur empreinte R03"
              status={door?.devices.fingerprintSensor ?? 'offline'}
            />
            <DeviceRow icon="server" label="Serveur API" status={door?.devices.server ?? 'offline'} />
            <Button mode="text" onPress={refresh} icon="refresh" style={{ alignSelf: 'flex-start' }}>
              Actualiser
            </Button>
          </AppCard>

          {USE_MOCKS ? (
            <AppCard title="Simulateur (démo)" subtitle="Imite un scan au capteur">
              <View style={styles.simRow}>
                <Button
                  mode="contained"
                  onPress={() => handleSimulate(true)}
                  disabled={busy}
                  buttonColor={COLORS.success}
                  style={styles.simBtn}
                >
                  Accès OK
                </Button>
                <Button
                  mode="outlined"
                  onPress={() => handleSimulate(false)}
                  disabled={busy}
                  textColor={COLORS.danger}
                  style={styles.simBtn}
                >
                  Refusé
                </Button>
              </View>
            </AppCard>
          ) : null}

          {isAdmin ? (
            <AppCard title="Administration">
              <Button
                mode="contained-tonal"
                icon="door-open"
                onPress={handleRemoteOpen}
                loading={busy}
                disabled={busy}
              >
                Ouverture à distance (secours)
              </Button>
              <Button
                mode="outlined"
                icon="account-plus"
                onPress={() => router.push(Routes.enroll)}
                style={{ marginTop: SPACING.sm }}
              >
                Enregistrer une empreinte
              </Button>
            </AppCard>
          ) : null}

          <AppCard title="Derniers passages" subtitle="Capteur physique">
            {doorEvents.length === 0 ? (
              <Text style={styles.empty}>Aucun passage</Text>
            ) : (
              doorEvents.slice(0, 6).map((e) => <ActivityRow key={e.id} event={e} compact />)
            )}
          </AppCard>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', gap: SPACING.sm, paddingVertical: SPACING.sm },
  ring: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  ringOpen: { backgroundColor: COLORS.successMuted },
  heroTitle: { fontSize: 22, fontWeight: '700', color: COLORS.text },
  heroHint: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 20 },
  simRow: { flexDirection: 'row', gap: SPACING.sm },
  simBtn: { flex: 1 },
  empty: { color: COLORS.textMuted, textAlign: 'center', paddingVertical: SPACING.md },
});

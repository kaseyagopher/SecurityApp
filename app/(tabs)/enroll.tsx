import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { Screen } from '../../components/layout/Screen';
import { AppCard } from '../../components/ui/Card';
import { MockBanner } from '../../components/ui/MockBanner';
import { COLORS, SPACING } from '../../constants/theme';
import { USE_MOCKS } from '../../config/app';
import type { AppUser } from '../../mocks/types';
import { api } from '../../services/api';
import { enrollPhaseLabel, type EnrollProgress } from '../../services/esp32-enroll';
import { useAuth } from '../../contexts/AuthContext';

type Step = 'pick' | 'scan1' | 'scan2' | 'scan' | 'done';

export default function EnrollScreen() {
  const { userId: paramUserId } = useLocalSearchParams<{ userId?: string }>();
  const { user: authUser } = useAuth();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(
    paramUserId ? parseInt(paramUserId, 10) : null
  );
  const [step, setStep] = useState<Step>(
    paramUserId ? (USE_MOCKS ? 'scan1' : 'pick') : 'pick'
  );
  const [loading, setLoading] = useState(false);
  const [assignedSlot, setAssignedSlot] = useState<number | null>(null);
  const [progress, setProgress] = useState<EnrollProgress | null>(null);

  useEffect(() => {
    if (authUser?.role !== 'admin') {
      router.back();
      return;
    }
    api.getUsers().then(setUsers);
  }, [authUser]);

  const selected = users.find((u) => u.id === selectedId);

  const runScan = async (next: Step) => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1500));
    setLoading(false);
    setStep(next);
  };

  const runLiveEnroll = async () => {
    if (!selectedId) return;
    setLoading(true);
    setProgress(null);
    setStep('scan');
    try {
      const u = await api.enrollFingerprint(selectedId, setProgress);
      setAssignedSlot(u.fingerprintSlot);
      setStep('done');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Enregistrement impossible';
      Alert.alert('Erreur', msg);
      setStep('pick');
    } finally {
      setLoading(false);
    }
  };

  const finishMock = async () => {
    if (!selectedId) return;
    setLoading(true);
    try {
      const u = await api.enrollFingerprint(selectedId);
      setAssignedSlot(u.fingerprintSlot);
      setStep('done');
    } finally {
      setLoading(false);
    }
  };

  const startEnroll = () => {
    if (USE_MOCKS) setStep('scan1');
    else void runLiveEnroll();
  };

  const liveHint =
    progress?.message ||
    (progress ? enrollPhaseLabel(progress.phase) : 'Connexion au capteur à la porte…');

  return (
    <Screen
      title="Enregistrement"
      subtitle="Empreinte sur le capteur R03"
      headerRight={
        <Button textColor={COLORS.white} onPress={() => router.back()}>
          Fermer
        </Button>
      }
    >
      <MockBanner />

      {step === 'pick' ? (
        <AppCard title="Choisir la personne">
          {users
            .filter((u) => u.fingerprintSlot == null)
            .map((u) => (
              <Button
                key={u.id}
                mode={selectedId === u.id ? 'contained' : 'outlined'}
                onPress={() => setSelectedId(u.id)}
                style={styles.pickBtn}
              >
                {u.name}
              </Button>
            ))}
          <Button
            mode="contained"
            disabled={!selectedId || loading}
            loading={loading}
            onPress={startEnroll}
            style={{ marginTop: SPACING.md }}
          >
            {USE_MOCKS ? 'Continuer' : 'Démarrer l\'enregistrement'}
          </Button>
          {!USE_MOCKS ? (
            <Text style={[styles.scanHint, { marginTop: SPACING.sm }]}>
              Le doigt est enregistré directement sur le capteur de la porte — pas besoin de
              retéléverser l&apos;Arduino.
            </Text>
          ) : null}
        </AppCard>
      ) : null}

      {!USE_MOCKS && step === 'scan' ? (
        <AppCard title={selected?.name ?? 'Enregistrement'}>
          <View style={styles.scanHero}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <MaterialCommunityIcons name="fingerprint" size={72} color={COLORS.primary} />
            <Text style={styles.scanTitle}>{liveHint}</Text>
            {progress?.slot_id ? (
              <Text style={styles.scanHint}>Slot #{progress.slot_id}</Text>
            ) : null}
            <Text style={styles.scanHint}>
              Suivez les instructions sur le capteur : 1er scan, retirez le doigt, 2e scan.
            </Text>
          </View>
        </AppCard>
      ) : null}

      {USE_MOCKS && (step === 'scan1' || step === 'scan2') && (
        <AppCard>
          <View style={styles.scanHero}>
            {loading ? (
              <ActivityIndicator size="large" color={COLORS.primary} />
            ) : (
              <MaterialCommunityIcons name="fingerprint" size={72} color={COLORS.primary} />
            )}
            <Text style={styles.scanTitle}>
              {step === 'scan1' ? '1er scan' : '2e scan'} — {selected?.name}
            </Text>
            <Text style={styles.scanHint}>
              {step === 'scan1'
                ? 'Placez le doigt sur le capteur à la porte, puis retirez-le.'
                : 'Même doigt, deuxième lecture pour validation.'}
            </Text>
          </View>
          {!loading ? (
            <Button
              mode="contained"
              onPress={() => (step === 'scan1' ? runScan('scan2') : finishMock())}
            >
              {step === 'scan1' ? 'Doigt enregistré — continuer' : 'Valider l\'enregistrement'}
            </Button>
          ) : null}
        </AppCard>
      )}

      {step === 'done' ? (
        <AppCard accent>
          <View style={styles.done}>
            <MaterialCommunityIcons name="check-circle" size={64} color={COLORS.success} />
            <Text style={styles.doneTitle}>Empreinte enregistrée</Text>
            <Text style={styles.doneSub}>
              {USE_MOCKS
                ? `${selected?.name} peut maintenant ouvrir la porte au capteur.`
                : `${selected?.name} peut ouvrir la porte (slot #${assignedSlot ?? selected?.fingerprintSlot}).`}
            </Text>
            <Button mode="contained" onPress={() => router.back()}>
              Terminer
            </Button>
          </View>
        </AppCard>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  pickBtn: { marginBottom: SPACING.sm },
  scanHero: { alignItems: 'center', gap: SPACING.md, paddingVertical: SPACING.lg },
  scanTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text, textAlign: 'center' },
  scanHint: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center' },
  done: { alignItems: 'center', gap: SPACING.md, paddingVertical: SPACING.md },
  doneTitle: { fontSize: 20, fontWeight: '700', color: COLORS.text },
  doneSub: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center' },
});

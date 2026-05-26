import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { Screen } from '../../components/layout/Screen';
import { AppCard } from '../../components/ui/Card';
import { MockBanner } from '../../components/ui/MockBanner';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { COLORS, SPACING } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext';
import { useSystem } from '../../contexts/SystemContext';

export default function AlarmScreen() {
  const { user } = useAuth();
  const { alarm, triggerAlarm, stopAlarm } = useSystem();
  const [busy, setBusy] = useState(false);
  const isAdmin = user?.role === 'admin';
  const active = alarm?.active ?? false;

  const onTrigger = () => {
    Alert.alert('Déclencher l\'alarme', 'LED rouge + buzzer sur l\'ESP32 jusqu\'à arrêt manuel.', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Confirmer',
        style: 'destructive',
        onPress: async () => {
          setBusy(true);
          try {
            await triggerAlarm();
          } finally {
            setBusy(false);
          }
        },
      },
    ]);
  };

  const onStop = async () => {
    setBusy(true);
    try {
      await stopAlarm();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen title="Alarme" subtitle="Sécurité et intrusion">
      <MockBanner />

      <AppCard accent={active}>
        <View style={styles.hero}>
          <View style={[styles.iconWrap, active && styles.iconWrapActive]}>
            <MaterialCommunityIcons
              name={active ? 'bell-ring' : 'bell-outline'}
              size={48}
              color={active ? COLORS.danger : COLORS.primary}
            />
          </View>
          <StatusBadge label={active ? 'Alarme active' : 'Système au repos'} tone={active ? 'danger' : 'success'} />
          <Text style={styles.desc}>
            {active
              ? `Déclenchée${alarm?.triggeredAt ? ` à ${new Date(alarm.triggeredAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}` : ''}. ${alarm?.reason ?? ''}`
              : "L'alarme se déclenche aussi automatiquement après 3 tentatives d'accès refusées au capteur."}
          </Text>
        </View>

        {isAdmin ? (
          active ? (
            <Button
              mode="contained"
              buttonColor={COLORS.success}
              icon="bell-off"
              onPress={onStop}
              loading={busy}
              style={styles.btn}
            >
              Couper l'alarme
            </Button>
          ) : (
            <Button
              mode="contained"
              buttonColor={COLORS.danger}
              icon="bell-ring"
              onPress={onTrigger}
              loading={busy}
              style={styles.btn}
            >
              Déclencher l'alarme
            </Button>
          )
        ) : (
          <Text style={styles.adminOnly}>Réservé à l'administrateur</Text>
        )}
      </AppCard>

      <AppCard title="Comportement matériel">
        <Text style={styles.bullet}>• LED rouge allumée en continu</Text>
        <Text style={styles.bullet}>• Buzzer en bip jusqu'à désactivation</Text>
        <Text style={styles.bullet}>• Déclenchement auto : 3 refus au capteur</Text>
      </AppCard>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', gap: SPACING.md, paddingVertical: SPACING.sm },
  iconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: COLORS.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapActive: { backgroundColor: COLORS.dangerMuted },
  desc: { fontSize: 15, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 22 },
  btn: { marginTop: SPACING.sm },
  adminOnly: { textAlign: 'center', color: COLORS.textMuted, fontStyle: 'italic' },
  bullet: { fontSize: 14, color: COLORS.textSecondary, marginBottom: 6 },
});

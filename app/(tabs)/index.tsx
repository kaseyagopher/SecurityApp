import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { Routes } from '../../lib/routes';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { Screen } from '../../components/layout/Screen';
import { ActivityRow } from '../../components/ui/ActivityRow';
import { AppCard } from '../../components/ui/Card';
import { MockBanner } from '../../components/ui/MockBanner';
import { QuickTile } from '../../components/ui/QuickTile';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { COLORS, RADIUS, SPACING } from '../../constants/theme';
import { parseServerDate } from '../../lib/datetime';
import { useAuth } from '../../contexts/AuthContext';
import { useSystem } from '../../contexts/SystemContext';

function doorLabel(state: string) {
  if (state === 'unlocked') return { label: 'Ouverte', tone: 'warning' as const };
  if (state === 'unlocking') return { label: 'Ouverture…', tone: 'info' as const };
  return { label: 'Verrouillée', tone: 'success' as const };
}

export default function HomeScreen() {
  const { user } = useAuth();
  const { door, alarm, history, loading, stopAlarm, refresh } = useSystem();
  const [stopping, setStopping] = useState(false);
  const firstName = user?.name?.split(' ')[0] ?? 'Admin';
  const doorInfo = door ? doorLabel(door.state) : { label: '—', tone: 'neutral' as const };
  const active = alarm?.active ?? false;

  const onStopAlarm = async () => {
    setStopping(true);
    try {
      await stopAlarm();
      await refresh({ silent: true });
    } finally {
      setStopping(false);
    }
  };

  return (
    <Screen
      title={`Bonjour, ${firstName}`}
      subtitle="Vue d'ensemble du domicile"
      onRefresh={() => refresh({ silent: true })}
      headerRight={
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{(user?.name ?? 'A').slice(0, 2).toUpperCase()}</Text>
        </View>
      }
    >
      <MockBanner />

      {loading && !door ? (
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: 24 }} />
      ) : (
        <>
          <AppCard accent>
            <View style={styles.doorRow}>
              <View style={styles.doorIcon}>
                <MaterialCommunityIcons
                  name={door?.state === 'unlocked' ? 'door-open' : 'door-closed-lock'}
                  size={32}
                  color={COLORS.primary}
                />
              </View>
              <View style={styles.doorBody}>
                <Text style={styles.doorTitle}>Porte d'entrée</Text>
                <StatusBadge label={doorInfo.label} tone={doorInfo.tone} />
                {door?.lastAccessAt ? (
                  <Text style={styles.doorMeta}>
                    Dernier accès : {door.lastAccessBy} ·{' '}
                    {parseServerDate(door.lastAccessAt).toLocaleTimeString('fr-FR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                ) : null}
              </View>
            </View>
          </AppCard>

          {active ? (
            <AppCard accent>
              <View style={styles.alarmCard}>
                <View style={[styles.alarmIconWrap, styles.alarmIconWrapActive]}>
                  <MaterialCommunityIcons name="bell-ring" size={32} color={COLORS.danger} />
                </View>
                <View style={styles.alarmBody}>
                  <Text style={styles.alarmTitle}>Alarme active</Text>
                  <Text style={styles.alarmDesc}>
                    {alarm?.reason ??
                      "Déclenchée après 3 tentatives refusées. Coupez-la depuis le téléphone avant d'intervenir."}
                  </Text>
                  {alarm?.triggeredAt ? (
                    <Text style={styles.alarmTime}>
                      Depuis{' '}
                      {parseServerDate(alarm.triggeredAt).toLocaleTimeString('fr-FR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  ) : null}
                </View>
              </View>
              <Button
                mode="contained"
                buttonColor={COLORS.success}
                icon="bell-off"
                loading={stopping}
                onPress={onStopAlarm}
                style={styles.alarmBtn}
              >
                Couper l&apos;alarme à distance
              </Button>
              <Link href={Routes.alarm} asChild>
                <Pressable style={styles.alarmLink}>
                  <Text style={styles.alarmLinkText}>Détails alarme</Text>
                </Pressable>
              </Link>
            </AppCard>
          ) : null}

          <View style={styles.quickGrid}>
            <QuickTile
              href={Routes.door}
              icon="fingerprint"
              label="Porte"
              subtitle="Capteur & ouverture"
              iconBg={COLORS.primaryMuted}
              iconColor={COLORS.primaryDark}
            />
            <QuickTile
              href={Routes.history}
              icon="history"
              label="Historiques"
              subtitle="Qui est passé"
              iconBg={COLORS.accentMuted}
              iconColor={COLORS.accent}
            />
            <QuickTile
              href={Routes.users}
              icon="account-group"
              label="Personnes"
              subtitle="Gérer les accès"
              iconBg={COLORS.warningMuted}
              iconColor={COLORS.warning}
            />
            <QuickTile
              href={Routes.alarm}
              icon={active ? 'bell-ring' : 'shield-alert'}
              label="Alarme"
              subtitle={active ? 'Sonnerie en cours' : 'Après 3 refus'}
              iconBg={COLORS.dangerMuted}
              iconColor={COLORS.danger}
              borderColor={COLORS.danger + '40'}
              active={active}
              activeLabel="ON"
            />
          </View>

          <AppCard title="Activité récente" subtitle={`${history.length} événements`}>
            {history.length === 0 ? (
              <Text style={styles.empty}>Aucune activité</Text>
            ) : (
              history.slice(0, 5).map((e) => <ActivityRow key={e.id} event={e} compact />)
            )}
            <Link href={Routes.history} asChild>
              <Pressable style={styles.seeAll}>
                <Text style={styles.seeAllText}>Voir tout l&apos;historique</Text>
                <MaterialCommunityIcons name="chevron-right" size={20} color={COLORS.primary} />
              </Pressable>
            </Link>
          </AppCard>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: COLORS.white, fontWeight: '700', fontSize: 16 },
  doorRow: { flexDirection: 'row', gap: SPACING.md },
  doorIcon: {
    width: 56,
    height: 56,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doorBody: { flex: 1, gap: 6 },
  doorTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  doorMeta: { fontSize: 13, color: COLORS.textSecondary },
  alarmCard: { flexDirection: 'row', gap: SPACING.md, alignItems: 'flex-start' },
  alarmIconWrap: {
    width: 56,
    height: 56,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alarmIconWrapActive: { backgroundColor: COLORS.dangerMuted },
  alarmBody: { flex: 1, gap: 4 },
  alarmTitle: { fontSize: 17, fontWeight: '700', color: COLORS.text },
  alarmDesc: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 20 },
  alarmTime: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  alarmBtn: { marginTop: SPACING.md },
  alarmLink: { alignItems: 'center', marginTop: SPACING.sm },
  alarmLinkText: { color: COLORS.primary, fontWeight: '600', fontSize: 13 },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  empty: { textAlign: 'center', color: COLORS.textMuted, paddingVertical: SPACING.md },
  seeAll: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
  },
  seeAllText: { color: COLORS.primary, fontWeight: '600' },
});

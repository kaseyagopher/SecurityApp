import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import type { AccessEvent } from '../../mocks/types';
import { COLORS, RADIUS, SPACING } from '../../constants/theme';
import { parseServerDate } from '../../lib/datetime';

function eventMeta(event: AccessEvent) {
  const isUnknown =
    event.userName === 'Inconnu' ||
    event.details?.toLowerCase().includes('inconnue') ||
    event.details?.toLowerCase().includes('inconnu');

  if (event.event_type === 'door_open' && event.result === 'success')
    return { icon: 'door-open' as const, color: COLORS.success, label: 'Accès autorisé' };
  if (event.event_type === 'door_denied' || (event.event_type === 'door_open' && event.result !== 'success')) {
    return {
      icon: isUnknown ? ('account-alert' as const) : ('door-closed-lock' as const),
      color: COLORS.danger,
      label: isUnknown ? 'Tentative inconnue' : 'Accès refusé',
    };
  }
  if (event.event_type === 'alarm')
    return {
      icon: 'bell-ring' as const,
      color: event.result === 'triggered' ? COLORS.warning : COLORS.info,
      label: event.result === 'triggered' ? 'Alarme déclenchée' : 'Alarme coupée',
    };
  if (event.event_type === 'enrollment')
    return { icon: 'fingerprint' as const, color: COLORS.primary, label: 'Empreinte enregistrée' };
  return { icon: 'information' as const, color: COLORS.textMuted, label: event.event_type };
}

type Props = { event: AccessEvent; compact?: boolean };

export function ActivityRow({ event, compact }: Props) {
  const meta = eventMeta(event);
  const d = parseServerDate(event.created_at);
  const time = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  const date = d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  const who =
    event.event_type === 'door_open' && event.result === 'success'
      ? event.userName ?? 'Inconnu'
      : event.userName ?? (meta.label === 'Tentative inconnue' ? 'Visiteur inconnu' : '—');

  return (
    <View style={[styles.row, compact && styles.compact]}>
      <View style={[styles.icon, { backgroundColor: meta.color + '18' }]}>
        <MaterialCommunityIcons name={meta.icon} size={22} color={meta.color} />
      </View>
      <View style={styles.body}>
        <Text style={styles.title}>{meta.label}</Text>
        <Text style={styles.user}>{who}</Text>
        {!compact && event.details ? <Text style={styles.method}>{event.details}</Text> : null}
        {!compact && !event.details ? <Text style={styles.method}>{event.method}</Text> : null}
      </View>
      <View style={styles.time}>
        <Text style={styles.timeText}>{time}</Text>
        {!compact ? <Text style={styles.dateText}>{date}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  compact: { paddingVertical: SPACING.xs },
  icon: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1 },
  title: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  user: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  method: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  time: { alignItems: 'flex-end' },
  timeText: { fontSize: 13, fontWeight: '600', color: COLORS.text },
  dateText: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
});

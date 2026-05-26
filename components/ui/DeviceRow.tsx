import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import type { DeviceStatus } from '../../mocks/types';
import { COLORS, RADIUS } from '../../constants/theme';
import { StatusBadge } from './StatusBadge';

type Props = {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  status: DeviceStatus;
};

export function DeviceRow({ icon, label, status }: Props) {
  const tone = status === 'online' ? 'success' : status === 'degraded' ? 'warning' : 'danger';
  const labelStatus = status === 'online' ? 'En ligne' : status === 'degraded' ? 'Instable' : 'Hors ligne';

  return (
    <View style={styles.row}>
      <View style={styles.left}>
        <MaterialCommunityIcons name={icon} size={22} color={COLORS.primary} />
        <Text style={styles.label}>{label}</Text>
      </View>
      <StatusBadge label={labelStatus} tone={tone} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  left: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  label: { fontSize: 15, color: COLORS.text, fontWeight: '500' },
});

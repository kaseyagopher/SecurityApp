import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { COLORS, RADIUS } from '../../constants/theme';

type Tone = 'success' | 'danger' | 'warning' | 'neutral' | 'info';

const TONE_STYLES: Record<Tone, { bg: string; fg: string; icon: keyof typeof MaterialCommunityIcons.glyphMap }> = {
  success: { bg: COLORS.successMuted, fg: COLORS.success, icon: 'check-circle' },
  danger: { bg: COLORS.dangerMuted, fg: COLORS.danger, icon: 'alert-circle' },
  warning: { bg: COLORS.warningMuted, fg: COLORS.warning, icon: 'alert' },
  neutral: { bg: COLORS.border, fg: COLORS.textSecondary, icon: 'minus-circle' },
  info: { bg: COLORS.infoMuted, fg: COLORS.info, icon: 'information' },
};

type Props = { label: string; tone?: Tone; showIcon?: boolean };

export function StatusBadge({ label, tone = 'neutral', showIcon = true }: Props) {
  const t = TONE_STYLES[tone];
  return (
    <View style={[styles.badge, { backgroundColor: t.bg }]}>
      {showIcon ? <MaterialCommunityIcons name={t.icon} size={14} color={t.fg} /> : null}
      <Text style={[styles.text, { color: t.fg }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    alignSelf: 'flex-start',
  },
  text: { fontSize: 12, fontWeight: '600' },
});

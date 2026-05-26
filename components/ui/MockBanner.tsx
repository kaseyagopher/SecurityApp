import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { USE_MOCKS } from '../../config/app';
import { COLORS, RADIUS, SPACING } from '../../constants/theme';

export function MockBanner() {
  if (!USE_MOCKS) return null;
  return (
    <View style={styles.banner}>
      <MaterialCommunityIcons name="flask" size={16} color={COLORS.warning} />
      <Text style={styles.text}>Mode démo — données simulées</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.warningMuted,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.warning + '40',
  },
  text: { fontSize: 12, fontWeight: '600', color: '#b45309', flex: 1 },
});

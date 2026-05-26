import { ReactNode } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { Text } from 'react-native-paper';
import { COLORS, RADIUS, SPACING } from '../../constants/theme';

type Props = {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  style?: ViewStyle;
  accent?: boolean;
};

export function AppCard({ children, title, subtitle, style, accent }: Props) {
  return (
    <View style={[styles.card, accent && styles.accent, style]}>
      {title ? (
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
      ) : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  accent: { borderColor: COLORS.primary + '40' },
  header: { marginBottom: SPACING.sm },
  title: { fontSize: 17, fontWeight: '700', color: COLORS.text },
  subtitle: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
});

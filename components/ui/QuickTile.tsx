import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Link, type Href } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { COLORS, RADIUS, SPACING } from '../../constants/theme';

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

type Props = {
  href: Href;
  icon: IconName;
  label: string;
  subtitle?: string;
  iconBg: string;
  iconColor: string;
  borderColor?: string;
  active?: boolean;
  activeLabel?: string;
};

export function QuickTile({
  href,
  icon,
  label,
  subtitle,
  iconBg,
  iconColor,
  borderColor = COLORS.border,
  active,
  activeLabel,
}: Props) {
  return (
    <Link href={href} asChild>
      <Pressable
        style={[
          styles.tile,
          { borderColor: active ? COLORS.danger : borderColor },
          active && styles.tileActive,
        ]}
      >
        {active ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{activeLabel ?? 'Actif'}</Text>
          </View>
        ) : null}
        <View style={[styles.iconWrap, { backgroundColor: iconBg }]}>
          <MaterialCommunityIcons name={icon} size={26} color={iconColor} />
        </View>
        <Text style={styles.label}>{label}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  tile: {
    width: '47%',
    minHeight: 108,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1.5,
  },
  tileActive: {
    backgroundColor: COLORS.dangerMuted,
  },
  badge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: COLORS.danger,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
  },
  badgeText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '700',
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 11,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 14,
  },
});

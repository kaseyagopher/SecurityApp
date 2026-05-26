import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Routes } from '../../lib/routes';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { Screen } from '../../components/layout/Screen';
import { AppCard } from '../../components/ui/Card';
import { MockBanner } from '../../components/ui/MockBanner';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { COLORS, RADIUS, SPACING } from '../../constants/theme';
import { USE_MOCKS } from '../../config/app';
import { useAuth } from '../../contexts/AuthContext';

type MenuItem = {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  onPress: () => void;
  danger?: boolean;
};

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const isAdmin = user?.role === 'admin';

  const menu: MenuItem[] = [
    ...(isAdmin
      ? [
          {
            icon: 'account-group' as const,
            label: 'Gestion des personnes',
            onPress: () => router.push(Routes.users),
          },
          {
            icon: 'fingerprint' as const,
            label: 'Enregistrer une empreinte',
            onPress: () => router.push(Routes.enroll),
          },
        ]
      : []),
    {
      icon: 'logout',
      label: 'Déconnexion',
      onPress: async () => {
        await logout();
        router.replace(Routes.login);
      },
      danger: true,
    },
  ];

  return (
    <Screen title="Profil" subtitle="Votre compte">
      <MockBanner />

      <AppCard>
        <View style={styles.profile}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{(user?.name ?? 'U').slice(0, 2).toUpperCase()}</Text>
          </View>
          <Text style={styles.name}>{user?.name}</Text>
          <StatusBadge
            label={isAdmin ? 'Administrateur' : 'Utilisateur'}
            tone={isAdmin ? 'info' : 'neutral'}
          />
          <Text style={styles.email}>{user?.email}</Text>
        </View>
      </AppCard>

      {USE_MOCKS ? (
        <AppCard title="À propos du mode démo">
          <Text style={styles.info}>
            Les données sont simulées localement. Quand le backend et l'ESP32 seront connectés,
            basculez USE_MOCKS à false dans config/app.ts.
          </Text>
        </AppCard>
      ) : null}

      <AppCard title="Menu">
        {menu.map((item) => (
          <Pressable key={item.label} style={styles.menuRow} onPress={item.onPress}>
            <MaterialCommunityIcons
              name={item.icon}
              size={22}
              color={item.danger ? COLORS.danger : COLORS.primary}
            />
            <Text style={[styles.menuLabel, item.danger && { color: COLORS.danger }]}>
              {item.label}
            </Text>
            <MaterialCommunityIcons name="chevron-right" size={22} color={COLORS.textMuted} />
          </Pressable>
        ))}
      </AppCard>
    </Screen>
  );
}

const styles = StyleSheet.create({
  profile: { alignItems: 'center', gap: SPACING.sm, paddingVertical: SPACING.sm },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 28, fontWeight: '700', color: COLORS.white },
  name: { fontSize: 22, fontWeight: '700', color: COLORS.text },
  email: { fontSize: 14, color: COLORS.textSecondary },
  info: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 20 },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  menuLabel: { flex: 1, fontSize: 16, fontWeight: '500', color: COLORS.text },
});

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { Button, Text, TextInput } from 'react-native-paper';
import { MockBanner } from '../../components/ui/MockBanner';
import { COLORS, RADIUS, SPACING } from '../../constants/theme';
import { USE_MOCKS } from '../../config/app';
import { useAuth } from '../../contexts/AuthContext';

const ADMIN_ACCOUNT = {
  label: 'Admin',
  email: 'admin@securityapp.local',
  password: 'Admin123!',
};

export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState(USE_MOCKS ? ADMIN_ACCOUNT.email : '');
  const [password, setPassword] = useState(USE_MOCKS ? ADMIN_ACCOUNT.password : '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      setError('Email et mot de passe requis');
      return;
    }
    setError('');
    setLoading(true);
    const result = await login(email, password);
    setLoading(false);
    if (result.ok) router.replace('/(tabs)');
    else setError(result.error || 'Erreur');
  };

  return (
    <LinearGradient colors={[...COLORS.headerGradient]} style={styles.gradient}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.brand}>
            <View style={styles.logo}>
              <MaterialCommunityIcons name="shield-lock" size={40} color={COLORS.white} />
            </View>
            <Text style={styles.brandTitle}>SecurityApp</Text>
            <Text style={styles.brandSub}>Administration du domicile</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Connexion administrateur</Text>
            <Text style={styles.adminNote}>
              Seul le compte administrateur peut utiliser l&apos;application. Les personnes
              autorisées passent par le capteur à la porte.
            </Text>
            {USE_MOCKS ? <MockBanner /> : (
              <Text style={styles.serverHint}>
                Serveur : npm start dans server/ — même Wi‑Fi que le téléphone
              </Text>
            )}

            <TextInput
              label="Email admin"
              value={email}
              onChangeText={setEmail}
              mode="outlined"
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.input}
            />
            <TextInput
              label="Mot de passe"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              mode="outlined"
              style={styles.input}
            />

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <Button mode="contained" onPress={handleLogin} loading={loading} style={styles.btn}>
              Se connecter
            </Button>

            <View style={styles.demo}>
              <Text style={styles.demoTitle}>Compte administrateur</Text>
              <Pressable
                style={styles.demoChip}
                onPress={() => {
                  setEmail(ADMIN_ACCOUNT.email);
                  setPassword(ADMIN_ACCOUNT.password);
                  setError('');
                }}
              >
                <Text style={styles.demoChipText}>{ADMIN_ACCOUNT.label}</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, padding: SPACING.lg, paddingTop: 72, justifyContent: 'center' },
  brand: { alignItems: 'center', marginBottom: SPACING.xl },
  logo: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  brandTitle: { fontSize: 28, fontWeight: '800', color: COLORS.white },
  brandSub: { fontSize: 14, color: 'rgba(255,255,255,0.9)', marginTop: 4 },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    gap: SPACING.sm,
  },
  cardTitle: { fontSize: 20, fontWeight: '700', color: COLORS.text, textAlign: 'center', marginBottom: SPACING.xs },
  adminNote: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: SPACING.xs,
  },
  input: { backgroundColor: COLORS.surface },
  error: { color: COLORS.danger, textAlign: 'center', fontSize: 14 },
  btn: { marginTop: SPACING.sm },
  demo: { marginTop: SPACING.md, gap: SPACING.sm, alignItems: 'center' },
  demoTitle: { fontSize: 13, color: COLORS.textSecondary, textAlign: 'center' },
  demoChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.primaryMuted,
    borderRadius: RADIUS.full,
  },
  demoChipText: { color: COLORS.primaryDark, fontWeight: '600', fontSize: 13 },
  serverHint: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
});

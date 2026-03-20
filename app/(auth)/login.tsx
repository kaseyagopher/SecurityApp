import { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Text, TextInput, Button } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { COLORS } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext';

export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
    if (result.ok) {
      router.replace('/(tabs)');
    } else {
      setError(result.error || 'Erreur de connexion');
    }
  };

  return (
    <LinearGradient
      colors={[COLORS.primary, COLORS.primaryLight]}
      style={styles.gradient}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboard}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <MaterialCommunityIcons name="shield-lock" size={64} color="white" />
            <Text style={styles.title}>SecurityApp</Text>
            <Text style={styles.subtitle}>Contrôle d'accès domestique</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Connexion</Text>
            <TextInput
              label="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              mode="outlined"
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
            <Button
              mode="contained"
              onPress={handleLogin}
              loading={loading}
              disabled={loading}
              style={styles.btn}
            >
              Se connecter
            </Button>
            <Text style={styles.hint}>Admin par défaut : admin@securityapp.local / Admin123!</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  keyboard: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24, paddingTop: 80 },
  header: { alignItems: 'center', marginBottom: 32 },
  title: { fontSize: 28, fontWeight: 'bold', color: 'white', marginTop: 16 },
  subtitle: { fontSize: 14, color: 'rgba(255,255,255,0.9)', marginTop: 8 },
  card: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 24,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  cardTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  input: { marginBottom: 12 },
  error: { color: COLORS.danger, marginBottom: 12, textAlign: 'center' },
  btn: { marginTop: 8 },
  hint: { fontSize: 12, color: COLORS.gray, marginTop: 16, textAlign: 'center' },
});

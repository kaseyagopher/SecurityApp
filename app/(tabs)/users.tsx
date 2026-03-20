import { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Text, Card, Button, TextInput, List, FAB } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { apiUrl } from '../../config/api';
import { COLORS } from '../../constants/theme';

type User = { id: number; email: string; name: string; role: string; is_authorized: number };
type AuthorizedUser = { id: number; email: string; name: string; created_at: string };

export default function UsersScreen() {
  const { token } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [authorized, setAuthorized] = useState<AuthorizedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const fetchData = async () => {
    if (!token) return;
    try {
      const [uRes, aRes] = await Promise.all([
        fetch(apiUrl('/api/users'), { headers: { Authorization: `Bearer ${token}` } }),
        fetch(apiUrl('/api/authorized-users'), { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (uRes.ok) setUsers(await uRes.json());
      if (aRes.ok) setAuthorized(await aRes.json());
    } catch {
      Alert.alert('Erreur', 'Impossible de charger les données');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  const addUser = async () => {
    if (!newEmail || !newName || !newPassword) {
      Alert.alert('Erreur', 'Remplissez tous les champs');
      return;
    }
    try {
      const res = await fetch(apiUrl('/api/users'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email: newEmail, name: newName, password: newPassword }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        Alert.alert('Erreur', data.error || 'Échec');
        return;
      }
      setShowAdd(false);
      setNewEmail('');
      setNewName('');
      setNewPassword('');
      fetchData();
    } catch {
      Alert.alert('Erreur', 'Erreur réseau');
    }
  };

  const toggleAuthorized = async (userId: number, isAuthorized: boolean) => {
    try {
      if (isAuthorized) {
        await fetch(apiUrl(`/api/authorized-users/${userId}`), {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        await fetch(apiUrl('/api/authorized-users'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ user_id: userId }),
        });
      }
      fetchData();
    } catch {
      Alert.alert('Erreur', 'Erreur réseau');
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[COLORS.primary, COLORS.primaryLight]}
        style={styles.header}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.title}>Utilisateurs autorisés</Text>
        <Text style={styles.subtitle}>Gérer l'accès à la porte</Text>
      </LinearGradient>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {showAdd && (
          <Card style={styles.card}>
            <Card.Title title="Nouvel utilisateur" />
            <Card.Content>
              <TextInput label="Nom" value={newName} onChangeText={setNewName} mode="outlined" style={styles.input} />
              <TextInput label="Email" value={newEmail} onChangeText={setNewEmail} keyboardType="email-address" mode="outlined" style={styles.input} />
              <TextInput label="Mot de passe" value={newPassword} onChangeText={setNewPassword} secureTextEntry mode="outlined" style={styles.input} />
              <View style={styles.row}>
                <Button onPress={() => setShowAdd(false)}>Annuler</Button>
                <Button mode="contained" onPress={addUser}>Ajouter</Button>
              </View>
            </Card.Content>
          </Card>
        )}

        <Card style={styles.card}>
          <Card.Title
            title="Utilisateurs"
            right={(props) => (
              <Button onPress={() => setShowAdd(!showAdd)} {...props}>
                {showAdd ? 'Masquer' : '+ Ajouter'}
              </Button>
            )}
          />
          <Card.Content>
            {loading ? (
              <Text>Chargement...</Text>
            ) : (
              users.filter(u => u.role !== 'admin').map((u) => (
                <List.Item
                  key={u.id}
                  title={u.name}
                  description={u.email}
                  left={() => (
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>{u.name.slice(0, 2).toUpperCase()}</Text>
                    </View>
                  )}
                  right={() => (
                    <Button
                      mode={u.is_authorized ? 'contained-tonal' : 'contained'}
                      onPress={() => toggleAuthorized(u.id, !!u.is_authorized)}
                    >
                      {u.is_authorized ? 'Autorisé' : 'Autoriser'}
                    </Button>
                  )}
                />
              ))
            )}
          </Card.Content>
        </Card>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 50, paddingBottom: 24, paddingHorizontal: 20 },
  backBtn: { position: 'absolute', top: 50, left: 20, zIndex: 1 },
  title: { fontSize: 24, fontWeight: 'bold', color: 'white' },
  subtitle: { fontSize: 14, color: 'rgba(255,255,255,0.9)', marginTop: 4 },
  scroll: { flex: 1 },
  scrollContent: { padding: 16 },
  card: { marginBottom: 16 },
  input: { marginBottom: 12 },
  row: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.primary + '30', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  avatarText: { fontSize: 14, fontWeight: 'bold', color: COLORS.primary },
});

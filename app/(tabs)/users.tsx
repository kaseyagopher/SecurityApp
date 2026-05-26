import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Button, Text, TextInput } from 'react-native-paper';
import { Screen } from '../../components/layout/Screen';
import { AppCard } from '../../components/ui/Card';
import { MockBanner } from '../../components/ui/MockBanner';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { COLORS, SPACING } from '../../constants/theme';
import type { AppUser } from '../../mocks/types';
import { api } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

export default function UsersScreen() {
  const { user } = useAuth();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setUsers(await api.getUsers());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.role !== 'admin') {
      router.back();
      return;
    }
    load();
  }, [user, load]);

  const toggleAuth = async (u: AppUser) => {
    await api.setUserAuthorized(u.id, !u.isAuthorized);
    load();
  };

  const deletePerson = (u: AppUser) => {
    const msg =
      u.fingerprintSlot != null
        ? `${u.name} sera supprimée et son empreinte (slot #${u.fingerprintSlot}) retirée du capteur.`
        : `Supprimer ${u.name} de la liste ?`;
    Alert.alert('Supprimer la personne', msg, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.deleteUser(u.id);
            load();
          } catch (e) {
            Alert.alert('Erreur', e instanceof Error ? e.message : 'Suppression impossible');
          }
        },
      },
    ]);
  };

  const removeFingerprint = (u: AppUser) => {
    Alert.alert('Supprimer l\'empreinte', `Retirer l\'empreinte de ${u.name} ?`, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          await api.deleteFingerprint(u.id);
          load();
        },
      },
    ]);
  };

  const addPerson = async () => {
    const name = newName.trim();
    if (!name) {
      Alert.alert('Erreur', 'Indiquez un nom');
      return;
    }
    await api.createUser({ name });
    setShowAdd(false);
    setNewName('');
    load();
  };

  return (
    <Screen
      title="Personnes"
      subtitle="Qui peut accéder au domicile"
      headerRight={
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <MaterialCommunityIcons name="close" size={26} color={COLORS.white} />
        </Pressable>
      }
    >
      <MockBanner />

      {showAdd ? (
        <AppCard title="Nouvelle personne">
          <Text style={styles.hint}>
            Seul le nom est nécessaire. Il apparaîtra dans l&apos;historique lors des accès.
          </Text>
          <TextInput label="Nom" value={newName} onChangeText={setNewName} mode="outlined" style={styles.input} />
          <View style={styles.row}>
            <Button onPress={() => setShowAdd(false)}>Annuler</Button>
            <Button mode="contained" onPress={addPerson}>
              Ajouter
            </Button>
          </View>
        </AppCard>
      ) : (
        <Button mode="contained-tonal" icon="account-plus" onPress={() => setShowAdd(true)}>
          Ajouter une personne
        </Button>
      )}

      {loading ? (
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: 24 }} />
      ) : (
        users
          .filter((u) => u.role !== 'admin')
          .map((u) => (
            <AppCard key={u.id}>
              <View style={styles.userRow}>
                <View style={styles.userAvatar}>
                  <Text style={styles.userAvatarText}>{u.name.slice(0, 2).toUpperCase()}</Text>
                </View>
                <View style={styles.userBody}>
                  <Text style={styles.userName}>{u.name}</Text>
                  <View style={styles.badges}>
                    <StatusBadge
                      label={u.isAuthorized ? 'Autorisé' : 'Non autorisé'}
                      tone={u.isAuthorized ? 'success' : 'neutral'}
                    />
                    {u.fingerprintSlot != null ? (
                      <StatusBadge label={`Empreinte #${u.fingerprintSlot}`} tone="info" />
                    ) : (
                      <StatusBadge label="Sans empreinte" tone="warning" />
                    )}
                  </View>
                </View>
              </View>
              <View style={styles.actions}>
                <Button mode="outlined" compact onPress={() => toggleAuth(u)}>
                  {u.isAuthorized ? 'Révoquer accès' : 'Autoriser'}
                </Button>
                {u.fingerprintSlot == null ? (
                  <Button
                    mode="contained"
                    compact
                    icon="fingerprint"
                    onPress={() =>
                      router.push({ pathname: '/(tabs)/enroll', params: { userId: String(u.id) } } as never)
                    }
                  >
                    Enregistrer
                  </Button>
                ) : (
                  <Button mode="text" compact textColor={COLORS.danger} onPress={() => removeFingerprint(u)}>
                    Retirer empreinte
                  </Button>
                )}
                <Button
                  mode="text"
                  compact
                  icon="delete-outline"
                  textColor={COLORS.textMuted}
                  onPress={() => deletePerson(u)}
                >
                  Supprimer
                </Button>
              </View>
            </AppCard>
          ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  hint: { fontSize: 13, color: COLORS.textSecondary, marginBottom: SPACING.sm },
  input: { marginBottom: SPACING.sm },
  row: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8 },
  userRow: { flexDirection: 'row', gap: SPACING.md },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userAvatarText: { fontWeight: '700', color: COLORS.primaryDark },
  userBody: { flex: 1, gap: 4 },
  userName: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: SPACING.md },
});

import { useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Chip, Searchbar, Text } from 'react-native-paper';
import { Screen } from '../../components/layout/Screen';
import { ActivityRow } from '../../components/ui/ActivityRow';
import { AppCard } from '../../components/ui/Card';
import { MockBanner } from '../../components/ui/MockBanner';
import { COLORS, SPACING } from '../../constants/theme';
import { useSystem } from '../../contexts/SystemContext';

const FILTERS = [
  { id: 'all', label: 'Tous' },
  { id: 'today', label: "Aujourd'hui" },
  { id: 'access', label: 'Accès' },
  { id: 'alarm', label: 'Alarmes' },
] as const;

export default function HistoryScreen() {
  const { history, loading } = useSystem();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<(typeof FILTERS)[number]['id']>('all');

  const stats = useMemo(() => {
    const success = history.filter((e) => e.result === 'success').length;
    const refused = history.filter((e) => e.result === 'refused').length;
    const alarms = history.filter((e) => e.event_type === 'alarm').length;
    return { total: history.length, success, refused, alarms };
  }, [history]);

  const filtered = useMemo(() => {
    const now = new Date();
    return history.filter((e) => {
      const d = new Date(e.created_at);
      if (filter === 'today' && d.toDateString() !== now.toDateString()) return false;
      if (filter === 'access' && e.event_type !== 'door_open' && e.event_type !== 'door_denied')
        return false;
      if (filter === 'alarm' && e.event_type !== 'alarm') return false;
      const q = search.toLowerCase();
      if (!q) return true;
      return (
        (e.userName?.toLowerCase().includes(q) ?? false) ||
        e.method.toLowerCase().includes(q) ||
        (e.details?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [history, filter, search]);

  return (
    <Screen title="Historiques" subtitle="Qui a accédé au domicile">
      <MockBanner />
      <Searchbar
        placeholder="Rechercher…"
        value={search}
        onChangeText={setSearch}
        style={styles.search}
        inputStyle={styles.searchInput}
      />
      <View style={styles.chips}>
        {FILTERS.map((f) => (
          <Chip
            key={f.id}
            selected={filter === f.id}
            onPress={() => setFilter(f.id)}
            style={filter === f.id ? styles.chipOn : undefined}
            textStyle={filter === f.id ? styles.chipTextOn : undefined}
          >
            {f.label}
          </Chip>
        ))}
      </View>

      

      <AppCard title={`${filtered.length} événement(s)`}>
        {loading && history.length === 0 ? (
          <ActivityIndicator color={COLORS.primary} style={{ padding: 24 }} />
        ) : filtered.length === 0 ? (
          <Text style={styles.empty}>Aucun événement</Text>
        ) : (
          filtered.map((e) => <ActivityRow key={e.id} event={e} />)
        )}
      </AppCard>
    </Screen>
  );
}

const styles = StyleSheet.create({
  search: { backgroundColor: COLORS.surface, elevation: 0 },
  searchInput: { fontSize: 15 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chipOn: { backgroundColor: COLORS.primary },
  chipTextOn: { color: COLORS.white },
  statsRow: { flexDirection: 'row', gap: SPACING.sm },
  stat: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: SPACING.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statValue: { fontSize: 20, fontWeight: '700', color: COLORS.primary },
  statLabel: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },
  empty: { textAlign: 'center', color: COLORS.textMuted, padding: SPACING.lg },
});

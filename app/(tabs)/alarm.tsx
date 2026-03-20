import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Card, Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext';
import { apiUrl } from '../../config/api';
import { useState, useEffect } from 'react';

export default function AlarmScreen() {
    const { user, token } = useAuth();
    const [triggering, setTriggering] = useState(false);
    const [stopping, setStopping] = useState(false);
    const [alarmActive, setAlarmActive] = useState<boolean | null>(null);

    const fetchStatus = () => {
        if (!token) return;
        fetch(apiUrl('/api/alarm/status'), { headers: { Authorization: `Bearer ${token}` } })
            .then((r) => (r.ok ? r.json() : { alarm: 'unknown' }))
            .then((data) => setAlarmActive(data.alarm === 'active'))
            .catch(() => setAlarmActive(null));
    };

    useEffect(() => {
        fetchStatus();
        const t = setInterval(fetchStatus, 5000);
        return () => clearInterval(t);
    }, [token]);

    const handleTriggerAlarm = async () => {
        if (user?.role !== 'admin') {
            Alert.alert('Accès refusé', 'Seul l\'administrateur peut déclencher l\'alarme.');
            return;
        }
        setTriggering(true);
        try {
            const res = await fetch(apiUrl('/api/alarm/trigger'), {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                setAlarmActive(true);
                Alert.alert('Alarme déclenchée', 'L\'alarme reste active jusqu\'à désactivation manuelle.');
            } else {
                Alert.alert('Erreur', 'Impossible de joindre l\'ESP32.');
            }
        } catch {
            Alert.alert('Erreur', 'Erreur réseau.');
        } finally {
            setTriggering(false);
        }
    };

    const handleStopAlarm = async () => {
        if (user?.role !== 'admin') return;
        setStopping(true);
        try {
            const res = await fetch(apiUrl('/api/alarm/stop'), {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json().catch(() => ({ success: false }));
            if (res.ok && data.success) {
                setAlarmActive(false);
                Alert.alert('Alarme désactivée', 'L\'alarme a été coupée.');
            } else {
                Alert.alert('Erreur', 'Impossible d\'arrêter l\'alarme. Vérifiez que l\'ESP32 est joignable.');
                fetchStatus();
            }
        } catch {
            Alert.alert('Erreur', 'Erreur réseau.');
            fetchStatus();
        } finally {
            setStopping(false);
        }
    };

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={[COLORS.primary, COLORS.primaryLight]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.header}
            >
                <View style={styles.headerContent}>
                    <Text style={styles.headerTitle}>Alarme</Text>
                    <Text style={styles.headerSubtitle}>Déclencher l'alarme en cas d'urgence</Text>
                </View>
            </LinearGradient>

            <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
                <Card style={styles.card}>
                    <LinearGradient colors={['#ffffff', '#f8fafc']} style={styles.cardGradient}>
                        <Card.Content style={styles.cardContent}>
                            <View style={styles.iconWrap}>
                                <MaterialCommunityIcons name="bell-ring" size={64} color={COLORS.danger} />
                            </View>
                            <Text style={styles.cardTitle}>
                                {alarmActive ? 'Alarme active' : 'Contrôle de l\'alarme'}
                            </Text>
                            <Text style={styles.cardDesc}>
                                {alarmActive
                                    ? 'L\'alarme est activée. LED rouge et buzzer actifs jusqu\'à désactivation.'
                                    : 'L\'alarme reste active jusqu\'à désactivation manuelle. Elle se déclenche aussi après 3 tentatives d\'accès refusées.'}
                            </Text>
                            {user?.role === 'admin' ? (
                                alarmActive ? (
                                    <Button
                                        mode="contained"
                                        onPress={handleStopAlarm}
                                        loading={stopping}
                                        disabled={stopping}
                                        style={styles.triggerBtn}
                                        icon="bell-off"
                                        buttonColor={COLORS.success}
                                    >
                                        Désactiver l'alarme
                                    </Button>
                                ) : (
                                    <Button
                                        mode="contained"
                                        onPress={handleTriggerAlarm}
                                        loading={triggering}
                                        disabled={triggering}
                                        style={styles.triggerBtn}
                                        icon="bell-ring"
                                        buttonColor={COLORS.danger}
                                    >
                                        Déclencher l'alarme
                                    </Button>
                                )
                            ) : (
                                <Text style={styles.adminOnly}>Réservé à l'administrateur</Text>
                            )}
                        </Card.Content>
                    </LinearGradient>
                </Card>
                <View style={{ height: 90 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    header: { paddingTop: 60, paddingBottom: 30, paddingHorizontal: 20, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
    headerContent: {},
    headerTitle: { fontSize: 28, fontWeight: 'bold', color: 'white', marginBottom: 8 },
    headerSubtitle: { fontSize: 16, color: 'rgba(255,255,255,0.9)' },
    scroll: { flex: 1 },
    scrollContent: { padding: 20 },
    card: { borderRadius: 24, elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12 },
    cardGradient: { borderRadius: 24, padding: 5 },
    cardContent: { alignItems: 'center', padding: 32 },
    iconWrap: { width: 100, height: 100, borderRadius: 50, backgroundColor: COLORS.danger + '15', alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
    cardTitle: { fontSize: 22, fontWeight: 'bold', color: COLORS.dark, marginBottom: 12, textAlign: 'center' },
    cardDesc: { fontSize: 15, color: COLORS.gray, textAlign: 'center', marginBottom: 24 },
    triggerBtn: { marginTop: 8 },
    adminOnly: { fontSize: 14, color: COLORS.gray, fontStyle: 'italic' },
});

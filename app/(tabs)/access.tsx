import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as LocalAuthentication from 'expo-local-authentication';
import { useEffect, useState } from 'react';
import { Alert, Dimensions, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Card, Text } from 'react-native-paper';
import { useAuth } from '../../contexts/AuthContext';
import { apiUrl } from '../../config/api';
import { COLORS } from '../../constants/theme';

const { width } = Dimensions.get('window');

export default function AccessScreen() {
    const { token, user } = useAuth();
    const [isScanning, setIsScanning] = useState(false);
    const [lastStatus, setLastStatus] = useState<'success' | 'error' | null>(null);
    const [biometricAvailable, setBiometricAvailable] = useState<boolean | null>(null);
    const [lastAccesses, setLastAccesses] = useState<{ name: string; time: string; result: string }[]>([]);

    useEffect(() => {
        (async () => {
            const hasHardware = await LocalAuthentication.hasHardwareAsync();
            const isEnrolled = await LocalAuthentication.isEnrolledAsync();
            setBiometricAvailable(hasHardware && isEnrolled);
        })();
    }, []);

    useEffect(() => {
        if (!token) return;
        fetch(apiUrl('/api/history?limit=10'), { headers: { Authorization: `Bearer ${token}` } })
            .then((r) => (r.ok ? r.json() : []))
            .then((data: { name: string | null; created_at: string; result: string; event_type: string }[]) => {
                const door = data.filter((h) => h.event_type === 'door_open').slice(0, 5);
                setLastAccesses(door.map((h) => {
                    const d = new Date(h.created_at);
                    return {
                        name: h.name || 'Système',
                        time: d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) + ' - Porte d\'entrée',
                        result: h.result,
                    };
                }));
            })
            .catch(() => {});
    }, [token]);

    const handleScan = async () => {
        if (!biometricAvailable) {
            Alert.alert(
                'Biométrie indisponible',
                'Aucun capteur d\'empreinte ou Face ID configuré sur cet appareil. Configurez-le dans les paramètres du téléphone.',
                [{ text: 'OK' }]
            );
            return;
        }

        setIsScanning(true);
        setLastStatus(null);

        try {
            const result = await LocalAuthentication.authenticateAsync({
                promptMessage: 'Vérifiez votre identité pour ouvrir la porte',
                cancelLabel: 'Annuler',
                disableDeviceFallback: false,
            });

            if (!result.success) {
                setIsScanning(false);
                setLastStatus('error');
                setTimeout(() => setLastStatus(null), 3000);
                return;
            }

            if (!token) {
                setLastStatus('error');
                Alert.alert('Session expirée', 'Reconnectez-vous.');
                return;
            }

            // Empreinte OK → backend vérifie l'autorisation et envoie la commande à l'ESP32
            const response = await fetch(apiUrl('/api/door/open'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({}),
            });
            const data = await response.json().catch(() => ({}));

            if (response.ok && data.success) {
                setLastStatus('success');
            } else {
                setLastStatus('error');
                if (response.status === 403) {
                    Alert.alert('Accès refusé', "Vous n'êtes pas autorisé à ouvrir la porte. Demandez à l'administrateur.");
                } else if (response.status === 502) {
                    Alert.alert('Porte hors ligne', 'L\'ESP32 n\'est pas joignable. Vérifiez qu\'il est allumé et sur le même réseau.');
                }
            }
        } catch (err) {
            setLastStatus('error');
            const message = err instanceof Error ? err.message : 'Erreur réseau';
            Alert.alert('Erreur', `Impossible de contacter le serveur: ${message}`);
        } finally {
            setIsScanning(false);
            setTimeout(() => setLastStatus(null), 3000);
        }
    };

    return (
        <View style={styles.container}>
            {/* Header avec dégradé */}
            <LinearGradient
                colors={[COLORS.primary, COLORS.primaryLight]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.header}
            >
                <View style={styles.headerContent}>
                    <Text style={styles.headerTitle}>Accès sécurisé</Text>
                    <Text style={styles.headerSubtitle}>Empreinte du téléphone → ESP32</Text>
                </View>
            </LinearGradient>

            {/* Carte principale - Scanner biométrique */}
            <Card style={styles.scannerCard}>
                <LinearGradient
                    colors={['#ffffff', '#f8fafc']}
                    style={styles.scannerGradient}
                >
                    <Card.Content style={styles.scannerContent}>
                        {/* Animation du capteur */}
                        <View style={styles.fingerprintContainer}>
                            <LinearGradient
                                colors={isScanning
                                    ? [COLORS.primary, COLORS.primaryLight]
                                    : lastStatus === 'success'
                                        ? [COLORS.success, COLORS.successLight]
                                        : lastStatus === 'error'
                                            ? [COLORS.danger, '#f87171']
                                            : ['#e2e8f0', '#cbd5e1']
                                }
                                style={[
                                    styles.fingerprintRing,
                                    isScanning && styles.pulseRing
                                ]}
                            >
                                <View style={styles.fingerprintInner}>
                                    <MaterialCommunityIcons
                                        name={lastStatus === 'success' ? 'check' : 'fingerprint'}
                                        size={64}
                                        color={isScanning || lastStatus ? COLORS.white : COLORS.gray}
                                    />
                                </View>
                            </LinearGradient>

                            <Text style={styles.scanTitle}>
                                {isScanning
                                    ? 'Scan en cours...'
                                    : lastStatus === 'success'
                                        ? 'Accès autorisé !'
                                        : lastStatus === 'error'
                                            ? 'Échec de reconnaissance'
                                            : 'Scanner votre empreinte'
                                }
                            </Text>

                            <Text style={styles.scanSubtitle}>
                                {isScanning
                                    ? 'Veuillez maintenir votre doigt'
                                    : lastStatus === 'success'
                                        ? `Bienvenue ${user?.name || 'Utilisateur'}`
                                        : lastStatus === 'error'
                                            ? 'Réessayez ou utilisez une autre méthode'
                                            : 'Utilisez l\'empreinte ou Face ID de votre téléphone'
                                }
                            </Text>
                        </View>

                        {/* Bouton de scan */}
                        <TouchableOpacity
                            onPress={handleScan}
                            disabled={isScanning}
                            activeOpacity={0.8}
                        >
                            <LinearGradient
                                colors={isScanning
                                    ? [COLORS.gray, COLORS.grayLight]
                                    : [COLORS.primary, COLORS.primaryLight]
                                }
                                style={styles.scanButton}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                            >
                                <Text style={styles.scanButtonText}>
                                    {isScanning ? 'Scan en cours...' : 'Scanner maintenant'}
                                </Text>
                                <MaterialCommunityIcons
                                    name="fingerprint"
                                    size={24}
                                    color="white"
                                />
                            </LinearGradient>
                        </TouchableOpacity>
                    </Card.Content>
                </LinearGradient>
            </Card>

            {/* Derniers accès - données API */}
            <Card style={styles.historyCard}>
                <Card.Title
                    title="Derniers accès"
                    subtitle={lastAccesses.length ? 'Porte d\'entrée' : 'Aucun accès'}
                    left={() => (
                        <View style={styles.historyIcon}>
                            <MaterialCommunityIcons name="clock-outline" size={24} color={COLORS.primary} />
                        </View>
                    )}
                />
                <Card.Content>
                    {lastAccesses.length === 0 ? (
                        <Text style={styles.emptyHistoryText}>Aucun accès enregistré</Text>
                    ) : (
                        lastAccesses.map((item, i) => (
                            <View key={i} style={styles.historyItem}>
                                <View style={styles.historyLeft}>
                                    <View style={[styles.historyDot, { backgroundColor: item.result === 'success' ? COLORS.success : COLORS.danger }]} />
                                    <View>
                                        <Text style={styles.historyName}>{item.name}</Text>
                                        <Text style={styles.historyTime}>{item.time}</Text>
                                    </View>
                                </View>
                                <View style={[styles.historyBadge, item.result !== 'success' && { backgroundColor: COLORS.danger + '20' }]}>
                                    <Text style={[styles.badgeText, { color: item.result === 'success' ? COLORS.success : COLORS.danger }]}>
                                        {item.result === 'success' ? 'Autorisé' : 'Refusé'}
                                    </Text>
                                </View>
                            </View>
                        ))
                    )}
                </Card.Content>
            </Card>

            {/* Espace pour la tab bar */}
            <View style={{ height: 90 }} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
        paddingTop: 60,
        paddingBottom: 40,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
    },
    headerContent: {
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: COLORS.white,
        marginBottom: 8,
    },
    headerSubtitle: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.9)',
    },
    scannerCard: {
        marginTop: -30,
        marginHorizontal: 20,
        borderRadius: 24,
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
    },
    scannerGradient: {
        borderRadius: 24,
        padding: 5,
    },
    scannerContent: {
        padding: 16,
    },
    fingerprintContainer: {
        alignItems: 'center',
        marginVertical: 24,
    },
    fingerprintRing: {
        width: 140,
        height: 140,
        borderRadius: 70,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    pulseRing: {
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 10,
    },
    fingerprintInner: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: 'white',
        alignItems: 'center',
        justifyContent: 'center',
    },
    scanTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: COLORS.dark,
        marginBottom: 8,
    },
    scanSubtitle: {
        fontSize: 15,
        color: COLORS.gray,
        textAlign: 'center',
        marginBottom: 24,
    },
    scanButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 16,
        gap: 12,
    },
    scanButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: '600',
    },
    alternativeSection: {
        marginTop: 32,
    },
    alternativeTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.dark,
        marginBottom: 16,
        textAlign: 'center',
    },
    alternativeGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: 12,
    },
    alternativeItem: {
        width: (width - 100) / 2,
        alignItems: 'center',
        marginBottom: 16,
    },
    alternativeIcon: {
        width: 60,
        height: 60,
        borderRadius: 30,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    alternativeText: {
        fontSize: 14,
        color: COLORS.dark,
        fontWeight: '500',
    },
    historyCard: {
        marginTop: 24,
        marginHorizontal: 20,
        borderRadius: 20,
        backgroundColor: 'white',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
    },
    historyIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: COLORS.primary + '10',
        alignItems: 'center',
        justifyContent: 'center',
    },
    historyItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    historyLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    historyDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    historyName: {
        fontSize: 15,
        fontWeight: '600',
        color: COLORS.dark,
    },
    historyTime: {
        fontSize: 13,
        color: COLORS.gray,
        marginTop: 2,
    },
    badgeText: {
        fontSize: 12,
        fontWeight: '600',
    },
    historyBadge: {
        backgroundColor: COLORS.success + '20',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 20,
    },
    emptyHistoryText: {
        fontSize: 14,
        color: COLORS.gray,
        textAlign: 'center',
        paddingVertical: 20,
    },
});
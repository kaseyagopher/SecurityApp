import { View, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { Text, Card, Switch } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../../constants/theme';
import { useState } from 'react';

const { width } = Dimensions.get('window');

export default function AlarmScreen() {
    const [isArmed, setIsArmed] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedMode, setSelectedMode] = useState('home');

    const handleArmAlarm = () => {
        setIsLoading(true);

        // Simulation d'activation
        setTimeout(() => {
            setIsArmed(!isArmed);
            setIsLoading(false);
        }, 1500);
    };

    const alarmModes = [
        {
            id: 'home',
            name: 'Mode Maison',
            description: 'Capteurs périmétriques actifs',
            icon: 'home',
            color: COLORS.primary,
            gradient: [COLORS.primary, COLORS.primaryLight]
        },
        {
            id: 'night',
            name: 'Mode Nuit',
            description: 'Tous capteurs actifs',
            icon: 'weather-night',
            color: COLORS.secondary,
            gradient: [COLORS.secondary, COLORS.secondaryLight]
        },
        {
            id: 'away',
            name: 'Mode Absent',
            description: 'Protection totale',
            icon: 'briefcase',
            color: COLORS.success,
            gradient: [COLORS.success, COLORS.successLight]
        },
        {
            id: 'vacation',
            name: 'Mode Vacances',
            description: 'Simulation présence',
            icon: 'airplane',
            color: COLORS.info,
            gradient: [COLORS.info, COLORS.infoLight]
        }
    ];

    const sensors = [
        {
            id: 1,
            name: 'Porte d\'entrée',
            status: 'Fermée',
            isSecure: true,
            icon: 'door',
            battery: 85
        },

    ];

    const recentAlerts = [
        {
            id: 1,
            type: 'warning',
            message: 'Tentative d\'accès - Porte entrée',
            time: '14:30',
            icon: 'bell-ring'
        },

    ];

    return (
        <View style={styles.container}>
            {/* Header avec dégradé */}
            <LinearGradient
                colors={isArmed
                    ? [COLORS.success, COLORS.successLight]
                    : [COLORS.danger, '#f87171']
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.header}
            >
                <View style={styles.headerContent}>
                    <View style={styles.headerLeft}>
                        <Text style={styles.headerTitle}>Alarme</Text>
                        <Text style={styles.headerSubtitle}>
                            {isArmed ? 'Système armé' : 'Système désarmé'}
                        </Text>
                    </View>
                    <View style={styles.headerRight}>
                        <MaterialCommunityIcons
                            name={isArmed ? 'shield-check' : 'shield-off'}
                            size={32}
                            color="white"
                        />
                    </View>
                </View>

                {/* Statut badge */}
                <View style={styles.statusBadge}>
                    <View style={styles.statusDot} />
                    <Text style={styles.statusText}>
                        {isArmed ? 'Protection active' : 'Aucune protection'}
                    </Text>
                </View>
            </LinearGradient>

            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Contrôle principal - Bouton circulaire */}
                <Card style={styles.mainControlCard}>
                    <LinearGradient
                        colors={['#ffffff', '#f8fafc']}
                        style={styles.mainControlGradient}
                    >
                        <Card.Content style={styles.mainControlContent}>
                            <Text style={styles.controlTitle}>Contrôle central</Text>

                            <TouchableOpacity
                                onPress={handleArmAlarm}
                                disabled={isLoading}
                                activeOpacity={0.8}
                            >
                                <LinearGradient
                                    colors={isArmed
                                        ? ['#ef4444', '#dc2626']
                                        : [COLORS.success, COLORS.successLight]
                                    }
                                    style={[
                                        styles.armButton,
                                        isLoading && styles.armButtonLoading
                                    ]}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                >
                                    <View style={styles.armButtonContent}>
                                        {isLoading ? (
                                            <>
                                                <MaterialCommunityIcons
                                                    name="loading"
                                                    size={48}
                                                    color="white"
                                                    style={styles.loadingIcon}
                                                />
                                                <Text style={styles.armButtonText}>
                                                    {isArmed ? 'Désarmement...' : 'Armement...'}
                                                </Text>
                                            </>
                                        ) : (
                                            <>
                                                <MaterialCommunityIcons
                                                    name={isArmed ? 'shield-off' : 'shield-check'}
                                                    size={48}
                                                    color="white"
                                                />
                                                <Text style={styles.armButtonText}>
                                                    {isArmed ? 'Désarmer' : 'Armer'}
                                                </Text>
                                            </>
                                        )}
                                    </View>
                                </LinearGradient>
                            </TouchableOpacity>

                            <View style={styles.armStatus}>
                                <Text style={styles.armStatusText}>
                                    {isArmed
                                        ? 'Tous les capteurs sont actifs'
                                        : 'Aucun capteur actif'}
                                </Text>
                            </View>
                        </Card.Content>
                    </LinearGradient>
                </Card>

                {/* Modes d'alarme */}
                <View style={styles.modesSection}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Modes de sécurité</Text>
                        <TouchableOpacity>
                            <Text style={styles.sectionLink}>Personnaliser</Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.modesContainer}
                    >
                        {alarmModes.map((mode) => (
                            <TouchableOpacity
                                key={mode.id}
                                onPress={() => setSelectedMode(mode.id)}
                            >
                                <Card style={[
                                    styles.modeCard,
                                    selectedMode === mode.id && styles.modeCardSelected
                                ]}>
                                    <LinearGradient
                                        colors={selectedMode === mode.id
                                            ? mode.gradient
                                            : ['#ffffff', '#f8fafc']
                                        }
                                        style={styles.modeGradient}
                                    >
                                        <View style={[
                                            styles.modeIconContainer,
                                            selectedMode === mode.id && { backgroundColor: 'rgba(255,255,255,0.2)' }
                                        ]}>
                                            <MaterialCommunityIcons
                                                name={mode.icon}
                                                size={28}
                                                color={selectedMode === mode.id ? 'white' : mode.color}
                                            />
                                        </View>
                                        <Text style={[
                                            styles.modeName,
                                            selectedMode === mode.id && styles.modeTextSelected
                                        ]}>
                                            {mode.name}
                                        </Text>
                                        <Text style={[
                                            styles.modeDescription,
                                            selectedMode === mode.id && styles.modeDescSelected
                                        ]}>
                                            {mode.description}
                                        </Text>
                                    </LinearGradient>
                                </Card>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {/* État des capteurs */}
                <View style={styles.sensorsSection}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Capteurs connectés</Text>
                        <Text style={styles.sensorCount}>{sensors.length} actifs</Text>
                    </View>

                    {sensors.map((sensor) => (
                        <Card key={sensor.id} style={styles.sensorCard}>
                            <Card.Content style={styles.sensorContent}>
                                <View style={styles.sensorLeft}>
                                    <View style={[styles.sensorIcon, { backgroundColor: COLORS.primary + '10' }]}>
                                        <MaterialCommunityIcons
                                            name={sensor.icon}
                                            size={24}
                                            color={COLORS.primary}
                                        />
                                    </View>
                                    <View>
                                        <Text style={styles.sensorName}>{sensor.name}</Text>
                                        <View style={styles.sensorStatus}>
                                            <View style={[styles.statusDot, { backgroundColor: COLORS.success }]} />
                                            <Text style={styles.sensorStatusText}>{sensor.status}</Text>
                                        </View>
                                    </View>
                                </View>

                                <View style={styles.sensorRight}>
                                    <View style={styles.batteryContainer}>
                                        <MaterialCommunityIcons
                                            name={sensor.battery > 70 ? 'battery' : sensor.battery > 30 ? 'battery-50' : 'battery-20'}
                                            size={20}
                                            color={sensor.battery > 30 ? COLORS.success : COLORS.danger}
                                        />
                                        <Text style={styles.batteryText}>{sensor.battery}%</Text>
                                    </View>
                                    <MaterialCommunityIcons
                                        name="chevron-right"
                                        size={24}
                                        color={COLORS.gray}
                                    />
                                </View>
                            </Card.Content>
                        </Card>
                    ))}
                </View>

                {/* Alertes récentes */}
                <View style={styles.alertsSection}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Alertes récentes</Text>
                        <TouchableOpacity>
                            <Text style={styles.sectionLink}>Voir tout</Text>
                        </TouchableOpacity>
                    </View>

                    {recentAlerts.map((alert) => (
                        <Card key={alert.id} style={styles.alertCard}>
                            <Card.Content style={styles.alertContent}>
                                <View style={styles.alertLeft}>
                                    <View style={[
                                        styles.alertIcon,
                                        { backgroundColor: COLORS[alert.type] + '15' }
                                    ]}>
                                        <MaterialCommunityIcons
                                            name={alert.icon}
                                            size={20}
                                            color={COLORS[alert.type]}
                                        />
                                    </View>
                                    <View>
                                        <Text style={styles.alertMessage}>{alert.message}</Text>
                                        <Text style={styles.alertTime}>{alert.time}</Text>
                                    </View>
                                </View>
                                <View style={[
                                    styles.alertBadge,
                                    { backgroundColor: COLORS[alert.type] + '20' }
                                ]}>
                                    <Text style={[styles.alertBadgeText, { color: COLORS[alert.type] }]}>
                                        {alert.type === 'warning' ? 'Alerte' :
                                            alert.type === 'info' ? 'Info' : 'Succès'}
                                    </Text>
                                </View>
                            </Card.Content>
                        </Card>
                    ))}
                </View>

                {/* Paramètres rapides */}
                <Card style={styles.settingsCard}>
                    <LinearGradient
                        colors={['#ffffff', '#fafafa']}
                        style={styles.settingsGradient}
                    >
                        <Card.Content>
                            <View style={styles.settingsHeader}>
                                <Text style={styles.settingsTitle}>Paramètres rapides</Text>
                                <TouchableOpacity>
                                    <Text style={styles.settingsLink}>Voir tout</Text>
                                </TouchableOpacity>
                            </View>

                            <View style={styles.settingItem}>
                                <View style={styles.settingLeft}>
                                    <MaterialCommunityIcons name="bell" size={22} color={COLORS.primary} />
                                    <Text style={styles.settingText}>Notifications push</Text>
                                </View>
                                <Switch
                                    value={true}
                                    color={COLORS.primary}
                                />
                            </View>

                            <View style={styles.settingItem}>
                                <View style={styles.settingLeft}>
                                    <MaterialCommunityIcons name="timer" size={22} color={COLORS.primary} />
                                    <Text style={styles.settingText}>Délai d'entrée</Text>
                                </View>
                                <Text style={styles.settingValue}>30s</Text>
                            </View>

                            <View style={styles.settingItem}>
                                <View style={styles.settingLeft}>
                                    <MaterialCommunityIcons name="volume-high" size={22} color={COLORS.primary} />
                                    <Text style={styles.settingText}>Sirène d'alarme</Text>
                                </View>
                                <Switch
                                    value={true}
                                    color={COLORS.primary}
                                />
                            </View>
                        </Card.Content>
                    </LinearGradient>
                </Card>

                <View style={{ height: 90 }} />
            </ScrollView>
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
        paddingBottom: 30,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
    },
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    headerLeft: {
        flex: 1,
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
    headerRight: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignSelf: 'flex-start',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 30,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: COLORS.white,
        marginRight: 8,
    },
    statusText: {
        fontSize: 14,
        color: COLORS.white,
        fontWeight: '600',
    },
    mainControlCard: {
        marginTop: -20,
        marginHorizontal: 20,
        borderRadius: 24,
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
    },
    mainControlGradient: {
        borderRadius: 24,
        padding: 5,
    },
    mainControlContent: {
        alignItems: 'center',
        padding: 24,
    },
    controlTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: COLORS.dark,
        marginBottom: 24,
    },
    armButton: {
        width: 180,
        height: 180,
        borderRadius: 90,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    armButtonLoading: {
        opacity: 0.8,
    },
    armButtonContent: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    loadingIcon: {
        transform: [{ rotate: '45deg' }],
    },
    armButtonText: {
        color: COLORS.white,
        fontSize: 20,
        fontWeight: 'bold',
        marginTop: 12,
    },
    armStatus: {
        marginTop: 8,
    },
    armStatusText: {
        fontSize: 14,
        color: COLORS.gray,
    },
    modesSection: {
        marginTop: 24,
        paddingLeft: 20,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingRight: 20,
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.dark,
    },
    sectionLink: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.primary,
    },
    modesContainer: {
        paddingRight: 20,
        gap: 12,
    },
    modeCard: {
        width: 160,
        marginRight: 12,
        borderRadius: 20,
        overflow: 'hidden',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
    },
    modeCardSelected: {
        elevation: 6,
        shadowOpacity: 0.15,
    },
    modeGradient: {
        padding: 16,
        alignItems: 'center',
    },
    modeIconContainer: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#f0f0f0',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    modeName: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.dark,
        marginBottom: 4,
        textAlign: 'center',
    },
    modeTextSelected: {
        color: COLORS.white,
    },
    modeDescription: {
        fontSize: 12,
        color: COLORS.gray,
        textAlign: 'center',
    },
    modeDescSelected: {
        color: 'rgba(255,255,255,0.9)',
    },
    sensorsSection: {
        marginTop: 24,
        paddingHorizontal: 20,
    },
    sensorCount: {
        fontSize: 14,
        color: COLORS.primary,
        fontWeight: '600',
    },
    sensorCard: {
        marginBottom: 12,
        borderRadius: 16,
        backgroundColor: COLORS.white,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
    },
    sensorContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    sensorLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    sensorIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    sensorName: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.dark,
        marginBottom: 4,
    },
    sensorStatus: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    sensorStatusText: {
        fontSize: 14,
        color: COLORS.success,
        fontWeight: '500',
    },
    sensorRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    batteryContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    batteryText: {
        fontSize: 14,
        color: COLORS.gray,
    },
    alertsSection: {
        marginTop: 24,
        paddingHorizontal: 20,
    },
    alertCard: {
        marginBottom: 8,
        borderRadius: 12,
        backgroundColor: COLORS.white,
    },
    alertContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    alertLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    alertIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    alertMessage: {
        fontSize: 15,
        fontWeight: '500',
        color: COLORS.dark,
        marginBottom: 2,
    },
    alertTime: {
        fontSize: 12,
        color: COLORS.gray,
    },
    alertBadge: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 16,
    },
    alertBadgeText: {
        fontSize: 12,
        fontWeight: '600',
    },
    settingsCard: {
        marginTop: 24,
        marginHorizontal: 20,
        borderRadius: 20,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
    },
    settingsGradient: {
        borderRadius: 20,
        padding: 5,
    },
    settingsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    settingsTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.dark,
    },
    settingsLink: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.primary,
    },
    settingItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    settingLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    settingText: {
        fontSize: 16,
        color: COLORS.dark,
    },
    settingValue: {
        fontSize: 16,
        color: COLORS.primary,
        fontWeight: '600',
    },
});
import { View, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { Text, Card, Searchbar, Chip } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../../constants/theme';
import { useState } from 'react';

const { width } = Dimensions.get('window');

export default function HistoryScreen() {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedFilter, setSelectedFilter] = useState('all');

    const filters = [
        { id: 'all', label: 'Tous', icon: 'format-list-bulleted' },
        { id: 'today', label: 'Aujourd\'hui', icon: 'calendar-today' },
        { id: 'week', label: 'Cette semaine', icon: 'calendar-week' },
        { id: 'month', label: 'Ce mois', icon: 'calendar-month' },
    ];

    const stats = [
        {
            label: 'Total accès',
            value: '156',
            icon: 'door',
            color: COLORS.primary,
            gradient: [COLORS.primary, COLORS.primaryLight]
        },
        {
            label: 'Autorisés',
            value: '142',
            icon: 'check-circle',
            color: COLORS.success,
            gradient: [COLORS.success, COLORS.successLight]
        },
        {
            label: 'Refusés',
            value: '14',
            icon: 'close-circle',
            color: COLORS.danger,
            gradient: [COLORS.danger, '#f87171']
        },
        {
            label: 'Alarmes',
            value: '3',
            icon: 'bell',
            color: COLORS.secondary,
            gradient: [COLORS.secondary, COLORS.secondaryLight]
        },
    ];

    const recentActivities = [
        {
            id: 1,
            user: 'Godelive K.',
            type: 'Accès autorisé',
            method: 'Empreinte digitale',
            time: '14:30',
            date: 'Aujourd\'hui',
            status: 'success',
            device: 'Porte d\'entrée',
        },
        {
            id: 2,
            user: 'Admin',
            type: 'Accès autorisé',
            method: 'Code PIN',
            time: '11:15',
            date: 'Aujourd\'hui',
            status: 'success',
            device: 'Porte principale',
        },
        {
            id: 3,
            user: 'Visiteur',
            type: 'Accès refusé',
            method: 'Empreinte inconnue',
            time: '09:45',
            date: 'Aujourd\'hui',
            status: 'error',
            device: 'Porte d\'entrée',
        },
        {
            id: 4,
            user: 'Godelive K.',
            type: 'Alarme désactivée',
            method: 'Application mobile',
            time: '08:20',
            date: 'Aujourd\'hui',
            status: 'warning',
            device: 'Système alarme',
        },
        {
            id: 5,
            user: 'Marie K.',
            type: 'Accès autorisé',
            method: 'Carte RFID',
            time: '19:45',
            date: 'Hier',
            status: 'success',
            device: 'Porte garage',
        },
        {
            id: 6,
            user: 'Inconnu',
            type: 'Tentative forcée',
            method: 'Alarme déclenchée',
            time: '02:30',
            date: 'Hier',
            status: 'danger',
            device: 'Fenêtre salon',
        },
    ];

    const getStatusColor = (status: string) => {
        switch(status) {
            case 'success': return COLORS.success;
            case 'error': return COLORS.danger;
            case 'warning': return COLORS.secondary;
            case 'danger': return COLORS.danger;
            default: return COLORS.gray;
        }
    };

    const getStatusIcon = (status: string) => {
        switch(status) {
            case 'success': return 'check-circle';
            case 'error': return 'close-circle';
            case 'warning': return 'bell';
            case 'danger': return 'alert';
            default: return 'information';
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
                    <Text style={styles.headerTitle}>Historique</Text>
                    <Text style={styles.headerSubtitle}>Journal des accès et événements</Text>
                </View>

                {/* Barre de recherche */}
                <View style={styles.searchContainer}>
                    <Searchbar
                        placeholder="Rechercher un accès..."
                        onChangeText={setSearchQuery}
                        value={searchQuery}
                        style={styles.searchBar}
                        inputStyle={styles.searchInput}
                        iconColor={COLORS.gray}
                        placeholderTextColor={COLORS.gray}
                    />
                </View>
            </LinearGradient>

            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Stats Cards */}
                <View style={styles.statsGrid}>
                    {stats.map((stat, index) => (
                        <TouchableOpacity key={index} style={styles.statCard}>
                            <LinearGradient
                                colors={stat.gradient}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.statGradient}
                            >
                                <View style={styles.statIconContainer}>
                                    <MaterialCommunityIcons name={stat.icon} size={24} color="white" />
                                </View>
                                <Text style={styles.statValue}>{stat.value}</Text>
                                <Text style={styles.statLabel}>{stat.label}</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Filtres */}
                <View style={styles.filtersSection}>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.filtersContainer}
                    >
                        {filters.map((filter) => (
                            <TouchableOpacity
                                key={filter.id}
                                onPress={() => setSelectedFilter(filter.id)}
                            >
                                <Chip
                                    selected={selectedFilter === filter.id}
                                    style={[
                                        styles.filterChip,
                                        selectedFilter === filter.id && styles.filterChipSelected
                                    ]}
                                    textStyle={[
                                        styles.filterText,
                                        selectedFilter === filter.id && styles.filterTextSelected
                                    ]}
                                    icon={() => (
                                        <MaterialCommunityIcons
                                            name={filter.icon}
                                            size={18}
                                            color={selectedFilter === filter.id ? COLORS.white : COLORS.gray}
                                        />
                                    )}
                                >
                                    {filter.label}
                                </Chip>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {/* Graphique d'activité */}
                <Card style={styles.chartCard}>
                    <LinearGradient
                        colors={['#ffffff', '#fafafa']}
                        style={styles.chartGradient}
                    >
                        <Card.Content>
                            <View style={styles.chartHeader}>
                                <View>
                                    <Text style={styles.chartTitle}>Activité hebdomadaire</Text>
                                    <Text style={styles.chartSubtitle}>Nombre d'accès par jour</Text>
                                </View>
                                <TouchableOpacity>
                                    <Text style={styles.chartLink}>Détails</Text>
                                </TouchableOpacity>
                            </View>

                            {/* Barres du graphique */}
                            <View style={styles.chartBars}>
                                {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((day, index) => {
                                    const heights = [60, 45, 80, 65, 90, 55, 40];
                                    return (
                                        <View key={day} style={styles.chartBarItem}>
                                            <View style={styles.barContainer}>
                                                <LinearGradient
                                                    colors={[COLORS.primary, COLORS.primaryLight]}
                                                    style={[
                                                        styles.chartBar,
                                                        { height: heights[index] }
                                                    ]}
                                                    start={{ x: 0, y: 1 }}
                                                    end={{ x: 0, y: 0 }}
                                                />
                                            </View>
                                            <Text style={styles.chartDay}>{day}</Text>
                                        </View>
                                    );
                                })}
                            </View>
                        </Card.Content>
                    </LinearGradient>
                </Card>

                {/* Liste des activités */}
                <View style={styles.activitiesSection}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Activités récentes</Text>
                        <TouchableOpacity>
                            <Text style={styles.sectionLink}>Voir tout</Text>
                        </TouchableOpacity>
                    </View>

                    {recentActivities.map((activity) => (
                        <Card key={activity.id} style={styles.activityCard}>
                            <Card.Content style={styles.activityContent}>
                                <View style={styles.activityLeft}>
                                    <View style={[
                                        styles.activityIconContainer,
                                        { backgroundColor: getStatusColor(activity.status) + '15' }
                                    ]}>
                                        <MaterialCommunityIcons
                                            name={getStatusIcon(activity.status)}
                                            size={24}
                                            color={getStatusColor(activity.status)}
                                        />
                                    </View>
                                    <View>
                                        <Text style={styles.activityUser}>{activity.user}</Text>
                                        <Text style={styles.activityType}>{activity.type}</Text>
                                        <View style={styles.activityMeta}>
                                            <View style={styles.metaItem}>
                                                <MaterialCommunityIcons name="fingerprint" size={14} color={COLORS.gray} />
                                                <Text style={styles.metaText}>{activity.method}</Text>
                                            </View>
                                            <View style={styles.metaItem}>
                                                <MaterialCommunityIcons name="door" size={14} color={COLORS.gray} />
                                                <Text style={styles.metaText}>{activity.device}</Text>
                                            </View>
                                        </View>
                                    </View>
                                </View>

                                <View style={styles.activityRight}>
                                    <Text style={styles.activityTime}>{activity.time}</Text>
                                    <View style={[
                                        styles.statusBadge,
                                        { backgroundColor: getStatusColor(activity.status) + '20' }
                                    ]}>
                                        <Text style={[
                                            styles.statusText,
                                            { color: getStatusColor(activity.status) }
                                        ]}>
                                            {activity.date}
                                        </Text>
                                    </View>
                                </View>
                            </Card.Content>
                        </Card>
                    ))}
                </View>

                {/* Bouton charger plus */}
                <TouchableOpacity style={styles.loadMoreButton}>
                    <Text style={styles.loadMoreText}>Charger plus d'activités</Text>
                    <MaterialCommunityIcons name="chevron-down" size={20} color={COLORS.primary} />
                </TouchableOpacity>

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
        marginBottom: 20,
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
    searchContainer: {
        marginTop: 10,
    },
    searchBar: {
        elevation: 0,
        backgroundColor: COLORS.white,
        borderRadius: 16,
        height: 50,
    },
    searchInput: {
        fontSize: 16,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: 20,
        marginTop: 24,
        gap: 12,
    },
    statCard: {
        width: (width - 52) / 2,
        borderRadius: 20,
        overflow: 'hidden',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
    statGradient: {
        padding: 20,
        alignItems: 'center',
    },
    statIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    statValue: {
        fontSize: 28,
        fontWeight: 'bold',
        color: COLORS.white,
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.9)',
    },
    filtersSection: {
        marginTop: 24,
        marginBottom: 8,
    },
    filtersContainer: {
        paddingHorizontal: 20,
        gap: 12,
    },
    filterChip: {
        backgroundColor: COLORS.white,
        borderRadius: 25,
        paddingHorizontal: 8,
    },
    filterChipSelected: {
        backgroundColor: COLORS.primary,
    },
    filterText: {
        fontSize: 14,
        color: COLORS.dark,
    },
    filterTextSelected: {
        color: COLORS.white,
    },
    chartCard: {
        marginHorizontal: 20,
        marginTop: 24,
        borderRadius: 20,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
    },
    chartGradient: {
        borderRadius: 20,
        padding: 5,
    },
    chartHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    chartTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.dark,
    },
    chartSubtitle: {
        fontSize: 14,
        color: COLORS.gray,
        marginTop: 4,
    },
    chartLink: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.primary,
    },
    chartBars: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        height: 120,
    },
    chartBarItem: {
        alignItems: 'center',
    },
    barContainer: {
        width: 30,
        height: 100,
        justifyContent: 'flex-end',
    },
    chartBar: {
        width: '100%',
        borderRadius: 8,
        minHeight: 4,
    },
    chartDay: {
        fontSize: 12,
        color: COLORS.gray,
        marginTop: 8,
    },
    activitiesSection: {
        marginTop: 24,
        paddingHorizontal: 20,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
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
    activityCard: {
        marginBottom: 12,
        borderRadius: 16,
        backgroundColor: COLORS.white,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
    },
    activityContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    activityLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: 12,
    },
    activityIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    activityUser: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.dark,
        marginBottom: 2,
    },
    activityType: {
        fontSize: 14,
        color: COLORS.gray,
        marginBottom: 4,
    },
    activityMeta: {
        flexDirection: 'row',
        gap: 12,
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    metaText: {
        fontSize: 12,
        color: COLORS.gray,
    },
    activityRight: {
        alignItems: 'flex-end',
    },
    activityTime: {
        fontSize: 14,
        fontWeight: '500',
        color: COLORS.dark,
        marginBottom: 4,
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 20,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
    },
    loadMoreButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 16,
        marginBottom: 8,
        paddingVertical: 12,
    },
    loadMoreText: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.primary,
        marginRight: 8,
    },
});
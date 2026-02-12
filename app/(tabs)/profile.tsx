import { View, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { Text, Card, Avatar, Button, ProgressBar } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../../constants/theme';
import { useState } from 'react';

const { width } = Dimensions.get('window');

export default function ProfileScreen() {
    const [isEditing, setIsEditing] = useState(false);

    const userStats = [
        {
            id: 1,
            label: 'Accès',
            value: '156',
            icon: 'door',
            color: COLORS.primary,
            gradient: [COLORS.primary, COLORS.primaryLight]
        },
        {
            id: 2,
            label: 'Empreintes',
            value: '4',
            icon: 'fingerprint',
            color: COLORS.success,
            gradient: [COLORS.success, COLORS.successLight]
        },
        {
            id: 3,
            label: 'Alertes',
            value: '3',
            icon: 'bell',
            color: COLORS.secondary,
            gradient: [COLORS.secondary, COLORS.secondaryLight]
        },
        {
            id: 4,
            label: 'Appareils',
            value: '6',
            icon: 'devices',
            color: COLORS.info,
            gradient: [COLORS.info, COLORS.infoLight]
        }
    ];

    const securitySettings = [
        {
            id: 1,
            title: 'Authentification à deux facteurs',
            subtitle: 'Sécuriser votre compte',
            icon: 'shield-account',
            color: COLORS.primary,
            value: true
        },
        {
            id: 2,
            title: 'Notifications de sécurité',
            subtitle: 'Alertes en temps réel',
            icon: 'bell-security',
            color: COLORS.success,
            value: true
        },
        {
            id: 3,
            title: 'Verrouillage automatique',
            subtitle: 'Après 5 minutes d\'inactivité',
            icon: 'clock-lock',
            color: COLORS.secondary,
            value: false
        }
    ];

    const familyMembers = [
        {
            id: 1,
            name: 'Godelive K.',
            role: 'Administrateur',
            avatar: 'GK',
            fingerprints: 2,
            lastAccess: 'Aujourd\'hui, 14:30',
            color: COLORS.primary
        },
        {
            id: 2,
            name: 'Simon K.',
            role: 'Membre',
            avatar: 'SK',
            fingerprints: 1,
            lastAccess: 'Aujourd\'hui, 11:15',
            color: COLORS.success
        },
        {
            id: 3,
            name: 'Pauline M.',
            role: 'Membre',
            avatar: 'PM',
            fingerprints: 1,
            lastAccess: 'Hier, 19:45',
            color: COLORS.secondary
        },
        {
            id: 4,
            name: 'Marie K.',
            role: 'Invité',
            avatar: 'MK',
            fingerprints: 1,
            lastAccess: 'Hier, 08:20',
            color: COLORS.info
        }
    ];

    const activityLog = [
        {
            id: 1,
            action: 'Modification du code PIN',
            device: 'Porte d\'entrée',
            time: 'Il y a 2 heures',
            icon: 'lock-reset'
        },
        {
            id: 2,
            action: 'Nouvelle empreinte ajoutée',
            device: 'Administrateur',
            time: 'Hier, 15:30',
            icon: 'fingerprint'
        },
        {
            id: 3,
            action: 'Alarme désactivée',
            device: 'Système central',
            time: 'Hier, 08:15',
            icon: 'bell-off'
        }
    ];

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
                    <View style={styles.headerTop}>
                        <Text style={styles.headerTitle}>Profil</Text>
                        <TouchableOpacity
                            style={styles.editButton}
                            onPress={() => setIsEditing(!isEditing)}
                        >
                            <MaterialCommunityIcons
                                name={isEditing ? 'check' : 'pencil'}
                                size={22}
                                color="white"
                            />
                        </TouchableOpacity>
                    </View>
                </View>
            </LinearGradient>

            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Carte de profil */}
                <Card style={styles.profileCard}>
                    <LinearGradient
                        colors={['#ffffff', '#f8fafc']}
                        style={styles.profileGradient}
                    >
                        <Card.Content style={styles.profileContent}>
                            <View style={styles.avatarContainer}>
                                <LinearGradient
                                    colors={[COLORS.primary, COLORS.primaryLight]}
                                    style={styles.avatarGradient}
                                >
                                    <Avatar.Text
                                        size={80}
                                        label="GK"
                                        style={styles.avatar}
                                        labelStyle={styles.avatarLabel}
                                    />
                                </LinearGradient>

                                {isEditing && (
                                    <TouchableOpacity style={styles.cameraButton}>
                                        <LinearGradient
                                            colors={[COLORS.primary, COLORS.primaryLight]}
                                            style={styles.cameraGradient}
                                        >
                                            <MaterialCommunityIcons name="camera" size={20} color="white" />
                                        </LinearGradient>
                                    </TouchableOpacity>
                                )}
                            </View>

                            <View style={styles.userInfo}>
                                <Text style={styles.userName}>Godelive Kapinga</Text>
                                <View style={styles.userRoleContainer}>
                                    <View style={styles.roleBadge}>
                                        <MaterialCommunityIcons name="shield-account" size={16} color={COLORS.primary} />
                                        <Text style={styles.userRole}>Administrateur</Text>
                                    </View>
                                </View>

                                <View style={styles.userContact}>
                                    <View style={styles.contactItem}>
                                        <MaterialCommunityIcons name="email" size={16} color={COLORS.gray} />
                                        <Text style={styles.contactText}>godelive.k@security.com</Text>
                                    </View>
                                    <View style={styles.contactItem}>
                                        <MaterialCommunityIcons name="phone" size={16} color={COLORS.gray} />
                                        <Text style={styles.contactText}>+243 999 999 999</Text>
                                    </View>
                                </View>
                            </View>

                            <View style={styles.profileActions}>
                                <TouchableOpacity style={styles.profileAction}>
                                    <LinearGradient
                                        colors={[COLORS.primary + '10', COLORS.primary + '05']}
                                        style={styles.profileActionGradient}
                                    >
                                        <MaterialCommunityIcons name="qrcode-scan" size={24} color={COLORS.primary} />
                                        <Text style={styles.profileActionText}>Mon QR</Text>
                                    </LinearGradient>
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.profileAction}>
                                    <LinearGradient
                                        colors={[COLORS.success + '10', COLORS.success + '05']}
                                        style={styles.profileActionGradient}
                                    >
                                        <MaterialCommunityIcons name="share-variant" size={24} color={COLORS.success} />
                                        <Text style={styles.profileActionText}>Partager</Text>
                                    </LinearGradient>
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.profileAction}>
                                    <LinearGradient
                                        colors={[COLORS.secondary + '10', COLORS.secondary + '05']}
                                        style={styles.profileActionGradient}
                                    >
                                        <MaterialCommunityIcons name="cog" size={24} color={COLORS.secondary} />
                                        <Text style={styles.profileActionText}>Paramètres</Text>
                                    </LinearGradient>
                                </TouchableOpacity>
                            </View>
                        </Card.Content>
                    </LinearGradient>
                </Card>

                {/* Statistiques */}
                <View style={styles.statsGrid}>
                    {userStats.map((stat) => (
                        <TouchableOpacity key={stat.id} style={styles.statCard}>
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

                {/* Sécurité */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Sécurité</Text>
                        <TouchableOpacity>
                            <Text style={styles.sectionLink}>Configurer</Text>
                        </TouchableOpacity>
                    </View>

                    <Card style={styles.securityCard}>
                        <LinearGradient
                            colors={['#ffffff', '#fafafa']}
                            style={styles.securityGradient}
                        >
                            <Card.Content>
                                {/* Niveau de sécurité */}
                                <View style={styles.securityLevel}>
                                    <View style={styles.securityLevelHeader}>
                                        <Text style={styles.securityLevelTitle}>Niveau de sécurité</Text>
                                        <Text style={styles.securityLevelValue}>Élevé</Text>
                                    </View>
                                    <ProgressBar
                                        progress={0.85}
                                        color={COLORS.success}
                                        style={styles.progressBar}
                                    />
                                    <Text style={styles.securityLevelDesc}>
                                        85% - Votre compte est bien protégé
                                    </Text>
                                </View>

                                {/* Paramètres de sécurité */}
                                {securitySettings.map((setting) => (
                                    <View key={setting.id} style={styles.settingItem}>
                                        <View style={styles.settingLeft}>
                                            <View style={[styles.settingIcon, { backgroundColor: setting.color + '10' }]}>
                                                <MaterialCommunityIcons name={setting.icon} size={22} color={setting.color} />
                                            </View>
                                            <View>
                                                <Text style={styles.settingTitle}>{setting.title}</Text>
                                                <Text style={styles.settingSubtitle}>{setting.subtitle}</Text>
                                            </View>
                                        </View>
                                        <View style={[
                                            styles.settingStatus,
                                            { backgroundColor: setting.value ? setting.color + '20' : COLORS.gray + '20' }
                                        ]}>
                                            <Text style={[
                                                styles.settingStatusText,
                                                { color: setting.value ? setting.color : COLORS.gray }
                                            ]}>
                                                {setting.value ? 'Activé' : 'Désactivé'}
                                            </Text>
                                        </View>
                                    </View>
                                ))}

                                <TouchableOpacity style={styles.passwordButton}>
                                    <LinearGradient
                                        colors={[COLORS.primary + '10', COLORS.primary + '05']}
                                        style={styles.passwordGradient}
                                    >
                                        <MaterialCommunityIcons name="key" size={20} color={COLORS.primary} />
                                        <Text style={styles.passwordButtonText}>Modifier le mot de passe</Text>
                                        <MaterialCommunityIcons name="chevron-right" size={20} color={COLORS.gray} />
                                    </LinearGradient>
                                </TouchableOpacity>
                            </Card.Content>
                        </LinearGradient>
                    </Card>
                </View>

                {/* Membres de la famille */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Membres de la famille</Text>
                        <TouchableOpacity>
                            <Text style={styles.sectionLink}>Voir tout</Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.familyContainer}
                    >
                        {familyMembers.map((member) => (
                            <TouchableOpacity key={member.id}>
                                <Card style={styles.familyCard}>
                                    <LinearGradient
                                        colors={['#ffffff', '#f8fafc']}
                                        style={styles.familyGradient}
                                    >
                                        <Card.Content style={styles.familyContent}>
                                            <LinearGradient
                                                colors={[member.color, member.color + '80']}
                                                style={styles.familyAvatar}
                                            >
                                                <Text style={styles.familyAvatarText}>{member.avatar}</Text>
                                            </LinearGradient>
                                            <Text style={styles.familyName}>{member.name}</Text>
                                            <View style={[styles.familyRole, { backgroundColor: member.color + '10' }]}>
                                                <Text style={[styles.familyRoleText, { color: member.color }]}>
                                                    {member.role}
                                                </Text>
                                            </View>
                                            <View style={styles.familyMeta}>
                                                <View style={styles.familyMetaItem}>
                                                    <MaterialCommunityIcons name="fingerprint" size={14} color={COLORS.gray} />
                                                    <Text style={styles.familyMetaText}>{member.fingerprints}</Text>
                                                </View>
                                                <View style={styles.familyMetaItem}>
                                                    <MaterialCommunityIcons name="clock-outline" size={14} color={COLORS.gray} />
                                                    <Text style={styles.familyMetaText}>{member.lastAccess}</Text>
                                                </View>
                                            </View>
                                        </Card.Content>
                                    </LinearGradient>
                                </Card>
                            </TouchableOpacity>
                        ))}

                        {/* Ajouter un membre */}
                        <TouchableOpacity>
                            <Card style={styles.addFamilyCard}>
                                <LinearGradient
                                    colors={[COLORS.primary + '10', COLORS.primary + '05']}
                                    style={styles.addFamilyGradient}
                                >
                                    <Card.Content style={styles.addFamilyContent}>
                                        <View style={styles.addFamilyIcon}>
                                            <MaterialCommunityIcons name="plus" size={32} color={COLORS.primary} />
                                        </View>
                                        <Text style={styles.addFamilyText}>Ajouter</Text>
                                        <Text style={styles.addFamilySubtext}>Nouveau membre</Text>
                                    </Card.Content>
                                </LinearGradient>
                            </Card>
                        </TouchableOpacity>
                    </ScrollView>
                </View>

                {/* Activité récente */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Activité récente</Text>
                        <TouchableOpacity>
                            <Text style={styles.sectionLink}>Historique</Text>
                        </TouchableOpacity>
                    </View>

                    <Card style={styles.activityCard}>
                        <LinearGradient
                            colors={['#ffffff', '#fafafa']}
                            style={styles.activityGradient}
                        >
                            <Card.Content>
                                {activityLog.map((activity, index) => (
                                    <View key={activity.id} style={[
                                        styles.activityItem,
                                        index < activityLog.length - 1 && styles.activityItemBorder
                                    ]}>
                                        <View style={styles.activityLeft}>
                                            <View style={styles.activityIcon}>
                                                <MaterialCommunityIcons name={activity.icon} size={22} color={COLORS.primary} />
                                            </View>
                                            <View>
                                                <Text style={styles.activityAction}>{activity.action}</Text>
                                                <View style={styles.activityMeta}>
                                                    <MaterialCommunityIcons name="door" size={14} color={COLORS.gray} />
                                                    <Text style={styles.activityDevice}>{activity.device}</Text>
                                                    <Text style={styles.activityTime}>• {activity.time}</Text>
                                                </View>
                                            </View>
                                        </View>
                                        <MaterialCommunityIcons name="chevron-right" size={20} color={COLORS.gray} />
                                    </View>
                                ))}
                            </Card.Content>
                        </LinearGradient>
                    </Card>
                </View>

                {/* Bouton déconnexion */}
                <TouchableOpacity style={styles.logoutButton}>
                    <LinearGradient
                        colors={[COLORS.danger + '10', COLORS.danger + '05']}
                        style={styles.logoutGradient}
                    >
                        <MaterialCommunityIcons name="logout" size={22} color={COLORS.danger} />
                        <Text style={styles.logoutText}>Déconnexion</Text>
                    </LinearGradient>
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
        flex: 1,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: COLORS.white,
    },
    editButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    profileCard: {
        marginTop: -20,
        marginHorizontal: 20,
        borderRadius: 24,
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
    },
    profileGradient: {
        borderRadius: 24,
        padding: 5,
    },
    profileContent: {
        alignItems: 'center',
        padding: 20,
    },
    avatarContainer: {
        position: 'relative',
        marginBottom: 16,
    },
    avatarGradient: {
        width: 96,
        height: 96,
        borderRadius: 48,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatar: {
        backgroundColor: 'transparent',
    },
    avatarLabel: {
        fontSize: 32,
        fontWeight: 'bold',
        color: COLORS.white,
    },
    cameraButton: {
        position: 'absolute',
        bottom: 0,
        right: 0,
    },
    cameraGradient: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: COLORS.white,
    },
    userInfo: {
        alignItems: 'center',
        marginBottom: 20,
    },
    userName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.dark,
        marginBottom: 8,
    },
    userRoleContainer: {
        flexDirection: 'row',
        marginBottom: 12,
    },
    roleBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.primary + '10',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        gap: 6,
    },
    userRole: {
        fontSize: 14,
        color: COLORS.primary,
        fontWeight: '600',
    },
    userContact: {
        alignItems: 'center',
        gap: 4,
    },
    contactItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    contactText: {
        fontSize: 14,
        color: COLORS.gray,
    },
    profileActions: {
        flexDirection: 'row',
        gap: 16,
        marginTop: 8,
    },
    profileAction: {
        flex: 1,
    },
    profileActionGradient: {
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 8,
        borderRadius: 16,
        gap: 6,
    },
    profileActionText: {
        fontSize: 13,
        fontWeight: '600',
        color: COLORS.dark,
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
    section: {
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
    securityCard: {
        borderRadius: 20,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
    },
    securityGradient: {
        borderRadius: 20,
        padding: 5,
    },
    securityLevel: {
        marginBottom: 24,
    },
    securityLevelHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    securityLevelTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.dark,
    },
    securityLevelValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.success,
    },
    progressBar: {
        height: 8,
        borderRadius: 4,
        marginBottom: 8,
    },
    securityLevelDesc: {
        fontSize: 14,
        color: COLORS.gray,
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
    settingIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
    },
    settingTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: COLORS.dark,
        marginBottom: 2,
    },
    settingSubtitle: {
        fontSize: 13,
        color: COLORS.gray,
    },
    settingStatus: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 16,
    },
    settingStatusText: {
        fontSize: 12,
        fontWeight: '600',
    },
    passwordButton: {
        marginTop: 16,
    },
    passwordGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        gap: 12,
    },
    passwordButtonText: {
        flex: 1,
        fontSize: 15,
        fontWeight: '600',
        color: COLORS.primary,
    },
    familyContainer: {
        paddingRight: 20,
        gap: 12,
    },
    familyCard: {
        width: 200,
        marginRight: 12,
        borderRadius: 20,
        overflow: 'hidden',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
    },
    familyGradient: {
        borderRadius: 20,
    },
    familyContent: {
        alignItems: 'center',
        padding: 20,
    },
    familyAvatar: {
        width: 64,
        height: 64,
        borderRadius: 32,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    familyAvatarText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.white,
    },
    familyName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.dark,
        marginBottom: 6,
        textAlign: 'center',
    },
    familyRole: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 16,
        marginBottom: 12,
    },
    familyRoleText: {
        fontSize: 12,
        fontWeight: '600',
    },
    familyMeta: {
        alignItems: 'center',
        gap: 4,
    },
    familyMetaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    familyMetaText: {
        fontSize: 12,
        color: COLORS.gray,
    },
    addFamilyCard: {
        width: 200,
        marginRight: 12,
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: COLORS.primary + '20',
        borderStyle: 'dashed',
    },
    addFamilyGradient: {
        borderRadius: 20,
    },
    addFamilyContent: {
        alignItems: 'center',
        padding: 30,
    },
    addFamilyIcon: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: COLORS.primary + '10',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    addFamilyText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.primary,
        marginBottom: 4,
    },
    addFamilySubtext: {
        fontSize: 13,
        color: COLORS.gray,
    },
    activityCard: {
        borderRadius: 20,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
    },
    activityGradient: {
        borderRadius: 20,
        padding: 5,
    },
    activityItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
    },
    activityItemBorder: {
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    activityLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    activityIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: COLORS.primary + '10',
        alignItems: 'center',
        justifyContent: 'center',
    },
    activityAction: {
        fontSize: 15,
        fontWeight: '600',
        color: COLORS.dark,
        marginBottom: 4,
    },
    activityMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    activityDevice: {
        fontSize: 13,
        color: COLORS.gray,
    },
    activityTime: {
        fontSize: 13,
        color: COLORS.gray,
    },
    logoutButton: {
        marginTop: 24,
        marginHorizontal: 20,
    },
    logoutGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderRadius: 16,
        gap: 12,
    },
    logoutText: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.danger,
    },
});
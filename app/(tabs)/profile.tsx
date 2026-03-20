import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text, Card, Avatar } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { COLORS } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext';

export default function ProfileScreen() {
    const { user, logout } = useAuth();

    const handleLogout = async () => {
        await logout();
        router.replace('/(auth)/login');
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
                    <Text style={styles.headerTitle}>Profil</Text>
                    <Text style={styles.headerSubtitle}>Informations de votre compte</Text>
                </View>
            </LinearGradient>

            <ScrollView showsVerticalScrollIndicator={false}>
                <Card style={styles.profileCard}>
                    <LinearGradient colors={['#ffffff', '#f8fafc']} style={styles.profileGradient}>
                        <Card.Content style={styles.profileContent}>
                            <View style={styles.avatarContainer}>
                                <LinearGradient
                                    colors={[COLORS.primary, COLORS.primaryLight]}
                                    style={styles.avatarGradient}
                                >
                                    <Avatar.Text
                                        size={80}
                                        label={(user?.name ?? 'U').slice(0, 2).toUpperCase()}
                                        style={styles.avatar}
                                        labelStyle={styles.avatarLabel}
                                    />
                                </LinearGradient>
                            </View>

                            <View style={styles.userInfo}>
                                <Text style={styles.userName}>{user?.name ?? 'Utilisateur'}</Text>
                                <View style={styles.userRoleContainer}>
                                    <View style={styles.roleBadge}>
                                        <MaterialCommunityIcons name="shield-account" size={16} color={COLORS.primary} />
                                        <Text style={styles.userRole}>
                                            {user?.role === 'admin' ? 'Administrateur' : 'Utilisateur'}
                                        </Text>
                                    </View>
                                </View>

                                <View style={styles.userContact}>
                                    <View style={styles.contactItem}>
                                        <MaterialCommunityIcons name="email" size={16} color={COLORS.gray} />
                                        <Text style={styles.contactText}>{user?.email ?? ''}</Text>
                                    </View>
                                </View>
                            </View>

                            {user?.role === 'admin' && (
                                <TouchableOpacity
                                    style={styles.menuButton}
                                    onPress={() => router.push('/(tabs)/users')}
                                >
                                    <LinearGradient
                                        colors={[COLORS.primary + '10', COLORS.primary + '05']}
                                        style={styles.menuButtonGradient}
                                    >
                                        <MaterialCommunityIcons name="account-multiple" size={22} color={COLORS.primary} />
                                        <Text style={styles.menuButtonText}>Utilisateurs autorisés</Text>
                                        <MaterialCommunityIcons name="chevron-right" size={22} color={COLORS.gray} />
                                    </LinearGradient>
                                </TouchableOpacity>
                            )}

                            <TouchableOpacity style={styles.menuButton} onPress={handleLogout}>
                                <LinearGradient
                                    colors={[COLORS.danger + '15', COLORS.danger + '08']}
                                    style={styles.menuButtonGradient}
                                >
                                    <MaterialCommunityIcons name="logout" size={22} color={COLORS.danger} />
                                    <Text style={[styles.menuButtonText, { color: COLORS.danger }]}>Déconnexion</Text>
                                    <MaterialCommunityIcons name="chevron-right" size={22} color={COLORS.gray} />
                                </LinearGradient>
                            </TouchableOpacity>
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
    header: {
        paddingTop: 60,
        paddingBottom: 30,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
    },
    headerContent: {},
    headerTitle: { fontSize: 28, fontWeight: 'bold', color: 'white', marginBottom: 8 },
    headerSubtitle: { fontSize: 16, color: 'rgba(255,255,255,0.9)' },
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
    profileGradient: { borderRadius: 24, padding: 5 },
    profileContent: { alignItems: 'center', padding: 24 },
    avatarContainer: { marginBottom: 20 },
    avatarGradient: {
        width: 96,
        height: 96,
        borderRadius: 48,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatar: { backgroundColor: 'transparent' },
    avatarLabel: { fontSize: 32, fontWeight: 'bold', color: 'white' },
    userInfo: { alignItems: 'center', marginBottom: 24 },
    userName: { fontSize: 24, fontWeight: 'bold', color: COLORS.dark, marginBottom: 8 },
    userRoleContainer: { marginBottom: 12 },
    roleBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.primary + '10',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        gap: 6,
    },
    userRole: { fontSize: 14, color: COLORS.primary, fontWeight: '600' },
    userContact: { alignItems: 'center' },
    contactItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    contactText: { fontSize: 14, color: COLORS.gray },
    menuButton: { width: '100%', marginTop: 12 },
    menuButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        gap: 12,
    },
    menuButtonText: { flex: 1, fontSize: 15, fontWeight: '600', color: COLORS.primary },
});

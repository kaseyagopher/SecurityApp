import { View, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { Text, Card, Button, Avatar, Badge } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../../constants/theme';
import { Link } from 'expo-router';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  return (
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

        {/* Header avec dégradé */}
        <LinearGradient
            colors={[COLORS.primary, COLORS.primaryLight]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.headerGradient}
        >
          <View style={styles.header}>
            <View>
              <Text style={styles.greeting}>Bonjour,</Text>
              <Text style={styles.userName}>Godelive 👋</Text>
            </View>
            <Avatar.Text
                size={55}
                label="GK"
                style={styles.avatar}
                labelStyle={styles.avatarLabel}
            />
          </View>

          {/* Solde ou statut principal */}
          <View style={styles.balanceContainer}>
            <Text style={styles.balanceLabel}>Système de sécurité</Text>
            <View style={styles.balanceRow}>
              <MaterialCommunityIcons name="shield-check" size={28} color="white" />
              <Text style={styles.balanceAmount}>ACTIF</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Statut de la porte - Carte moderne */}
        <Card style={styles.statusCard}>
          <LinearGradient
              colors={['#ffffff', '#f8f9fa']}
              style={styles.statusGradient}
          >
            <Card.Content style={styles.statusContent}>
              <View style={styles.statusIconContainer}>
                <LinearGradient
                    colors={[COLORS.primary, COLORS.primaryLight]}
                    style={styles.statusIcon}
                >
                  <MaterialCommunityIcons name="lock" size={30} color="white" />
                </LinearGradient>
              </View>
              <View style={styles.statusTextContainer}>
                <Text style={styles.statusTitle}>Porte verrouillée</Text>
                <Text style={styles.statusSubtitle}>
                  Dernier accès • 14:30 aujourd'hui
                </Text>
              </View>
              <Badge style={styles.badgeSecure}>Sécurisé</Badge>
            </Card.Content>
          </LinearGradient>
        </Card>

        {/* Actions rapides - Design moderne */}
        <View style={styles.quickActionsSection}>
          <Text style={styles.sectionTitle}>Actions rapides</Text>
          <View style={styles.quickActionsGrid}>
            <Link href="/(tabs)/access" asChild>
              <TouchableGradient
                  colors={[COLORS.primary, COLORS.primaryLight]}
                  style={styles.quickActionItem}
              >
                <MaterialCommunityIcons name="fingerprint" size={32} color="white" />
                <Text style={styles.quickActionText}>Accès</Text>
              </TouchableGradient>
            </Link>

            <Link href="/(tabs)/alarm" asChild>
              <TouchableGradient
                  colors={[COLORS.secondary, '#fbbf24']}
                  style={styles.quickActionItem}
              >
                <MaterialCommunityIcons name="bell" size={32} color="white" />
                <Text style={styles.quickActionText}>Alarme</Text>
              </TouchableGradient>
            </Link>

            <Link href="/(tabs)/history" asChild>
              <TouchableGradient
                  colors={[COLORS.success, '#34d399']}
                  style={styles.quickActionItem}
              >
                <MaterialCommunityIcons name="history" size={32} color="white" />
                <Text style={styles.quickActionText}>Historique</Text>
              </TouchableGradient>
            </Link>

            <Link href="/(tabs)/profile" asChild>
              <TouchableGradient
                  colors={[COLORS.info, '#60a5fa']}
                  style={styles.quickActionItem}
              >
                <MaterialCommunityIcons name="account" size={32} color="white" />
                <Text style={styles.quickActionText}>Profil</Text>
              </TouchableGradient>
            </Link>
          </View>
        </View>

        {/* Activités récentes - Design épuré */}
        <Card style={styles.activitiesCard}>
          <LinearGradient
              colors={['#ffffff', '#fafafa']}
              style={styles.activitiesGradient}
          >
            <Card.Title
                title="Activités récentes"
                subtitle="Aujourd'hui • 3 événements"
                left={(props) => (
                    <View style={styles.activitiesIcon}>
                      <MaterialCommunityIcons name="history" size={24} color={COLORS.primary} />
                    </View>
                )}
            />
            <Card.Content>
              {[1, 2, 3].map((item) => (
                  <View key={item} style={styles.activityItem}>
                    <View style={styles.activityLeft}>
                      <View style={[styles.activityDot, { backgroundColor: COLORS.success }]} />
                      <View>
                        <Text style={styles.activityTitle}>Accès autorisé</Text>
                        <Text style={styles.activityUser}>Utilisateur 00{item}</Text>
                      </View>
                    </View>
                    <Text style={styles.activityTime}>14:{30 - item}</Text>
                  </View>
              ))}
            </Card.Content>
          </LinearGradient>
        </Card>

        {/* Espace en bas pour la tab bar */}
        <View style={{ height: 90 }} />
      </ScrollView>
  );
}

// Composant pour les boutons avec dégradé
const TouchableGradient = ({ colors, style, children, onPress }: any) => (
    <TouchableOpacity onPress={onPress} style={style}>
      <LinearGradient colors={colors} style={styles.gradientButton} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        {children}
      </LinearGradient>
    </TouchableOpacity>
);

// Composant pour les cartes d'appareils
const DeviceCard = ({ icon, name, status, color }: any) => (
    <View style={styles.deviceCard}>
      <LinearGradient
          colors={[color, color + '80']}
          style={styles.deviceIcon}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
      >
        <MaterialCommunityIcons name={icon} size={28} color="white" />
      </LinearGradient>
      <Text style={styles.deviceName}>{name}</Text>
      <Text style={[styles.deviceStatus, { color }]}>{status}</Text>
    </View>
);

import { TouchableOpacity } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  headerGradient: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  greeting: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 4,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  avatar: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 2,
    borderColor: 'white',
  },
  avatarLabel: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  balanceContainer: {
    marginTop: 10,
  },
  balanceLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 5,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
  },
  statusCard: {
    marginTop: -20,
    marginHorizontal: 20,
    borderRadius: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  statusGradient: {
    borderRadius: 20,
    padding: 5,
  },
  statusContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  statusIconContainer: {
    marginRight: 16,
  },
  statusIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusTextContainer: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginBottom: 4,
  },
  statusSubtitle: {
    fontSize: 14,
    color: COLORS.gray,
  },
  badgeSecure: {
    backgroundColor: COLORS.success + '20',
    color: COLORS.success,
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 12,
  },
  quickActionsSection: {
    marginTop: 30,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginBottom: 16,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  quickActionItem: {
    width: (width - 60) / 2,
    height: 110,
    borderRadius: 20,
    overflow: 'hidden',
  },
  gradientButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  quickActionText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
  },
  devicesSection: {
    marginTop: 30,
    paddingLeft: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingRight: 20,
    marginBottom: 16,
  },
  seeAll: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  devicesScroll: {
    flexDirection: 'row',
  },
  deviceCard: {
    width: 140,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginRight: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  deviceIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.dark,
    marginBottom: 4,
  },
  deviceStatus: {
    fontSize: 14,
    fontWeight: '500',
  },
  activitiesCard: {
    marginTop: 30,
    marginHorizontal: 20,
    borderRadius: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  activitiesGradient: {
    borderRadius: 20,
    padding: 5,
  },
  activitiesIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary + '10',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  activityLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  activityDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  activityTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.dark,
  },
  activityUser: {
    fontSize: 13,
    color: COLORS.gray,
    marginTop: 2,
  },
  activityTime: {
    fontSize: 13,
    color: COLORS.gray,
  },
});
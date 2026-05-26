import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { Platform, StyleSheet, View } from 'react-native';
import { COLORS } from '../../constants/theme';

const TABS = [
  { name: 'index', icon: 'view-dashboard-outline', iconActive: 'view-dashboard' },
  { name: 'door', icon: 'door', iconActive: 'door-open' },
  { name: 'history', icon: 'history', iconActive: 'history' },
  { name: 'alarm', icon: 'shield-alert-outline', iconActive: 'shield-alert' },
  { name: 'profile', icon: 'account-outline', iconActive: 'account' },
] as const;

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: true,
        tabBarActiveTintColor: COLORS.white,
        tabBarInactiveTintColor: 'rgba(255,255,255,0.65)',
        tabBarLabelStyle: styles.label,
      }}
    >
      {TABS.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title:
              tab.name === 'index'
                ? 'Accueil'
                : tab.name === 'door'
                  ? 'Porte'
                  : tab.name === 'history'
                    ? 'Historiques'
                    : tab.name === 'alarm'
                      ? 'Alarme'
                      : 'Profil',
            tabBarIcon: ({ focused, color }) => (
              <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
                <MaterialCommunityIcons
                  name={focused ? tab.iconActive : tab.icon}
                  size={22}
                  color={focused ? COLORS.primaryDark : color}
                />
              </View>
            ),
          }}
        />
      ))}
      <Tabs.Screen name="users" options={{ href: null }} />
      <Tabs.Screen name="enroll" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    backgroundColor: COLORS.tabBar,
    borderTopWidth: 0,
    height: Platform.OS === 'ios' ? 84 : 68,
    paddingTop: 6,
    paddingBottom: Platform.OS === 'ios' ? 24 : 8,
  },
  label: { fontSize: 11, fontWeight: '600', marginTop: -2 },
  iconWrap: {
    width: 40,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapActive: {
    backgroundColor: COLORS.white,
  },
});

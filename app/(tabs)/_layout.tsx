import { Tabs } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../../constants/theme';

export default function TabLayout() {
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarStyle: styles.tabBar,
                tabBarShowLabel: false,
                tabBarActiveTintColor: COLORS.primary,
                tabBarInactiveTintColor: COLORS.gray,
            }}
        >


            <Tabs.Screen
                name="access"
                options={{
                    tabBarIcon: ({ focused }) => (
                        <View style={styles.tabItem}>
                            <View style={[styles.iconContainer, focused && styles.activeIconContainer]}>
                                <MaterialCommunityIcons
                                    name="fingerprint"
                                    size={24}
                                    color={focused ? COLORS.white : COLORS.gray}
                                />
                            </View>
                        </View>
                    ),
                }}
            />

            <Tabs.Screen
                name="history"
                options={{
                    tabBarIcon: ({ focused }) => (
                        <View style={styles.tabItem}>
                            <View style={[styles.iconContainer, focused && styles.activeIconContainer]}>
                                <MaterialCommunityIcons
                                    name="history"
                                    size={24}
                                    color={focused ? COLORS.white : COLORS.gray}
                                />
                            </View>
                        </View>
                    ),
                }}
            />
            <Tabs.Screen
                name="index"
                options={{
                    tabBarIcon: ({ focused }) => (
                        <View style={styles.tabItem}>
                            <View style={[styles.iconContainer, focused && styles.activeIconContainer]}>
                                <MaterialCommunityIcons
                                    name="home"
                                    size={24}
                                    color={focused ? COLORS.white : COLORS.gray}
                                />
                            </View>
                        </View>
                    ),
                }}
            />
            <Tabs.Screen
                name="alarm"
                options={{
                    tabBarIcon: ({ focused }) => (
                        <View style={styles.tabItem}>
                            <View style={[styles.iconContainer, focused && styles.activeIconContainer]}>
                                <MaterialCommunityIcons
                                    name="bell"
                                    size={24}
                                    color={focused ? COLORS.white : COLORS.gray}
                                />
                            </View>
                        </View>
                    ),
                }}
            />

            <Tabs.Screen
                name="profile"
                options={{
                    tabBarIcon: ({ focused }) => (
                        <View style={styles.tabItem}>
                            <View style={[styles.iconContainer, focused && styles.activeIconContainer]}>
                                <MaterialCommunityIcons
                                    name="account"
                                    size={24}
                                    color={focused ? COLORS.white : COLORS.gray}
                                />
                            </View>
                        </View>
                    ),
                }}
            />
        </Tabs>
    );
}

const styles = StyleSheet.create({
    tabBar: {
        position: 'absolute',
        left: 20,
        right: 20,
        backgroundColor: '#FFFFFF',
        borderRadius: 35,
        height: 75,
        paddingHorizontal: 25,
        paddingVertical: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 10,
        borderTopWidth: 0,
        // ⚠️ CRITIQUE: Distribue les icônes uniformément
        justifyContent: 'space-around',
        alignItems: 'center',
    },
    tabItem: {
        alignItems: 'center',
        justifyContent: 'center',
        width: 60, // Largeur fixe pour chaque item
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'transparent',
    },
    activeIconContainer: {
        backgroundColor: COLORS.primary,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 4,
    },
});
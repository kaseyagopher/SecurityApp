import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { Platform, StyleSheet, View } from 'react-native';
import { COLORS } from '../../constants/theme';

const TAB_CONFIG = [
    { name: 'index', iconOutline: 'home-outline', iconFilled: 'home' },
    { name: 'history', iconOutline: 'clock-outline', iconFilled: 'clock' },
    { name: 'access', iconOutline: 'fingerprint', iconFilled: 'fingerprint' },
    { name: 'alarm', iconOutline: 'bell-outline', iconFilled: 'bell' },
    { name: 'profile', iconOutline: 'account-outline', iconFilled: 'account' },
] as const;

function TabIcon({ item, focused }: { item: (typeof TAB_CONFIG)[number]; focused: boolean }) {
    const color = focused ? COLORS.primary : 'rgba(255,255,255,0.8)';
    const name = focused ? item.iconFilled : item.iconOutline;
    return <MaterialCommunityIcons name={name} size={24} color={color} />;
}

export default function TabLayout() {
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarStyle: styles.tabBar,
                tabBarShowLabel: false,
                tabBarActiveTintColor: COLORS.white,
                tabBarInactiveTintColor: 'rgba(255,255,255,0.65)',
                tabBarItemStyle: styles.tabBarItem,
            }}
        >
            {TAB_CONFIG.map((item) => (
                <Tabs.Screen
                    key={item.name}
                    name={item.name}
                    options={{
                        tabBarIcon: ({ focused }) => (
                            <View style={[styles.iconContainer, focused && styles.activeIconContainer]}>
                                <TabIcon item={item} focused={focused} />
                            </View>
                        ),
                    }}
                />
            ))}
            <Tabs.Screen name="users" options={{ tabBarButton: () => null }} />
        </Tabs>
    );
}

const styles = StyleSheet.create({
    tabBar: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: COLORS.primary,
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        height: Platform.OS === 'ios' ? 88 : 72,
        paddingTop: 8,
        paddingLeft: 20,
        paddingBottom: Platform.OS === 'ios' ? 28 : 8,
        borderTopWidth: 0,
        elevation: 0,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.12,
        shadowRadius: 12,
    },
    tabBarItem: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
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
        backgroundColor: COLORS.white,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 4,
    },
});

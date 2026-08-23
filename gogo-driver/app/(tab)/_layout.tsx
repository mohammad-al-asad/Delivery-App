import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { Colors } from '../../constants/Colors';

export default function DriverLayout() {
    return (
        <Tabs
            screenOptions={{
                tabBarActiveTintColor: Colors.primaryDark,
                tabBarInactiveTintColor: Colors.tabIconDefault,
                tabBarStyle: {
                    height: 90,
                    paddingBottom: 20,
                    paddingTop: 10,
                    backgroundColor: '#fff',
                    shadowColor: "#000",
                    shadowOffset: {
                        width: 0,
                        height: -2,
                    },
                    shadowOpacity: 0.1,
                    shadowRadius: 3.84,
                    elevation: 5,
                },
                headerShown: false,
                tabBarLabelStyle: {
                    fontSize: 12,
                    fontWeight: '600',
                }
            }}>
            <Tabs.Screen
                name="driver"
                options={{
                    title: 'HOME',
                    tabBarIcon: ({ color }) => <FontAwesome5 name="home" size={24} color={color} />,
                }}
            />
            <Tabs.Screen
                name="rides"
                options={{
                    title: 'RIDES',
                    tabBarIcon: ({ color }) => <FontAwesome5 name="car" size={24} color={color} />,
                }}
            />
            <Tabs.Screen
                name="earnings"
                options={{
                    title: 'EARNINGS',
                    tabBarIcon: ({ color }) => <Ionicons name="wallet-outline" size={28} color={color} />,
                }}
            />
            <Tabs.Screen
                name="account"
                options={{
                    title: 'ACCOUNT',
                    tabBarIcon: ({ color }) => <Ionicons name="person-outline" size={28} color={color} />,
                }}
            />
        </Tabs>
    );
}

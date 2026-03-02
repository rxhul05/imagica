import { Tabs } from 'expo-router';
import { TabBar } from '../../components/TabBar';

export default function TabLayout() {
    return (
        <Tabs
            tabBar={(props) => <TabBar {...props} />}
            screenOptions={{
                headerShown: false,
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Home',
                }}
            />
            <Tabs.Screen
                name="browse"
                options={{
                    title: 'Browse',
                }}
            />
            <Tabs.Screen
                name="bag"
                options={{
                    title: 'Bag',
                }}
            />
            <Tabs.Screen
                name="account"
                options={{
                    title: 'Account',
                }}
            />
        </Tabs>
    );
}

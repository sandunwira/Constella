import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { HapticTab } from '@/components/haptic-tab';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TabLayout() {
	const colorScheme = useColorScheme();
	const isDark = colorScheme === 'dark';

	return (
		<Tabs
			screenOptions={{
				headerShown: false,
				tabBarActiveTintColor: isDark ? '#fff' : '#0a7ea4',
				tabBarInactiveTintColor: isDark ? '#9BA1A6' : '#687076',
				tabBarStyle: {
					backgroundColor: isDark ? '#151718' : '#fff',
					borderTopColor: isDark ? '#2a2a2a' : '#e5e5e5',
				},
				tabBarButton: HapticTab,
			}}>
			<Tabs.Screen
				name="index"
				options={{
					title: 'Home',
					tabBarIcon: ({ color, size }) => (
						<Ionicons name="home" size={size} color={color} />
					),
				}}
			/>
			<Tabs.Screen
				name="collections"
				options={{
					title: 'Collections',
					tabBarIcon: ({ color, size }) => (
						<Ionicons name="albums" size={size} color={color} />
					),
				}}
			/>
			<Tabs.Screen
				name="downloads"
				options={{
					title: 'Downloads',
					tabBarIcon: ({ color, size }) => (
						<Ionicons name="download" size={size} color={color} />
					),
				}}
			/>
			<Tabs.Screen
				name="settings"
				options={{
					title: 'Settings',
					tabBarIcon: ({ color, size }) => (
						<Ionicons name="settings" size={size} color={color} />
					),
				}}
			/>
		</Tabs>
	);
}

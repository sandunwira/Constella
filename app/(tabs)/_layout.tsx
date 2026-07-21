import { BlurView } from 'expo-blur';
import { Tabs } from 'expo-router';
import { Platform, StyleSheet } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { TabIcon } from '@/components/ui/tab-icon';
import { Colors } from '@/constants/colors';

export default function TabLayout() {
	return (
		<Tabs
			screenOptions={{
				headerShown: false,
				tabBarActiveTintColor: Colors.brand.primary,
				tabBarInactiveTintColor: Colors.text.inkMuted,
				tabBarButton: HapticTab,
				tabBarLabelStyle: {
					fontSize: 10,
					fontWeight: '500',
					letterSpacing: -0.1,
					marginBottom: 2,
				},
				tabBarStyle: {
					position: 'absolute',
					bottom: 0,
					left: 0,
					right: 0,
					height: Platform.OS === 'ios' ? 82 : 66,
					backgroundColor: 'transparent',
					borderTopWidth: 0,
					elevation: 0,
				},
				tabBarBackground: () => (
					<BlurView
						tint="dark"
						intensity={100}
						style={StyleSheet.absoluteFill}
					/>
				),
			}}>

			<Tabs.Screen
				name="index"
				options={{
					title: 'Home',
					tabBarIcon: ({ color, focused }) => (
						<TabIcon name={focused ? 'home' : 'home-outline'} color={color} />
					),
				}}
			/>

			<Tabs.Screen
				name="collections"
				options={{
					title: 'Collections',
					tabBarIcon: ({ color, focused }) => (
						<TabIcon name={focused ? 'albums' : 'albums-outline'} color={color} />
					),
				}}
			/>

			<Tabs.Screen
				name="downloads"
				options={{
					title: 'Downloads',
					tabBarIcon: ({ color, focused }) => (
						<TabIcon name={focused ? 'arrow-down-circle' : 'arrow-down-circle-outline'} color={color} />
					),
				}}
			/>

			<Tabs.Screen
				name="settings"
				options={{
					title: 'Settings',
					tabBarIcon: ({ color, focused }) => (
						<TabIcon name={focused ? 'settings' : 'settings-outline'} color={color} />
					),
				}}
			/>
		</Tabs>
	);
}

import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MiniPlayer } from '@/components/mini-player';

const SETTINGS = [
	{ id: '1', label: 'Account', icon: 'person-outline' as const },
	{ id: '2', label: 'Playback quality', icon: 'options-outline' as const },
	{ id: '3', label: 'Storage', icon: 'folder-outline' as const },
	{ id: '4', label: 'About', icon: 'information-circle-outline' as const },
];

export default function SettingsScreen() {
	return (
		<SafeAreaView className="flex-1 bg-white dark:bg-neutral-950" edges={['top']}>
			<View className="px-4 pb-2 pt-4">
				<Text className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
					Settings
				</Text>
			</View>

			<View className="mt-2">
				{SETTINGS.map((item) => (
					<Pressable
						key={item.id}
						className="flex-row items-center gap-3 border-b border-neutral-100 px-4 py-4 active:bg-neutral-50 dark:border-neutral-800 dark:active:bg-neutral-900">
						<Ionicons name={item.icon} size={22} color="#687076" />
						<Text className="flex-1 text-base text-neutral-900 dark:text-neutral-100">
							{item.label}
						</Text>
						<Ionicons name="chevron-forward" size={18} color="#9BA1A6" />
					</Pressable>
				))}
			</View>

			<View className="flex-1" />
			<MiniPlayer />
		</SafeAreaView>
	);
}

import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MiniPlayer } from '@/components/mini-player';

export default function DownloadsScreen() {
	return (
		<SafeAreaView className="flex-1 bg-white dark:bg-neutral-950" edges={['top']}>
			<View className="px-4 pb-2 pt-4">
				<Text className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
					Downloads
				</Text>
			</View>

			<View className="flex-1 items-center justify-center px-6">
				<Ionicons name="cloud-download-outline" size={64} color="#9BA1A6" />
				<Text className="mt-4 text-center text-neutral-500 dark:text-neutral-400">
					No downloads yet. Saved tracks will appear here.
				</Text>
			</View>

			<MiniPlayer />
		</SafeAreaView>
	);
}

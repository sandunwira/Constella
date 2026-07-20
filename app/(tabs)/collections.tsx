import { FlatList, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MiniPlayer } from '@/components/mini-player';

const COLLECTIONS = [
	{ id: '1', name: 'Favorites', count: 12 },
	{ id: '2', name: 'Workout', count: 8 },
	{ id: '3', name: 'Chill', count: 24 },
];

export default function CollectionsScreen() {
	return (
		<SafeAreaView className="flex-1 bg-white dark:bg-neutral-950" edges={['top']}>
			<View className="px-4 pb-2 pt-4">
				<Text className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
					Collections
				</Text>
			</View>

			<FlatList
				data={COLLECTIONS}
				keyExtractor={(item) => item.id}
				renderItem={({ item }) => (
					<View className="mx-4 mb-3 rounded-xl bg-neutral-100 p-4 dark:bg-neutral-900">
						<Text className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
							{item.name}
						</Text>
						<Text className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
							{item.count} tracks
						</Text>
					</View>
				)}
				className="flex-1"
			/>

			<MiniPlayer />
		</SafeAreaView>
	);
}

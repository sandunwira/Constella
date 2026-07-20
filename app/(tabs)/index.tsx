import { FlatList, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MiniPlayer } from '@/components/mini-player';
import { TrackItem } from '@/components/track-item';
import { useAudio, type Track } from '@/contexts/audio-context';

const SAMPLE_TRACKS: Track[] = [
	{
		id: '1',
		title: 'Sample Track One',
		artist: 'Demo Artist',
		uri: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
	},
	{
		id: '2',
		title: 'Sample Track Two',
		artist: 'Demo Artist',
		uri: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
	},
];

export default function HomeScreen() {
	const { currentTrack, playTrack } = useAudio();

	return (
		<SafeAreaView className="flex-1 bg-white dark:bg-neutral-950" edges={['top']}>
			<View className="px-4 pb-2 pt-4">
				<Text className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
					Home
				</Text>
				<Text className="mt-1 text-neutral-500 dark:text-neutral-400">
					Recently played & recommendations
				</Text>
			</View>

			<FlatList
				data={SAMPLE_TRACKS}
				keyExtractor={(item) => item.id}
				renderItem={({ item }) => (
					<TrackItem
						track={item}
						isActive={currentTrack?.id === item.id}
						onPress={() => playTrack(item)}
					/>
				)}
				className="flex-1"
			/>

			<MiniPlayer />
		</SafeAreaView>
	);
}

import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

import { useAudio } from '@/contexts/audio-context';

function formatTime(ms: number) {
	const total = Math.floor(ms / 1000);
	const m = Math.floor(total / 60);
	const s = total % 60;
	return `${m}:${s.toString().padStart(2, '0')}`;
}

export function MiniPlayer() {
	const { currentTrack, isPlaying, position, duration, togglePlayPause } = useAudio();

	if (!currentTrack) return null;

	const progress = duration > 0 ? (position / duration) * 100 : 0;

	return (
		<View className="border-t border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
			<View className="h-0.5 bg-sky-600" style={{ width: `${progress}%` }} />
			<View className="flex-row items-center gap-3 px-4 py-3">
				<View className="h-10 w-10 items-center justify-center rounded-md bg-neutral-200 dark:bg-neutral-700">
					<Ionicons name="musical-note" size={18} color="#0a7ea4" />
				</View>
				<View className="flex-1">
					<Text
						className="text-sm font-semibold text-neutral-900 dark:text-neutral-100"
						numberOfLines={1}>
						{currentTrack.title}
					</Text>
					<Text className="text-xs text-neutral-500 dark:text-neutral-400">
						{formatTime(position)} / {formatTime(duration)}
					</Text>
				</View>
				<Pressable onPress={togglePlayPause} className="p-2">
					<Ionicons name={isPlaying ? 'pause' : 'play'} size={28} color="#0a7ea4" />
				</Pressable>
			</View>
		</View>
	);
}

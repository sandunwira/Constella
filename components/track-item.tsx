import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

import type { Track } from '@/contexts/audio-context';

type Props = {
	track: Track;
	isActive?: boolean;
	onPress: () => void;
};

export function TrackItem({ track, isActive, onPress }: Props) {
	return (
		<Pressable
			onPress={onPress}
			className="flex-row items-center gap-3 px-4 py-3 active:bg-neutral-100 dark:active:bg-neutral-800">
			<View className="h-12 w-12 items-center justify-center rounded-lg bg-neutral-200 dark:bg-neutral-700">
				<Ionicons name="musical-note" size={20} color={isActive ? '#0a7ea4' : '#888'} />
			</View>
			<View className="flex-1">
				<Text
					className={`text-base font-medium ${isActive ? 'text-sky-600' : 'text-neutral-900 dark:text-neutral-100'}`}
					numberOfLines={1}>
					{track.title}
				</Text>
				<Text className="text-sm text-neutral-500 dark:text-neutral-400" numberOfLines={1}>
					{track.artist}
				</Text>
			</View>
			<Ionicons name="play-circle" size={28} color="#0a7ea4" />
		</Pressable>
	);
}

/**
 * TrackItem — Minimalist list row for audio tracks
 */

import type { Track } from '@/contexts/audio-context';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type Props = {
	track: Track;
	index?: number;
	isActive?: boolean;
	onPress: () => void;
	onLongPress?: () => void;
	card?: boolean;
};

export function TrackItem({ track, index, isActive, onPress, onLongPress, card }: Props) {
	return (
		<Pressable
			onPress={onPress}
			onLongPress={onLongPress}
			className={`flex-row items-center ${card ? 'py-3 px-[14px] gap-[14px] rounded-lg bg-surface-1' : 'py-[11px] px-4 gap-3 border-b border-hairline/50'}`}
			style={({ pressed }) => pressed && { backgroundColor: card ? '#2C2C2E' : '#1A1A1C' }}>
			<View className={`items-center justify-center overflow-hidden bg-surface-2 ${card ? 'w-[52px] h-[52px] rounded-[10px]' : 'w-10 h-10 rounded-sm'}`}>
				{track.artwork ? (
					<Image
						source={{ uri: track.artwork }}
						style={StyleSheet.absoluteFill}
						contentFit="cover"
						transition={200}
					/>
				) : (
					<Ionicons name="musical-note" size={card ? 20 : 16} color="#999999" />
				)}
			</View>

			<View className="flex-1 gap-0.5">
				<Text
					className={`text-ink ${card ? 'text-body font-medium' : 'text-body'}`}
					numberOfLines={1}>
					{track.title}
				</Text>
				<Text className="text-ink-muted text-caption" numberOfLines={1}>
					{track.artist}
					{track.album ? ` · ${track.album}` : ''}
				</Text>
			</View>

			<Pressable hitSlop={8} onPress={() => { }} className="p-1">
				<Ionicons name="ellipsis-horizontal" size={18} color="#999999" />
			</Pressable>
		</Pressable>
	);
}

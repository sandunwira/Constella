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
			className={`flex-row items-center border-b border-border ${card ? 'py-3 px-3.5 gap-3.5 rounded-[14px] bg-card border' : 'py-[11px] pl-4 pr-5 gap-3 border-border'}`}
			style={({ pressed }) => pressed && { backgroundColor: card ? '#2C2C2E' : '#1C1C1E' }}>
			<View className={`items-center justify-center overflow-hidden bg-ink-700 ${card ? 'w-[52px] h-[52px] rounded-[10px]' : 'w-10 h-10 rounded-[6px]'}`}>
				{track.artwork ? (
					<Image
						source={{ uri: track.artwork }}
						style={StyleSheet.absoluteFill}
						contentFit="cover"
						transition={200}
					/>
				) : (
					<Ionicons name="musical-note" size={card ? 20 : 16} color="#636366" />
				)}
			</View>

			<View className="flex-1 gap-0.5">
				<Text
					className={`text-white ${card ? 'text-[15px] font-semibold' : 'text-[15px] font-medium'}`}
					style={{ letterSpacing: -0.3 }}
					numberOfLines={1}>
					{track.title}
				</Text>
				<Text className="text-muted text-[13px]" style={{ letterSpacing: -0.1 }} numberOfLines={1}>
					{track.artist}
					{track.album ? ` · ${track.album}` : ''}
				</Text>
			</View>

			<Pressable hitSlop={8} onPress={() => { }} className="p-1">
				<Ionicons name="ellipsis-horizontal" size={18} color="#636366" />
			</Pressable>
		</Pressable>
	);
}

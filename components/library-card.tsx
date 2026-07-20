/**
 * LibraryCard — Minimalist grid card for the Collections library picker
 */

import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { Pressable, Text, View } from 'react-native';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

type Props = {
	id: string;
	name: string;
	type: string;
	count?: number;
	onPress?: () => void;
};

function getLibraryIcon(type: string): IoniconName {
	switch (type?.toLowerCase()) {
		case 'music': return 'musical-notes';
		case 'musicvideos': return 'musical-note';
		case 'audiobooks': return 'book';
		case 'movies': return 'film';
		case 'tvshows': return 'tv';
		case 'homevideos': return 'videocam';
		case 'photos': return 'images';
		default: return 'folder';
	}
}

export function LibraryCard({ name, type, count, onPress }: Props) {
	const icon = getLibraryIcon(type);

	return (
		<Pressable onPress={onPress} className="flex-row items-center p-3.5 rounded-[14px] bg-card gap-3.5">
			<View className="w-[44px] h-[44px] rounded-xl bg-ink-700 items-center justify-center">
				<Ionicons name={icon} size={22} color="#FFFFFF" />
			</View>

			<Text className="flex-1 text-white text-[15px] font-semibold" numberOfLines={1}>{name}</Text>
			<Ionicons name="chevron-forward" size={16} color="#636366" />
		</Pressable>
	);
}

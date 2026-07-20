/**
 * AlbumCard — Minimalist square card with cover art
 */

import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type Props = {
	id: string;
	title: string;
	artist?: string;
	artwork?: string;
	year?: number;
	size?: number;
	onPress?: () => void;
};

export function AlbumCard({ title, artist, artwork, year, size = 160, onPress }: Props) {
	return (
		<Pressable
			onPress={onPress}
			className="rounded-xl bg-card overflow-hidden mr-3"
			style={{ width: size }}>
			{/* Artwork */}
			<View style={{ width: size, height: size }}>
				{artwork ? (
					<Image
						source={{ uri: artwork }}
						style={StyleSheet.absoluteFill}
						contentFit="cover"
						transition={300}
					/>
				) : (
					<View className="w-full h-full bg-ink-700 items-center justify-center">
						<Text className="text-subtle text-[28px] opacity-40">♪</Text>
					</View>
				)}
			</View>

			{/* Metadata */}
			<View className="py-2.5 px-3 gap-0.5">
				<Text className="text-white text-[13px] font-semibold" numberOfLines={1} style={{ lineHeight: 16 }}>
					{title}
				</Text>
				{artist && (
					<Text className="text-muted text-[11px]" numberOfLines={1}>
						{artist}
					</Text>
				)}
			</View>
		</Pressable>
	);
}

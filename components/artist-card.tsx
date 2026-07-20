/**
 * ArtistCard — Minimalist circle card for browsing artists
 */

import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type Props = {
	id: string;
	name: string;
	artwork?: string;
	size?: number;
	onPress?: () => void;
};

export function ArtistCard({ name, artwork, size = 110, onPress }: Props) {
	return (
		<Pressable
			onPress={onPress}
			className="items-center gap-2.5"
			style={{ width: size }}>
			{/* Circle image */}
			<View
				className="overflow-hidden bg-card items-center justify-center"
				style={{
					width: size,
					height: size,
					borderRadius: size / 2,
					shadowColor: '#000',
					shadowOffset: { width: 0, height: 4 },
					shadowOpacity: 0.3,
					shadowRadius: 8,
					elevation: 6,
				}}>
				{artwork ? (
					<Image
						source={{ uri: artwork }}
						style={StyleSheet.absoluteFill}
						contentFit="cover"
						transition={300}
					/>
				) : (
					<Text className="text-subtle text-[28px] opacity-40">♪</Text>
				)}
			</View>
			<Text
				className="text-white text-xs font-semibold text-center px-1"
				numberOfLines={2}
				style={{ lineHeight: 16 }}>
				{name}
			</Text>
		</Pressable>
	);
}

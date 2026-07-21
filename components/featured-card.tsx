/**
 * FeaturedCard — Hero card with gradient (Framer-style gradient spotlight card)
 */

import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type Props = {
	label: string;
	title: string;
	subtitle: string;
	onPress?: () => void;
	width: number;
};

export function FeaturedCard({ label, title, subtitle, onPress, width }: Props) {
	return (
		<Pressable
			onPress={onPress}
			className="overflow-hidden justify-end"
			style={{
				width,
				height: 200,
				borderRadius: 30,
				shadowColor: '#000',
				shadowOffset: { width: 0, height: 10 },
				shadowOpacity: 0.25,
				shadowRadius: 30,
				elevation: 10,
			}}>
			<LinearGradient
				colors={['#7C4DFF', '#0A0A0B']}
				start={{ x: 0, y: 0 }}
				end={{ x: 1, y: 1 }}
				style={StyleSheet.absoluteFill}
			/>
			<View className="p-8 gap-3">
				<View className="self-start px-md py-[5px] rounded-pill bg-white/10">
					<Text className="text-ink text-2xs font-medium tracking-wider uppercase">
						{label}
					</Text>
				</View>

				<View className="w-10 h-10 rounded-md items-center justify-center bg-white/5">
					<Ionicons name="sparkles" size={22} color="#FFFFFF" />
				</View>

				<Text
					className="text-ink text-subhead font-medium"
					numberOfLines={2}>
					{title}
				</Text>
				<Text className="text-ink-muted text-body-sm" numberOfLines={1}>
					{subtitle}
				</Text>
			</View>
		</Pressable>
	);
}

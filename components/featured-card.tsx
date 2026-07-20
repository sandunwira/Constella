/**
 * FeaturedCard — Hero card with gradient
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
			className="rounded-2xl overflow-hidden justify-end"
			style={{
				width,
				height: 200,
				shadowColor: '#000',
				shadowOffset: { width: 0, height: 8 },
				shadowOpacity: 0.4,
				shadowRadius: 20,
				elevation: 12,
			}}>
			<LinearGradient
				colors={['#1C1C1E', '#121213']}
				start={{ x: 0, y: 0 }}
				end={{ x: 1, y: 1 }}
				style={StyleSheet.absoluteFill}
			/>
			<View className="p-6 gap-2.5">
				<View className="self-start px-3 py-[5px] rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}>
					<Text className="text-muted text-[10px] font-semibold tracking-widest uppercase">
						{label}
					</Text>
				</View>

				<View className="w-10 h-10 rounded-[10px] items-center justify-center" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}>
					<Ionicons name="sparkles" size={22} color="#FFFFFF" />
				</View>

				<Text className="text-white text-xl font-bold" numberOfLines={2} style={{ letterSpacing: -0.5, lineHeight: 24 }}>
					{title}
				</Text>
				<Text className="text-muted text-[13px]" numberOfLines={1} style={{ lineHeight: 18 }}>
					{subtitle}
				</Text>
			</View>
		</Pressable>
	);
}

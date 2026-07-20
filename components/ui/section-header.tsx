import { Pressable, Text, View } from 'react-native';

type Props = {
	title: string;
	subtitle?: string;
	onSeeAll?: () => void;
};

export function SectionHeader({ title, subtitle, onSeeAll }: Props) {
	return (
		<View className="flex-row items-end justify-between px-5 mb-3.5">
			<View className="flex-1">
				<Text className="text-white text-xl font-bold" style={{ letterSpacing: -0.4 }}>
					{title}
				</Text>
				{subtitle && (
					<Text className="text-muted text-xs mt-0.5">{subtitle}</Text>
				)}
			</View>
			{onSeeAll && (
				<Pressable onPress={onSeeAll}>
					<Text className="text-muted text-[13px] font-semibold">See All</Text>
				</Pressable>
			)}
		</View>
	);
}

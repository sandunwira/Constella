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
				<Text className="text-ink text-subhead font-medium">
					{title}
				</Text>
				{subtitle && (
					<Text className="text-ink-muted text-xs mt-0.5">{subtitle}</Text>
				)}
			</View>
			{onSeeAll && (
				<Pressable onPress={onSeeAll}>
					<Text className="text-ink-muted text-caption font-medium">See All</Text>
				</Pressable>
			)}
		</View>
	);
}

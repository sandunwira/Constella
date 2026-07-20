/**
 * ToggleRow — Minimalist settings toggle row
 */

import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { Pressable, Switch, Text, View } from 'react-native';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

type ToggleRowProps = {
	icon: IoniconName;
	iconColor?: string;
	label: string;
	description?: string;
	value: boolean;
	onToggle: (v: boolean) => void;
};

type LinkRowProps = {
	icon: IoniconName;
	iconColor?: string;
	label: string;
	value?: string;
	onPress?: () => void;
	showChevron?: boolean;
};

export function ToggleRow({ icon, iconColor, label, description, value, onToggle }: ToggleRowProps) {
	const color = iconColor ?? '#A1A1A6';

	return (
		<View className="flex-row items-center px-4 py-3.5 gap-3">
			<View className="w-[34px] h-[34px] rounded-[10px] bg-ink-700 items-center justify-center">
				<Ionicons name={icon} size={18} color={color} />
			</View>
			<View className="flex-1 gap-0.5">
				<Text className="text-white text-[15px] font-medium">{label}</Text>
				{description && <Text className="text-muted text-xs">{description}</Text>}
			</View>
			<Switch
				value={value}
				onValueChange={onToggle}
				trackColor={{ false: '#2C2C2E', true: '#FFFFFF' }}
				thumbColor="#0A0A0B"
			/>
		</View>
	);
}

export function LinkRow({ icon, iconColor, label, value, onPress, showChevron = true }: LinkRowProps) {
	const color = iconColor ?? '#A1A1A6';

	return (
		<Pressable
			onPress={onPress}
			className="flex-row items-center px-4 py-3.5 gap-3"
			style={({ pressed }) => pressed && { backgroundColor: '#1C1C1E' }}>
			<View className="w-[34px] h-[34px] rounded-[10px] bg-ink-700 items-center justify-center">
				<Ionicons name={icon} size={18} color={color} />
			</View>
			<Text className="flex-1 text-white text-[15px] font-medium">{label}</Text>
			{value && <Text className="text-muted text-[14px] font-medium mr-1">{value}</Text>}
			{showChevron && (
				<Ionicons name="chevron-forward" size={16} color="#636366" />
			)}
		</Pressable>
	);
}

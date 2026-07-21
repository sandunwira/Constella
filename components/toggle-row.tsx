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
	const color = iconColor ?? '#999999';

	return (
		<View className="flex-row items-center px-4 py-[14px] gap-3">
			<View className="w-[34px] h-[34px] rounded-md bg-surface-2 items-center justify-center">
				<Ionicons name={icon} size={18} color={color} />
			</View>
			<View className="flex-1 gap-0.5">
				<Text className="text-ink text-body font-medium">{label}</Text>
				{description && <Text className="text-ink-muted text-xs">{description}</Text>}
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
	const color = iconColor ?? '#999999';

	return (
		<Pressable
			onPress={onPress}
			className="flex-row items-center px-4 py-[14px] gap-3"
			style={({ pressed }) => pressed && { backgroundColor: '#1A1A1C' }}>
			<View className="w-[34px] h-[34px] rounded-md bg-surface-2 items-center justify-center">
				<Ionicons name={icon} size={18} color={color} />
			</View>
			<Text className="flex-1 text-ink text-body font-medium">{label}</Text>
			{value && <Text className="text-ink-muted text-body-sm font-medium mr-1">{value}</Text>}
			{showChevron && (
				<Ionicons name="chevron-forward" size={16} color="#999999" />
			)}
		</Pressable>
	);
}

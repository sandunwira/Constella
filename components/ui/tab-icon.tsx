import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { View } from 'react-native';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

type Props = {
	name: IoniconName;
	color: string;
	size?: number;
};

export function TabIcon({ name, color, size = 24 }: Props) {
	return (
		<View className="items-center justify-center w-7 h-7">
			<Ionicons name={name} size={size} color={color} />
		</View>
	);
}

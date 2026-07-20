/**
 * SearchBar — Minimalist search input
 */

import { Ionicons } from '@expo/vector-icons';
import { Pressable, TextInput, View } from 'react-native';

type Props = {
	value: string;
	onChangeText: (t: string) => void;
	placeholder?: string;
	onClear?: () => void;
};

export function SearchBar({ value, onChangeText, placeholder = 'Search…', onClear }: Props) {
	return (
		<View className="flex-row items-center bg-card rounded-xl px-3.5 py-[11px] gap-2.5 border border-border">
			<Ionicons name="search" size={18} color="#636366" />
			<TextInput
				value={value}
				onChangeText={onChangeText}
				placeholder={placeholder}
				placeholderTextColor="#636366"
				className="flex-1 text-white text-[15px]"
				style={{ padding: 0 }}
				returnKeyType="search"
				autoCorrect={false}
				autoCapitalize="none"
			/>
			{value.length > 0 && (
				<Pressable onPress={onClear} hitSlop={8}>
					<Ionicons name="close-circle" size={18} color="#636366" />
				</Pressable>
			)}
		</View>
	);
}

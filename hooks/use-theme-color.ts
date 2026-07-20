/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { useColorScheme } from '@/hooks/use-color-scheme';

const ThemeColors = {
	light: {
		text: '#11181C',
		background: '#fff',
		tint: '#000000',
		icon: '#687076',
	},
	dark: {
		text: '#F1F0FF',
		background: '#050507',
		tint: '#FFFFFF',
		icon: '#9B97C0',
	},
};

export function useThemeColor(
	props: { light?: string; dark?: string },
	colorName: keyof typeof ThemeColors.light & keyof typeof ThemeColors.dark
) {
	const theme = useColorScheme() ?? 'dark';
	const colorFromProps = props[theme];

	if (colorFromProps) {
		return colorFromProps;
	} else {
		return ThemeColors[theme][colorName];
	}
}

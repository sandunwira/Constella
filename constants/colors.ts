export const Colors = {
	background: {
		primary: '#0A0A0B',
		secondary: '#121213',
		tertiary: '#1A1A1C',
		card: '#1C1C1E',
		elevated: '#2C2C2E',
	},

	white: '#FFFFFF',
	black: '#000000',

	text: {
		primary: '#FFFFFF',
		secondary: '#A1A1A6',
		tertiary: '#636366',
		disabled: '#48484A',
	},

	border: {
		subtle: '#2C2C2E',
		light: '#38383A',
	},

	gradients: {
		card: ['#1C1C1E', '#121213'] as string[],
		elevated: ['#2C2C2E', '#1A1A1C'] as string[],
		overlay: ['rgba(0,0,0,0.8)', 'rgba(0,0,0,0.2)'] as string[],
	},
} as const;

export type ColorKey = keyof typeof Colors;

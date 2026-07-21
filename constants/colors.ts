export const Colors = {
	brand: {
		primary: '#FFFFFF',
		onPrimary: '#000000',
		accentBlue: '#0099FF',
	},

	surface: {
		canvas: '#0A0A0B',
		surface1: '#1A1A1C',
		surface2: '#2C2C2E',
		hairline: '#38383A',
		hairlineSoft: '#1C1C1E',
		inverseCanvas: '#FFFFFF',
	},

	text: {
		ink: '#FFFFFF',
		inkMuted: '#999999',
	},

	semantic: {
		success: '#00CC66',
	},

	gradient: {
		magenta: '#E040FB',
		violet: '#7C4DFF',
		orange: '#FF6D00',
		coral: '#FF4081',
	},

	// Legacy aliases for backward compatibility
	white: '#FFFFFF',
	black: '#000000',

	background: {
		primary: '#0A0A0B',
		secondary: '#1A1A1C',
		tertiary: '#2C2C2E',
		card: '#1A1A1C',
		elevated: '#2C2C2E',
	},

	textLegacy: {
		primary: '#FFFFFF',
		secondary: '#999999',
		tertiary: '#636366',
		disabled: '#48484A',
	},

	border: {
		subtle: '#1C1C1E',
		light: '#38383A',
	},

	gradients: {
		card: ['#1A1A1C', '#0A0A0B'] as string[],
		elevated: ['#2C2C2E', '#1A1A1C'] as string[],
		overlay: ['rgba(0,0,0,0.8)', 'rgba(0,0,0,0.2)'] as string[],
	},
} as const;

export type ColorKey = keyof typeof Colors;

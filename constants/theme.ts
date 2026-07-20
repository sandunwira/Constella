export const Spacing = {
	xs: 4,
	sm: 8,
	md: 12,
	lg: 16,
	xl: 20,
	'2xl': 24,
	'3xl': 32,
	'4xl': 40,
	'5xl': 48,
	'6xl': 64,
} as const;

export const Radius = {
	sm: 10,
	md: 14,
	lg: 18,
	xl: 24,
	'2xl': 28,
	full: 9999,
} as const;

export const Typography = {
	sizes: {
		xs: 11,
		sm: 13,
		base: 15,
		md: 17,
		lg: 20,
		xl: 24,
		'2xl': 28,
		'3xl': 34,
	},
	weights: {
		regular: '400' as const,
		medium: '500' as const,
		semibold: '600' as const,
		bold: '700' as const,
		extrabold: '800' as const,
	},
} as const;

export const Layout = {
	albumCardSize: 160,
	artistCardSize: 120,
	featuredCardH: 200,
	nowPlayingBarH: 72,
	tabBarH: 60,
	fullPlayerArtW: 300,
} as const;

export const Shadow = {
	card: {
		shadowColor: '#000000',
		shadowOffset: { width: 0, height: 6 },
		shadowOpacity: 0.35,
		shadowRadius: 16,
		elevation: 10,
	},
	accent: {
		shadowColor: '#000000',
		shadowOffset: { width: 0, height: 10 },
		shadowOpacity: 0.5,
		shadowRadius: 24,
		elevation: 20,
	},
} as const;

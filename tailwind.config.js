/** @type {import('tailwindcss').Config} */
module.exports = {
	content: [
		'./App.tsx',
		'./components/**/*.{js,jsx,ts,tsx}',
		'./app/**/*.{js,jsx,ts,tsx}',
	],
	presets: [require('nativewind/preset')],
	theme: {
		extend: {
			colors: {
				ink: {
					950: '#0A0A0B',
					900: '#121213',
					850: '#1A1A1C',
					800: '#1C1C1E',
					700: '#2C2C2E',
					600: '#38383A',
				},
				accent: {
					50: '#FFFFFF',
					100: '#E5E5E5',
					200: '#D4D4D4',
					300: '#A1A1A6',
					400: '#636366',
					500: '#48484A',
					600: '#38383A',
					700: '#2C2C2E',
					800: '#1C1C1E',
					900: '#121213',
				},
				nebula: {
					400: '#A1A1A6',
					500: '#636366',
					600: '#48484A',
				},
				star: {
					400: '#A1A1A6',
					500: '#636366',
					600: '#48484A',
				},
				aurora: {
					400: '#A1A1A6',
					500: '#636366',
				},
				bg: '#0A0A0B',
				surface: '#121213',
				card: '#1C1C1E',
				border: '#2C2C2E',
				muted: '#A1A1A6',
				subtle: '#636366',
			},
			fontFamily: {
				sans: ['System', 'sans-serif'],
			},
			fontSize: {
				'2xs': ['10px', { lineHeight: '14px' }],
			},
			borderRadius: {
				'2xl': '16px',
				'3xl': '24px',
				'4xl': '32px',
			},
		},
	},
	plugins: [],
};
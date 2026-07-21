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
				// Brand
				primary: '#FFFFFF',
				'on-primary': '#000000',
				'accent-blue': '#0099FF',

				// Surface hierarchy
				'canvas': '#0A0A0B',
				'surface-1': '#1A1A1C',
				'surface-2': '#2C2C2E',
				'hairline': '#38383A',
				'hairline-soft': '#1C1C1E',
				'inverse-canvas': '#FFFFFF',

				// Text
				'ink': '#FFFFFF',
				'ink-muted': '#999999',

				// Semantic
				'semantic-success': '#00CC66',

				// Gradients (solid anchors — actual gradients are linear-gradient strings)
				'gradient-magenta': '#E040FB',
				'gradient-violet': '#7C4DFF',
				'gradient-orange': '#FF6D00',
				'gradient-coral': '#FF4081',
			},
			fontFamily: {
				sans: ['System', 'sans-serif'],
				display: ['System', 'sans-serif'],
			},
			fontSize: {
				'2xs': ['12px', { lineHeight: '14px' }],
				'micro': ['12px', { lineHeight: '14px', letterSpacing: '-0.12px' }],
				'caption': ['13px', { lineHeight: '15px', letterSpacing: '-0.13px' }],
				'button': ['14px', { lineHeight: '14px', letterSpacing: '-0.14px' }],
				'body-sm': ['14px', { lineHeight: '20px', letterSpacing: '-0.14px' }],
				'body': ['15px', { lineHeight: '20px', letterSpacing: '-0.15px' }],
				'body-lg': ['18px', { lineHeight: '23px', letterSpacing: '-0.18px' }],
				'subhead': ['24px', { lineHeight: '31px', letterSpacing: '-0.01px' }],
				'headline': ['22px', { lineHeight: '26px', letterSpacing: '-0.8px' }],
				'display-md': ['32px', { lineHeight: '36px', letterSpacing: '-1.0px' }],
				'display-lg': ['62px', { lineHeight: '62px', letterSpacing: '-3.1px' }],
				'display-xl': ['85px', { lineHeight: '81px', letterSpacing: '-4.25px' }],
				'display-xxl': ['110px', { lineHeight: '94px', letterSpacing: '-5.5px' }],
			},
			borderRadius: {
				'xs': '4px',
				'sm': '6px',
				'md': '10px',
				'lg': '15px',
				'xl': '20px',
				'2xl': '24px',
				'3xl': '30px',
				'4xl': '32px',
				'xxl': '30px',
				'pill': '100px',
			},
			spacing: {
				'hair': '1px',
				'xxs': '4px',
				'xs': '8px',
				'sm': '12px',
				'md': '15px',
				'lg': '20px',
				'xl': '30px',
				'2xl': '40px',
				'3xl': '48px',
				'4xl': '64px',
				'section': '96px',
			},
			boxShadow: {
				'level-1': '0 1px 3px rgba(0, 0, 0, 0.35)',
				'level-2': '0 10px 30px rgba(0, 0, 0, 0.25), inset 0 0.5px 0 rgba(255, 255, 255, 0.10)',
				'level-3': '0 0 0 1px rgba(0, 153, 255, 0.15)',
			},
			keyframes: {
				'pulse-glow': {
					'0%, 100%': { opacity: '0.4' },
					'50%': { opacity: '0.8' },
				},
			},
			animation: {
				'pulse-glow': 'pulse-glow 3s ease-in-out infinite',
			},
		},
	},
	plugins: [],
};

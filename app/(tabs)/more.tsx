import { StyleSheet } from 'react-native';

import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Fonts } from '@/constants/theme';

export default function TabThreeScreen() {
	return (
		<ParallaxScrollView
			headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
			headerImage={
				<IconSymbol
					size={310}
					color="#42A5F5"
					name="cloud.heavyrain"
					style={styles.headerImage}
				/>
			}>
			<ThemedView style={styles.titleContainer}>
				<ThemedText
					type="title"
					style={{
						fontFamily: Fonts.rounded,
					}}>
					More
				</ThemedText>
			</ThemedView>
			<ThemedText>This is another screen in the tab navigator. You can edit the code in <ThemedText type="defaultSemiBold">app/(tabs)/more.tsx</ThemedText> to change this screen.</ThemedText>
		</ParallaxScrollView>
	);
}

const styles = StyleSheet.create({
	headerImage: {
		color: '#808080',
		bottom: -90,
		left: -35,
		position: 'absolute',
	},
	titleContainer: {
		flexDirection: 'row',
		gap: 8,
	},
});

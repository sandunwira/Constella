import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import '../global.css';

import { AudioProvider } from '@/contexts/audio-context';
import { DbProvider } from '@/contexts/db-context';
import { JellyfinProvider } from '@/contexts/jellyfin-context';

export const unstable_settings = {
	anchor: '(tabs)',
};

export default function RootLayout() {
	return (
		<DbProvider>
			<JellyfinProvider>
				<AudioProvider>
					<Stack>
						<Stack.Screen name="(tabs)" options={{ headerShown: false }} />
						<Stack.Screen
							name="player"
							options={{
								headerShown: false,
								presentation: 'modal',
								animation: 'slide_from_bottom',
								gestureEnabled: true,
							}}
						/>
					</Stack>
					<StatusBar style="light" />
				</AudioProvider>
			</JellyfinProvider>
		</DbProvider>
	);
}

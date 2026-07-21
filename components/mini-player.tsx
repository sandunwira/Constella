import { BlurView } from 'expo-blur';
import { useAudio } from '@/contexts/audio-context';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

export function NowPlayingBar() {
	const {
		currentTrack,
		isPlaying,
		position,
		duration,
		togglePlayPause,
		skipNext,
		skipPrev,
	} = useAudio();

	if (!currentTrack) return null;

	const progress = duration > 0 ? position / duration : 0;

	const handleOpen = () => {
		router.push('/player');
	};

	return (
		<View
			className="absolute left-0 right-0 bottom-[82px] overflow-hidden"
			style={{
				...(Platform.OS === 'ios'
					? { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 20 }
					: { elevation: 12 }),
			}}>
			<BlurView
				tint="dark"
				intensity={100}
				style={StyleSheet.absoluteFill}
			/>
			{/* Progress bar */}
			<View className="h-[1px] absolute top-0 left-0 right-0 z-10 bg-hairline">
				<View className="h-[1px] bg-primary" style={{ width: `${progress * 100}%` }} />
			</View>

			<Pressable onPress={handleOpen} className="flex-row items-center py-3 px-[14px] gap-3">
				<View className="w-12 h-12 rounded-md overflow-hidden bg-surface-2 items-center justify-center">
					{currentTrack.artwork ? (
						<Image
							source={{ uri: currentTrack.artwork }}
							style={StyleSheet.absoluteFill}
							contentFit="cover"
							transition={300}
						/>
					) : (
						<Ionicons name="musical-note" size={20} color="#999999" />
					)}
				</View>

				<View className="flex-1 gap-1">
					<Text className="text-ink text-body font-medium" numberOfLines={1}>
						{currentTrack.title}
					</Text>
					<Text className="text-ink-muted text-caption" numberOfLines={1}>
						{currentTrack.artist}
					</Text>
				</View>

				<View className="flex-row items-center gap-1.5">
					<Pressable
						onPress={(e) => { e.stopPropagation(); togglePlayPause(); }}
						hitSlop={10}
						className="p-1.5">
						<Ionicons
							name={isPlaying ? 'pause' : 'play'}
							size={26}
							color="#FFFFFF"
						/>
					</Pressable>

					<Pressable
						onPress={(e) => { e.stopPropagation(); skipNext(); }}
						hitSlop={12}
						className="p-1.5">
						<Ionicons name="play-skip-forward-sharp" size={24} color="#FFFFFF" />
					</Pressable>
				</View>
			</Pressable>
		</View>
	);
}

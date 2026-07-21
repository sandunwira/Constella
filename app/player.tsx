/**
 * Full-Screen Player — Apple Music-style modal
 */

import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import {
	Dimensions,
	FlatList,
	PanResponder,
	Platform,
	Pressable,
	ScrollView,
	StatusBar,
	StyleSheet,
	Text,
	View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAudio } from '@/contexts/audio-context';

const { width: W } = Dimensions.get('window');
const ART_SIZE = W - 64;

function formatMs(ms: number): string {
	const total = Math.floor(ms / 1000);
	const m = Math.floor(total / 60);
	const s = total % 60;
	return `${m}:${s.toString().padStart(2, '0')}`;
}

const REPEAT_ICONS: Record<string, [React.ComponentProps<typeof Ionicons>['name'], string]> = {
	none: ['repeat', '#999999'],
	all: ['repeat', '#FFFFFF'],
	one: ['repeat-sharp', '#FFFFFF'],
};

export default function PlayerScreen() {
	const {
		currentTrack,
		isPlaying,
		position,
		duration,
		queue,
		queueIndex,
		queueName,
		isShuffled,
		repeatMode,
		togglePlayPause,
		seekTo,
		skipNext,
		skipPrev,
		toggleShuffle,
		cycleRepeat,
		removeFromQueue,
		clearQueue,
	} = useAudio();

	const [isScrubbing, setIsScrubbing] = useState(false);
	const [scrubValue, setScrubValue] = useState(0);
	const scrubberWidth = useRef(0);

	const [isFavorited, setIsFavorited] = useState(false);
	const [showQueue, setShowQueue] = useState(false);

	const progress = duration > 0 ? position / duration : 0;
	const displayPos = isScrubbing ? scrubValue : progress;

	const handleClose = useCallback(() => { router.back(); }, []);
	const handleToggle = useCallback(() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); togglePlayPause(); }, [togglePlayPause]);
	const handleSkipNext = useCallback(() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); skipNext(); }, [skipNext]);
	const handleSkipPrev = useCallback(() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); skipPrev(); }, [skipPrev]);
	const handleShuffle = useCallback(() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); toggleShuffle(); }, [toggleShuffle]);
	const handleRepeat = useCallback(() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); cycleRepeat(); }, [cycleRepeat]);
	const handleFavorite = useCallback(() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setIsFavorited((p) => !p); }, []);

	const panResponder = useRef(
		PanResponder.create({
			onStartShouldSetPanResponder: () => true,
			onPanResponderGrant: (evt) => {
				setIsScrubbing(true);
				const ratio = Math.max(0, Math.min(1, evt.nativeEvent.locationX / scrubberWidth.current));
				setScrubValue(ratio);
			},
			onPanResponderMove: (evt) => {
				const ratio = Math.max(0, Math.min(1, evt.nativeEvent.locationX / scrubberWidth.current));
				setScrubValue(ratio);
			},
			onPanResponderRelease: (evt) => {
				const ratio = Math.max(0, Math.min(1, evt.nativeEvent.locationX / scrubberWidth.current));
				seekTo(ratio * duration);
				setIsScrubbing(false);
			},
		}),
	).current;

	const [repeatIcon, repeatColor] = REPEAT_ICONS[repeatMode];
	const nextTrack = queue[queueIndex + 1];
	const upcomingTracks = queue.slice(queueIndex + 1, queueIndex + 6);

	if (!currentTrack) {
		return (
			<View className="flex-1 bg-canvas items-center justify-center">
				<Text className="text-ink-muted">Nothing playing</Text>
			</View>
		);
	}

	return (
		<View className="flex-1 bg-canvas">
			<StatusBar barStyle="light-content" />

			{currentTrack.artwork && (
				<>
					<Image
						source={{ uri: currentTrack.artwork }}
						style={[StyleSheet.absoluteFillObject, { opacity: 0.5 }]}
						contentFit="cover"
						blurRadius={40}
					/>
					<LinearGradient
						colors={['rgba(0,0,0,0.6)', 'rgba(0,0,0,0.9)', '#0A0A0B']}
						style={StyleSheet.absoluteFill}
					/>
				</>
			)}

			{!currentTrack.artwork && (
				<LinearGradient
					colors={['#1A1A1C', '#0A0A0B']}
					style={StyleSheet.absoluteFill}
				/>
			)}

			<SafeAreaView className="flex-1" edges={['top', 'bottom']}>
				{/* Top bar */}
				<View className="flex-row items-center px-5 py-3">
					<Pressable onPress={handleClose} hitSlop={12} className="p-2">
						<Ionicons name="chevron-down" size={28} color="#FFFFFF" />
					</Pressable>
					<View className="flex-1 items-center">
						<Text className="text-ink-muted text-2xs font-medium uppercase">Now Playing</Text>
						{queueName && (
							<Text className="text-ink-muted text-[11px] font-medium mt-0.5" numberOfLines={1}>
								{queueName}
							</Text>
						)}
					</View>
					<Pressable
						onPress={() => setShowQueue((p) => !p)}
						hitSlop={12}
						className="p-2">
						<Ionicons
							name={showQueue ? 'musical-notes' : 'list'}
							size={22}
							color={showQueue ? '#FFFFFF' : '#999999'}
						/>
					</Pressable>
				</View>

				{!showQueue ? (
					<ScrollView
						style={{ flex: 1 }}
						contentContainerStyle={{ paddingHorizontal: 28, paddingBottom: 24 }}
						showsVerticalScrollIndicator={false}
						bounces={false}>

						{/* Artwork */}
						<View className="items-center mt-3 mb-9">
							<View
								style={{
									borderRadius: 28,
									shadowColor: isPlaying ? '#FFFFFF' : '#000',
									shadowOffset: { width: 0, height: 20 },
									shadowOpacity: isPlaying ? 0.3 : 0.7,
									shadowRadius: 40,
									elevation: 30,
								}}>
								<View className="rounded-xl overflow-hidden bg-surface-1" style={{ width: ART_SIZE, height: ART_SIZE }}>
									{currentTrack.artwork ? (
										<Image
											source={{ uri: currentTrack.artwork }}
											style={{ width: '100%', height: '100%' }}
											contentFit="cover"
											transition={400}
										/>
									) : (
										<View className="flex-1 items-center justify-center bg-surface-2">
											<Ionicons name="musical-note" size={80} color="#999999" />
										</View>
									)}
								</View>
							</View>
						</View>

						{/* Track Info + Favorite */}
						<View className="flex-row items-center mb-7 gap-3">
							<View className="flex-1">
								<Text className="text-ink text-[26px] font-medium leading-8" numberOfLines={1}>
									{currentTrack.title}
								</Text>
								<Text className="text-ink-muted text-[16px] mt-1" numberOfLines={1}>
									{currentTrack.artist}
									{currentTrack.album ? ` · ${currentTrack.album}` : ''}
								</Text>
							</View>
							<Pressable onPress={handleFavorite} hitSlop={10} className="p-1">
								<Ionicons
									name={isFavorited ? 'heart' : 'heart-outline'}
									size={26}
									color={isFavorited ? '#EF4444' : '#999999'}
								/>
							</Pressable>
						</View>

						{/* Scrubber */}
						<View className="mb-8">
							<View
								className="h-[3px] bg-surface-2 rounded-sm mb-2.5 relative"
								onLayout={(e) => { scrubberWidth.current = e.nativeEvent.layout.width; }}
								{...panResponder.panHandlers}>
								<View
									className="h-[3px] bg-ink rounded-sm absolute top-0 left-0"
									style={{ width: `${displayPos * 100}%` }}
								/>
								<View
									className="w-[13px] h-[13px] rounded-full bg-ink absolute top-[-5px]"
									style={{
										left: `${displayPos * 100}%`,
										marginLeft: -6.5,
										...(isScrubbing && { transform: [{ scale: 1.5 }] }),
									}}
								/>
							</View>
							<View className="flex-row justify-between">
								<Text className="text-ink-muted text-2xs font-medium">{formatMs(isScrubbing ? scrubValue * duration : position)}</Text>
								<Text className="text-ink-muted text-2xs font-medium">
									-{formatMs(duration - (isScrubbing ? scrubValue * duration : position))}
								</Text>
							</View>
						</View>

						{/* Main Controls */}
						<View className="flex-row items-center justify-between mb-9 px-1">
							<Pressable onPress={handleShuffle} hitSlop={12} className="w-[44px] items-center justify-center">
								<Ionicons
									name="shuffle"
									size={24}
									color={isShuffled ? '#FFFFFF' : '#999999'}
								/>
							</Pressable>

							<Pressable onPress={handleSkipPrev} hitSlop={12} className="p-2">
								<Ionicons name="play-skip-back-sharp" size={34} color="#FFFFFF" />
							</Pressable>

							<Pressable
								onPress={handleToggle}
								className="w-[76px] h-[76px] rounded-[38px] bg-primary items-center justify-center"
								style={{
									shadowColor: '#fff',
									shadowOffset: { width: 0, height: 0 },
									shadowOpacity: 0.15,
									shadowRadius: 20,
									elevation: 8,
								}}>
								<Ionicons
									name={isPlaying ? 'pause' : 'play'}
									size={34}
									color="#000000"
								/>
							</Pressable>

							<Pressable onPress={handleSkipNext} hitSlop={12} className="p-2">
								<Ionicons name="play-skip-forward-sharp" size={34} color="#FFFFFF" />
							</Pressable>

							<Pressable onPress={handleRepeat} hitSlop={12} className="w-[44px] items-center justify-center">
								<Ionicons name={repeatIcon} size={24} color={repeatColor} />
								{repeatMode === 'one' && (
									<View className="absolute bottom-[-2px] w-1 h-1 rounded-full bg-ink" />
								)}
							</Pressable>
						</View>

						{/* Audio Output */}
						<View className="flex-row items-center justify-center gap-[6px] mb-7">
							<Ionicons name="phone-portrait-outline" size={16} color="#999999" />
							<Text className="text-ink-muted text-2xs font-medium">
								{Platform.OS === 'ios' ? 'iPhone' : 'Speaker'}
							</Text>
						</View>

						{/* Up Next peek */}
						{nextTrack && (
							<Pressable className="bg-surface-1/60 rounded-lg p-4 gap-2.5 border border-hairline/50" onPress={() => setShowQueue(true)}>
								<View className="flex-row items-center justify-between">
									<Text className="text-ink-muted text-2xs font-medium uppercase">Up Next</Text>
									<Ionicons name="chevron-forward" size={16} color="#999999" />
								</View>
								{upcomingTracks.map((track, i) => (
									<View key={`${track.id}-${i}`} className="flex-row items-center gap-3">
										<View className="w-10 h-10 rounded-lg overflow-hidden bg-surface-2 items-center justify-center">
											{track.artwork ? (
												<Image
													source={{ uri: track.artwork }}
													style={StyleSheet.absoluteFill}
													contentFit="cover"
												/>
											) : (
												<Ionicons name="musical-note" size={14} color="#999999" />
											)}
										</View>
										<View className="flex-1 gap-0.5">
											<Text className="text-ink text-body-sm font-medium" numberOfLines={1}>{track.title}</Text>
											<Text className="text-ink-muted text-xs" numberOfLines={1}>{track.artist}</Text>
										</View>
										<Text className="text-ink-muted text-xs font-medium">{formatMs(track.durationMs ?? 0)}</Text>
									</View>
								))}
							</Pressable>
						)}

						<View className="h-8" />
					</ScrollView>
				) : (
					/* Queue View */
					<View className="flex-1 px-5">
						<View className="flex-row items-center justify-between mb-5">
							<View className="flex-1">
								<Text className="text-ink text-headline font-medium">Queue</Text>
								{queueName && (
									<Text className="text-ink-muted text-caption mt-0.5">{queueName}</Text>
								)}
								<Text className="text-ink-muted text-caption mt-0.5">
									{queue.length} track{queue.length !== 1 ? 's' : ''}
								</Text>
							</View>
							<View className="flex-row gap-3">
								<Pressable
									onPress={clearQueue}
									className="px-3 py-[6px] rounded-[10px] bg-surface-1">
									<Text className="text-ink-muted text-caption font-medium">Clear</Text>
								</Pressable>
							</View>
						</View>

						<Text className="text-ink-muted text-2xs font-medium uppercase mb-2.5 mt-2">Now Playing</Text>
						<View className="flex-row items-center gap-3 p-3 rounded-xl bg-surface-1 mb-4">
							<View className="w-[44px] h-[44px] rounded-lg overflow-hidden bg-surface-2 items-center justify-center">
								{currentTrack.artwork ? (
									<Image
										source={{ uri: currentTrack.artwork }}
										style={StyleSheet.absoluteFill}
										contentFit="cover"
									/>
								) : (
									<Ionicons name="musical-note" size={18} color="#999999" />
								)}
							</View>
							<View className="flex-1 gap-0.5">
								<Text className="text-ink text-body font-medium" numberOfLines={1}>{currentTrack.title}</Text>
								<Text className="text-ink-muted text-caption" numberOfLines={1}>{currentTrack.artist}</Text>
							</View>
							<Ionicons name="play" size={16} color="#FFFFFF" />
						</View>

						{upcomingTracks.length > 0 && (
							<>
								<Text className="text-ink-muted text-2xs font-medium uppercase mb-2.5 mt-2">Up Next</Text>
								<FlatList
									data={upcomingTracks}
									keyExtractor={(item, i) => `${item.id}-${i}`}
									renderItem={({ item, index }) => (
										<View className="flex-row items-center gap-3 py-[10px] px-1">
											<View className="w-10 h-10 rounded-lg overflow-hidden bg-surface-2 items-center justify-center">
												{item.artwork ? (
													<Image
														source={{ uri: item.artwork }}
														style={StyleSheet.absoluteFill}
														contentFit="cover"
													/>
												) : (
													<Ionicons name="musical-note" size={16} color="#999999" />
												)}
											</View>
											<View className="flex-1 gap-0.5">
												<Text className="text-ink text-body-sm" numberOfLines={1}>{item.title}</Text>
												<Text className="text-ink-muted text-xs" numberOfLines={1}>{item.artist}</Text>
											</View>
											<Pressable
												onPress={() => removeFromQueue(queueIndex + 1 + index)}
												hitSlop={8}
												className="p-1">
												<Ionicons name="close" size={16} color="#999999" />
											</Pressable>
										</View>
									)}
									ListFooterComponent={
										queue.length > queueIndex + 6 ? (
											<Text className="text-ink-muted text-caption text-center py-3">
												+{queue.length - queueIndex - 6} more tracks
											</Text>
										) : null
									}
								/>
							</>
						)}
					</View>
				)}
			</SafeAreaView>
		</View>
	);
}

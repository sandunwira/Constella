/**
 * Full-Screen Player — Apple Music-style modal
 *
 * Features:
 * - Large blurred artwork background
 * - Scrubber with position / time remaining
 * - Play/Pause, Skip, Shuffle, Repeat controls
 * - Queue view with remove and reorder
 * - Favorite toggle
 * - Volume slider
 * - Haptic feedback on controls
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

import { Colors } from '@/constants/colors';
import { useAudio, type Track } from '@/contexts/audio-context';

const { width: W } = Dimensions.get('window');
const ART_SIZE = W - 64;

function formatMs(ms: number): string {
	const total = Math.floor(ms / 1000);
	const m = Math.floor(total / 60);
	const s = total % 60;
	return `${m}:${s.toString().padStart(2, '0')}`;
}

const REPEAT_ICONS: Record<string, [React.ComponentProps<typeof Ionicons>['name'], string]> = {
	none: ['repeat', Colors.text.tertiary],
	all: ['repeat', Colors.text.primary],
	one: ['repeat-sharp', Colors.text.primary],
};

export default function PlayerScreen() {
	const {
		currentTrack,
		isPlaying,
		position,
		duration,
		queue,
		queueIndex,
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

	const handleClose = useCallback(() => {
		router.back();
	}, []);

	const handleToggle = useCallback(() => {
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
		togglePlayPause();
	}, [togglePlayPause]);

	const handleSkipNext = useCallback(() => {
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
		skipNext();
	}, [skipNext]);

	const handleSkipPrev = useCallback(() => {
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
		skipPrev();
	}, [skipPrev]);

	const handleShuffle = useCallback(() => {
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
		toggleShuffle();
	}, [toggleShuffle]);

	const handleRepeat = useCallback(() => {
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
		cycleRepeat();
	}, [cycleRepeat]);

	const handleFavorite = useCallback(() => {
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
		setIsFavorited((prev) => !prev);
	}, []);

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
			<View style={[styles.bg, styles.center]}>
				<Text style={{ color: Colors.text.secondary }}>Nothing playing</Text>
			</View>
		);
	}

	return (
		<View style={styles.bg}>
			<StatusBar barStyle="light-content" />

			{currentTrack.artwork && (
				<>
					<Image
						source={{ uri: currentTrack.artwork }}
						style={styles.bgArt}
						contentFit="cover"
						blurRadius={40}
					/>
					<LinearGradient
						colors={['rgba(0,0,0,0.6)', 'rgba(0,0,0,0.9)', Colors.background.primary]}
						style={StyleSheet.absoluteFill}
					/>
				</>
			)}

			{!currentTrack.artwork && (
				<LinearGradient
					colors={[Colors.background.secondary, Colors.background.primary]}
					style={StyleSheet.absoluteFill}
				/>
			)}

			<SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
				<View style={styles.topBar}>
					<Pressable onPress={handleClose} hitSlop={12} style={styles.backBtn}>
						<Ionicons name="chevron-down" size={28} color={Colors.text.primary} />
					</Pressable>
					<View style={styles.headerCenter}>
						<Text style={styles.headerLabel}>Now Playing</Text>
					</View>
					<Pressable
						onPress={() => setShowQueue((prev) => !prev)}
						hitSlop={12}
						style={styles.moreBtn}>
						<Ionicons
							name={showQueue ? 'musical-notes' : 'list'}
							size={22}
							color={showQueue ? Colors.text.primary : Colors.text.secondary}
						/>
					</Pressable>
				</View>

				{!showQueue ? (
					<ScrollView
						style={{ flex: 1 }}
						contentContainerStyle={styles.scrollContent}
						showsVerticalScrollIndicator={false}
						bounces={false}>

						{/* Artwork */}
						<View style={styles.artContainer}>
							<View
								style={[
									styles.artShadow,
									isPlaying && styles.artShadowActive,
								]}>
								<View style={styles.artFrame}>
									{currentTrack.artwork ? (
										<Image
											source={{ uri: currentTrack.artwork }}
											style={styles.art}
											contentFit="cover"
											transition={400}
										/>
									) : (
										<View style={styles.artPlaceholder}>
											<Ionicons name="musical-note" size={80} color={Colors.text.tertiary} />
										</View>
									)}
								</View>
							</View>
						</View>

						{/* Track Info + Favorite */}
						<View style={styles.trackInfo}>
							<View style={{ flex: 1 }}>
								<Text style={styles.trackTitle} numberOfLines={1}>
									{currentTrack.title}
								</Text>
								<Text style={styles.trackArtist} numberOfLines={1}>
									{currentTrack.artist}
									{currentTrack.album ? ` · ${currentTrack.album}` : ''}
								</Text>
							</View>
							<Pressable onPress={handleFavorite} hitSlop={10} style={styles.favoriteBtn}>
								<Ionicons
									name={isFavorited ? 'heart' : 'heart-outline'}
									size={26}
									color={isFavorited ? '#EF4444' : Colors.text.secondary}
								/>
							</Pressable>
						</View>

						{/* Scrubber */}
						<View style={styles.scrubberWrap}>
							<View
								style={styles.scrubberTrack}
								onLayout={(e) => {
									scrubberWidth.current = e.nativeEvent.layout.width;
								}}
								{...panResponder.panHandlers}>
								<View
									style={[
										styles.scrubberFill,
										{ width: `${displayPos * 100}%` },
									]}
								/>
								<View
									style={[
										styles.scrubberThumb,
										{ left: `${displayPos * 100}%` },
										isScrubbing && styles.scrubberThumbActive,
									]}
								/>
							</View>
							<View style={styles.timeRow}>
								<Text style={styles.timeText}>{formatMs(isScrubbing ? scrubValue * duration : position)}</Text>
								<Text style={styles.timeText}>
									-{formatMs(duration - (isScrubbing ? scrubValue * duration : position))}
								</Text>
							</View>
						</View>

						{/* Main Controls */}
						<View style={styles.controls}>
							<Pressable onPress={handleShuffle} hitSlop={12} style={styles.sideCtrl}>
								<Ionicons
									name="shuffle"
									size={24}
									color={isShuffled ? Colors.text.primary : Colors.text.tertiary}
								/>
							</Pressable>

							<Pressable onPress={handleSkipPrev} hitSlop={12} style={styles.skipBtn}>
								<Ionicons name="play-skip-back-sharp" size={34} color={Colors.text.primary} />
							</Pressable>

							<Pressable onPress={handleToggle} style={styles.playBtn}>
								<Ionicons
									name={isPlaying ? 'pause' : 'play'}
									size={34}
									color={Colors.black}
								/>
							</Pressable>

							<Pressable onPress={handleSkipNext} hitSlop={12} style={styles.skipBtn}>
								<Ionicons name="play-skip-forward-sharp" size={34} color={Colors.text.primary} />
							</Pressable>

							<Pressable onPress={handleRepeat} hitSlop={12} style={styles.sideCtrl}>
								<Ionicons name={repeatIcon} size={24} color={repeatColor} />
								{repeatMode === 'one' && (
									<View style={styles.repeatOneDot} />
								)}
							</Pressable>
						</View>

						{/* Audio Output */}
						<View style={styles.audioOutput}>
							<Ionicons name="phone-portrait-outline" size={16} color={Colors.text.tertiary} />
							<Text style={styles.audioOutputText}>
								{Platform.OS === 'ios' ? 'iPhone' : 'Speaker'}
							</Text>
						</View>

						{/* Up Next peek */}
						{nextTrack && (
							<Pressable style={styles.upNextCard} onPress={() => setShowQueue(true)}>
								<View style={styles.upNextHeader}>
									<Text style={styles.upNextLabel}>Up Next</Text>
									<Ionicons name="chevron-forward" size={16} color={Colors.text.tertiary} />
								</View>
								{upcomingTracks.map((track, i) => (
									<View key={`${track.id}-${i}`} style={styles.upNextRow}>
										<View style={styles.upNextArt}>
											{track.artwork ? (
												<Image
													source={{ uri: track.artwork }}
													style={StyleSheet.absoluteFill}
													contentFit="cover"
												/>
											) : (
												<Ionicons name="musical-note" size={14} color={Colors.text.tertiary} />
											)}
										</View>
										<View style={{ flex: 1, gap: 1 }}>
											<Text style={styles.upNextTitle} numberOfLines={1}>{track.title}</Text>
											<Text style={styles.upNextArtist} numberOfLines={1}>{track.artist}</Text>
										</View>
										<Text style={styles.upNextDuration}>{formatMs(track.durationMs ?? 0)}</Text>
									</View>
								))}
							</Pressable>
						)}

						<View style={{ height: 32 }} />
					</ScrollView>
				) : (
					/* Queue View */
					<View style={styles.queueContainer}>
						<View style={styles.queueHeader}>
							<Text style={styles.queueTitle}>Queue</Text>
							<View style={styles.queueActions}>
								<Pressable
									onPress={clearQueue}
									style={styles.queueActionBtn}>
									<Text style={styles.queueActionText}>Clear</Text>
								</Pressable>
							</View>
						</View>

						<Text style={styles.queueSectionLabel}>Now Playing</Text>
						<View style={styles.queueNowPlaying}>
							<View style={styles.queueNowArt}>
								{currentTrack.artwork ? (
									<Image
										source={{ uri: currentTrack.artwork }}
										style={StyleSheet.absoluteFill}
										contentFit="cover"
									/>
								) : (
									<Ionicons name="musical-note" size={18} color={Colors.text.tertiary} />
								)}
							</View>
							<View style={{ flex: 1, gap: 2 }}>
								<Text style={styles.queueNowTitle} numberOfLines={1}>{currentTrack.title}</Text>
								<Text style={styles.queueNowArtist} numberOfLines={1}>{currentTrack.artist}</Text>
							</View>
							<Ionicons name="play" size={16} color={Colors.text.primary} />
						</View>

						{upcomingTracks.length > 0 && (
							<>
								<Text style={styles.queueSectionLabel}>Up Next</Text>
								<FlatList
									data={upcomingTracks}
									keyExtractor={(item, i) => `${item.id}-${i}`}
									renderItem={({ item, index }) => (
										<View style={styles.queueRow}>
											<View style={styles.queueArt}>
												{item.artwork ? (
													<Image
														source={{ uri: item.artwork }}
														style={StyleSheet.absoluteFill}
														contentFit="cover"
													/>
												) : (
													<Ionicons name="musical-note" size={16} color={Colors.text.tertiary} />
												)}
											</View>
											<View style={{ flex: 1, gap: 2 }}>
												<Text style={styles.queueTrackTitle} numberOfLines={1}>{item.title}</Text>
												<Text style={styles.queueTrackArtist} numberOfLines={1}>{item.artist}</Text>
											</View>
											<Pressable
												onPress={() => removeFromQueue(queueIndex + 1 + index)}
												hitSlop={8}
												style={styles.queueRemoveBtn}>
												<Ionicons name="close" size={16} color={Colors.text.tertiary} />
											</Pressable>
										</View>
									)}
									ListFooterComponent={
										queue.length > queueIndex + 6 ? (
											<Text style={styles.queueMoreText}>
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

const styles = StyleSheet.create({
	bg: {
		flex: 1,
		backgroundColor: Colors.background.primary,
	},
	center: {
		alignItems: 'center',
		justifyContent: 'center',
	},
	safe: { flex: 1 },
	bgArt: {
		...StyleSheet.absoluteFillObject,
		opacity: 0.5,
	},
	scrollContent: {
		paddingHorizontal: 28,
		paddingBottom: 24,
	},

	topBar: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: 20,
		paddingVertical: 12,
	},
	backBtn: { padding: 8 },
	moreBtn: { padding: 8 },
	headerCenter: {
		flex: 1,
		alignItems: 'center',
	},
	headerLabel: {
		color: Colors.text.secondary,
		fontSize: 12,
		fontWeight: '600',
		letterSpacing: 0.5,
		textTransform: 'uppercase',
	},

	artContainer: {
		alignItems: 'center',
		marginTop: 12,
		marginBottom: 36,
	},
	artShadow: {
		borderRadius: 28,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 20 },
		shadowOpacity: 0.7,
		shadowRadius: 40,
		elevation: 30,
	},
	artShadowActive: {
		shadowColor: Colors.text.primary,
		shadowOpacity: 0.3,
	},
	artFrame: {
		width: ART_SIZE,
		height: ART_SIZE,
		borderRadius: 16,
		overflow: 'hidden',
		backgroundColor: Colors.background.card,
	},
	art: {
		width: '100%',
		height: '100%',
	},
	artPlaceholder: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: Colors.background.elevated,
	},

	trackInfo: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 28,
		gap: 12,
	},
	trackTitle: {
		color: Colors.text.primary,
		fontSize: 26,
		fontWeight: '800',
		letterSpacing: -0.8,
		lineHeight: 32,
	},
	trackArtist: {
		color: Colors.text.secondary,
		fontSize: 16,
		marginTop: 4,
		letterSpacing: -0.2,
	},
	favoriteBtn: { padding: 4 },

	scrubberWrap: {
		marginBottom: 32,
	},
	scrubberTrack: {
		height: 3,
		backgroundColor: 'rgba(255,255,255,0.1)',
		borderRadius: 2,
		marginBottom: 10,
		position: 'relative',
	},
	scrubberFill: {
		height: 3,
		backgroundColor: Colors.text.primary,
		borderRadius: 2,
	},
	scrubberThumb: {
		position: 'absolute',
		top: -5,
		width: 13,
		height: 13,
		borderRadius: 6.5,
		backgroundColor: Colors.text.primary,
		marginLeft: -6.5,
	},
	scrubberThumbActive: {
		transform: [{ scale: 1.5 }],
	},
	timeRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
	},
	timeText: {
		color: Colors.text.tertiary,
		fontSize: 11,
		fontWeight: '500',
	},

	controls: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		marginBottom: 36,
		paddingHorizontal: 4,
	},
	sideCtrl: {
		width: 44,
		alignItems: 'center',
		justifyContent: 'center',
	},
	skipBtn: {
		padding: 8,
	},
	playBtn: {
		width: 76,
		height: 76,
		borderRadius: 38,
		backgroundColor: Colors.text.primary,
		alignItems: 'center',
		justifyContent: 'center',
		shadowColor: '#fff',
		shadowOffset: { width: 0, height: 0 },
		shadowOpacity: 0.15,
		shadowRadius: 20,
		elevation: 8,
	},
	repeatOneDot: {
		position: 'absolute',
		bottom: -2,
		alignSelf: 'center',
		width: 4,
		height: 4,
		borderRadius: 2,
		backgroundColor: Colors.text.primary,
	},

	audioOutput: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: 6,
		marginBottom: 28,
	},
	audioOutputText: {
		color: Colors.text.tertiary,
		fontSize: 12,
		fontWeight: '500',
	},

	upNextCard: {
		backgroundColor: 'rgba(28,28,30,0.6)',
		borderRadius: 14,
		padding: 16,
		gap: 10,
		borderWidth: StyleSheet.hairlineWidth,
		borderColor: Colors.border.subtle,
	},
	upNextHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
	},
	upNextLabel: {
		color: Colors.text.tertiary,
		fontSize: 11,
		fontWeight: '700',
		letterSpacing: 0.6,
		textTransform: 'uppercase',
	},
	upNextRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 12,
	},
	upNextArt: {
		width: 40,
		height: 40,
		borderRadius: 8,
		overflow: 'hidden',
		backgroundColor: Colors.background.elevated,
		alignItems: 'center',
		justifyContent: 'center',
	},
	upNextTitle: {
		color: Colors.text.primary,
		fontSize: 14,
		fontWeight: '600',
		letterSpacing: -0.2,
	},
	upNextArtist: {
		color: Colors.text.secondary,
		fontSize: 12,
	},
	upNextDuration: {
		color: Colors.text.tertiary,
		fontSize: 12,
		fontWeight: '500',
	},

	/* Queue View */
	queueContainer: {
		flex: 1,
		paddingHorizontal: 20,
	},
	queueHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		marginBottom: 20,
	},
	queueTitle: {
		color: Colors.text.primary,
		fontSize: 22,
		fontWeight: '800',
		letterSpacing: -0.5,
	},
	queueActions: {
		flexDirection: 'row',
		gap: 12,
	},
	queueActionBtn: {
		paddingHorizontal: 12,
		paddingVertical: 6,
		borderRadius: 8,
		backgroundColor: Colors.background.card,
	},
	queueActionText: {
		color: Colors.text.secondary,
		fontSize: 13,
		fontWeight: '600',
	},
	queueSectionLabel: {
		color: Colors.text.tertiary,
		fontSize: 11,
		fontWeight: '700',
		letterSpacing: 0.6,
		textTransform: 'uppercase',
		marginBottom: 10,
		marginTop: 8,
	},
	queueNowPlaying: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 12,
		padding: 12,
		borderRadius: 12,
		backgroundColor: 'rgba(255,255,255,0.06)',
		marginBottom: 16,
	},
	queueNowArt: {
		width: 44,
		height: 44,
		borderRadius: 8,
		overflow: 'hidden',
		backgroundColor: Colors.background.elevated,
		alignItems: 'center',
		justifyContent: 'center',
	},
	queueNowTitle: {
		color: Colors.text.primary,
		fontSize: 15,
		fontWeight: '600',
	},
	queueNowArtist: {
		color: Colors.text.secondary,
		fontSize: 13,
	},
	queueRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 12,
		paddingVertical: 10,
		paddingHorizontal: 4,
	},
	queueArt: {
		width: 40,
		height: 40,
		borderRadius: 8,
		overflow: 'hidden',
		backgroundColor: Colors.background.elevated,
		alignItems: 'center',
		justifyContent: 'center',
	},
	queueTrackTitle: {
		color: Colors.text.primary,
		fontSize: 14,
		fontWeight: '500',
	},
	queueTrackArtist: {
		color: Colors.text.secondary,
		fontSize: 12,
	},
	queueRemoveBtn: {
		padding: 4,
	},
	queueMoreText: {
		color: Colors.text.tertiary,
		fontSize: 13,
		textAlign: 'center',
		paddingVertical: 12,
	},
});

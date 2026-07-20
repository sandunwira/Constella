/**
 * Home Screen — Featured picks, recently played, and recommendations
 */

import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useCallback, useEffect, useState } from 'react';
import {
	Dimensions,
	FlatList,
	Pressable,
	RefreshControl,
	ScrollView,
	StyleSheet,
	Text,
	View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AlbumCard } from '@/components/album-card';
import { FeaturedCard } from '@/components/featured-card';
import { NowPlayingBar } from '@/components/mini-player';
import { SectionHeader } from '@/components/ui/section-header';

import { Colors } from '@/constants/colors';
import { useAudio, type Track } from '@/contexts/audio-context';
import { useJellyfin } from '@/contexts/jellyfin-context';
import { jellyfinClient } from '@/lib/jellyfin/client';
import type { JellyfinItem } from '@/lib/jellyfin/types';

const { width: SCREEN_W } = Dimensions.get('window');
const FEATURED_CARD_W = SCREEN_W - 56;

function getGreeting(): string {
	const h = new Date().getHours();
	if (h < 12) return 'Good morning';
	if (h < 18) return 'Good afternoon';
	return 'Good evening';
}

function jellyfinToTrack(item: JellyfinItem, serverUrl: string, token: string): Track {
	return {
		id: item.Id,
		title: item.Name,
		artist: item.Artists?.[0] ?? item.AlbumArtist ?? 'Unknown Artist',
		album: item.Album,
		uri: jellyfinClient.getStreamUrl(item.Id),
		artwork: item.ImageTags?.Primary
			? jellyfinClient.getImageUrl(item.Id)
			: undefined,
		durationMs: item.RunTimeTicks ? item.RunTimeTicks / 10000 : undefined,
		serverId: item.ServerId,
	};
}

export default function HomeScreen() {
	const { isConnected, server, activeLibraryId } = useJellyfin();
	const { playTrack, currentTrack } = useAudio();

	const [recentAlbums, setRecentAlbums] = useState<JellyfinItem[]>([]);
	const [recentTracks, setRecentTracks] = useState<JellyfinItem[]>([]);
	const [refreshing, setRefreshing] = useState(false);

	const loadData = useCallback(async () => {
		if (!isConnected || !activeLibraryId) return;
		try {
			const [albums, tracks] = await Promise.all([
				jellyfinClient.getRecentlyAdded(activeLibraryId, 20),
				jellyfinClient.getRecentlyPlayed(15),
			]);
			setRecentAlbums(albums);
			setRecentTracks(tracks);
		} catch (err) {
			console.warn('[Home] Failed to load data:', err);
		}
	}, [isConnected, activeLibraryId]);

	useEffect(() => { loadData(); }, [loadData]);

	const onRefresh = useCallback(async () => {
		setRefreshing(true);
		await loadData();
		setRefreshing(false);
	}, [loadData]);

	const handlePlayTrack = useCallback((item: JellyfinItem) => {
		if (!server) return;
		const track = jellyfinToTrack(item, server.url, server.accessToken);
		playTrack(track);
	}, [server, playTrack]);

	return (
		<View style={styles.bg}>

			<SafeAreaView style={styles.safe} edges={['top']}>
				<ScrollView
					showsVerticalScrollIndicator={false}
					contentContainerStyle={styles.scroll}
					refreshControl={
						<RefreshControl
							refreshing={refreshing}
							onRefresh={onRefresh}
							tintColor={Colors.text.primary}
						/>
					}>

					{/* ── Header ────────────────────────────────────────────── */}
					<View style={styles.header}>
						<View>
							<Text style={styles.greeting}>{getGreeting()}</Text>
							<Text style={styles.username}>
								{server?.username ?? 'Constella'}
							</Text>
						</View>
					</View>

					{/* ── Not connected banner ───────────────────────────────── */}
					{!isConnected && (
						<View style={styles.banner}>
							<Text style={styles.bannerText}>
								Connect a Jellyfin server in Settings to start listening.
							</Text>
						</View>
					)}

					{/* ── Featured Picks ─────────────────────────────────────── */}
					<View style={styles.section}>
						<SectionHeader title="Featured Picks" />
						<FlatList
							horizontal
							showsHorizontalScrollIndicator={false}
							data={FEATURED_CARDS}
							keyExtractor={(item) => item.id}
							contentContainerStyle={styles.hPad}
							renderItem={({ item }) => (
								<FeaturedCard
									label={item.label}
									title={item.title}
									subtitle={item.subtitle}
									width={FEATURED_CARD_W}
								/>
							)}
							snapToInterval={FEATURED_CARD_W + 16}
							decelerationRate="fast"
						/>
					</View>

					{/* ── Recently Added Albums ──────────────────────────────── */}
					{recentAlbums.length > 0 && (
						<View style={styles.section}>
							<SectionHeader title="Recently Added" />
							<FlatList
								horizontal
								showsHorizontalScrollIndicator={false}
								data={recentAlbums}
								keyExtractor={(item) => item.Id}
								contentContainerStyle={styles.hPad}
								renderItem={({ item }) => (
									<AlbumCard
										id={item.Id}
										title={item.Name}
										artist={item.AlbumArtist ?? item.Artists?.[0]}
										artwork={
											item.ImageTags?.Primary
												? jellyfinClient.getImageUrl(item.Id)
												: undefined
										}
										year={item.ProductionYear}
										size={160}
									/>
								)}
							/>
						</View>
					)}

					{/* ── Listen Again ────────────────────────────────────────── */}
					{recentTracks.length > 0 && (
						<View style={styles.section}>
							<SectionHeader title="Listen Again" subtitle="Recently played tracks" />
							<FlatList
								horizontal
								showsHorizontalScrollIndicator={false}
								data={recentTracks.slice(0, 10)}
								keyExtractor={(item) => item.Id}
								contentContainerStyle={styles.laPad}
								snapToInterval={292}
								decelerationRate="fast"
								renderItem={({ item }) => {
									const isActive = currentTrack?.id === item.Id;
									return (
										<Pressable
											onPress={() => handlePlayTrack(item)}
											className="flex-row items-center gap-4 rounded-[20px] bg-card border border-border w-[280px]"
											style={({ pressed }) => ({
												padding: 16,
												...(pressed && {
													backgroundColor: Colors.background.elevated,
													borderColor: Colors.border.light,
												}),
												...(isActive && {
													borderColor: Colors.text.primary,
												}),
											})}>
											<View className="w-[72px] h-[72px] rounded-[14px] overflow-hidden bg-ink-700">
												{item.ImageTags?.Primary ? (
													<Image
														source={{ uri: jellyfinClient.getImageUrl(item.Id) }}
														style={{ width: 72, height: 72, borderRadius: 14 }}
														contentFit="cover"
														transition={200}
													/>
												) : (
													<View className="w-full h-full items-center justify-center">
														<Ionicons name="musical-note" size={24} color={Colors.text.tertiary} />
													</View>
												)}
											</View>
											<View className="flex-1 gap-1 justify-center">
												<Text
													className="text-white text-[15px] font-semibold"
													numberOfLines={2}
													style={{ letterSpacing: -0.3, lineHeight: 20 }}>
													{item.Name}
												</Text>
												<Text className="text-muted text-xs" numberOfLines={1}>
													{item.Artists?.[0] ?? item.AlbumArtist ?? 'Unknown'}
												</Text>
											</View>
										</Pressable>
									);
								}}
							/>
						</View>
					)}

					{/* Bottom padding for NowPlayingBar + TabBar */}
					<View style={{ height: 170 }} />
				</ScrollView>

				<NowPlayingBar />
			</SafeAreaView>
		</View>
	);
}

// ── Static featured cards data ─────────────────────────────────────────────

const FEATURED_CARDS = [
	{
		id: 'a',
		label: 'Made for You',
		title: 'Your Mix',
		subtitle: 'Curated from your Jellyfin library',
	},
	{
		id: 'b',
		label: 'Listen Again',
		title: 'Revisit Favorites',
		subtitle: 'Tracks you keep coming back to',
	},
];

const styles = StyleSheet.create({
	bg: { flex: 1, backgroundColor: Colors.background.primary },
	safe: { flex: 1 },
	scroll: { paddingTop: 12 },
	header: {
		paddingHorizontal: 20,
		paddingBottom: 24,
		paddingTop: 4,
	},
	greeting: {
		color: Colors.text.secondary,
		fontSize: 13,
		fontWeight: '500',
		letterSpacing: 0.3,
		textTransform: 'uppercase',
	},
	username: {
		color: Colors.text.primary,
		fontSize: 30,
		fontWeight: '800',
		letterSpacing: -1,
		marginTop: 4,
	},
	section: {
		marginBottom: 36,
	},
	hPad: {
		paddingHorizontal: 16,
		gap: 14,
	},
	banner: {
		marginHorizontal: 20,
		marginBottom: 24,
		padding: 18,
		borderRadius: 14,
		backgroundColor: Colors.background.card,
		borderWidth: 1,
		borderColor: Colors.border.subtle,
	},
	bannerText: {
		color: Colors.text.secondary,
		fontSize: 14,
		lineHeight: 20,
	},

	laPad: {
		paddingHorizontal: 16,
		gap: 12,
	},
});

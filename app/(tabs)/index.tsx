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
	Text,
	View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AlbumCard } from '@/components/album-card';
import { FeaturedCard } from '@/components/featured-card';
import { NowPlayingBar } from '@/components/mini-player';
import { SectionHeader } from '@/components/ui/section-header';

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
		const trackList = recentTracks.map((t) => jellyfinToTrack(t, server.url, server.accessToken));
		playTrack(track, trackList, 'Recently Played');
	}, [server, playTrack, recentTracks]);

	return (
		<View className="flex-1 bg-canvas">
			<SafeAreaView className="flex-1" edges={['top']}>
				<ScrollView
					showsVerticalScrollIndicator={false}
					contentContainerStyle={{ paddingTop: 12 }}
					refreshControl={
						<RefreshControl
							refreshing={refreshing}
							onRefresh={onRefresh}
							tintColor="#FFFFFF"
						/>
					}>

					{/* ── Header ────────────────────────────────────────────── */}
					<View className="px-5 pb-6 pt-1">
						<View>
							<Text className="text-ink-muted text-caption font-medium uppercase">
								{getGreeting()}
							</Text>
							<Text className="text-ink text-display-md font-medium mt-1">
								{server?.username ?? 'Constella'}
							</Text>
						</View>
					</View>

					{/* ── Not connected banner ───────────────────────────────── */}
					{!isConnected && (
						<View className="mx-5 mb-6 p-[18px] rounded-lg bg-surface-1 border border-hairline/50">
							<Text className="text-ink-muted text-body-sm leading-5">
								Connect a Jellyfin server in Settings to start listening.
							</Text>
						</View>
					)}

					{/* ── Featured Picks ─────────────────────────────────────── */}
					<View className="mb-9">
						<SectionHeader title="Featured Picks" />
						<FlatList
							horizontal
							showsHorizontalScrollIndicator={false}
							data={FEATURED_CARDS}
							keyExtractor={(item) => item.id}
							contentContainerStyle={{ paddingHorizontal: 16, gap: 14 }}
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
						<View className="mb-9">
							<SectionHeader title="Recently Added" />
							<FlatList
								horizontal
								showsHorizontalScrollIndicator={false}
								data={recentAlbums}
								keyExtractor={(item) => item.Id}
								contentContainerStyle={{ paddingHorizontal: 16, gap: 14 }}
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
						<View className="mb-9">
							<SectionHeader title="Listen Again" subtitle="Recently played tracks" />
							<FlatList
								horizontal
								showsHorizontalScrollIndicator={false}
								data={recentTracks.slice(0, 10)}
								keyExtractor={(item) => item.Id}
								contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
								snapToInterval={292}
								decelerationRate="fast"
								renderItem={({ item }) => {
									const isActive = currentTrack?.id === item.Id;
									return (
										<Pressable
											onPress={() => handlePlayTrack(item)}
											className="flex-row items-center gap-4 rounded-xl bg-surface-1 w-[280px] p-4 overflow-hidden"
											style={({ pressed }) => ({
												backgroundColor: pressed ? '#2C2C2E' : '#1A1A1C',
												...(isActive && { borderWidth: 1, borderColor: '#FFFFFF' }),
											})}>
											<View className="w-[72px] h-[72px] rounded-[12px] overflow-hidden bg-surface-2">
												{item.ImageTags?.Primary ? (
													<Image
														source={{ uri: jellyfinClient.getImageUrl(item.Id) }}
														style={{ width: 72, height: 72 }}
														contentFit="cover"
														transition={200}
													/>
												) : (
													<View className="w-full h-full items-center justify-center">
														<Ionicons name="musical-note" size={24} color="#999999" />
													</View>
												)}
											</View>
											<View className="flex-1 gap-1 justify-center">
												<Text
													className="text-ink text-body font-medium"
													numberOfLines={2}>
													{item.Name}
												</Text>
												<Text className="text-ink-muted text-xs" numberOfLines={1}>
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
					<View className="h-[170px]" />
				</ScrollView>

				<NowPlayingBar />
			</SafeAreaView>
		</View>
	);
}

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

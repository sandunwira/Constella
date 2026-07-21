/**
 * Collections Screen — Browse Jellyfin libraries: artists, albums, tracks, playlists
 */

import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import {
	ActivityIndicator,
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
import { ArtistCard } from '@/components/artist-card';
import { LibraryCard } from '@/components/library-card';
import { NowPlayingBar } from '@/components/mini-player';
import { SearchBar } from '@/components/search-bar';
import { TrackItem } from '@/components/track-item';

import { useAudio } from '@/contexts/audio-context';
import { useJellyfin } from '@/contexts/jellyfin-context';
import { jellyfinClient } from '@/lib/jellyfin/client';
import type { JellyfinItem } from '@/lib/jellyfin/types';

type BrowseTab = 'Libraries' | 'Artists' | 'Albums' | 'Tracks' | 'Playlists';

const ALBUM_CARD_W = (Dimensions.get('window').width - 48) / 2;

export default function CollectionsScreen() {
	const { isConnected, libraries, activeLibraryId, setActiveLibrary } = useJellyfin();
	const { playTrack, currentTrack } = useAudio();

	const activeLibraryName = libraries.find((l) => l.Id === activeLibraryId)?.Name ?? 'Library';

	const [activeTab, setActiveTab] = useState<BrowseTab>('Libraries');
	const [searchText, setSearchText] = useState('');
	const [items, setItems] = useState<JellyfinItem[]>([]);
	const [loading, setLoading] = useState(false);
	const [refreshing, setRefreshing] = useState(false);
	const [page, setPage] = useState(0);
	const [hasMore, setHasMore] = useState(true);

	const PAGE_SIZE = 40;

	const loadItems = useCallback(async (tab: BrowseTab, reset = true) => {
		if (!isConnected) return;
		const startIndex = reset ? 0 : page * PAGE_SIZE;
		setLoading(true);
		try {
			let result: JellyfinItem[] = [];

			if (tab === 'Libraries') {
				setItems([]);
				setLoading(false);
				return;
			}

			if (!activeLibraryId) { setLoading(false); return; }

			if (tab === 'Artists') {
				const res = await jellyfinClient.getArtists(activeLibraryId, { limit: PAGE_SIZE, startIndex });
				result = res.Items;
				setHasMore(result.length === PAGE_SIZE);
			} else if (tab === 'Albums') {
				const res = await jellyfinClient.getAlbums(activeLibraryId, { limit: PAGE_SIZE, startIndex });
				result = res.Items;
				setHasMore(result.length === PAGE_SIZE);
			} else if (tab === 'Tracks') {
				const res = await jellyfinClient.getLibraryTracks(activeLibraryId, { limit: PAGE_SIZE, startIndex });
				result = res.Items;
				setHasMore(result.length === PAGE_SIZE);
			} else if (tab === 'Playlists') {
				const res = await jellyfinClient.getPlaylists();
				result = res.Items;
				setHasMore(false);
			}

			if (reset) {
				setItems(result);
				setPage(1);
			} else {
				setItems((prev) => {
					const existing = new Set(prev.map((i) => i.Id));
					return [...prev, ...result.filter((i) => !existing.has(i.Id))];
				});
				setPage((p) => p + 1);
			}
		} catch (err) {
			console.warn('[Collections] Load error:', err);
		} finally {
			setLoading(false);
		}
	}, [isConnected, activeLibraryId, page]);

	useEffect(() => {
		setPage(0);
		loadItems(activeTab, true);
	}, [activeTab, activeLibraryId]);

	const onRefresh = useCallback(async () => {
		setRefreshing(true);
		await loadItems(activeTab, true);
		setRefreshing(false);
	}, [activeTab, loadItems]);

	useEffect(() => {
		if (!searchText.trim() || !isConnected) return;
		const timer = setTimeout(async () => {
			setLoading(true);
			try {
				const res = await jellyfinClient.search(searchText);
				setItems(res.Items);
			} catch (err) { console.warn(err); }
			finally { setLoading(false); }
		}, 400);
		return () => clearTimeout(timer);
	}, [searchText, isConnected]);

	const renderLibraries = () => {
		const musicLibraries = libraries.filter(
			(lib) => lib.CollectionType?.toLowerCase() === 'music' || lib.Type?.toLowerCase().includes('music')
		);

		return (
			<View className="gap-2.5">
				{musicLibraries.map((lib) => (
					<LibraryCard
						key={lib.Id}
						id={lib.Id}
						name={lib.Name}
						type={lib.CollectionType ?? lib.Type}
						onPress={() => {
							setActiveLibrary(lib.Id);
							setActiveTab('Tracks');
						}}
					/>
				))}
				{musicLibraries.length === 0 && (
					<View className="flex-1 items-center justify-center gap-4 px-8">
						<Text className="text-ink text-headline font-medium">No music libraries found</Text>
						<Text className="text-ink-muted text-body-sm text-center leading-5">Add a music library in your Jellyfin server.</Text>
					</View>
				)}
			</View>
		);
	};

	const renderArtistItem = ({ item }: { item: JellyfinItem }) => (
		<ArtistCard
			id={item.Id}
			name={item.Name}
			artwork={
				item.ImageTags?.Primary
					? jellyfinClient.getImageUrl(item.Id, 'Primary', 200)
					: undefined
			}
		/>
	);

	const renderAlbumItem = ({ item }: { item: JellyfinItem }) => (
		<View className="flex-1" style={{ width: ALBUM_CARD_W }}>
			<AlbumCard
				id={item.Id}
				title={item.Name}
				artist={item.AlbumArtist ?? item.Artists?.[0]}
				artwork={
					item.ImageTags?.Primary
						? jellyfinClient.getImageUrl(item.Id, 'Primary', 300)
						: undefined
				}
				year={item.ProductionYear}
				size={ALBUM_CARD_W}
			/>
		</View>
	);

	const renderTrackItem = ({ item, index }: { item: JellyfinItem; index: number }) => (
		<TrackItem
			track={{
				id: item.Id,
				title: item.Name,
				artist: item.Artists?.[0] ?? item.AlbumArtist ?? 'Unknown',
				album: item.Album,
				uri: jellyfinClient.getStreamUrl(item.Id),
				artwork: item.ImageTags?.Primary
					? jellyfinClient.getImageUrl(item.Id)
					: undefined,
				durationMs: item.RunTimeTicks ? item.RunTimeTicks / 10000 : undefined,
			}}
			index={index}
			isActive={currentTrack?.id === item.Id}
			onPress={async () => {
				const track = {
					id: item.Id,
					title: item.Name,
					artist: item.Artists?.[0] ?? item.AlbumArtist ?? 'Unknown',
					album: item.Album,
					uri: jellyfinClient.getStreamUrl(item.Id),
					artwork: item.ImageTags?.Primary
						? jellyfinClient.getImageUrl(item.Id)
						: undefined,
					durationMs: item.RunTimeTicks ? item.RunTimeTicks / 10000 : undefined,
				};

				// Fetch all tracks for full queue
				let trackList: typeof track[];
				if (activeLibraryId) {
					const allItems = await jellyfinClient.getAllLibraryTracks(activeLibraryId);
					trackList = allItems.map((i) => ({
						id: i.Id,
						title: i.Name,
						artist: i.Artists?.[0] ?? i.AlbumArtist ?? 'Unknown',
						album: i.Album,
						uri: jellyfinClient.getStreamUrl(i.Id),
						artwork: i.ImageTags?.Primary
							? jellyfinClient.getImageUrl(i.Id)
							: undefined,
						durationMs: i.RunTimeTicks ? i.RunTimeTicks / 10000 : undefined,
					}));
				} else {
					trackList = items.map((i) => ({
						id: i.Id,
						title: i.Name,
						artist: i.Artists?.[0] ?? i.AlbumArtist ?? 'Unknown',
						album: i.Album,
						uri: jellyfinClient.getStreamUrl(i.Id),
						artwork: i.ImageTags?.Primary
							? jellyfinClient.getImageUrl(i.Id)
							: undefined,
						durationMs: i.RunTimeTicks ? i.RunTimeTicks / 10000 : undefined,
					}));
				}

				playTrack(track, trackList, activeLibraryName);
			}}
		/>
	);

	const renderPlaylistItem = ({ item }: { item: JellyfinItem }) => (
		<AlbumCard
			id={item.Id}
			title={item.Name}
			artwork={
				item.ImageTags?.Primary
					? jellyfinClient.getImageUrl(item.Id)
					: undefined
			}
			size={150}
		/>
	);

	return (
		<View className="flex-1 bg-canvas">
			<SafeAreaView className="flex-1" edges={['top']}>
				{/* ── Header ────────────────────────────────────────────── */}
				<View className="px-5 pt-1 pb-[14px] flex-row items-center gap-3">
					{activeTab !== 'Libraries' && (
						<Pressable onPress={() => setActiveTab('Libraries')} className="p-1">
							<Ionicons name="arrow-back" size={24} color="#FFFFFF" />
						</Pressable>
					)}
					<Text className="text-ink text-display-md font-medium">
						{activeTab === 'Libraries' ? 'Collections' : activeLibraryName}
					</Text>
				</View>

				{/* ── Search ────────────────────────────────────────────── */}
				<View className="px-4 mb-[14px]">
					<SearchBar
						value={searchText}
						onChangeText={setSearchText}
						onClear={() => setSearchText('')}
						placeholder="Artists, albums, songs…"
					/>
				</View>

				{/* ── Content ────────────────────────────────────────────── */}
				{!isConnected ? (
					<View className="flex-1 items-center justify-center gap-4 px-8">
						<Text className="text-[48px]">🔌</Text>
						<Text className="text-ink text-headline font-medium">No server connected</Text>
						<Text className="text-ink-muted text-body-sm text-center leading-5">Go to Settings to connect your Jellyfin server.</Text>
					</View>
				) : loading && items.length === 0 ? (
					<View className="flex-1 items-center justify-center">
						<ActivityIndicator color="#FFFFFF" size="large" />
					</View>
				) : activeTab === 'Libraries' ? (
					<ScrollView
						className="flex-1 p-4"
						refreshControl={
							<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FFFFFF" />
						}>
						{renderLibraries()}
						<View className="h-[180px]" />
					</ScrollView>
				) : activeTab === 'Artists' ? (
					<FlatList
						key={`artists-${activeTab}`}
						data={items}
						keyExtractor={(i) => i.Id}
						horizontal={false}
						numColumns={3}
						columnWrapperStyle={{ gap: 20, marginBottom: 24, paddingHorizontal: 16, justifyContent: 'flex-start' }}
						contentContainerStyle={{ paddingHorizontal: 12, paddingTop: 4 }}
						renderItem={({ item }) => renderArtistItem({ item })}
						onEndReached={() => hasMore && loadItems(activeTab, false)}
						onEndReachedThreshold={0.3}
						refreshControl={
							<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FFFFFF" />
						}
						ListFooterComponent={<View className="h-[180px]" />}
					/>
				) : activeTab === 'Albums' || activeTab === 'Playlists' ? (
					<FlatList
						key={`albums-${activeTab}`}
						data={items}
						keyExtractor={(i) => i.Id}
						numColumns={2}
						columnWrapperStyle={{ gap: 14, marginBottom: 18, paddingHorizontal: 16 }}
						contentContainerStyle={{ paddingHorizontal: 12, paddingTop: 4 }}
						renderItem={activeTab === 'Albums' ? renderAlbumItem : renderPlaylistItem}
						onEndReached={() => hasMore && loadItems(activeTab, false)}
						onEndReachedThreshold={0.3}
						refreshControl={
							<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FFFFFF" />
						}
						ListFooterComponent={<View className="h-[180px]" />}
					/>
				) : (
					<FlatList
						key={`tracks-${activeTab}`}
						data={items}
						keyExtractor={(i, idx) => `${i.Id}-${idx}`}
						renderItem={renderTrackItem}
						contentContainerStyle={{ paddingHorizontal: 12, paddingTop: 4 }}
						onEndReached={() => hasMore && loadItems(activeTab, false)}
						onEndReachedThreshold={0.3}
						refreshControl={
							<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FFFFFF" />
						}
						ListFooterComponent={<View className="h-[180px]" />}
					/>
				)}

				<NowPlayingBar />
			</SafeAreaView>
		</View>
	);
}

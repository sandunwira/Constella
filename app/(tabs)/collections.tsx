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
	StyleSheet,
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

import { Colors } from '@/constants/colors';
import { useAudio } from '@/contexts/audio-context';
import { useJellyfin } from '@/contexts/jellyfin-context';
import { jellyfinClient } from '@/lib/jellyfin/client';
import type { JellyfinItem } from '@/lib/jellyfin/types';

type BrowseTab = 'Libraries' | 'Artists' | 'Albums' | 'Tracks' | 'Playlists';

export default function CollectionsScreen() {
	const { isConnected, libraries, activeLibraryId, setActiveLibrary } = useJellyfin();
	const { playTrack, currentTrack } = useAudio();

	const [activeTab, setActiveTab] = useState<BrowseTab>('Libraries');
	const [searchText, setSearchText] = useState('');
	const [items, setItems] = useState<JellyfinItem[]>([]);
	const [loading, setLoading] = useState(false);
	const [refreshing, setRefreshing] = useState(false);
	const [page, setPage] = useState(0);
	const [hasMore, setHasMore] = useState(true);

	const PAGE_SIZE = 40;

	// ── Load data by tab ─────────────────────────────────────────────────────

	const loadItems = useCallback(async (tab: BrowseTab, reset = true) => {
		if (!isConnected) return;
		const startIndex = reset ? 0 : page * PAGE_SIZE;
		setLoading(true);
		try {
			let result: JellyfinItem[] = [];

			if (tab === 'Libraries') {
				// Library cards are already loaded via context
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

	// ── Search ────────────────────────────────────────────────────────────────

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

	// ── Render helpers ────────────────────────────────────────────────────────

	const renderLibraries = () => {
		const musicLibraries = libraries.filter(
			(lib) => lib.CollectionType?.toLowerCase() === 'music' || lib.Type?.toLowerCase().includes('music')
		);

		return (
			<View style={styles.libraryList}>
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
					<View style={styles.emptyState}>
						<Text style={styles.emptyText}>No music libraries found</Text>
						<Text style={styles.emptyHint}>Add a music library in your Jellyfin server.</Text>
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
		<View style={styles.albumGridItem}>
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
				size={styles.albumGridItem.width as number}
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
			onPress={() => {
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
				playTrack(track, items.map((i) => ({
					id: i.Id,
					title: i.Name,
					artist: i.Artists?.[0] ?? i.AlbumArtist ?? 'Unknown',
					uri: jellyfinClient.getStreamUrl(i.Id),
				})));
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
		<View style={styles.bg}>
			<SafeAreaView style={styles.safe} edges={['top']}>
				{/* ── Header ────────────────────────────────────────────── */}
				<View style={styles.header}>
					{activeTab !== 'Libraries' && (
						<Pressable onPress={() => setActiveTab('Libraries')} style={styles.backButton}>
							<Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
						</Pressable>
					)}
					<Text style={styles.title}>{activeTab === 'Libraries' ? 'Collections' : 'Tracks'}</Text>
				</View>

				{/* ── Search ────────────────────────────────────────────── */}
				<View style={styles.searchWrap}>
					<SearchBar
						value={searchText}
						onChangeText={setSearchText}
						onClear={() => setSearchText('')}
						placeholder="Artists, albums, songs…"
					/>
				</View>

				{/* ── Content ────────────────────────────────────────────── */}
				{!isConnected ? (
					<View style={styles.emptyState}>
						<Text style={styles.emptyIcon}>🔌</Text>
						<Text style={styles.emptyText}>No server connected</Text>
						<Text style={styles.emptyHint}>Go to Settings to connect your Jellyfin server.</Text>
					</View>
				) : loading && items.length === 0 ? (
					<View style={styles.emptyState}>
						<ActivityIndicator color={Colors.text.primary} size="large" />
					</View>
				) : activeTab === 'Libraries' ? (
					<ScrollView
						contentContainerStyle={styles.libraryScroll}
						refreshControl={
							<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.text.primary} />
						}>
						{renderLibraries()}
						<View style={{ height: 180 }} />
					</ScrollView>
				) : activeTab === 'Artists' ? (
					<FlatList
						key={`artists-${activeTab}`}
						data={items}
						keyExtractor={(i) => i.Id}
						horizontal={false}
						numColumns={3}
						columnWrapperStyle={styles.artistRow}
						contentContainerStyle={styles.listContent}
						renderItem={({ item }) => renderArtistItem({ item })}
						onEndReached={() => hasMore && loadItems(activeTab, false)}
						onEndReachedThreshold={0.3}
						refreshControl={
							<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.text.primary} />
						}
						ListFooterComponent={<View style={{ height: 180 }} />}
					/>
				) : activeTab === 'Albums' || activeTab === 'Playlists' ? (
					<FlatList
						key={`albums-${activeTab}`}
						data={items}
						keyExtractor={(i) => i.Id}
						numColumns={2}
						columnWrapperStyle={styles.albumRow}
						contentContainerStyle={styles.listContent}
						renderItem={activeTab === 'Albums' ? renderAlbumItem : renderPlaylistItem}
						onEndReached={() => hasMore && loadItems(activeTab, false)}
						onEndReachedThreshold={0.3}
						refreshControl={
							<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.text.primary} />
						}
						ListFooterComponent={<View style={{ height: 180 }} />}
					/>
				) : (
					<FlatList
						key={`tracks-${activeTab}`}
						data={items}
						keyExtractor={(i, idx) => `${i.Id}-${idx}`}
						renderItem={renderTrackItem}
						contentContainerStyle={styles.listContent}
						onEndReached={() => hasMore && loadItems(activeTab, false)}
						onEndReachedThreshold={0.3}
						refreshControl={
							<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.text.primary} />
						}
						ListFooterComponent={<View style={{ height: 180 }} />}
					/>
				)}

				<NowPlayingBar />
			</SafeAreaView>
		</View>
	);
}

const ALBUM_CARD_W = (Dimensions.get('window').width - 48) / 2;

const styles = StyleSheet.create({
	bg: { flex: 1, backgroundColor: Colors.background.primary },
	safe: { flex: 1 },
	header: {
		paddingHorizontal: 20,
		paddingTop: 4,
		paddingBottom: 14,
		flexDirection: 'row',
		alignItems: 'center',
		gap: 12,
	},
	backButton: {
		padding: 4,
	},
	title: {
		color: Colors.text.primary,
		fontSize: 30,
		fontWeight: '800',
		letterSpacing: -1,
	},
	searchWrap: {
		paddingHorizontal: 16,
		marginBottom: 14,
	},
	listContent: {
		paddingHorizontal: 12,
		paddingTop: 4,
	},
	albumRow: {
		gap: 14,
		marginBottom: 18,
		paddingHorizontal: 16,
	},
	albumGridItem: {
		flex: 1,
		width: ALBUM_CARD_W,
	},
	artistRow: {
		gap: 20,
		marginBottom: 24,
		paddingHorizontal: 16,
		justifyContent: 'flex-start',
	},
	libraryScroll: {
		padding: 16,
	},
	libraryList: {
		gap: 10,
	},
	emptyState: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		gap: 16,
		paddingHorizontal: 32,
	},
	emptyIcon: { fontSize: 48 },
	emptyText: {
		color: Colors.text.primary,
		fontSize: 18,
		fontWeight: '700',
	},
	emptyHint: {
		color: Colors.text.secondary,
		fontSize: 14,
		textAlign: 'center',
		lineHeight: 20,
	},
});

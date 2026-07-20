/**
 * Downloads Screen — Offline media management
 */

import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useState } from 'react';
import {
	FlatList,
	Pressable,
	StyleSheet,
	Text,
	View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { NowPlayingBar } from '@/components/mini-player';
import { Colors } from '@/constants/colors';
import { useAudio } from '@/contexts/audio-context';

// Simulated download record type
type DownloadItem = {
	id: string;
	title: string;
	artist: string;
	artwork?: string;
	status: 'complete' | 'downloading' | 'pending';
	progress?: number;    // 0–1
	fileSizeMB?: number;
};

// For demo/offline usage — real data comes from SQLite downloads table
const MOCK_DOWNLOADS: DownloadItem[] = [];

type FilterTab = 'All' | 'Albums' | 'Tracks';
const FILTER_TABS: FilterTab[] = ['All', 'Albums', 'Tracks'];

export default function DownloadsScreen() {
	const [filter, setFilter] = useState<FilterTab>('All');
	const { playTrack } = useAudio();

	const renderEmpty = () => (
		<View style={styles.emptyState}>
			<View style={styles.emptyIconBg}>
				<Ionicons name="cloud-download-outline" size={40} color={Colors.text.tertiary} />
			</View>
			<Text style={styles.emptyTitle}>No Downloads Yet</Text>
			<Text style={styles.emptyText}>
				Long-press any track or album in Collections to download it for offline listening.
			</Text>

			{/* Tips */}
			<View style={styles.tips}>
				{TIPS.map((tip) => (
					<View key={tip.icon} style={styles.tipRow}>
						<View style={styles.tipIconBg}>
							<Ionicons name={tip.icon as any} size={16} color={Colors.text.tertiary} />
						</View>
						<Text style={styles.tipText}>{tip.text}</Text>
					</View>
				))}
			</View>
		</View>
	);

	const renderDownloadItem = ({ item }: { item: DownloadItem }) => (
		<Pressable style={styles.downloadRow}>
			{/* Artwork */}
			<View style={styles.artwork}>
				{item.artwork ? (
					<Image
						source={{ uri: item.artwork }}
						style={StyleSheet.absoluteFill}
						contentFit="cover"
					/>
				) : (
					<Ionicons name="musical-note" size={20} color={Colors.text.tertiary} />
				)}
				{/* Downloaded badge */}
				{item.status === 'complete' && (
					<View style={styles.badge}>
						<Ionicons name="checkmark" size={10} color="#fff" />
					</View>
				)}
			</View>

			{/* Info */}
			<View style={styles.info}>
				<Text style={styles.itemTitle} numberOfLines={1}>{item.title}</Text>
				<Text style={styles.itemArtist} numberOfLines={1}>{item.artist}</Text>
				{item.status === 'downloading' && item.progress !== undefined && (
					<View style={styles.progressBar}>
						<View style={[styles.progressFill, { width: `${item.progress * 100}%` }]} />
					</View>
				)}
			</View>

			{/* Status */}
			<View>
				{item.status === 'downloading' ? (
					<Text style={styles.progressText}>
						{Math.round((item.progress ?? 0) * 100)}%
					</Text>
				) : item.status === 'complete' ? (
					<Text style={styles.sizeText}>{item.fileSizeMB?.toFixed(1)} MB</Text>
				) : (
					<Ionicons name="time-outline" size={18} color={Colors.text.tertiary} />
				)}
			</View>

			<Pressable hitSlop={10} style={styles.moreBtn}>
				<Ionicons name="ellipsis-horizontal" size={18} color={Colors.text.tertiary} />
			</Pressable>
		</Pressable>
	);

	return (
		<View style={styles.bg}>
			<SafeAreaView style={styles.safe} edges={['top']}>
				{/* ── Header ────────────────────────────────────────────── */}
				<View style={styles.header}>
					<Text style={styles.title}>Downloads</Text>
					<Pressable style={styles.storageBtn}>
						<Ionicons name="folder-outline" size={18} color={Colors.text.tertiary} />
						<Text style={styles.storageText}>0 MB used</Text>
					</Pressable>
				</View>

				{/* ── Filter Tabs ────────────────────────────────────────── */}
				<View style={styles.tabsRow}>
					{FILTER_TABS.map((tab) => (
						<Pressable
							key={tab}
							onPress={() => setFilter(tab)}
							style={[styles.tabPill, filter === tab && styles.tabPillActive]}>
							<Text style={[styles.tabText, filter === tab && styles.tabTextActive]}>
								{tab}
							</Text>
						</Pressable>
					))}
				</View>

				{/* ── Auto-Cache Banner ──────────────────────────────────── */}
				<View style={styles.autoCacheBanner}>
					<View style={styles.autoCacheLeft}>
						<Ionicons name="sparkles" size={18} color={Colors.text.tertiary} />
						<View>
							<Text style={styles.autoCacheTitle}>Smart Cache</Text>
							<Text style={styles.autoCacheDesc}>Auto-download recently played</Text>
						</View>
					</View>
					{/* Toggle placeholder */}
					<View style={styles.autoCacheToggle} />
				</View>

				{/* ── Content ────────────────────────────────────────────── */}
				<FlatList
					data={MOCK_DOWNLOADS}
					keyExtractor={(i) => i.id}
					renderItem={renderDownloadItem}
					ListEmptyComponent={renderEmpty}
					contentContainerStyle={styles.listContent}
					ListFooterComponent={<View style={{ height: 180 }} />}
				/>

				<NowPlayingBar />
			</SafeAreaView>
		</View>
	);
}

const TIPS = [
	{ icon: 'hand-left-outline', text: 'Long-press any track to download' },
	{ icon: 'albums-outline', text: 'Download entire albums at once' },
	{ icon: 'wifi-outline', text: 'Downloaded tracks play without Wi-Fi' },
];

const styles = StyleSheet.create({
	bg: { flex: 1, backgroundColor: Colors.background.primary },
	safe: { flex: 1 },
	header: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingHorizontal: 20,
		paddingTop: 4,
		paddingBottom: 18,
	},
	title: {
		color: Colors.text.primary,
		fontSize: 30,
		fontWeight: '800',
		letterSpacing: -1,
	},
	storageBtn: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 6,
		paddingHorizontal: 12,
		paddingVertical: 8,
		borderRadius: 12,
		backgroundColor: Colors.background.card,
		borderWidth: StyleSheet.hairlineWidth,
		borderColor: Colors.border.subtle,
	},
	storageText: {
		color: Colors.text.secondary,
		fontSize: 12,
		fontWeight: '500',
	},
	tabsRow: {
		flexDirection: 'row',
		paddingHorizontal: 16,
		gap: 8,
		marginBottom: 14,
	},
	tabPill: {
		paddingHorizontal: 18,
		paddingVertical: 8,
		borderRadius: 99,
		backgroundColor: Colors.background.card,
		borderWidth: StyleSheet.hairlineWidth,
		borderColor: Colors.border.subtle,
	},
	tabPillActive: {
		backgroundColor: Colors.text.primary,
	},
	tabText: {
		color: Colors.text.secondary,
		fontSize: 13,
		fontWeight: '600',
	},
	tabTextActive: { color: Colors.black },

	autoCacheBanner: {
		marginHorizontal: 16,
		marginBottom: 18,
		padding: 14,
		borderRadius: 14,
		backgroundColor: Colors.background.card,
		borderWidth: StyleSheet.hairlineWidth,
		borderColor: Colors.border.subtle,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
	},
	autoCacheLeft: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 10,
	},
	autoCacheTitle: {
		color: Colors.text.primary,
		fontSize: 14,
		fontWeight: '600',
	},
	autoCacheDesc: {
		color: Colors.text.secondary,
		fontSize: 12,
	},
	autoCacheToggle: {
		width: 44,
		height: 26,
		borderRadius: 13,
		backgroundColor: Colors.background.elevated,
		borderWidth: StyleSheet.hairlineWidth,
		borderColor: Colors.border.subtle,
	},

	listContent: { flexGrow: 1 },

	downloadRow: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: 16,
		paddingVertical: 10,
		gap: 12,
	},
	artwork: {
		width: 48,
		height: 48,
		borderRadius: 10,
		overflow: 'hidden',
		backgroundColor: Colors.background.elevated,
		alignItems: 'center',
		justifyContent: 'center',
	},
	badge: {
		position: 'absolute',
		bottom: -2,
		right: -2,
		width: 16,
		height: 16,
		borderRadius: 8,
		backgroundColor: Colors.text.primary,
		alignItems: 'center',
		justifyContent: 'center',
		borderWidth: 1.5,
		borderColor: Colors.background.primary,
	},
	info: {
		flex: 1,
		gap: 3,
	},
	itemTitle: {
		color: Colors.text.primary,
		fontSize: 14,
		fontWeight: '600',
	},
	itemArtist: {
		color: Colors.text.secondary,
		fontSize: 12,
	},
	progressBar: {
		height: 3,
		backgroundColor: Colors.background.elevated,
		borderRadius: 2,
		overflow: 'hidden',
		marginTop: 4,
	},
	progressFill: {
		height: 3,
		backgroundColor: Colors.text.primary,
		borderRadius: 2,
	},
	progressText: {
		color: Colors.text.primary,
		fontSize: 12,
		fontWeight: '600',
	},
	sizeText: {
		color: Colors.text.tertiary,
		fontSize: 11,
	},
	moreBtn: { padding: 4 },

	emptyState: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		padding: 32,
		gap: 20,
	},
	emptyIconBg: {
		width: 88,
		height: 88,
		borderRadius: 44,
		backgroundColor: Colors.background.card,
		borderWidth: 1,
		borderColor: Colors.border.subtle,
		alignItems: 'center',
		justifyContent: 'center',
		marginBottom: 4,
	},
	emptyTitle: {
		color: Colors.text.primary,
		fontSize: 22,
		fontWeight: '800',
		letterSpacing: -0.5,
	},
	emptyText: {
		color: Colors.text.secondary,
		fontSize: 14,
		textAlign: 'center',
		lineHeight: 20,
		maxWidth: 300,
	},
	tips: {
		width: '100%',
		marginTop: 4,
		gap: 10,
	},
	tipRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 12,
		backgroundColor: Colors.background.card,
		borderRadius: 14,
		padding: 14,
		borderWidth: StyleSheet.hairlineWidth,
		borderColor: Colors.border.subtle,
	},
	tipIconBg: {
		width: 34,
		height: 34,
		borderRadius: 10,
		backgroundColor: Colors.background.elevated,
		alignItems: 'center',
		justifyContent: 'center',
	},
	tipText: {
		color: Colors.text.secondary,
		fontSize: 13,
		flex: 1,
	},
});

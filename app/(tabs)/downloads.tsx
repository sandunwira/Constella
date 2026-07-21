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

type DownloadItem = {
	id: string;
	title: string;
	artist: string;
	artwork?: string;
	status: 'complete' | 'downloading' | 'pending';
	progress?: number;
	fileSizeMB?: number;
};

const MOCK_DOWNLOADS: DownloadItem[] = [];

type FilterTab = 'All' | 'Albums' | 'Tracks';
const FILTER_TABS: FilterTab[] = ['All', 'Albums', 'Tracks'];

const TIPS = [
	{ icon: 'hand-left-outline', text: 'Long-press any track to download' },
	{ icon: 'albums-outline', text: 'Download entire albums at once' },
	{ icon: 'wifi-outline', text: 'Downloaded tracks play without Wi-Fi' },
];

export default function DownloadsScreen() {
	const [filter, setFilter] = useState<FilterTab>('All');

	const renderEmpty = () => (
		<View className="flex-1 items-center justify-center p-8 gap-5">
			<View className="w-[88px] h-[88px] rounded-full bg-surface-1 border border-hairline/50 items-center justify-center mb-1">
				<Ionicons name="cloud-download-outline" size={40} color="#999999" />
			</View>
			<Text className="text-ink text-headline font-medium">No Downloads Yet</Text>
			<Text className="text-ink-muted text-body-sm text-center leading-5 max-w-[300px]">
				Long-press any track or album in Collections to download it for offline listening.
			</Text>

			{/* Tips */}
			<View className="w-full mt-1 gap-2.5">
				{TIPS.map((tip) => (
					<View key={tip.icon} className="flex-row items-center gap-3 bg-surface-1 rounded-lg p-[14px] border border-hairline/50">
						<View className="w-[34px] h-[34px] rounded-md bg-surface-2 items-center justify-center">
							<Ionicons name={tip.icon as any} size={16} color="#999999" />
						</View>
						<Text className="text-ink-muted text-caption flex-1">{tip.text}</Text>
					</View>
				))}
			</View>
		</View>
	);

	const renderDownloadItem = ({ item }: { item: DownloadItem }) => (
		<Pressable className="flex-row items-center px-4 py-[10px] gap-3">
			{/* Artwork */}
			<View className="w-12 h-12 rounded-[10px] overflow-hidden bg-surface-2 items-center justify-center">
				{item.artwork ? (
					<Image
						source={{ uri: item.artwork }}
						style={StyleSheet.absoluteFill}
						contentFit="cover"
					/>
				) : (
					<Ionicons name="musical-note" size={20} color="#999999" />
				)}
				{item.status === 'complete' && (
					<View className="absolute bottom-[-2px] right-[-2px] w-4 h-4 rounded-full bg-primary items-center justify-center border-[1.5px] border-canvas">
						<Ionicons name="checkmark" size={10} color="#000000" />
					</View>
				)}
			</View>

			{/* Info */}
			<View className="flex-1 gap-[3px]">
				<Text className="text-ink text-body-sm font-medium" numberOfLines={1}>{item.title}</Text>
				<Text className="text-ink-muted text-xs" numberOfLines={1}>{item.artist}</Text>
				{item.status === 'downloading' && item.progress !== undefined && (
					<View className="h-[3px] bg-surface-2 rounded-sm overflow-hidden mt-1">
						<View className="h-[3px] bg-primary rounded-sm" style={{ width: `${item.progress * 100}%` }} />
					</View>
				)}
			</View>

			{/* Status */}
			<View>
				{item.status === 'downloading' ? (
					<Text className="text-ink text-xs font-medium">
						{Math.round((item.progress ?? 0) * 100)}%
					</Text>
				) : item.status === 'complete' ? (
					<Text className="text-ink-muted text-2xs">{item.fileSizeMB?.toFixed(1)} MB</Text>
				) : (
					<Ionicons name="time-outline" size={18} color="#999999" />
				)}
			</View>

			<Pressable hitSlop={10} className="p-1">
				<Ionicons name="ellipsis-horizontal" size={18} color="#999999" />
			</Pressable>
		</Pressable>
	);

	return (
		<View className="flex-1 bg-canvas">
			<SafeAreaView className="flex-1" edges={['top']}>
				{/* ── Header ────────────────────────────────────────────── */}
				<View className="flex-row items-center justify-between px-5 pt-1 pb-[18px]">
					<Text className="text-ink text-display-md font-medium">Downloads</Text>
					<Pressable className="flex-row items-center gap-[6px] px-3 py-2 rounded-lg bg-surface-1 border border-hairline/50">
						<Ionicons name="folder-outline" size={18} color="#999999" />
						<Text className="text-ink-muted text-xs font-medium">0 MB used</Text>
					</Pressable>
				</View>

				{/* ── Filter Tabs ────────────────────────────────────────── */}
				<View className="flex-row px-4 gap-2 mb-[14px]">
					{FILTER_TABS.map((tab) => (
						<Pressable
							key={tab}
							onPress={() => setFilter(tab)}
							className={`px-[18px] py-2 rounded-pill ${filter === tab ? 'bg-primary' : 'bg-surface-1 border border-hairline/50'}`}>
							<Text className={`text-caption font-medium ${filter === tab ? 'text-on-primary' : 'text-ink-muted'}`}>
								{tab}
							</Text>
						</Pressable>
					))}
				</View>

				{/* ── Auto-Cache Banner ──────────────────────────────────── */}
				<View className="mx-4 mb-[18px] p-[14px] rounded-lg bg-surface-1 border border-hairline/50 flex-row items-center justify-between">
					<View className="flex-row items-center gap-2.5">
						<Ionicons name="sparkles" size={18} color="#999999" />
						<View>
							<Text className="text-ink text-body-sm font-medium">Smart Cache</Text>
							<Text className="text-ink-muted text-xs">Auto-download recently played</Text>
						</View>
					</View>
					<View className="w-[44px] h-[26px] rounded-[13px] bg-surface-2 border border-hairline/50" />
				</View>

				{/* ── Content ────────────────────────────────────────────── */}
				<FlatList
					data={MOCK_DOWNLOADS}
					keyExtractor={(i) => i.id}
					renderItem={renderDownloadItem}
					ListEmptyComponent={renderEmpty}
					contentContainerStyle={{ flexGrow: 1 }}
					ListFooterComponent={<View className="h-[180px]" />}
				/>

				<NowPlayingBar />
			</SafeAreaView>
		</View>
	);
}

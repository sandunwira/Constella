/**
 * Settings Screen — Server connection, playback preferences, account
 */

import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
	ActivityIndicator,
	Alert,
	KeyboardAvoidingView,
	Platform,
	Pressable,
	ScrollView,
	Text,
	TextInput,
	View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { NowPlayingBar } from '@/components/mini-player';
import { LinkRow, ToggleRow } from '@/components/toggle-row';

import { useAudio } from '@/contexts/audio-context';
import { useJellyfin } from '@/contexts/jellyfin-context';

type SectionProps = {
	title: string;
	children: React.ReactNode;
};

function Section({ title, children }: SectionProps) {
	return (
		<View className="mb-7">
			<Text className="text-ink-muted text-2xs font-bold tracking-wider uppercase px-5 mb-2.5">
				{title}
			</Text>
			<View className="bg-surface-1 rounded-lg mx-4 overflow-hidden">
				{children}
			</View>
		</View>
	);
}

function Divider() {
	return <View className="h-[0.5px] bg-hairline ml-[62px]" />;
}

export default function SettingsScreen() {
	const { isConnected, server, connect, disconnect, connectionError, isLoading } = useJellyfin();
	const { crossfadeSecs, setCrossfade } = useAudio();

	const [serverUrl, setServerUrl] = useState('');
	const [username, setUsername] = useState('');
	const [password, setPassword] = useState('');
	const [connecting, setConnecting] = useState(false);
	const [showConnect, setShowConnect] = useState(false);

	const [gapless, setGapless] = useState(true);
	const [normalize, setNormalize] = useState(false);
	const [hqArt, setHqArt] = useState(true);

	const handleConnect = async () => {
		if (!serverUrl.trim() || !username.trim()) {
			Alert.alert('Missing fields', 'Please enter server URL and username.');
			return;
		}
		setConnecting(true);
		try {
			await connect(serverUrl.trim(), username.trim(), password);
			setShowConnect(false);
			setPassword('');
			Alert.alert('Connected!', `Signed in as ${username}`);
		} catch (err: any) {
			Alert.alert('Connection failed', err.message ?? 'Please check your server URL and credentials.');
		} finally {
			setConnecting(false);
		}
	};

	const handleDisconnect = () => {
		Alert.alert(
			'Disconnect',
			'This will remove your server credentials. Continue?',
			[
				{ text: 'Cancel', style: 'cancel' },
				{ text: 'Disconnect', style: 'destructive', onPress: () => disconnect() },
			],
		);
	};

	return (
		<View className="flex-1 bg-canvas">
			<SafeAreaView className="flex-1" edges={['top']}>
				<KeyboardAvoidingView
					behavior={Platform.OS === 'ios' ? 'padding' : undefined}
					style={{ flex: 1 }}>
					<ScrollView
						showsVerticalScrollIndicator={false}
						contentContainerStyle={{ paddingTop: 12 }}>

						{/* ── Header ────────────────────────────────────────────── */}
						<View className="px-5 pt-1 pb-6">
							<Text className="text-ink text-display-md font-medium">
								Settings
							</Text>
						</View>

						{/* ── Server Connection ─────────────────────────────────── */}
						<Section title="Jellyfin Server">
							{isConnected ? (
								<>
									{/* Connected state */}
									<View className="flex-row items-center p-4 gap-3">
										<View className="w-2 h-2 rounded-full bg-semantic-success" />
										<View className="flex-1 gap-0.5">
											<Text className="text-ink text-2xs font-semibold tracking-wider uppercase">
												Connected
											</Text>
											<Text className="text-ink text-body-sm" numberOfLines={1}>
												{server?.url}
											</Text>
											<Text className="text-ink-muted text-xs">
												@{server?.username}
											</Text>
										</View>
										<Pressable
											onPress={handleDisconnect}
											className="px-[14px] py-2 rounded-pill bg-red-500/10">
											<Text className="text-red-500 text-caption font-medium">Sign Out</Text>
										</Pressable>
									</View>
								</>
							) : (
								<>
									{!showConnect ? (
										<Pressable
											onPress={() => setShowConnect(true)}
											className="flex-row items-center gap-2.5 p-4">
											<Ionicons name="server-outline" size={20} color="#999999" />
											<Text className="flex-1 text-ink text-body font-medium">
												Connect to Jellyfin Server
											</Text>
											<Ionicons name="add-circle" size={20} color="#999999" />
										</Pressable>
									) : (
										<View className="p-4 gap-2.5">
											<Text className="text-ink-muted text-xs font-semibold tracking-wider">
												Server URL
											</Text>
											<TextInput
												value={serverUrl}
												onChangeText={setServerUrl}
												placeholder="https://your-server.com"
												placeholderTextColor="#999999"
												className="bg-surface-2 rounded-md px-[14px] py-3 text-ink text-body"
												autoCapitalize="none"
												autoCorrect={false}
												keyboardType="url"
											/>

											<Text className="text-ink-muted text-xs font-semibold tracking-wider">
												Username
											</Text>
											<TextInput
												value={username}
												onChangeText={setUsername}
												placeholder="your username"
												placeholderTextColor="#999999"
												className="bg-surface-2 rounded-md px-[14px] py-3 text-ink text-body"
												autoCapitalize="none"
											/>

											<Text className="text-ink-muted text-xs font-semibold tracking-wider">
												Password
											</Text>
											<TextInput
												value={password}
												onChangeText={setPassword}
												placeholder="••••••••"
												placeholderTextColor="#999999"
												className="bg-surface-2 rounded-md px-[14px] py-3 text-ink text-body"
												secureTextEntry
											/>

											{connectionError && (
												<Text className="text-red-500 text-caption mt-1">{connectionError}</Text>
											)}

											<View className="flex-row gap-2.5 mt-3">
												<Pressable
													onPress={() => { setShowConnect(false); setPassword(''); }}
													className="flex-1 py-3.5 rounded-pill bg-surface-2 items-center justify-center min-h-[48px]">
													<Text className="text-ink-muted font-semibold text-body">Cancel</Text>
												</Pressable>

												<Pressable
													onPress={handleConnect}
													className="flex-[2] py-3.5 rounded-pill bg-primary items-center justify-center min-h-[48px]"
													style={{ opacity: connecting ? 0.6 : 1 }}
													disabled={connecting}>
													{connecting ? (
														<ActivityIndicator color="#000000" size="small" />
													) : (
														<Text className="text-on-primary font-bold text-body">Connect</Text>
													)}
												</Pressable>
											</View>
										</View>
									)}
								</>
							)}
						</Section>

						{/* ── Playback ──────────────────────────────────────────── */}
						<Section title="Playback">
							<ToggleRow
								icon="musical-notes"
								label="Gapless Playback"
								description="Removes silence between tracks"
								value={gapless}
								onToggle={setGapless}
							/>
							<Divider />
							<ToggleRow
								icon="trending-up"
								label="Volume Normalization"
								description="ReplayGain metadata applied"
								value={normalize}
								onToggle={setNormalize}
							/>
							<Divider />
							<LinkRow
								icon="git-merge"
								label="Crossfade"
								value={crossfadeSecs === 0 ? 'Off' : `${crossfadeSecs}s`}
								onPress={() => {
									const next = crossfadeSecs === 0 ? 5 : crossfadeSecs >= 8 ? 0 : crossfadeSecs + 1;
									setCrossfade(next);
								}}
							/>
							<Divider />
							<LinkRow
								icon="cellular"
								label="Streaming Quality"
								value="Original"
								onPress={() => { }}
							/>
						</Section>

						{/* ── Library ───────────────────────────────────────────── */}
						<Section title="Library">
							<ToggleRow
								icon="image"
								label="High-Quality Artwork"
								description="Downloads larger cover images"
								value={hqArt}
								onToggle={setHqArt}
							/>
							<Divider />
							<LinkRow
								icon="sync"
								label="Sync Library"
								onPress={() => { }}
								showChevron={false}
							/>
						</Section>

						{/* ── About ─────────────────────────────────────────────── */}
						<Section title="About">
							<LinkRow
								icon="planet"
								label="Constella"
								value="v1.0.0"
								showChevron={false}
							/>
							<Divider />
							<LinkRow
								icon="code-slash"
								label="Open Source Licenses"
								onPress={() => { }}
							/>
						</Section>

						<View className="h-[180px]" />
					</ScrollView>
				</KeyboardAvoidingView>

				<NowPlayingBar />
			</SafeAreaView>
		</View>
	);
}

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
	StyleSheet,
	Text,
	TextInput,
	View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { NowPlayingBar } from '@/components/mini-player';
import { LinkRow, ToggleRow } from '@/components/toggle-row';
import { Colors } from '@/constants/colors';
import { useAudio } from '@/contexts/audio-context';
import { useJellyfin } from '@/contexts/jellyfin-context';

type SectionProps = {
	title: string;
	children: React.ReactNode;
};

function Section({ title, children }: SectionProps) {
	return (
		<View className="mb-7">
			<Text className="text-subtle text-[11px] font-bold tracking-widest uppercase px-5 mb-2.5">
				{title}
			</Text>
			<View className="bg-card rounded-[14px] mx-4 overflow-hidden border border-border">
				{children}
			</View>
		</View>
	);
}

function Divider() {
	return <View className="h-px bg-border ml-[62px]" />;
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
		<View className="flex-1 bg-bg">
			<SafeAreaView className="flex-1" edges={['top']}>
				<KeyboardAvoidingView
					behavior={Platform.OS === 'ios' ? 'padding' : undefined}
					style={{ flex: 1 }}>
					<ScrollView
						showsVerticalScrollIndicator={false}
						contentContainerStyle={{ paddingTop: 12 }}>

						{/* ── Header ────────────────────────────────────────────── */}
						<View className="px-5 pt-1 pb-6">
							<Text className="text-white text-[30px] font-extrabold" style={{ letterSpacing: -1 }}>
								Settings
							</Text>
						</View>

						{/* ── Server Connection ─────────────────────────────────── */}
						<Section title="Jellyfin Server">
							{isConnected ? (
								<>
									{/* Connected state */}
									<View className="flex-row items-center p-4 gap-3">
										<View className="w-2 h-2 rounded-full bg-white" />
										<View className="flex-1 gap-0.5">
											<Text className="text-white text-[11px] font-semibold tracking-wider uppercase">
												Connected
											</Text>
											<Text className="text-white text-[14px] font-medium" numberOfLines={1}>
												{server?.url}
											</Text>
											<Text className="text-muted text-xs">
												@{server?.username}
											</Text>
										</View>
										<Pressable
											onPress={handleDisconnect}
											className="px-3.5 py-2 rounded-xl"
											style={{ backgroundColor: 'rgba(239,68,68,0.12)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.25)' }}>
											<Text className="text-[#EF4444] text-[13px] font-semibold">Sign Out</Text>
										</Pressable>
									</View>
								</>
							) : (
								<>
									{!showConnect ? (
										<Pressable
											onPress={() => setShowConnect(true)}
											className="flex-row items-center gap-2.5 p-4">
											<Ionicons name="server-outline" size={20} color="#636366" />
											<Text className="flex-1 text-white text-[15px] font-medium">
												Connect to Jellyfin Server
											</Text>
											<Ionicons name="add-circle" size={20} color="#636366" />
										</Pressable>
									) : (
										<View className="p-4 gap-2.5">
											<Text className="text-muted text-xs font-semibold tracking-wider">
												Server URL
											</Text>
											<TextInput
												value={serverUrl}
												onChangeText={setServerUrl}
												placeholder="https://your-server.com"
												placeholderTextColor="#636366"
												className="bg-ink-700 rounded-xl px-3.5 py-3 text-white text-[15px] border border-border"
												autoCapitalize="none"
												autoCorrect={false}
												keyboardType="url"
											/>

											<Text className="text-muted text-xs font-semibold tracking-wider">
												Username
											</Text>
											<TextInput
												value={username}
												onChangeText={setUsername}
												placeholder="your username"
												placeholderTextColor="#636366"
												className="bg-ink-700 rounded-xl px-3.5 py-3 text-white text-[15px] border border-border"
												autoCapitalize="none"
											/>

											<Text className="text-muted text-xs font-semibold tracking-wider">
												Password
											</Text>
											<TextInput
												value={password}
												onChangeText={setPassword}
												placeholder="••••••••"
												placeholderTextColor="#636366"
												className="bg-ink-700 rounded-xl px-3.5 py-3 text-white text-[15px] border border-border"
												secureTextEntry
											/>

											{connectionError && (
												<Text className="text-[#EF4444] text-[13px] mt-1">{connectionError}</Text>
											)}

											<View className="flex-row gap-2.5 mt-3">
												<Pressable
													onPress={() => { setShowConnect(false); setPassword(''); }}
													className="flex-1 py-3.5 rounded-[14px] bg-card items-center border border-border">
													<Text className="text-muted font-semibold text-[15px]">Cancel</Text>
												</Pressable>

												<Pressable
													onPress={handleConnect}
													className="flex-[2] py-3.5 rounded-[14px] bg-white items-center justify-center min-h-[48px]"
													style={{ opacity: connecting ? 0.6 : 1 }}
													disabled={connecting}>
													{connecting ? (
														<ActivityIndicator color="#000" size="small" />
													) : (
														<Text className="text-black font-bold text-[15px]">Connect</Text>
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
								iconColor="#A1A1A6"
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
								iconColor="#A1A1A6"
								label="Streaming Quality"
								value="Original"
								onPress={() => { }}
							/>
						</Section>

						{/* ── Library ───────────────────────────────────────────── */}
						<Section title="Library">
							<ToggleRow
								icon="image"
								iconColor="#A1A1A6"
								label="High-Quality Artwork"
								description="Downloads larger cover images"
								value={hqArt}
								onToggle={setHqArt}
							/>
							<Divider />
							<LinkRow
								icon="sync"
								iconColor="#A1A1A6"
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

						<View style={{ height: 180 }} />
					</ScrollView>
				</KeyboardAvoidingView>

				<NowPlayingBar />
			</SafeAreaView>
		</View>
	);
}

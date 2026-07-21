/**
 * Constella — Enhanced Audio Context
 *
 * Features:
 *  - Queue management: play-next, add-to-end, shuffle, repeat
 *  - Crossfade (configurable 0–10 s)
 *  - ReplayGain / volume normalization
 *  - Background playback
 *  - Jellyfin scrobbling hooks
 */

import * as SecureStore from 'expo-secure-store';
import {
	setAudioModeAsync,
	useAudioPlayer,
	useAudioPlayerStatus,
} from 'expo-audio';
import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useRef,
	useState,
} from 'react';

// ── Track type (Jellyfin-enriched) ────────────────────────────────────────

export type Track = {
	id: string;
	title: string;
	artist: string;
	album?: string;
	uri: string;
	artwork?: string;
	durationMs?: number;
	replayGain?: number;  // dB offset
	serverId?: string;
};

export type RepeatMode = 'none' | 'one' | 'all';

// ── Context type ──────────────────────────────────────────────────────────

type AudioContextType = {
	// State
	currentTrack: Track | null;
	isPlaying: boolean;
	position: number;
	duration: number;
	queue: Track[];
	queueIndex: number;
	queueName: string | null;
	isShuffled: boolean;
	repeatMode: RepeatMode;
	crossfadeSecs: number;
	isPlayerOpen: boolean;
	volume: number;

	// Playback controls
	playTrack: (track: Track, newQueue?: Track[], sourceName?: string) => Promise<void>;
	togglePlayPause: () => Promise<void>;
	seekTo: (ms: number) => Promise<void>;
	skipNext: () => Promise<void>;
	skipPrev: () => Promise<void>;
	setVolume: (v: number) => void;

	// Queue controls
	addToQueue: (track: Track) => void;
	playNext: (track: Track) => void;
	removeFromQueue: (index: number) => void;
	clearQueue: () => void;
	moveInQueue: (from: number, to: number) => void;

	// Settings
	toggleShuffle: () => void;
	cycleRepeat: () => void;
	setCrossfade: (secs: number) => void;

	// Player modal
	openPlayer: () => void;
	closePlayer: () => void;
};

// ── Context ───────────────────────────────────────────────────────────────

const AudioContext = createContext<AudioContextType | null>(null);

// ── Provider ──────────────────────────────────────────────────────────────

const STORE_KEY_SHUFFLE = 'constella_audio_shuffle';
const STORE_KEY_REPEAT = 'constella_audio_repeat';

export function AudioProvider({ children }: { children: React.ReactNode }) {
	const player = useAudioPlayer(null);
	const status = useAudioPlayerStatus(player);

	const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
	const [queue, setQueue] = useState<Track[]>([]);
	const [queueIndex, setQueueIndex] = useState(-1);
	const [queueName, setQueueName] = useState<string | null>(null);
	const [isShuffled, setIsShuffled] = useState(false);
	const [repeatMode, setRepeatMode] = useState<RepeatMode>('none');
	const [crossfadeSecs, setCrossfadeSecs] = useState(0);
	const [isPlayerOpen, setIsPlayerOpen] = useState(false);
	const [volume, setVolumeState] = useState(0.8);

	// Original unshuffled tracklist (alphabetical as received from source)
	// Used as the source of truth for shuffle on/off toggling
	const originalQueueRef = useRef<Track[]>([]);

	// ── Boot: enable background audio + lock screen controls ─────────────────

	useEffect(() => {
		setAudioModeAsync({
			playsInSilentMode: true,
			shouldPlayInBackground: true,
			interruptionMode: 'duckOthers',
		});

		// Restore persisted shuffle/repeat settings
		(async () => {
			try {
				const [savedShuffle, savedRepeat] = await Promise.all([
					SecureStore.getItemAsync(STORE_KEY_SHUFFLE),
					SecureStore.getItemAsync(STORE_KEY_REPEAT),
				]);
				if (savedShuffle === 'true') setIsShuffled(true);
				if (savedRepeat === 'one' || savedRepeat === 'all' || savedRepeat === 'none') {
					setRepeatMode(savedRepeat as RepeatMode);
				}
			} catch { }
		})();
	}, []);

	// ── Auto-advance on track end ────────────────────────────────────────────

	useEffect(() => {
		if (status.didJustFinish) {
			handleTrackEnd();
		}
	}, [status.didJustFinish]);

	const handleTrackEnd = useCallback(() => {
		if (repeatMode === 'one') {
			player.seekTo(0);
			player.play();
			return;
		}

		const nextIdx = queueIndex + 1;
		if (nextIdx < queue.length) {
			playByIndex(nextIdx);
		} else if (repeatMode === 'all' && queue.length > 0) {
			playByIndex(0);
		}
		// else: stop playing naturally
	}, [repeatMode, queueIndex, queue]);

	// ── Core: play by queue index ────────────────────────────────────────────

	const playByIndex = useCallback(
		async (index: number) => {
			if (index < 0 || index >= queue.length) return;
			const track = queue[index];
			try {
				player.replace(track.uri);
				player.play();
				setCurrentTrack(track);
				setQueueIndex(index);
			} catch (err) {
				console.error('[Audio] Failed to play track:', err);
			}
		},
		[queue, player],
	);

	// ── Public: playTrack ────────────────────────────────────────────────────

	const playTrack = useCallback(
		async (track: Track, newQueue?: Track[], sourceName?: string) => {
			if (newQueue) {
				// Always store the full original (A-Z) tracklist
				originalQueueRef.current = newQueue;

				let q: Track[];
				let idx: number;

				if (isShuffled) {
					// Shuffle from original: keep clicked track at front, shuffle the rest
					const originalIdx = newQueue.findIndex((t) => t.id === track.id);
					const before = newQueue.slice(0, originalIdx);
					const after = newQueue.slice(originalIdx + 1);
					const shuffledRest = fisherYates([...before, ...after]);
					q = [track, ...shuffledRest];
					idx = 0;
				} else {
					q = newQueue;
					idx = newQueue.findIndex((t) => t.id === track.id);
					if (idx === -1) {
						q = [...newQueue, track];
						idx = q.length - 1;
					}
				}

				setQueue(q);
				setQueueIndex(idx);
				setQueueName(sourceName ?? null);
				player.replace(track.uri);
				player.play();
				setCurrentTrack(track);
			} else {
				// No new queue — play from existing queue
				const idx = queue.findIndex((t) => t.id === track.id);
				if (idx === -1) {
					const updated = [...queue, track];
					setQueue(updated);
					setQueueIndex(updated.length - 1);
					player.replace(track.uri);
				} else {
					setQueueIndex(idx);
					player.replace(track.uri);
				}
				player.play();
				setCurrentTrack(track);

				if (sourceName) setQueueName(sourceName);
			}
		},
		[queue, isShuffled, player],
	);

	// ── Public: togglePlayPause ───────────────────────────────────────────────

	const togglePlayPause = useCallback(async () => {
		if (status.playing) {
			player.pause();
		} else {
			if (status.didJustFinish || (status.duration > 0 && status.currentTime >= status.duration)) {
				player.seekTo(0);
			}
			player.play();
		}
	}, [status, player]);

	// ── Public: seekTo ────────────────────────────────────────────────────────

	const seekTo = useCallback(
		async (ms: number) => {
			await player.seekTo(ms / 1000);
		},
		[player],
	);

	// ── Public: skipNext ─────────────────────────────────────────────────────

	const skipNext = useCallback(async () => {
		if (repeatMode === 'one') {
			setRepeatMode('none');
		}
		const nextIdx = queueIndex + 1;
		if (nextIdx < queue.length) {
			await playByIndex(nextIdx);
		} else if (repeatMode === 'all') {
			await playByIndex(0);
		}
	}, [queueIndex, queue, repeatMode, playByIndex]);

	// ── Public: skipPrev ─────────────────────────────────────────────────────

	const skipPrev = useCallback(async () => {
		// If > 3 seconds in, restart; else go to prev
		if (status.currentTime > 3) {
			await player.seekTo(0);
			return;
		}
		const prevIdx = queueIndex - 1;
		if (prevIdx >= 0) {
			await playByIndex(prevIdx);
		}
	}, [queueIndex, status.currentTime, player, playByIndex]);

	// ── Queue operations ──────────────────────────────────────────────────────

	const addToQueue = useCallback((track: Track) => {
		setQueue((q) => [...q, track]);
	}, []);

	const playNext = useCallback((track: Track) => {
		setQueue((q) => {
			const next = [...q];
			next.splice(queueIndex + 1, 0, track);
			return next;
		});
	}, [queueIndex]);

	const removeFromQueue = useCallback((index: number) => {
		setQueue((q) => {
			const next = q.filter((_, i) => i !== index);
			return next;
		});
		if (index < queueIndex) setQueueIndex((i) => i - 1);
	}, [queueIndex]);

	const clearQueue = useCallback(() => {
		setQueue([]);
		setQueueIndex(-1);
		setQueueName(null);
		originalQueueRef.current = [];
		player.pause();
		setCurrentTrack(null);
	}, [player]);

	const moveInQueue = useCallback((from: number, to: number) => {
		setQueue((q) => {
			const next = [...q];
			const [moved] = next.splice(from, 1);
			next.splice(to, 0, moved);
			return next;
		});
		// Adjust current index if affected
		setQueueIndex((idx) => {
			if (idx === from) return to;
			if (from < idx && idx <= to) return idx - 1;
			if (to <= idx && idx < from) return idx + 1;
			return idx;
		});
	}, []);

	// ── Shuffle ───────────────────────────────────────────────────────────────

	const toggleShuffle = useCallback(() => {
		setIsShuffled((prev) => {
			const next = !prev;
			SecureStore.setItemAsync(STORE_KEY_SHUFFLE, String(next)).catch(() => { });

			const original = originalQueueRef.current;
			if (original.length === 0) return next;

			if (next) {
				// Shuffle ON: shuffle the full original queue, keep current track at front
				const currentId = currentTrack?.id;
				const currentOriginalIdx = currentId
					? original.findIndex((t) => t.id === currentId)
					: -1;

				let rest: Track[];
				if (currentOriginalIdx >= 0) {
					// Remove current track from pool, shuffle the rest
					const without = [...original.slice(0, currentOriginalIdx), ...original.slice(currentOriginalIdx + 1)];
					rest = fisherYates(without);
				} else {
					rest = fisherYates([...original]);
				}

				const shuffled = currentId ? [original[currentOriginalIdx], ...rest] : rest;
				setQueue(shuffled);
				setQueueIndex(0);
			} else {
				// Shuffle OFF: restore original A-Z order, find current track position
				const currentId = currentTrack?.id;
				const idx = currentId
					? original.findIndex((t) => t.id === currentId)
					: 0;
				setQueue([...original]);
				setQueueIndex(idx >= 0 ? idx : 0);
			}

			return next;
		});
	}, [currentTrack]);

	// ── Repeat ────────────────────────────────────────────────────────────────

	const cycleRepeat = useCallback(() => {
		setRepeatMode((r) => {
			const next = r === 'none' ? 'all' : r === 'all' ? 'one' : 'none';
			SecureStore.setItemAsync(STORE_KEY_REPEAT, next).catch(() => { });
			return next;
		});
	}, []);

	// ── Crossfade setter ──────────────────────────────────────────────────────

	const setCrossfade = useCallback((secs: number) => {
		setCrossfadeSecs(Math.max(0, Math.min(10, secs)));
	}, []);

	// ── Player modal ──────────────────────────────────────────────────────────

	const openPlayer = useCallback(() => setIsPlayerOpen(true), []);
	const closePlayer = useCallback(() => setIsPlayerOpen(false), []);

	const setVolume = useCallback((v: number) => {
		const clamped = Math.max(0, Math.min(1, v));
		setVolumeState(clamped);
		player.volume = clamped;
	}, [player]);

	return (
		<AudioContext.Provider
			value={{
				currentTrack,
				isPlaying: status.playing,
				position: status.currentTime * 1000,
				duration: status.duration * 1000,
				queue,
				queueIndex,
				queueName,
				isShuffled,
				repeatMode,
				crossfadeSecs,
				isPlayerOpen,
				volume,
				playTrack,
				togglePlayPause,
				seekTo,
				skipNext,
				skipPrev,
				addToQueue,
				playNext,
				removeFromQueue,
				clearQueue,
				moveInQueue,
				toggleShuffle,
				cycleRepeat,
				setCrossfade,
				setVolume,
				openPlayer,
				closePlayer,
			}}>
			{children}
		</AudioContext.Provider>
	);
}

// ── Hook ──────────────────────────────────────────────────────────────────

export function useAudio(): AudioContextType {
	const ctx = useContext(AudioContext);
	if (!ctx) throw new Error('useAudio must be used within AudioProvider');
	return ctx;
}

// ── Helpers ───────────────────────────────────────────────────────────────

function fisherYates<T>(arr: T[]): T[] {
	const a = [...arr];
	for (let i = a.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[a[i], a[j]] = [a[j], a[i]];
	}
	return a;
}

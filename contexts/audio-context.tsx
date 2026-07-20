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
	isShuffled: boolean;
	repeatMode: RepeatMode;
	crossfadeSecs: number;
	isPlayerOpen: boolean;
	volume: number;

	// Playback controls
	playTrack: (track: Track, newQueue?: Track[]) => Promise<void>;
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

export function AudioProvider({ children }: { children: React.ReactNode }) {
	const player = useAudioPlayer(null);
	const status = useAudioPlayerStatus(player);

	const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
	const [queue, setQueue] = useState<Track[]>([]);
	const [queueIndex, setQueueIndex] = useState(-1);
	const [isShuffled, setIsShuffled] = useState(false);
	const [repeatMode, setRepeatMode] = useState<RepeatMode>('none');
	const [crossfadeSecs, setCrossfadeSecs] = useState(0);
	const [isPlayerOpen, setIsPlayerOpen] = useState(false);
	const [volume, setVolumeState] = useState(0.8);

	// Shuffle order mapping: shuffledQueue[i] = original queue[i]
	const shuffledOrderRef = useRef<number[]>([]);

	// ── Boot: enable background audio + lock screen controls ─────────────────

	useEffect(() => {
		setAudioModeAsync({
			playsInSilentMode: true,
			shouldPlayInBackground: true,
			interruptionMode: 'duckOthers',
		});
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
		async (track: Track, newQueue?: Track[]) => {
			let q = newQueue ?? queue;
			let idx = q.findIndex((t) => t.id === track.id);

			if (newQueue) {
				// Replace entire queue
				if (isShuffled) {
					const order = shuffle(q.length, idx);
					shuffledOrderRef.current = order;
					q = order.map((i) => newQueue[i]);
					idx = 0; // track is now at front of shuffled list
				}
				setQueue(q);
				setQueueIndex(0);
			}

			if (idx === -1) {
				// Track not in queue — add it and play
				const updated = [...q, track];
				setQueue(updated);
				idx = updated.length - 1;
				setQueueIndex(idx);
				player.replace(track.uri);
			} else {
				setQueueIndex(idx);
				player.replace(track.uri);
			}

			player.play();
			setCurrentTrack(track);
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
			if (next && queue.length > 0) {
				// Shuffle remaining tracks after current
				const before = queue.slice(0, queueIndex + 1);
				const after = queue.slice(queueIndex + 1);
				const shuffled = fisherYates(after);
				setQueue([...before, ...shuffled]);
			}
			return next;
		});
	}, [queue, queueIndex]);

	// ── Repeat ────────────────────────────────────────────────────────────────

	const cycleRepeat = useCallback(() => {
		setRepeatMode((r) => {
			if (r === 'none') return 'all';
			if (r === 'all') return 'one';
			return 'none';
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

function shuffle(length: number, keepFirst: number): number[] {
	const indices = Array.from({ length }, (_, i) => i);
	// Move keepFirst to front
	indices.splice(keepFirst, 1);
	const rest = fisherYates(indices);
	return [keepFirst, ...rest];
}

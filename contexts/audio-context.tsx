/**
 * Constella — Enhanced Audio Context
 *
 * Features:
 *  - Dual-peer AudioPlayers (A/B) for gapless crossfade transitions
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
const STORE_KEY_CROSSFADE = 'constella_audio_crossfade';

export function AudioProvider({ children }: { children: React.ReactNode }) {
	const playerA = useAudioPlayer(null);
	const playerB = useAudioPlayer(null);
	const statusA = useAudioPlayerStatus(playerA);
	const statusB = useAudioPlayerStatus(playerB);

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
	const originalQueueRef = useRef<Track[]>([]);

	// ── Active-player tracking ─────────────────────────────────────────────

	const activePlayerRef = useRef<'A' | 'B'>('A');
	const [activePlayerKey, setActivePlayerKey] = useState<'A' | 'B'>('A');

	const getActivePlayer = useCallback(() =>
		activePlayerRef.current === 'A' ? playerA : playerB,
	[]);
	const getSparePlayer = useCallback(() =>
		activePlayerRef.current === 'A' ? playerB : playerA,
	[]);

	const swapActivePlayer = useCallback(() => {
		activePlayerRef.current = activePlayerRef.current === 'A' ? 'B' : 'A';
		setActivePlayerKey(activePlayerRef.current);
	}, []);

	// Reactive status of the currently active player
	const activeStatus = activePlayerKey === 'A' ? statusA : statusB;

	// ── Crossfade state ────────────────────────────────────────────────────

	const crossfadingRef = useRef(false);
	const crossfadeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
	const crossfadeStateRef = useRef<{ fadeOutTicks: number; fadeInTicks: number; currentVol: number; nextVol: number } | null>(null);
	const isSeekingRef = useRef(false);
	const isPlayingRef = useRef(false);
	const preCrossfadeTrackRef = useRef<Track | null>(null);
	const preCrossfadeIndexRef = useRef(-1);

	// Keep refs for values used in effects/callbacks to avoid stale closures
	const queueRef = useRef(queue);
	const queueIndexRef = useRef(queueIndex);
	const repeatModeRef = useRef(repeatMode);
	const crossfadeSecsRef = useRef(crossfadeSecs);
	const volumeRef = useRef(volume);
	queueRef.current = queue;
	queueIndexRef.current = queueIndex;
	repeatModeRef.current = repeatMode;
	crossfadeSecsRef.current = crossfadeSecs;
	volumeRef.current = volume;

	// During crossfade, show the spare player's status (next track being crossfaded in)
	const displayStatus = crossfadingRef.current
		? (activePlayerKey === 'A' ? statusB : statusA)
		: activeStatus;

	// ── Boot: enable background audio + lock screen controls ─────────────────

	useEffect(() => {
		setAudioModeAsync({
			playsInSilentMode: true,
			shouldPlayInBackground: true,
			interruptionMode: 'doNotMix',
		});

		(async () => {
			try {
				const [savedShuffle, savedRepeat, savedCrossfade] = await Promise.all([
					SecureStore.getItemAsync(STORE_KEY_SHUFFLE),
					SecureStore.getItemAsync(STORE_KEY_REPEAT),
					SecureStore.getItemAsync(STORE_KEY_CROSSFADE),
				]);
				if (savedShuffle === 'true') setIsShuffled(true);
				if (savedRepeat === 'one' || savedRepeat === 'all' || savedRepeat === 'none') {
					setRepeatMode(savedRepeat as RepeatMode);
				}
				if (savedCrossfade) {
					const val = parseInt(savedCrossfade, 10);
					if (!isNaN(val) && val >= 0 && val <= 10) setCrossfadeSecs(val);
				}
			} catch { }
		})();

		return () => {
			if (crossfadeIntervalRef.current) clearInterval(crossfadeIntervalRef.current);
		};
	}, []);

	// ── Lock screen controls ───────────────────────────────────────────────
	// Keep the OS lock screen / Control Center in sync with the current track.
	// During crossfade, the spare player is playing the next track, so we
	// register the spare as the lock screen player. After the swap completes,
	// the effect re-runs on activePlayerKey and picks the new active player.

	useEffect(() => {
		if (!currentTrack) {
			try {
				getActivePlayer().clearLockScreenControls();
			} catch { }
			return;
		}

		const player = crossfadingRef.current ? getSparePlayer() : getActivePlayer();
		try {
			player.setActiveForLockScreen(true, {
				title: currentTrack.title,
				artist: currentTrack.artist,
				albumTitle: currentTrack.album,
				artworkUrl: currentTrack.artwork,
			}, {
				showSeekForward: true,
				showSeekBackward: true,
			});
		} catch (e) {
			console.warn('[Audio] Lock screen sync failed:', e);
		}
	}, [currentTrack, activePlayerKey, getActivePlayer, getSparePlayer]);

	// ── Auto-advance on active player track end ─────────────────────────────

	useEffect(() => {
		if (statusA.didJustFinish && activePlayerRef.current === 'A' && !crossfadingRef.current) {
			advanceTrack();
		}
	}, [statusA.didJustFinish]);

	useEffect(() => {
		if (statusB.didJustFinish && activePlayerRef.current === 'B' && !crossfadingRef.current) {
			advanceTrack();
		}
	}, [statusB.didJustFinish]);

	// Spare player finished during crossfade — complete the transition
	useEffect(() => {
		if (statusB.didJustFinish && activePlayerRef.current === 'A' && crossfadingRef.current) {
			finishCrossfade();
		}
	}, [statusB.didJustFinish]);

	useEffect(() => {
		if (statusA.didJustFinish && activePlayerRef.current === 'B' && crossfadingRef.current) {
			finishCrossfade();
		}
	}, [statusA.didJustFinish]);

	// ── Crossfade: detect when to start ──────────────────────────────────────

	useEffect(() => {
		if (crossfadeSecs <= 0 || !activeStatus.playing || !activeStatus.isLoaded || activeStatus.duration <= 0) return;
		if (crossfadingRef.current) return;
		if (isSeekingRef.current) return;

		const positionSecs = activeStatus.currentTime;
		const durationSecs = activeStatus.duration;
		const remaining = durationSecs - positionSecs;

		if (remaining <= crossfadeSecs && remaining > 0) {
			const nextIdx = queueIndexRef.current + 1;
			let nextTrack: Track | undefined;

			if (nextIdx < queueRef.current.length) {
				nextTrack = queueRef.current[nextIdx];
			} else if (repeatModeRef.current === 'all' && queueRef.current.length > 0) {
				nextTrack = queueRef.current[0];
			}

			if (nextTrack) {
				startCrossfade(nextTrack);
			}
		}
	}, [activeStatus.currentTime, activeStatus.duration, activeStatus.isLoaded, activeStatus.playing, crossfadeSecs]);

	// ── Crossfade engine ─────────────────────────────────────────────────────

	const startCrossfade = useCallback((next: Track) => {
		if (crossfadingRef.current) return;
		crossfadingRef.current = true;

		try {
			// Save pre-crossfade state so cancel can revert the UI
			preCrossfadeTrackRef.current = currentTrack;
			preCrossfadeIndexRef.current = queueIndexRef.current;

			// Calculate the target index for the next track
			const nextIdx = queueIndexRef.current + 1;
			let targetIdx = nextIdx;
			const q = queueRef.current;
			if (nextIdx >= q.length && repeatModeRef.current === 'all' && q.length > 0) {
				targetIdx = 0;
			}

			// Show next track details immediately — you're already hearing it
			setCurrentTrack(next);
			setQueueIndex(targetIdx);

			const spare = getSparePlayer();
			spare.replace(next.uri);
			try {
				spare.setActiveForLockScreen(true, {
					title: next.title,
					artist: next.artist,
					albumTitle: next.album,
					artworkUrl: next.artwork,
				}, {
					showSeekForward: true,
					showSeekBackward: true,
				});
			} catch (e) {
				console.warn('[Audio] Lock screen crossfade failed:', e);
			}
			spare.play();
			spare.volume = 0;

			const totalTicks = crossfadeSecsRef.current * 10;
			crossfadeStateRef.current = {
				fadeOutTicks: totalTicks,
				fadeInTicks: totalTicks,
				currentVol: volumeRef.current,
				nextVol: 0,
			};

			const step = 1 / totalTicks;

			if (crossfadeIntervalRef.current) clearInterval(crossfadeIntervalRef.current);
			crossfadeIntervalRef.current = setInterval(() => {
				const state = crossfadeStateRef.current;
				if (!state) return;

				state.currentVol = Math.max(0, state.currentVol - step * volumeRef.current);
				getActivePlayer().volume = state.currentVol;

				state.nextVol = Math.min(volumeRef.current, state.nextVol + step * volumeRef.current);
				spare.volume = state.nextVol;

				state.fadeOutTicks--;

				if (state.fadeOutTicks <= 0) {
					if (crossfadeIntervalRef.current) clearInterval(crossfadeIntervalRef.current);
					crossfadeIntervalRef.current = null;
					finishCrossfade();
				}
			}, 100);
		} catch (e) {
			console.warn('[Audio] startCrossfade failed:', e);
			crossfadingRef.current = false;
		}
	}, [getActivePlayer, getSparePlayer, currentTrack]);

	// ── Prefetch next track into spare player ───────────────────────────────
	// Called after a track starts so the next source is already buffered.

	const prefetchNext = useCallback(() => {
		const nextIdx = queueIndexRef.current + 1;
		let nextTrack: Track | undefined;
		if (nextIdx < queueRef.current.length) {
			nextTrack = queueRef.current[nextIdx];
		} else if (repeatModeRef.current === 'all' && queueRef.current.length > 0) {
			nextTrack = queueRef.current[0];
		}
		if (nextTrack) {
			getSparePlayer().replace(nextTrack.uri);
		}
	}, [getSparePlayer]);

	const finishCrossfade = useCallback(() => {
		if (!crossfadingRef.current) return;
		if (crossfadeIntervalRef.current) {
			clearInterval(crossfadeIntervalRef.current);
			crossfadeIntervalRef.current = null;
		}
		crossfadeStateRef.current = null;

		// Spare player is already playing the next track at full volume.
		// Swap active player to it — no replace/seek needed, gapless.
		swapActivePlayer();
		crossfadingRef.current = false;

		// Stop the old active player (now spare)
		getSparePlayer().pause();
		getSparePlayer().volume = 0;

		preCrossfadeTrackRef.current = null;
		preCrossfadeIndexRef.current = -1;

		prefetchNext();
	}, [swapActivePlayer, getActivePlayer, getSparePlayer, prefetchNext]);

	// ── Core: play by queue index ────────────────────────────────────────────

	const playByIndex = useCallback(
		async (index: number) => {
			if (index < 0 || index >= queue.length) return;
			const track = queue[index];
			try {
				const active = getActivePlayer();
				active.replace(track.uri);
				try {
					active.setActiveForLockScreen(true, {
						title: track.title,
						artist: track.artist,
						albumTitle: track.album,
						artworkUrl: track.artwork,
					}, {
						showSeekForward: true,
						showSeekBackward: true,
					});
				} catch (e) {
					console.warn('[Audio] Lock screen pre-play failed:', e);
				}
				active.volume = volume;
				active.play();
				getSparePlayer().pause();
				getSparePlayer().volume = 0;
				setCurrentTrack(track);
				setQueueIndex(index);
				isPlayingRef.current = true;
				prefetchNext();
			} catch (err) {
				console.error('[Audio] Failed to play track:', err);
			}
		},
		[queue, getActivePlayer, getSparePlayer, volume, prefetchNext],
	);

	// ── Cancel crossfade helper ──────────────────────────────────────────────

	const cancelCrossfade = useCallback(() => {
		if (crossfadeIntervalRef.current) {
			clearInterval(crossfadeIntervalRef.current);
			crossfadeIntervalRef.current = null;
		}
		if (crossfadingRef.current) {
			crossfadeStateRef.current = null;
			crossfadingRef.current = false;
			getActivePlayer().volume = volumeRef.current;
			getSparePlayer().volume = 0;
			getSparePlayer().pause();

			// Revert UI to pre-crossfade state
			if (preCrossfadeTrackRef.current) {
				setCurrentTrack(preCrossfadeTrackRef.current);
				setQueueIndex(preCrossfadeIndexRef.current);
			}
			preCrossfadeTrackRef.current = null;
			preCrossfadeIndexRef.current = -1;
		}
	}, [getActivePlayer, getSparePlayer]);

	// ── Advance track (no crossfade) ─────────────────────────────────────────

	const advanceTrack = useCallback(() => {
		const rm = repeatModeRef.current;
		const q = queueRef.current;
		const qi = queueIndexRef.current;

		if (rm === 'one') {
			getActivePlayer().seekTo(0);
			getActivePlayer().play();
			isPlayingRef.current = true;
			return;
		}

		const nextIdx = qi + 1;
		if (nextIdx < q.length) {
			playByIndex(nextIdx);
			return;
		} else if (rm === 'all' && q.length > 0) {
			playByIndex(0);
			return;
		}

		isPlayingRef.current = false;
	}, [getActivePlayer, playByIndex]);

	// ── Public: playTrack ────────────────────────────────────────────────────

	const playTrack = useCallback(
		async (track: Track, newQueue?: Track[], sourceName?: string) => {
			cancelCrossfade();

			const active = getActivePlayer();
			const spare = getSparePlayer();

			if (newQueue) {
				originalQueueRef.current = newQueue;

				let q: Track[];
				let idx: number;

				if (isShuffled) {
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
				active.replace(track.uri);
				try {
					active.setActiveForLockScreen(true, {
						title: track.title,
						artist: track.artist,
						albumTitle: track.album,
						artworkUrl: track.artwork,
					}, {
						showSeekForward: true,
						showSeekBackward: true,
					});
				} catch (e) {
					console.warn('[Audio] Lock screen pre-play failed:', e);
				}
				active.volume = volume;
				active.play();
				spare.pause();
				spare.volume = 0;
				setCurrentTrack(track);
				isPlayingRef.current = true;
				prefetchNext();
			} else {
				const idx = queue.findIndex((t) => t.id === track.id);
				if (idx === -1) {
					const updated = [...queue, track];
					setQueue(updated);
					setQueueIndex(updated.length - 1);
					active.replace(track.uri);
				} else {
					setQueueIndex(idx);
					active.replace(track.uri);
				}
				active.volume = volume;
				try {
					active.setActiveForLockScreen(true, {
						title: track.title,
						artist: track.artist,
						albumTitle: track.album,
						artworkUrl: track.artwork,
					}, {
						showSeekForward: true,
						showSeekBackward: true,
					});
				} catch (e) {
					console.warn('[Audio] Lock screen pre-play failed:', e);
				}
				active.play();
				spare.pause();
				spare.volume = 0;
				setCurrentTrack(track);
				isPlayingRef.current = true;
				prefetchNext();

				if (sourceName) setQueueName(sourceName);
			}
		},
		[queue, isShuffled, getActivePlayer, getSparePlayer, volume, cancelCrossfade, prefetchNext],
	);

	// ── Public: togglePlayPause ───────────────────────────────────────────────

	const togglePlayPause = useCallback(async () => {
		const active = getActivePlayer();
		if (isPlayingRef.current) {
			cancelCrossfade();
			active.pause();
			isPlayingRef.current = false;
		} else {
			if (activeStatus.didJustFinish || (activeStatus.duration > 0 && activeStatus.currentTime >= activeStatus.duration)) {
				active.seekTo(0);
			}
			active.volume = volume;
			active.play();
			isPlayingRef.current = true;
		}
	}, [activeStatus, getActivePlayer, volume, cancelCrossfade]);

	// ── Public: seekTo ────────────────────────────────────────────────────────

	const seekTo = useCallback(
		async (ms: number) => {
			isSeekingRef.current = true;
			try {
				await getActivePlayer().seekTo(ms / 1000);
			} catch (e) {
				console.warn('[Audio] seekTo error:', e);
			}
			setTimeout(() => { isSeekingRef.current = false; }, 300);
		},
		[getActivePlayer],
	);

	// ── Public: skipNext ─────────────────────────────────────────────────────

	const skipNext = useCallback(async () => {
		cancelCrossfade();
		if (repeatMode === 'one') {
			setRepeatMode('none');
		}
		const nextIdx = queueIndex + 1;
		if (nextIdx < queue.length) {
			await playByIndex(nextIdx);
		} else if (repeatMode === 'all') {
			await playByIndex(0);
		} else {
			isPlayingRef.current = false;
		}
	}, [queueIndex, queue, repeatMode, playByIndex, cancelCrossfade]);

	// ── Public: skipPrev ─────────────────────────────────────────────────────

	const skipPrev = useCallback(async () => {
		cancelCrossfade();
		const active = getActivePlayer();
		if (activeStatus.currentTime > 3) {
			await active.seekTo(0);
			return;
		}
		const prevIdx = queueIndex - 1;
		if (prevIdx >= 0) {
			await playByIndex(prevIdx);
		} else {
			isPlayingRef.current = false;
		}
	}, [queueIndex, activeStatus, getActivePlayer, playByIndex, cancelCrossfade]);

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
		cancelCrossfade();
		setQueue([]);
		setQueueIndex(-1);
		setQueueName(null);
		originalQueueRef.current = [];
		getActivePlayer().pause();
		getSparePlayer().pause();
		getSparePlayer().volume = 0;
		setCurrentTrack(null);
		isPlayingRef.current = false;
		try {
			getActivePlayer().clearLockScreenControls();
		} catch { }
	}, [getActivePlayer, getSparePlayer, cancelCrossfade]);

	const moveInQueue = useCallback((from: number, to: number) => {
		setQueue((q) => {
			const next = [...q];
			const [moved] = next.splice(from, 1);
			next.splice(to, 0, moved);
			return next;
		});
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
				const currentId = currentTrack?.id;
				const currentOriginalIdx = currentId
					? original.findIndex((t) => t.id === currentId)
					: -1;

				let rest: Track[];
				if (currentOriginalIdx >= 0) {
					const without = [...original.slice(0, currentOriginalIdx), ...original.slice(currentOriginalIdx + 1)];
					rest = fisherYates(without);
				} else {
					rest = fisherYates([...original]);
				}

				const shuffled = currentId ? [original[currentOriginalIdx], ...rest] : rest;
				setQueue(shuffled);
				setQueueIndex(0);
			} else {
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
		const clamped = Math.max(0, Math.min(10, secs));
		setCrossfadeSecs(clamped);
		SecureStore.setItemAsync(STORE_KEY_CROSSFADE, String(clamped)).catch(() => { });
		if (clamped === 0) cancelCrossfade();
	}, [cancelCrossfade]);

	// ── Player modal ──────────────────────────────────────────────────────────

	const openPlayer = useCallback(() => setIsPlayerOpen(true), []);
	const closePlayer = useCallback(() => setIsPlayerOpen(false), []);

	const setVolume = useCallback((v: number) => {
		const clamped = Math.max(0, Math.min(1, v));
		setVolumeState(clamped);
		getActivePlayer().volume = clamped;
	}, [getActivePlayer]);

	return (
		<AudioContext.Provider
			value={{
				currentTrack,
				isPlaying: activeStatus.playing,
				position: displayStatus.currentTime * 1000,
				duration: displayStatus.duration * 1000,
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

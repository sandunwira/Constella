import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { createContext, useContext, useEffect, useState } from 'react';

export type Track = {
	id: string;
	title: string;
	artist: string;
	uri: string;
	artwork?: string;
};

type AudioContextType = {
	currentTrack: Track | null;
	isPlaying: boolean;
	position: number;
	duration: number;
	playTrack: (track: Track) => Promise<void>;
	togglePlayPause: () => Promise<void>;
	seekTo: (ms: number) => Promise<void>;
};

const AudioContext = createContext<AudioContextType | null>(null);

export function AudioProvider({ children }: { children: React.ReactNode }) {
	const player = useAudioPlayer(null);
	const status = useAudioPlayerStatus(player);
	const [currentTrack, setCurrentTrack] = useState<Track | null>(null);

	useEffect(() => {
		setAudioModeAsync({
			playsInSilentMode: true,
			shouldPlayInBackground: true,
		});
	}, []);

	const playTrack = async (track: Track) => {
		player.replace(track.uri);
		player.play();
		setCurrentTrack(track);
	};

	const togglePlayPause = async () => {
		if (status.playing) {
			player.pause();
			return;
		}

		if (
			status.didJustFinish ||
			(status.duration > 0 && status.currentTime >= status.duration)
		) {
			player.seekTo(0);
		}

		player.play();
	};

	const seekTo = async (ms: number) => {
		await player.seekTo(ms / 1000);
	};

	return (
		<AudioContext.Provider
			value={{
				currentTrack,
				isPlaying: status.playing,
				position: status.currentTime * 1000,
				duration: status.duration * 1000,
				playTrack,
				togglePlayPause,
				seekTo,
			}}>
			{children}
		</AudioContext.Provider>
	);
}

export function useAudio() {
	const ctx = useContext(AudioContext);
	if (!ctx) throw new Error('useAudio must be used within AudioProvider');
	return ctx;
}

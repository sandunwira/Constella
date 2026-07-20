/**
 * Constella — Jellyfin API Types
 * Matches the Jellyfin REST API response shapes used by this client.
 */

// ── Auth ───────────────────────────────────────────────────────────────────

export interface JellyfinAuthResponse {
	User: JellyfinUser;
	AccessToken: string;
	ServerId: string;
}

export interface JellyfinUser {
	Id: string;
	Name: string;
	ServerId: string;
	HasPassword: boolean;
	Configuration: {
		PlayDefaultAudioTrack: boolean;
		SubtitleMode: string;
	};
}

// ── Library ────────────────────────────────────────────────────────────────

export interface JellyfinLibrary {
	Id: string;
	Name: string;
	CollectionType: string | null;
	Type: string;
	ImageTags: Record<string, string>;
}

// ── Base Item ──────────────────────────────────────────────────────────────

export interface JellyfinItem {
	Id: string;
	Name: string;
	ServerId: string;
	Type: JellyfinItemType;
	SortName?: string;

	// Media info
	RunTimeTicks?: number;         // 1 tick = 100ns → ms = ticks / 10000
	ProductionYear?: number;
	IndexNumber?: number;          // Track number
	ParentIndexNumber?: number;    // Disc number
	ChildCount?: number;
	CommunityRating?: number;

	// Album / Artist
	AlbumId?: string;
	Album?: string;
	AlbumArtist?: string;
	AlbumArtistId?: string;
	ArtistItems?: Array<{ Id: string; Name: string }>;
	Artists?: string[];

	// Playlist
	PlaylistItemId?: string;

	// Image
	ImageTags?: Record<string, string>;
	BackdropImageTags?: string[];
	ParentBackdropItemId?: string;

	// Audio stream
	MediaSources?: JellyfinMediaSource[];
	MediaStreams?: JellyfinMediaStream[];

	// Playback
	UserData?: JellyfinUserData;

	// Parent references
	ParentId?: string;
	AlbumPrimaryImageTag?: string;
}

export type JellyfinItemType =
	| 'Audio'
	| 'MusicAlbum'
	| 'MusicArtist'
	| 'MusicGenre'
	| 'Playlist'
	| 'Genre'
	| 'Folder'
	| 'CollectionFolder';

// ── Media Source ───────────────────────────────────────────────────────────

export interface JellyfinMediaSource {
	Id: string;
	Name: string;
	Path: string;
	Container: string;
	Bitrate?: number;
	Size?: number;
	RunTimeTicks?: number;
	MediaStreams: JellyfinMediaStream[];
	SupportsDirectPlay: boolean;
	SupportsTranscoding: boolean;
	TranscodingUrl?: string;
}

export interface JellyfinMediaStream {
	Type: 'Audio' | 'Video' | 'Subtitle';
	Codec?: string;
	BitRate?: number;
	Channels?: number;
	SampleRate?: number;
	Index: number;
	IsDefault: boolean;
	Comment?: string; // e.g. "ReplayGain: -6.5 dB"
}

// ── User Data ──────────────────────────────────────────────────────────────

export interface JellyfinUserData {
	PlaybackPositionTicks: number;
	PlayCount: number;
	IsFavorite: boolean;
	LastPlayedDate?: string;
	Played: boolean;
	Key: string;
}

// ── Query Results ──────────────────────────────────────────────────────────

export interface JellyfinQueryResult<T = JellyfinItem> {
	Items: T[];
	TotalRecordCount: number;
	StartIndex: number;
}

// ── Server Info ────────────────────────────────────────────────────────────

export interface JellyfinServerInfo {
	Id: string;
	ServerName: string;
	Version: string;
	ProductName: string;
	OperatingSystem: string;
}

// ── Playback Report ────────────────────────────────────────────────────────

export interface PlaybackProgressReport {
	ItemId: string;
	SessionId?: string;
	PositionTicks: number;
	IsPaused: boolean;
	IsMuted: boolean;
	PlayMethod: 'DirectStream' | 'Transcode';
	MediaSourceId: string;
}

// ── Stream quality ─────────────────────────────────────────────────────────

export type AudioQuality =
	| 'original'    // DirectPlay
	| 'high'        // 320 kbps
	| 'medium'      // 192 kbps
	| 'low';        // 128 kbps

export const QUALITY_BITRATES: Record<AudioQuality, number | null> = {
	original: null,
	high: 320000,
	medium: 192000,
	low: 128000,
};

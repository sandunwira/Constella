/**
 * Constella — Jellyfin REST API Client
 *
 * Handles authentication, library browsing, search, stream URL generation,
 * image URL generation, and playback reporting.
 */

import type {
	AudioQuality,
	JellyfinAuthResponse,
	JellyfinItem,
	JellyfinLibrary,
	JellyfinQueryResult,
	JellyfinServerInfo,
	PlaybackProgressReport
} from './types';

const CLIENT_NAME = 'Constella';
const CLIENT_VERSION = '1.0.0';
const DEVICE_NAME = 'Mobile';
const DEVICE_ID = 'constella-mobile-client';

function buildAuthHeader(token?: string): string {
	let header = `MediaBrowser Client="${CLIENT_NAME}", Device="${DEVICE_NAME}", DeviceId="${DEVICE_ID}", Version="${CLIENT_VERSION}"`;
	if (token) header += `, Token="${token}"`;
	return header;
}

export class JellyfinClient {
	private baseUrl: string = '';
	private accessToken: string = '';
	private userId: string = '';
	private tracksCache: Map<string, { data: JellyfinItem[]; timestamp: number }> = new Map();
	private static CACHE_TTL = 5 * 60 * 1000; // 5 minutes

	// ── Connection ────────────────────────────────────────────────────────────

	configure(baseUrl: string, accessToken: string, userId: string) {
		this.baseUrl = baseUrl.replace(/\/$/, '');
		this.accessToken = accessToken;
		this.userId = userId;
	}

	isConfigured(): boolean {
		return Boolean(this.baseUrl && this.accessToken && this.userId);
	}

	// ── Private fetch helper ──────────────────────────────────────────────────

	private async request<T>(
		path: string,
		options: RequestInit = {},
	): Promise<T> {
		const url = `${this.baseUrl}${path}`;
		const headers: Record<string, string> = {
			'X-Emby-Authorization': buildAuthHeader(this.accessToken),
			'Content-Type': 'application/json',
			Accept: 'application/json',
			...(options.headers as Record<string, string>),
		};

		const res = await fetch(url, { ...options, headers });

		if (!res.ok) {
			const body = await res.text().catch(() => '');
			throw new Error(`Jellyfin API error ${res.status}: ${body}`);
		}

		// Some endpoints return 204 No Content
		if (res.status === 204) return undefined as T;

		return res.json() as Promise<T>;
	}

	// ── Authentication ────────────────────────────────────────────────────────

	async authenticate(
		serverUrl: string,
		username: string,
		password: string,
	): Promise<JellyfinAuthResponse> {
		const base = serverUrl.replace(/\/$/, '');
		const res = await fetch(`${base}/Users/AuthenticateByName`, {
			method: 'POST',
			headers: {
				'X-Emby-Authorization': buildAuthHeader(),
				'Content-Type': 'application/json',
				Accept: 'application/json',
			},
			body: JSON.stringify({ Username: username, Pw: password }),
		});

		if (!res.ok) {
			const text = await res.text().catch(() => '');
			throw new Error(`Authentication failed (${res.status}): ${text}`);
		}

		const data: JellyfinAuthResponse = await res.json();
		this.configure(base, data.AccessToken, data.User.Id);
		return data;
	}

	async getServerInfo(): Promise<JellyfinServerInfo> {
		return this.request<JellyfinServerInfo>('/System/Info/Public');
	}

	// ── Libraries ─────────────────────────────────────────────────────────────

	async getLibraries(): Promise<JellyfinLibrary[]> {
		const res = await this.request<{ Items: JellyfinLibrary[] }>(
			`/Users/${this.userId}/Views`,
		);
		return res.Items;
	}

	// ── Artists ───────────────────────────────────────────────────────────────

	async getArtists(
		libraryId: string,
		params: { limit?: number; startIndex?: number; sortBy?: string } = {},
	): Promise<JellyfinQueryResult> {
		const qs = new URLSearchParams({
			ParentId: libraryId,
			Recursive: 'true',
			IncludeItemTypes: 'MusicArtist',
			Fields: 'SortName,ImageTags,ChildCount',
			SortBy: params.sortBy ?? 'SortName',
			SortOrder: 'Ascending',
			Limit: String(params.limit ?? 50),
			StartIndex: String(params.startIndex ?? 0),
		});
		return this.request<JellyfinQueryResult>(`/Items?${qs}`);
	}

	// ── Albums ────────────────────────────────────────────────────────────────

	async getAlbums(
		libraryId: string,
		params: { artistId?: string; limit?: number; startIndex?: number; sortBy?: string } = {},
	): Promise<JellyfinQueryResult> {
		const qs = new URLSearchParams({
			ParentId: libraryId,
			Recursive: 'true',
			IncludeItemTypes: 'MusicAlbum',
			Fields: 'SortName,ImageTags,ChildCount,Artists,AlbumArtist,ProductionYear,RunTimeTicks',
			SortBy: params.sortBy ?? 'SortName',
			SortOrder: 'Ascending',
			Limit: String(params.limit ?? 50),
			StartIndex: String(params.startIndex ?? 0),
			...(params.artistId ? { AlbumArtistIds: params.artistId } : {}),
		});
		return this.request<JellyfinQueryResult>(`/Items?${qs}`);
	}

	// ── Tracks ────────────────────────────────────────────────────────────────

	async getTracks(
		albumId: string,
		params: { limit?: number; startIndex?: number } = {},
	): Promise<JellyfinQueryResult> {
		const qs = new URLSearchParams({
			ParentId: albumId,
			Recursive: 'true',
			IncludeItemTypes: 'Audio',
			Fields: 'SortName,MediaSources,MediaStreams,ImageTags,UserData,RunTimeTicks,IndexNumber,ParentIndexNumber,Artists,AlbumArtist,Bitrate',
			SortBy: 'ParentIndexNumber,IndexNumber,SortName',
			SortOrder: 'Ascending',
			Limit: String(params.limit ?? 500),
			StartIndex: String(params.startIndex ?? 0),
		});
		return this.request<JellyfinQueryResult>(`/Items?${qs}`);
	}

	async getLibraryTracks(
		libraryId: string,
		params: { limit?: number; startIndex?: number } = {},
	): Promise<JellyfinQueryResult> {
		const qs = new URLSearchParams({
			ParentId: libraryId,
			Recursive: 'true',
			IncludeItemTypes: 'Audio',
			Fields: 'SortName,MediaSources,MediaStreams,ImageTags,UserData,RunTimeTicks,IndexNumber,ParentIndexNumber,Artists,AlbumArtist,Bitrate,Album',
			SortBy: 'Album,ParentIndexNumber,IndexNumber,SortName',
			SortOrder: 'Ascending',
			Limit: String(params.limit ?? 500),
			StartIndex: String(params.startIndex ?? 0),
		});
		return this.request<JellyfinQueryResult>(`/Items?${qs}`);
	}

	async getAllLibraryTracks(libraryId: string, forceRefresh = false): Promise<JellyfinItem[]> {
		// Check cache first
		if (!forceRefresh) {
			const cached = this.tracksCache.get(libraryId);
			if (cached && Date.now() - cached.timestamp < JellyfinClient.CACHE_TTL) {
				return cached.data;
			}
		}

		// Fetch all tracks
		const allTracks: JellyfinItem[] = [];
		let startIndex = 0;
		const limit = 500;
		let hasMore = true;

		while (hasMore) {
			const res = await this.getLibraryTracks(libraryId, { limit, startIndex });
			allTracks.push(...res.Items);
			startIndex += limit;
			hasMore = res.Items.length === limit;
		}

		// Cache the result
		this.tracksCache.set(libraryId, { data: allTracks, timestamp: Date.now() });

		return allTracks;
	}

	clearCache(libraryId?: string) {
		if (libraryId) {
			this.tracksCache.delete(libraryId);
		} else {
			this.tracksCache.clear();
		}
	}

	async getTrack(trackId: string): Promise<JellyfinItem> {
		const qs = new URLSearchParams({
			Fields: 'MediaSources,MediaStreams,ImageTags,UserData,RunTimeTicks,Artists,AlbumArtist',
			UserId: this.userId,
		});
		return this.request<JellyfinItem>(`/Items/${trackId}?${qs}`);
	}

	// ── Playlists ─────────────────────────────────────────────────────────────

	async getPlaylists(): Promise<JellyfinQueryResult> {
		const qs = new URLSearchParams({
			IncludeItemTypes: 'Playlist',
			Recursive: 'true',
			Fields: 'ImageTags,ChildCount',
			SortBy: 'SortName',
			SortOrder: 'Ascending',
		});
		return this.request<JellyfinQueryResult>(`/Users/${this.userId}/Items?${qs}`);
	}

	async getPlaylistItems(playlistId: string): Promise<JellyfinQueryResult> {
		const qs = new URLSearchParams({
			Fields: 'MediaSources,ImageTags,UserData,RunTimeTicks,Artists',
			SortBy: 'ListItemOrder',
		});
		return this.request<JellyfinQueryResult>(`/Playlists/${playlistId}/Items?${qs}&UserId=${this.userId}`);
	}

	// ── Search ────────────────────────────────────────────────────────────────

	async search(
		query: string,
		types: string[] = ['Audio', 'MusicAlbum', 'MusicArtist', 'Playlist'],
	): Promise<JellyfinQueryResult> {
		const qs = new URLSearchParams({
			SearchTerm: query,
			IncludeItemTypes: types.join(','),
			Recursive: 'true',
			Fields: 'ImageTags,Artists,AlbumArtist,RunTimeTicks',
			Limit: '30',
		});
		return this.request<JellyfinQueryResult>(`/Users/${this.userId}/Items?${qs}`);
	}

	// ── Recently Played ───────────────────────────────────────────────────────

	async getRecentlyPlayed(limit = 20): Promise<JellyfinItem[]> {
		const qs = new URLSearchParams({
			Recursive: 'true',
			IncludeItemTypes: 'Audio',
			Filters: 'IsPlayed',
			SortBy: 'DatePlayed',
			SortOrder: 'Descending',
			Fields: 'ImageTags,Artists,AlbumArtist,RunTimeTicks,UserData',
			Limit: String(limit),
		});
		const res = await this.request<JellyfinQueryResult>(`/Users/${this.userId}/Items?${qs}`);
		return res.Items;
	}

	async getRecentlyAdded(libraryId: string, limit = 20): Promise<JellyfinItem[]> {
		const qs = new URLSearchParams({
			ParentId: libraryId,
			Recursive: 'true',
			IncludeItemTypes: 'MusicAlbum',
			SortBy: 'DateCreated',
			SortOrder: 'Descending',
			Fields: 'ImageTags,Artists,AlbumArtist,ProductionYear,ChildCount',
			Limit: String(limit),
		});
		const res = await this.request<JellyfinQueryResult>(`/Users/${this.userId}/Items?${qs}`);
		return res.Items;
	}

	// ── Favorites ─────────────────────────────────────────────────────────────

	async getFavoriteAlbums(limit = 20): Promise<JellyfinItem[]> {
		const qs = new URLSearchParams({
			Recursive: 'true',
			IncludeItemTypes: 'MusicAlbum',
			Filters: 'IsFavorite',
			Fields: 'ImageTags,Artists,ProductionYear',
			Limit: String(limit),
		});
		const res = await this.request<JellyfinQueryResult>(`/Users/${this.userId}/Items?${qs}`);
		return res.Items;
	}

	// ── Stream URL ────────────────────────────────────────────────────────────

	getStreamUrl(
		itemId: string,
		quality: AudioQuality = 'original',
		mediaSourceId?: string,
	): string {
		if (quality === 'original') {
			return `${this.baseUrl}/Audio/${itemId}/stream?static=true&api_key=${this.accessToken}${mediaSourceId ? `&MediaSourceId=${mediaSourceId}` : ''}`;
		}

		const bitrates: Record<string, number> = {
			high: 320000,
			medium: 192000,
			low: 128000,
		};

		const qs = new URLSearchParams({
			AudioBitRate: String(bitrates[quality]),
			Container: 'mp3',
			api_key: this.accessToken,
			...(mediaSourceId ? { MediaSourceId: mediaSourceId } : {}),
		});
		return `${this.baseUrl}/Audio/${itemId}/stream.mp3?${qs}`;
	}

	// ── Image URL ─────────────────────────────────────────────────────────────

	getImageUrl(
		itemId: string,
		imageType: 'Primary' | 'Backdrop' | 'Logo' = 'Primary',
		size = 400,
	): string {
		return `${this.baseUrl}/Items/${itemId}/Images/${imageType}?maxWidth=${size}&quality=90&api_key=${this.accessToken}`;
	}

	// ── Playback Reporting ────────────────────────────────────────────────────

	async reportPlaybackStart(itemId: string, mediaSourceId: string): Promise<void> {
		await this.request('/Sessions/Playing', {
			method: 'POST',
			body: JSON.stringify({
				ItemId: itemId,
				MediaSourceId: mediaSourceId,
				PlayMethod: 'DirectStream',
				PositionTicks: 0,
			}),
		});
	}

	async reportPlaybackProgress(report: PlaybackProgressReport): Promise<void> {
		await this.request('/Sessions/Playing/Progress', {
			method: 'POST',
			body: JSON.stringify(report),
		});
	}

	async reportPlaybackStopped(itemId: string, positionTicks: number): Promise<void> {
		await this.request('/Sessions/Playing/Stopped', {
			method: 'POST',
			body: JSON.stringify({ ItemId: itemId, PositionTicks: positionTicks }),
		});
	}

	async markAsPlayed(itemId: string): Promise<void> {
		await this.request(`/Users/${this.userId}/PlayedItems/${itemId}`, {
			method: 'POST',
		});
	}

	async toggleFavorite(itemId: string, isFavorite: boolean): Promise<void> {
		const method = isFavorite ? 'POST' : 'DELETE';
		await this.request(`/Users/${this.userId}/FavoriteItems/${itemId}`, { method });
	}
}

// Singleton instance
export const jellyfinClient = new JellyfinClient();

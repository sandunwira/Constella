/**
 * Constella — Jellyfin Context
 *
 * Manages server connection state, authentication, active server/library,
 * and persists credentials via expo-secure-store.
 */

import * as SecureStore from 'expo-secure-store';
import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useState,
} from 'react';
import { jellyfinClient } from '@/lib/jellyfin/client';
import type { JellyfinLibrary, JellyfinUser } from '@/lib/jellyfin/types';

const STORE_KEY_SERVER_URL = 'constella_server_url';
const STORE_KEY_ACCESS_TOKEN = 'constella_access_token';
const STORE_KEY_USER_ID = 'constella_user_id';
const STORE_KEY_USERNAME = 'constella_username';

export interface ServerConfig {
	url: string;
	accessToken: string;
	userId: string;
	username: string;
}

interface JellyfinContextValue {
	isConnected: boolean;
	isLoading: boolean;
	server: ServerConfig | null;
	currentUser: JellyfinUser | null;
	libraries: JellyfinLibrary[];
	activeLibraryId: string | null;

	connect: (url: string, username: string, password: string) => Promise<void>;
	disconnect: () => Promise<void>;
	setActiveLibrary: (id: string) => void;
	refreshLibraries: () => Promise<void>;
	connectionError: string | null;
}

const JellyfinContext = createContext<JellyfinContextValue | null>(null);

export function JellyfinProvider({ children }: { children: React.ReactNode }) {
	const [server, setServer] = useState<ServerConfig | null>(null);
	const [currentUser, setCurrentUser] = useState<JellyfinUser | null>(null);
	const [libraries, setLibraries] = useState<JellyfinLibrary[]>([]);
	const [activeLibraryId, setActiveLib] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [connectionError, setError] = useState<string | null>(null);

	// ── Restore saved credentials on mount ──────────────────────────────────

	useEffect(() => {
		restoreSession();
	}, []);

	const restoreSession = async () => {
		try {
			const [url, token, userId, username] = await Promise.all([
				SecureStore.getItemAsync(STORE_KEY_SERVER_URL),
				SecureStore.getItemAsync(STORE_KEY_ACCESS_TOKEN),
				SecureStore.getItemAsync(STORE_KEY_USER_ID),
				SecureStore.getItemAsync(STORE_KEY_USERNAME),
			]);

			if (url && token && userId && username) {
				jellyfinClient.configure(url, token, userId);
				const cfg: ServerConfig = { url, accessToken: token, userId, username };
				setServer(cfg);
				await loadLibraries();
			}
		} catch (err) {
			console.warn('[Constella] Failed to restore session:', err);
		} finally {
			setIsLoading(false);
		}
	};

	// ── Connect ──────────────────────────────────────────────────────────────

	const connect = useCallback(
		async (url: string, username: string, password: string) => {
			setIsLoading(true);
			setError(null);
			try {
				const authData = await jellyfinClient.authenticate(url, username, password);
				const cfg: ServerConfig = {
					url: url.replace(/\/$/, ''),
					accessToken: authData.AccessToken,
					userId: authData.User.Id,
					username: authData.User.Name,
				};

				await Promise.all([
					SecureStore.setItemAsync(STORE_KEY_SERVER_URL, cfg.url),
					SecureStore.setItemAsync(STORE_KEY_ACCESS_TOKEN, cfg.accessToken),
					SecureStore.setItemAsync(STORE_KEY_USER_ID, cfg.userId),
					SecureStore.setItemAsync(STORE_KEY_USERNAME, cfg.username),
				]);

				setServer(cfg);
				setCurrentUser(authData.User);
				await loadLibraries();
			} catch (err: any) {
				setError(err.message ?? 'Connection failed');
				throw err;
			} finally {
				setIsLoading(false);
			}
		},
		[],
	);

	// ── Disconnect ────────────────────────────────────────────────────────────

	const disconnect = useCallback(async () => {
		await Promise.all([
			SecureStore.deleteItemAsync(STORE_KEY_SERVER_URL),
			SecureStore.deleteItemAsync(STORE_KEY_ACCESS_TOKEN),
			SecureStore.deleteItemAsync(STORE_KEY_USER_ID),
			SecureStore.deleteItemAsync(STORE_KEY_USERNAME),
		]);
		setServer(null);
		setCurrentUser(null);
		setLibraries([]);
		setActiveLib(null);
		jellyfinClient.configure('', '', '');
	}, []);

	// ── Libraries ─────────────────────────────────────────────────────────────

	const loadLibraries = async () => {
		try {
			const libs = await jellyfinClient.getLibraries();
			setLibraries(libs);
			if (libs.length > 0 && !activeLibraryId) {
				// Default to first music library, or first library
				const musicLib = libs.find(
					(l) => l.CollectionType === 'music' || l.CollectionType === 'musicvideos',
				);
				setActiveLib(musicLib?.Id ?? libs[0].Id);
			}
		} catch (err) {
			console.warn('[Constella] Failed to load libraries:', err);
		}
	};

	const refreshLibraries = useCallback(loadLibraries, [activeLibraryId]);

	const setActiveLibrary = useCallback((id: string) => {
		setActiveLib(id);
	}, []);

	return (
		<JellyfinContext.Provider
			value={{
				isConnected: Boolean(server),
				isLoading,
				server,
				currentUser,
				libraries,
				activeLibraryId,
				connect,
				disconnect,
				setActiveLibrary,
				refreshLibraries,
				connectionError,
			}}>
			{children}
		</JellyfinContext.Provider>
	);
}

export function useJellyfin(): JellyfinContextValue {
	const ctx = useContext(JellyfinContext);
	if (!ctx) throw new Error('useJellyfin must be used within JellyfinProvider');
	return ctx;
}

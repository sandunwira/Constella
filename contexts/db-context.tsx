/**
 * Constella — Database Context
 *
 * Initializes the SQLite database and provides it via React context.
 * Must be the outermost provider so other contexts can use it.
 */

import { createContext, useContext, useEffect, useState } from 'react';
import type { SQLiteDatabase } from 'expo-sqlite';
import { openDatabase } from '@/lib/db/schema';

interface DbContextValue {
	db: SQLiteDatabase | null;
	isReady: boolean;
	error: Error | null;
}

const DbContext = createContext<DbContextValue>({
	db: null,
	isReady: false,
	error: null,
});

export function DbProvider({ children }: { children: React.ReactNode }) {
	const [db, setDb] = useState<SQLiteDatabase | null>(null);
	const [isReady, setIsReady] = useState(false);
	const [error, setError] = useState<Error | null>(null);

	useEffect(() => {
		let mounted = true;
		openDatabase()
			.then((database) => {
				if (mounted) {
					setDb(database);
					setIsReady(true);
				}
			})
			.catch((err: Error) => {
				if (mounted) {
					console.error('[Constella DB] Failed to open database:', err);
					setError(err);
					setIsReady(true); // allow app to render even if DB fails
				}
			});
		return () => { mounted = false; };
	}, []);

	return (
		<DbContext.Provider value={{ db, isReady, error }}>
			{children}
		</DbContext.Provider>
	);
}

export function useDb(): DbContextValue {
	return useContext(DbContext);
}

export function useDbRequired(): SQLiteDatabase {
	const { db } = useContext(DbContext);
	if (!db) throw new Error('Database not yet initialized');
	return db;
}

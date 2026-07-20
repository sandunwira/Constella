/**
 * Constella — SQLite Schema & Migration Runner
 *
 * Tables:
 *   servers, libraries, artists, albums, tracks,
 *   playlists, playlist_items, downloads, queue_items,
 *   playback_state, play_history
 */

import * as SQLite from 'expo-sqlite';

export const DB_NAME = 'constella.db';

export async function openDatabase(): Promise<SQLite.SQLiteDatabase> {
	const db = await SQLite.openDatabaseAsync(DB_NAME);
	await runMigrations(db);
	return db;
}

async function runMigrations(db: SQLite.SQLiteDatabase): Promise<void> {
	await db.execAsync('PRAGMA journal_mode = WAL;');
	await db.execAsync('PRAGMA foreign_keys = ON;');

	await db.execAsync(`
    CREATE TABLE IF NOT EXISTS servers (
      id          TEXT PRIMARY KEY,
      url         TEXT NOT NULL,
      name        TEXT NOT NULL,
      user_id     TEXT NOT NULL,
      username    TEXT NOT NULL,
      access_token TEXT NOT NULL,
      is_active   INTEGER NOT NULL DEFAULT 0,
      created_at  TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

	await db.execAsync(`
    CREATE TABLE IF NOT EXISTS libraries (
      id          TEXT NOT NULL,
      server_id   TEXT NOT NULL,
      name        TEXT NOT NULL,
      type        TEXT NOT NULL,
      item_count  INTEGER NOT NULL DEFAULT 0,
      updated_at  TEXT NOT NULL DEFAULT (datetime('now')),
      PRIMARY KEY (id, server_id),
      FOREIGN KEY (server_id) REFERENCES servers(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_libraries_server ON libraries(server_id);
  `);

	await db.execAsync(`
    CREATE TABLE IF NOT EXISTS artists (
      id          TEXT NOT NULL,
      server_id   TEXT NOT NULL,
      name        TEXT NOT NULL,
      sort_name   TEXT,
      image_tag   TEXT,
      album_count INTEGER DEFAULT 0,
      updated_at  TEXT NOT NULL DEFAULT (datetime('now')),
      PRIMARY KEY (id, server_id),
      FOREIGN KEY (server_id) REFERENCES servers(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_artists_server    ON artists(server_id);
    CREATE INDEX IF NOT EXISTS idx_artists_sort_name ON artists(sort_name);
  `);

	await db.execAsync(`
    CREATE TABLE IF NOT EXISTS albums (
      id          TEXT NOT NULL,
      server_id   TEXT NOT NULL,
      artist_id   TEXT,
      artist_name TEXT,
      library_id  TEXT,
      name        TEXT NOT NULL,
      sort_name   TEXT,
      year        INTEGER,
      duration_ms INTEGER DEFAULT 0,
      track_count INTEGER DEFAULT 0,
      image_tag   TEXT,
      updated_at  TEXT NOT NULL DEFAULT (datetime('now')),
      PRIMARY KEY (id, server_id),
      FOREIGN KEY (server_id) REFERENCES servers(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_albums_server    ON albums(server_id);
    CREATE INDEX IF NOT EXISTS idx_albums_artist    ON albums(artist_id);
    CREATE INDEX IF NOT EXISTS idx_albums_library   ON albums(library_id);
    CREATE INDEX IF NOT EXISTS idx_albums_sort_name ON albums(sort_name);
  `);

	await db.execAsync(`
    CREATE TABLE IF NOT EXISTS tracks (
      id             TEXT NOT NULL,
      server_id      TEXT NOT NULL,
      album_id       TEXT,
      album_name     TEXT,
      artist_id      TEXT,
      artist_name    TEXT,
      library_id     TEXT,
      name           TEXT NOT NULL,
      sort_name      TEXT,
      duration_ms    INTEGER DEFAULT 0,
      track_number   INTEGER,
      disc_number    INTEGER DEFAULT 1,
      codec          TEXT,
      bitrate        INTEGER,
      sample_rate    INTEGER,
      channels       INTEGER,
      image_tag      TEXT,
      replay_gain    REAL,
      updated_at     TEXT NOT NULL DEFAULT (datetime('now')),
      PRIMARY KEY (id, server_id),
      FOREIGN KEY (server_id) REFERENCES servers(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_tracks_server ON tracks(server_id);
    CREATE INDEX IF NOT EXISTS idx_tracks_album  ON tracks(album_id);
    CREATE INDEX IF NOT EXISTS idx_tracks_artist ON tracks(artist_id);
  `);

	await db.execAsync(`
    CREATE TABLE IF NOT EXISTS playlists (
      id          TEXT NOT NULL,
      server_id   TEXT NOT NULL,
      name        TEXT NOT NULL,
      image_tag   TEXT,
      item_count  INTEGER DEFAULT 0,
      updated_at  TEXT NOT NULL DEFAULT (datetime('now')),
      PRIMARY KEY (id, server_id),
      FOREIGN KEY (server_id) REFERENCES servers(id) ON DELETE CASCADE
    );
  `);

	await db.execAsync(`
    CREATE TABLE IF NOT EXISTS playlist_items (
      id          TEXT NOT NULL,
      playlist_id TEXT NOT NULL,
      server_id   TEXT NOT NULL,
      track_id    TEXT NOT NULL,
      position    INTEGER NOT NULL,
      PRIMARY KEY (id),
      FOREIGN KEY (server_id) REFERENCES servers(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_playlist_items_playlist ON playlist_items(playlist_id);
  `);

	await db.execAsync(`
    CREATE TABLE IF NOT EXISTS downloads (
      track_id      TEXT NOT NULL,
      server_id     TEXT NOT NULL,
      local_path    TEXT,
      artwork_path  TEXT,
      status        TEXT NOT NULL DEFAULT 'pending',
      progress      REAL NOT NULL DEFAULT 0,
      file_size     INTEGER,
      created_at    TEXT NOT NULL DEFAULT (datetime('now')),
      completed_at  TEXT,
      PRIMARY KEY (track_id, server_id),
      FOREIGN KEY (server_id) REFERENCES servers(id) ON DELETE CASCADE
    );
  `);

	await db.execAsync(`
    CREATE TABLE IF NOT EXISTS queue_items (
      position    INTEGER NOT NULL,
      track_id    TEXT NOT NULL,
      server_id   TEXT NOT NULL,
      queue_id    TEXT NOT NULL DEFAULT 'main',
      PRIMARY KEY (position, queue_id),
      FOREIGN KEY (server_id) REFERENCES servers(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_queue_queue_id ON queue_items(queue_id);
  `);

	await db.execAsync(`
    CREATE TABLE IF NOT EXISTS playback_state (
      id              TEXT PRIMARY KEY DEFAULT 'current',
      track_id        TEXT,
      server_id       TEXT,
      position_ms     INTEGER DEFAULT 0,
      is_shuffled     INTEGER DEFAULT 0,
      repeat_mode     TEXT DEFAULT 'none',
      updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
    );
    INSERT OR IGNORE INTO playback_state (id) VALUES ('current');
  `);

	await db.execAsync(`
    CREATE TABLE IF NOT EXISTS play_history (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      track_id    TEXT NOT NULL,
      server_id   TEXT NOT NULL,
      played_at   TEXT NOT NULL DEFAULT (datetime('now')),
      duration_ms INTEGER DEFAULT 0,
      FOREIGN KEY (server_id) REFERENCES servers(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_history_played_at  ON play_history(played_at DESC);
    CREATE INDEX IF NOT EXISTS idx_history_track      ON play_history(track_id);
  `);
}

import { db } from './client';
import { SongRow, SongWithStats, TabRow } from '../types';

export function getAllSongs(): SongWithStats[] {
  const songs = db.getAllSync<SongRow & { best_score: number | null; latest_score: number | null; score_count: number }>(`
    SELECT
      s.*,
      MAX(sc.score)  AS best_score,
      (SELECT score FROM scores WHERE song_id = s.id ORDER BY scored_at DESC LIMIT 1) AS latest_score,
      COUNT(sc.id)   AS score_count
    FROM songs s
    LEFT JOIN scores sc ON sc.song_id = s.id
    GROUP BY s.id
    ORDER BY s.created_at DESC
  `);
  return songs.map((song) => ({
    ...song,
    tabs: db.getAllSync<TabRow>(
      'SELECT t.* FROM tabs t JOIN song_tabs st ON st.tab_id = t.id WHERE st.song_id = ?',
      [song.id]
    ),
  }));
}

export function getSongsByTab(tabId: number): SongWithStats[] {
  const songs = db.getAllSync<SongRow & { best_score: number | null; latest_score: number | null; score_count: number }>(`
    SELECT
      s.*,
      MAX(sc.score)  AS best_score,
      (SELECT score FROM scores WHERE song_id = s.id ORDER BY scored_at DESC LIMIT 1) AS latest_score,
      COUNT(sc.id)   AS score_count
    FROM songs s
    JOIN song_tabs st ON st.song_id = s.id
    LEFT JOIN scores sc ON sc.song_id = s.id
    WHERE st.tab_id = ?
    GROUP BY s.id
    ORDER BY s.created_at DESC
  `, [tabId]);
  return songs.map((song) => ({
    ...song,
    tabs: db.getAllSync<TabRow>(
      'SELECT t.* FROM tabs t JOIN song_tabs st ON st.tab_id = t.id WHERE st.song_id = ?',
      [song.id]
    ),
  }));
}

export function getSongById(id: number): SongWithStats | null {
  const song = db.getFirstSync<SongRow & { best_score: number | null; latest_score: number | null; score_count: number }>(`
    SELECT
      s.*,
      MAX(sc.score)  AS best_score,
      (SELECT score FROM scores WHERE song_id = s.id ORDER BY scored_at DESC LIMIT 1) AS latest_score,
      COUNT(sc.id)   AS score_count
    FROM songs s
    LEFT JOIN scores sc ON sc.song_id = s.id
    WHERE s.id = ?
    GROUP BY s.id
  `, [id]);
  if (!song) return null;
  return {
    ...song,
    tabs: db.getAllSync<TabRow>(
      'SELECT t.* FROM tabs t JOIN song_tabs st ON st.tab_id = t.id WHERE st.song_id = ?',
      [id]
    ),
  };
}

export function insertSong(title: string, artist: string, keyOffset: number | null): number {
  const result = db.runSync(
    'INSERT INTO songs (title, artist, key_offset, created_at) VALUES (?, ?, ?, ?)',
    [title, artist, keyOffset, new Date().toISOString()]
  );
  return result.lastInsertRowId;
}

export function updateSong(id: number, title: string, artist: string, keyOffset: number | null): void {
  db.runSync(
    'UPDATE songs SET title = ?, artist = ?, key_offset = ? WHERE id = ?',
    [title, artist, keyOffset, id]
  );
}

export function deleteSong(id: number): void {
  db.runSync('DELETE FROM songs WHERE id = ?', [id]);
}

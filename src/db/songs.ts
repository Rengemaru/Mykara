import { getDb } from './client';
import { SongRow, SongWithStats, TabRow } from '../types';

export function getAllSongs(): SongWithStats[] {
  const songs = getDb().getAllSync<SongRow & { best_score: number | null; latest_score: number | null; score_count: number }>(`
    SELECT
      s.*,
      MAX(sc.score)  AS best_score,
      (SELECT score FROM scores WHERE song_id = s.id ORDER BY scored_at DESC LIMIT 1) AS latest_score,
      COUNT(sc.id)   AS score_count
    FROM songs s
    LEFT JOIN scores sc ON sc.song_id = s.id
    GROUP BY s.id
    ORDER BY s.sort_order ASC
  `);
  return songs.map((song) => ({
    ...song,
    tabs: getDb().getAllSync<TabRow>(
      'SELECT t.* FROM tabs t JOIN song_tabs st ON st.tab_id = t.id WHERE st.song_id = ?',
      [song.id]
    ),
  }));
}

export function getSongsByTab(tabId: number): SongWithStats[] {
  const songs = getDb().getAllSync<SongRow & { best_score: number | null; latest_score: number | null; score_count: number }>(`
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
    ORDER BY s.sort_order ASC
  `, [tabId]);
  return songs.map((song) => ({
    ...song,
    tabs: getDb().getAllSync<TabRow>(
      'SELECT t.* FROM tabs t JOIN song_tabs st ON st.tab_id = t.id WHERE st.song_id = ?',
      [song.id]
    ),
  }));
}

export function getSongById(id: number): SongWithStats | null {
  const song = getDb().getFirstSync<SongRow & { best_score: number | null; latest_score: number | null; score_count: number }>(`
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
    tabs: getDb().getAllSync<TabRow>(
      'SELECT t.* FROM tabs t JOIN song_tabs st ON st.tab_id = t.id WHERE st.song_id = ?',
      [id]
    ),
  };
}

export function insertSong(
  title: string,
  artist: string,
  keyOffset: number | null,
  artworkUrl?: string | null
): number {
  const result = getDb().runSync(
    'INSERT INTO songs (title, artist, key_offset, artwork_url, created_at) VALUES (?, ?, ?, ?, ?)',
    [title, artist, keyOffset, artworkUrl ?? null, new Date().toISOString()]
  );
  return result.lastInsertRowId;
}

export function updateSong(
  id: number,
  title: string,
  artist: string,
  keyOffset: number | null,
  artworkUrl?: string | null
): void {
  getDb().runSync(
    'UPDATE songs SET title = ?, artist = ?, key_offset = ?, artwork_url = ? WHERE id = ?',
    [title, artist, keyOffset, artworkUrl ?? null, id]
  );
}

export function deleteSong(id: number): void {
  getDb().runSync('DELETE FROM songs WHERE id = ?', [id]);
}

export function updateSongOrder(orderedIds: number[]): void {
  orderedIds.forEach((id, index) => {
    getDb().runSync('UPDATE songs SET sort_order = ? WHERE id = ?', [index, id]);
  });
}

import { getDb } from './client';
import { ScoreRow } from '../types';

export function getScoresBySong(songId: number): ScoreRow[] {
  return getDb().getAllSync<ScoreRow>(
    'SELECT * FROM scores WHERE song_id = ? ORDER BY scored_at DESC',
    [songId]
  );
}

export function insertScore(songId: number, score: number, scoredAt: string): number {
  const result = getDb().runSync(
    'INSERT INTO scores (song_id, score, scored_at) VALUES (?, ?, ?)',
    [songId, score, scoredAt]
  );
  return result.lastInsertRowId;
}

export function updateScore(id: number, score: number, scoredAt: string): void {
  getDb().runSync(
    'UPDATE scores SET score = ?, scored_at = ? WHERE id = ?',
    [score, scoredAt, id]
  );
}

export function deleteScore(id: number): void {
  getDb().runSync('DELETE FROM scores WHERE id = ?', [id]);
}

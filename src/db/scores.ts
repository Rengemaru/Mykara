import { getDb } from './client';
import { ScoreRow } from '../types';

export function getScoresBySong(songId: number): ScoreRow[] {
  return getDb().getAllSync<ScoreRow>(
    'SELECT * FROM scores WHERE song_id = ? ORDER BY scored_at DESC',
    [songId]
  );
}

export function insertScore(songId: number, score: number, scoredAt: string, machine: string): number {
  const result = getDb().runSync(
    'INSERT INTO scores (song_id, score, scored_at, machine) VALUES (?, ?, ?, ?)',
    [songId, score, scoredAt, machine]
  );
  return result.lastInsertRowId;
}

export function updateScore(id: number, score: number, scoredAt: string, machine: string): void {
  getDb().runSync(
    'UPDATE scores SET score = ?, scored_at = ?, machine = ? WHERE id = ?',
    [score, scoredAt, machine, id]
  );
}

export function deleteScore(id: number): void {
  getDb().runSync('DELETE FROM scores WHERE id = ?', [id]);
}

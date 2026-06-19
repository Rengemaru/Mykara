import { getDb } from './client';
import { ScoreRow } from '../types';

export interface SessionSummary {
  song_count: number;
  pb_count: number;
}

export function getSessionSummary(date: string): SessionSummary {
  const countRow = getDb().getFirstSync<{ song_count: number }>(
    'SELECT COUNT(DISTINCT song_id) AS song_count FROM scores WHERE scored_at = ?',
    [date]
  );
  const pbRow = getDb().getFirstSync<{ pb_count: number }>(`
    SELECT COUNT(*) AS pb_count
    FROM (
      SELECT song_id, MAX(score) AS today_best
      FROM scores WHERE scored_at = ?
      GROUP BY song_id
    ) today
    JOIN (
      SELECT song_id, MAX(score) AS all_time_best
      FROM scores GROUP BY song_id
    ) all_time ON today.song_id = all_time.song_id
    WHERE today.today_best >= all_time.all_time_best
  `, [date]);
  return {
    song_count: countRow?.song_count ?? 0,
    pb_count: pbRow?.pb_count ?? 0,
  };
}

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

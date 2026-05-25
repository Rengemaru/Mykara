import { useState, useEffect, useCallback } from 'react';
import { SongWithStats, ScoreRow } from '../types';
import { getSongById } from '../db/songs';
import { getScoresBySong } from '../db/scores';

export function useSongDetail(songId: number) {
  const [song, setSong] = useState<SongWithStats | null>(null);
  const [scores, setScores] = useState<ScoreRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(() => {
    try {
      setLoading(true);
      const songData = getSongById(songId);
      const scoreData = getScoresBySong(songId);
      setSong(songData);
      setScores(scoreData);
      setError(null);
    } catch (e) {
      setError('データの取得に失敗しました');
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [songId]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { song, scores, loading, error, reload };
}

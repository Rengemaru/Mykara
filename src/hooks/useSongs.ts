import { useState, useEffect, useCallback } from 'react';
import { SongWithStats } from '../types';
import { getAllSongs, getSongsByTab } from '../db/songs';

export const ALL_TAB = { id: -1, name: 'すべて', sort_order: -1 } as const;

export function useSongs(tabId: number) {
  const [songs, setSongs] = useState<SongWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(() => {
    try {
      setLoading(true);
      const data = tabId === ALL_TAB.id ? getAllSongs() : getSongsByTab(tabId);
      setSongs(data);
      setError(null);
    } catch (e) {
      setError('データの取得に失敗しました');
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [tabId]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { songs, loading, error, reload };
}

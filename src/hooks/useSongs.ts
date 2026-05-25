import { useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import { SongWithStats } from '../types';
import { getAllSongs, getSongsByTab } from '../db/songs';
import { MOCK_SONGS } from '../db/mockData';

export const ALL_TAB = { id: -1, name: 'すべて', sort_order: -1 } as const;

export function useSongs(tabId: number) {
  const [songs, setSongs] = useState<SongWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(() => {
    try {
      setLoading(true);
      if (Platform.OS === 'web') {
        const data = tabId === ALL_TAB.id
          ? MOCK_SONGS
          : MOCK_SONGS.filter(s => s.tabs.some(t => t.id === tabId));
        setSongs(data);
        setError(null);
        setLoading(false);
        return;
      }
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

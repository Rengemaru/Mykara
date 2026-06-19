import { useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import { TabWithCount } from '../types';
import { getAllTabsWithCounts } from '../db/tabs';
import { getAllSongsCount } from '../db/songs';
import { ALL_TAB } from './useSongs';
import { MOCK_TABS_WITH_COUNTS } from '../db/mockData';

export function useTabs() {
  const [tabs, setTabs] = useState<TabWithCount[]>([]);
  const [totalSongsCount, setTotalSongsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(() => {
    try {
      setLoading(true);
      if (Platform.OS === 'web') {
        setTabs(MOCK_TABS_WITH_COUNTS);
        setTotalSongsCount(5);
        setError(null);
        setLoading(false);
        return;
      }
      const data = getAllTabsWithCounts();
      setTabs(data);
      setTotalSongsCount(getAllSongsCount());
      setError(null);
    } catch (e) {
      setError('タブの取得に失敗しました');
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const tabsWithAll = [
    { ...ALL_TAB, song_count: totalSongsCount },
    ...tabs,
  ];

  return { tabs, tabsWithAll, loading, error, reload };
}

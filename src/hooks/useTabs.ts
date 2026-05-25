import { useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import { TabRow } from '../types';
import { getAllTabs } from '../db/tabs';
import { ALL_TAB } from './useSongs';
import { MOCK_TABS } from '../db/mockData';

export function useTabs() {
  const [tabs, setTabs] = useState<TabRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(() => {
    try {
      setLoading(true);
      if (Platform.OS === 'web') {
        setTabs(MOCK_TABS);
        setError(null);
        setLoading(false);
        return;
      }
      const data = getAllTabs();
      setTabs(data);
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

  const tabsWithAll = [ALL_TAB, ...tabs] as const;

  return { tabs, tabsWithAll, loading, error, reload };
}

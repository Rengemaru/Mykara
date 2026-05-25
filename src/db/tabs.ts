import { getDb } from './client';
import { TabRow } from '../types';

export function getAllTabs(): TabRow[] {
  return getDb().getAllSync<TabRow>('SELECT * FROM tabs ORDER BY sort_order ASC');
}

export function insertTab(name: string): number {
  const result = getDb().runSync(
    'INSERT INTO tabs (name, sort_order) VALUES (?, (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM tabs))',
    [name]
  );
  return result.lastInsertRowId;
}

export function updateTab(id: number, name: string): void {
  getDb().runSync('UPDATE tabs SET name = ? WHERE id = ?', [name, id]);
}

export function deleteTab(id: number): void {
  getDb().runSync('DELETE FROM tabs WHERE id = ?', [id]);
}

export function updateTabOrder(tabs: { id: number; sort_order: number }[]): void {
  for (const tab of tabs) {
    getDb().runSync('UPDATE tabs SET sort_order = ? WHERE id = ?', [tab.sort_order, tab.id]);
  }
}

import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';
import { schema } from './schema';

let _db: SQLite.SQLiteDatabase | null = null;

export function initDatabase(): void {
  if (Platform.OS === 'web') return;
  _db = SQLite.openDatabaseSync('mykara.db');
  _db.execSync('PRAGMA foreign_keys = ON;');
  _db.execSync(schema);
  _migrateSortOrder(_db);
}

function _migrateSortOrder(db: SQLite.SQLiteDatabase): void {
  // sort_order カラムが存在しなければ追加する
  const columns = db.getAllSync<{ name: string }>('PRAGMA table_info(songs)');
  const hasSortOrder = columns.some((c) => c.name === 'sort_order');
  if (hasSortOrder) return;

  db.execSync('ALTER TABLE songs ADD COLUMN sort_order INTEGER NOT NULL DEFAULT 0');
  // 既存曲に created_at 降順（新しい曲が上）で連番を割り振る
  const songs = db.getAllSync<{ id: number }>('SELECT id FROM songs ORDER BY created_at DESC');
  songs.forEach((song, index) => {
    db.runSync('UPDATE songs SET sort_order = ? WHERE id = ?', [index, song.id]);
  });
}

export function getDb(): SQLite.SQLiteDatabase {
  if (!_db) throw new Error('Database not initialized. Call initDatabase() first.');
  return _db;
}

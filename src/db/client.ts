import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';
import { schema } from './schema';
import { runMigrations } from './migrations';

let _db: SQLite.SQLiteDatabase | null = null;

export async function initDatabase(): Promise<void> {
  if (Platform.OS === 'web') return;
  _db = SQLite.openDatabaseSync('mykara.db');
  _db.execSync('PRAGMA foreign_keys = ON;');
  _db.execSync(schema);
  await runMigrations(_db);
}

export function getDb(): SQLite.SQLiteDatabase {
  if (!_db) throw new Error('Database not initialized. Call initDatabase() first.');
  return _db;
}

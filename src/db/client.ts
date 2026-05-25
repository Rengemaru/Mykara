import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';
import { schema } from './schema';

let _db: SQLite.SQLiteDatabase | null = null;

export function initDatabase(): void {
  if (Platform.OS === 'web') return;
  _db = SQLite.openDatabaseSync('mykara.db');
  _db.execSync('PRAGMA foreign_keys = ON;');
  _db.execSync(schema);
}

export function getDb(): SQLite.SQLiteDatabase {
  if (!_db) throw new Error('Database not initialized. Call initDatabase() first.');
  return _db;
}

import * as SQLite from 'expo-sqlite';
import { schema } from './schema';

const db = SQLite.openDatabaseSync('mykara.db');

export function initDatabase(): void {
  db.execSync('PRAGMA foreign_keys = ON;');
  db.execSync(schema);
}

export { db };

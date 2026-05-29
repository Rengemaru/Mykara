import * as SQLite from 'expo-sqlite';

export type Migration = {
  version: number;
  description: string;
  up: (db: SQLite.SQLiteDatabase) => Promise<void>;
};

export const MIGRATIONS: Migration[] = [
  {
    version: 1,
    description: 'add memo column to songs',
    up: async (db) => {
      await db.execAsync(
        `ALTER TABLE songs ADD COLUMN memo TEXT NOT NULL DEFAULT ''`
      );
    },
  },
  {
    version: 2,
    description: 'create settings table',
    up: async (db) => {
      await db.execAsync(`
        CREATE TABLE settings (
          key   TEXT PRIMARY KEY,
          value TEXT NOT NULL
        )
      `);
    },
  },
  {
    version: 3,
    description: 'add machine column to scores (delete existing test data)',
    up: async (db) => {
      await db.execAsync(`DELETE FROM scores`);
      await db.execAsync(`
        ALTER TABLE scores ADD COLUMN machine TEXT NOT NULL
          CHECK (machine IN ('DAM', 'JOYSOUND'))
      `);
    },
  },
];

export async function runMigrations(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS db_version (
      version INTEGER NOT NULL
    )
  `);

  const row = await db.getFirstAsync<{ version: number }>('SELECT version FROM db_version LIMIT 1');
  if (!row) {
    await db.execAsync('INSERT INTO db_version (version) VALUES (0)');
  }

  const currentVersion = row?.version ?? 0;
  console.log(`現在のDBバージョン: ${currentVersion}`);

  const pending = MIGRATIONS
    .filter((m) => m.version > currentVersion)
    .sort((a, b) => a.version - b.version);

  if (pending.length === 0) {
    console.log('マイグレーション不要');
    return;
  }

  for (const migration of pending) {
    console.log(`マイグレーション ${migration.version} を適用中: ${migration.description}`);
    await db.withTransactionAsync(async () => {
      await migration.up(db);
      await db.runAsync('UPDATE db_version SET version = ?', [migration.version]);
    });
  }

  console.log('マイグレーション完了');
}

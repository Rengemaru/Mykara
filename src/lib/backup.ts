import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { getDb } from '../db/client';

const SETTINGS_WHITELIST = ['default_machine', 'onboarding_completed'] as const;

export async function buildBackupJson(): Promise<string> {
  const db = getDb();

  const versionRow = db.getFirstSync<{ version: number }>('SELECT version FROM db_version LIMIT 1');
  const schemaVersion = versionRow?.version ?? 0;

  const allSettings = db.getAllSync<{ key: string; value: string }>(
    'SELECT key, value FROM settings ORDER BY key'
  );
  const settings = allSettings.filter(
    (s) => (SETTINGS_WHITELIST as readonly string[]).includes(s.key)
  );

  const tabs = db.getAllSync('SELECT * FROM tabs ORDER BY id');
  const songs = db.getAllSync('SELECT * FROM songs ORDER BY id');
  const song_tabs = db.getAllSync('SELECT * FROM song_tabs ORDER BY song_id, tab_id');
  const scores = db.getAllSync('SELECT * FROM scores ORDER BY id');

  const backup = {
    version: '1.0',
    schemaVersion,
    exportedAt: new Date().toISOString(),
    settings,
    tabs,
    songs,
    song_tabs,
    scores,
  };

  return JSON.stringify(backup, null, 2);
}

export async function exportBackup(): Promise<void> {
  const json = await buildBackupJson();

  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const ts = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  const filename = `utacho-backup-${ts}.json`;

  const file = new File(Paths.cache, filename);
  file.write(json);

  await Sharing.shareAsync(file.uri, {
    mimeType: 'application/json',
    dialogTitle: 'バックアップを保存',
  });
}

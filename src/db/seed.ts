import { getDb } from './client';

export function seedIfEmpty(): void {
  const db = getDb();

  const songCount = db.getFirstSync<{ count: number }>('SELECT COUNT(*) as count FROM songs');
  if (songCount && songCount.count > 0) return;

  // タブ
  db.runSync("INSERT INTO tabs (name, sort_order) VALUES ('十八番', 1)");
  db.runSync("INSERT INTO tabs (name, sort_order) VALUES ('練習中', 2)");
  db.runSync("INSERT INTO tabs (name, sort_order) VALUES ('アニソン', 3)");

  const now = new Date().toISOString();

  // 曲1: ガーネット
  db.runSync("INSERT INTO songs (title, artist, key_offset, created_at) VALUES ('ガーネット', '奥華子', 1, ?)", [now]);
  db.runSync("INSERT INTO song_tabs (song_id, tab_id) VALUES (1, 1)");
  db.runSync("INSERT INTO scores (song_id, score, scored_at) VALUES (1, 83.5, '2026-03-18')");
  db.runSync("INSERT INTO scores (song_id, score, scored_at) VALUES (1, 86.0, '2026-04-05')");
  db.runSync("INSERT INTO scores (song_id, score, scored_at) VALUES (1, 89.2, '2026-04-22')");
  db.runSync("INSERT INTO scores (song_id, score, scored_at) VALUES (1, 92.4, '2026-05-10')");

  // 曲2: Lemon
  db.runSync("INSERT INTO songs (title, artist, key_offset, created_at) VALUES ('Lemon', '米津玄師', -3, ?)", [now]);
  db.runSync("INSERT INTO song_tabs (song_id, tab_id) VALUES (2, 1)");
  db.runSync("INSERT INTO scores (song_id, score, scored_at) VALUES (2, 84.3, '2026-04-10')");
  db.runSync("INSERT INTO scores (song_id, score, scored_at) VALUES (2, 89.1, '2026-05-01')");

  // 曲3: 夜に駆ける
  db.runSync("INSERT INTO songs (title, artist, key_offset, created_at) VALUES ('夜に駆ける', 'YOASOBI', 2, ?)", [now]);
  db.runSync("INSERT INTO song_tabs (song_id, tab_id) VALUES (3, 1)");
  db.runSync("INSERT INTO song_tabs (song_id, tab_id) VALUES (3, 3)");
  db.runSync("INSERT INTO scores (song_id, score, scored_at) VALUES (3, 80.2, '2026-03-01')");
  db.runSync("INSERT INTO scores (song_id, score, scored_at) VALUES (3, 85.7, '2026-05-20')");

  // 曲4: カタオモイ（キーなし）
  db.runSync("INSERT INTO songs (title, artist, key_offset, created_at) VALUES ('カタオモイ', 'Aimer', NULL, ?)", [now]);
  db.runSync("INSERT INTO scores (song_id, score, scored_at) VALUES (4, 88.3, '2026-05-15')");

  // 曲5: 炎
  db.runSync("INSERT INTO songs (title, artist, key_offset, created_at) VALUES ('炎', 'LiSA', -1, ?)", [now]);
  db.runSync("INSERT INTO song_tabs (song_id, tab_id) VALUES (5, 2)");
  db.runSync("INSERT INTO song_tabs (song_id, tab_id) VALUES (5, 3)");
  db.runSync("INSERT INTO scores (song_id, score, scored_at) VALUES (5, 78.9, '2026-04-15')");
  db.runSync("INSERT INTO scores (song_id, score, scored_at) VALUES (5, 83.2, '2026-05-22')");
}
